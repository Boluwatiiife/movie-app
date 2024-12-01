const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// name, email, password, confirmPassword, photo
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "please enter your name boss"],
  },
  email: {
    type: String,
    required: [true, "please enter an email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "please enter a valid email"],
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "please enter a password"],
    minlength: 8,
    select: false, // so the password will not show when we get the user
  },
  confirmPassword: {
    type: String,
    required: [true, "please confirm your password"],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: "password & confirm password does not match",
    },
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpire: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();

  // encrypt the password before saving it
  this.password = await bcrypt.hash(this.password, 12);

  this.confirmPassword = undefined;
  next();
});

userSchema.pre(
  /^find/ /**will run before any query that starts with find */,
  function (next) {
    // this keyword in the function will point to current query
    this.find({ active: { $ne: false } });
    next();
  }
);

// function to compare user password when logging in
userSchema.methods.comparePasswordInDB = async function (password, passwordDB) {
  return await bcrypt.compare(password, passwordDB);
};

userSchema.methods.isPasswordChanged = async function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const passwordChangedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(passwordChangedTimestamp, JWTTimeStamp);
    return JWTTimeStamp < passwordChangedTimestamp; //password was changed after the jwt was issued
  }
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetTokenExpire = Date.now() + 10 * 60 * 1000;

  // console.log(resetToken, this.passwordResetToken);

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
