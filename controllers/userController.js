const User = require("../models/usersModel");
const CatchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const SendMail = require("../utils/sendMail");
const { SendToken } = require("../utils/sendToken");

//Register Controller
exports.registerUser = CatchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  //   const { avatar } = req.files;
  let user = await User.findOne({ email });
  if (user) {
    return next(new ErrorHandler("User already registered...", 500));
  }
  const otp = Math.floor(Math.random() * 1000000);

  user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "",
      url: "",
    },
    otp,
    otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000),
  });
  const message = `Verify Your Email\nCopy the below Code and perform your otp authentication\n\n  ${otp}\n\nIf you don't wish to Authenticate your account, disregard this email and no action will be taken.\n\n The V3 Solution Team.`;
  await SendMail(email, "Verify your email", message);
  SendToken(
    res,
    user,
    200,
    "OTP sent to your email, please verify your account"
  );
});

// Verify Your Account
exports.verifyAccount = CatchAsyncError(async (req, res, next) => {
  const otp = Number(req.body.otp);
  const user = await User.findById(req.user._id);

  if (user.otp !== otp || user.otp_expiry < Date.now()) {
    return next(new ErrorHandler("Invalid Otp or has been Expired", 500));
  }
  user.verified = true;
  user.otp = null;
  user.otp_expiry = null;

  await user.save();
  SendToken(res, user, 200, "Account Verified");
});

//Login
exports.loginUser = CatchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please Enter All Fields", 500));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invelid Email or Password", 500));
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorHandler("Invelid Email or Password", 500));
  }
  SendToken(res, user, 200, "Login Successful");
});

//Logut
exports.logoutUser = CatchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logout Successful",
    });
});

//Add Task
exports.addTask = CatchAsyncError(async (req, res, next) => {
  const { title, description } = req.body;
  const user = await User.findById(req.user._id);
  user.tasks.push({
    title,
    description,
    completed: false,
    createdAt: new Date(Date.now()),
  });
  await user.save();
  res.status(200).json({
    success: true,
    message: "Task Added Success",
  });
});
//Remove Task
exports.removeTask = CatchAsyncError(async (req, res, next) => {
  const { taskId } = req.params;
  const user = await User.findById(req.user._id);
  user.tasks = user.tasks.filter(
    (task) => task._id.toString() !== taskId.toString()
  );
  await user.save();
  res.status(200).json({
    success: true,
    message: "Task Removed Success",
  });
});

//update task
exports.updateTask = CatchAsyncError(async (req, res, next) => {
  const { taskId } = req.params;
  console.log(taskId);
  const user = await User.findById(req.user._id);
  user.task = user.tasks.find(
    (task) => task._id.toString() === taskId.toString()
  );

  user.task.completed = !user.task.completed;

  await user.save();
  res.status(200).json({
    success: true,
    message: "task Updated Successfully...",
  });
});

// Get Profile
exports.getProfile = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  SendToken(res, user, 200, `Welcome back ${user.name}`);
});

// Update Profile
exports.updateProfile = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const { name } = req.body;
  // const avatar = req.files.avatar.tempFilePath;

  if (name) user.name = name;
  // if (avatar) {
  //   await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  //   const mycloud = await cloudinary.v2.uploader.upload(avatar);

  //   fs.rmSync("./tmp", { recursive: true });

  //   user.avatar = {
  //     public_id: mycloud.public_id,
  //     url: mycloud.secure_url,
  //   };
  // }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Updated successfully",
  });
});

//Update Password
exports.updatePassword = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please enter all fields", 500));
  }

  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) {
    return next(new ErrorHandler("Invalid Old Password", 500));
  }

  user.password = newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Updated successfully",
  });
});

// Forget Password

exports.forgetPassword = CatchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("Invalid Email", 500));
  }

  const otp = Math.floor(Math.random() * 1000000);

  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000;

  await user.save();

  const message = `Your OTP for reseting the password ${otp}. If you did not request for this, please ignore this email.`;

  await SendMail(email, "Request for Reseting Password", message);

  res.status(200).json({ success: true, message: `OTP sent to ${email}` });
});

// Reset Password

exports.resetPasswordOtp = CatchAsyncError(async (req, res, next) => {
  const { otp, newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordOtp: otp,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Otp Invalid or has been Expired", 500));
  }
  user.password = newPassword;
  user.resetPasswordOtp = null;
  user.resetPasswordExpiry = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: `Password Changed Successfully`
  });
});
