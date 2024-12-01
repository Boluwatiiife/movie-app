const User = require("./../Models/userModel");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const jwt = require("jsonwebtoken");
const CustomError = require("../Utils/CustomError");
const util = require("util");
const sendEmail = require("../Utils/email");
const crypto = require("crypto");
const authcontroller = require("./authController");

exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: "success",
    result: users.length,
    data: {
      users,
    },
  });
});

const filterRequestObj = (obj, ...allowedfields) => {
  const newObj = {};
  Object.keys(obj).forEach((prop) => {
    if (allowedfields.includes(prop)) newObj[prop] = obj[prop];
  });
  return newObj;
};

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  // get correct user data from database
  const user = await User.findById(req.user._id).select("+password");

  // check if the supplied current password is correct
  if (
    !(await user.comparePasswordInDB(req.body.currentPassword, user.password))
  ) {
    return next(
      new CustomError("The current password you provided is wrong", 401)
    );
  }

  // if supplied password is correct, update password with the new value
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  // login user and send jwt
  createSendResponse(user, 200, res);
  //   res.status(200).json({
  //     status: "Success",
  //     data: {
  //       user: updateUser,
  //     },
  //   });
});

exports.updateMe = asyncErrorHandler(async (req, res, next) => {
  // 1. check if request data contain password || confirm password
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new CustomError(
        "You cannot update your password using this endpoint",
        400
      )
    );
  }

  // update user detail
  const filterObj = filterRequestObj(req.body, "name", "email");
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterObj, {
    runValidators: true,
    new: true,
  });
  res.status(200).json({
    status: "success",
    message: "You have updated your profile",
    data: {
      update: updatedUser,
    },
  });
});

exports.deleteMe = asyncErrorHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});
