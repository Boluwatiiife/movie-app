const User = require("./../Models/userModel");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const jwt = require("jsonwebtoken");
const CustomError = require("../Utils/CustomError");
const util = require("util");
const sendEmail = require("../Utils/email");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
};

const createSendResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  const options = {
    maxAge: process.env.LOGIN_EXPIRES,
    // secure:true,
    httpOnly: true, // makes sure that the cookie cannot be accessed or modified in any way by the browser
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.cookie("jwt", token, options);

  user.password = undefined; // so the password wont be returned to the user

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = asyncErrorHandler(async (req, res, next) => {
  const newUser = await User.create(req.body);

  createSendResponse(newUser, 201, res);
});

exports.login = asyncErrorHandler(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  // const { email,password}=req.body

  // check if email and password is present in req.body
  if (!email || !password) {
    const error = new CustomError(
      `please provide email ID & password for logging in!`,
      400
    );
    return next(error);
  }

  // check if user exists in db
  const user = await User.findOne({ email }).select("+password");
  //const isMatch=await user.comparePasswordInDB(password,user.password)

  // check if user exists and password matches
  if (!user || !(await user.comparePasswordInDB(password, user.password))) {
    const error = new CustomError("Incorrect email or password", 400);
    return next(error);
  }

  createSendResponse(user, 200, res);
});

exports.protect = asyncErrorHandler(async (req, res, next) => {
  // 1. read the token and check if it exists
  const testToken = req.headers.authorization;

  let token;
  if (testToken && testToken.startsWith("Bearer")) {
    token = testToken.split(" ")[1];
  }
  if (!token) {
    next(new CustomError("You are not logged in egbon!", 401));
  }

  // 2. validate the token
  const decodedToken = await util.promisify(jwt.verify)(
    token,
    process.env.SECRET_STR
  );

  console.log(decodedToken);

  // 3. check if the user exists
  const user = await User.findById(decodedToken.id);

  if (!user) {
    const error = new CustomError(
      "The user with the given token does not exist",
      401
    );
    next(error);
  }

  // 4. check if the user changed password after the token was issued
  const isPasswordChanged = await user.isPasswordChanged(decodedToken.iat);

  if (isPasswordChanged) {
    const error = new CustomError(
      "the password has been changed recently, please login again",
      401
    );
    return next(error);
  }

  // 5. Allow user to access route
  req.user = user;
  next();
});

exports.restrict = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      const error = new CustomError(
        "You do not have permission to perform this action",
        403
      );
      next(error);
    }
    next();
  };
};

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  // 1. get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    const error = new CustomError(
      "we could not find the user with given email",
      404
    );
    next(error);
  }

  // 2. generate a randon reset token
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // 3. send an email with the reset token
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/reset-password/${resetToken}`;
  const message = `We have recieved a password reset request. please use the below link to reset your password\n\n${resetUrl}\n\n this reset password link will be valid only for 10 minutes`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password change request received",
      message: message,
    });
    res.status(200).json({
      status: "success",
      message: "password reset link sent to the user email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpire = undefined;
    user.save({ validateBeforeSave: false });

    return next(
      new CustomError(
        "there was an error sending password reset email, please try again later",
        500
      )
    );
  }
});

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  // 1. checking if the user exists with the given token and token has not expired
  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    const error = new CustomError("Token is invalid or has expired!", 400);
    next(error);
  }

  // 2. reseting the user password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpire = undefined;
  user.passwordChangedAt = Date.now();

  //   user.passwordChangedAt = Date.now() - 1000;

  user.save();

  // 3. login the user
  createSendResponse(user, 200, res);
});
