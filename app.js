const express = require("express");
const User = require("./routers/userRoute");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const ErrorMiddleware = require("./middleware/error");
const cors = require("cors");
const {config} = require('dotenv')

const app = express();

//config
config({ path: './config/config.env' })

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Cookie-Parser
app.use(cookieParser());
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
  })
);
app.use(cors());

app.use("/api/v1", User);

// Middleware for Errors
app.use(ErrorMiddleware);



module.exports = app;