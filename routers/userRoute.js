const express = require("express");
const {
  registerUser,
  verifyAccount,
  loginUser,
  logoutUser,
  addTask,
  removeTask,
  updateTask,
  getProfile,
  forgetPassword,
  resetPasswordOtp
} = require("../controllers/userController");
const { isAuthenticated } = require("../middleware/auth");
const router = express.Router();

router.route("/register").post(registerUser);
router.route("/verify").post(isAuthenticated, verifyAccount);
router.route("/login").post(loginUser);
router.route("/logout").get(logoutUser);
router.route("/addtask").post(isAuthenticated, addTask);
router.route("/removeTask/:taskId").delete(isAuthenticated, removeTask);
router.route("/updatetask/:taskId").put(isAuthenticated, updateTask);
router.route("/me").get(isAuthenticated, getProfile);
router.route("/forgotPassword").post(isAuthenticated, forgetPassword)
router.route("/resetPassword").put(isAuthenticated, resetPasswordOtp)

module.exports = router;
