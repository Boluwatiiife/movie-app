const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log(err.message);
  console.log("uncaught Exception occured! Shutting down...");

  server.close(() => {
    process.exit(1);
  });
});

const app = require("./app");
// const { default: mongoose } = require("mongoose");

// console.log(process.env);

mongoose
  .connect(process.env.MONGODB_LOCAL)
  .then((conn) => {
    // console.log(conn);
    console.log("DB connection successfully!...");
  })
  .catch((err) => {
    console.log(`error has occured`);
  });

// create a server
const port = process.env.PORT || 3090;
const server = app.listen(port, () => {
  console.log(`server started on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.message);
  console.log("Unhandled rejection occured! Shutting down...");

  server.close(() => {
    process.exit(1);
  });
});
