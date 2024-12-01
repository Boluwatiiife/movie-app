const express = require("express");
const authcontroller = require("../Controllers/authController");

const router = express.Router();

router.route("/signup").post(authcontroller.signup);
router.route("/login").post(authcontroller.login);
router.route("/forgot-password").post(authcontroller.forgotPassword);
router.route("/reset-password/:token").patch(authcontroller.resetPassword);

module.exports = router;
