const express = require("express");
const router = express.Router();

const authcontroller = require("../Controllers/authController");
const userController = require("../Controllers/userController");

router.route("/get-users").get(userController.getAllUsers);

router
  .route("/update-password")
  .patch(authcontroller.protect, userController.updatePassword);

router
  .route("/update-me")
  .patch(authcontroller.protect, userController.updateMe);

router
  .route("/delete-me")
  .delete(authcontroller.protect, userController.deleteMe);

module.exports = router;
