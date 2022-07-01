const  app  = require('./app');
const  {config}  = require('dotenv');
const connectDatabase = require('./config/database.js') 
const cloudinary = require('cloudinary')

config({
  path: "./config/config.env",
});
//If Private Key Is Not Define
if (!process.env.PRIVATE_KEY) {
    console.error("FATAl ERROR: jwtPrivateKey Is Not Define...")
    process.exit(1)
}

// Handling Uncaught Exception
process.on('uncaughtException', (err) => {
    console.log(`Error Message: ${err.message}`);
    console.log('Shuting Down the Server due to Uncaught Exception');
    process.exit(1);
})

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});
connectDatabase();

app.listen(process.env.PORT, () => {
  console.log("Server is running on port " + process.env.PORT);
});

// Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Unhandled Promise Rejection`);

    server.close(() => {
        process.exit(1);
    });
});