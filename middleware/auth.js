const jwt = require('jsonwebtoken');
const User = require('../models/usersModel')
const CathAsyncError = require('./catchAsyncError')
const ErrorHandler = require('../utils/errorHandler')
exports.isAuthenticated = CathAsyncError(async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return next(new ErrorHandler("Login To Access This Resource",500))
    }
    const decoded = jwt.verify(token, process.env.PRIVATE_KEY);

    req.user = await User.findById(decoded.id);

    next();
})