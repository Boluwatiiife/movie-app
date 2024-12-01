const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const Movie = require("../Models/movieModel");

dotenv.config({ path: "./config.env" });

mongoose
  .connect(process.env.MONGODB_LOCAL)
  .then((conn) => {
    // console.log(conn);
    console.log("DB connection successfully!...");
  })
  .catch((err) => {
    console.log(`error has occured`);
  });

// read movies.json file
const movies = JSON.parse(fs.readFileSync("./data/movies.json", "utf-8"));

// delete existing movie docs from collection
const deleteMovies = async () => {
  try {
    await Movie.deleteMany();
    console.log("data successfully deleted!");
  } catch (err) {
    console.log(err.message);
  }
  process.exit();
};

// import data to mongodb collection
const importMovies = async () => {
  try {
    await Movie.create(movies);
    console.log("data successfully imported!");
  } catch (err) {
    console.log(err.message);
  }
  process.exit();
};

if (process.argv[2] === "--import") {
  importMovies();
}
if (process.argv[2] === "--delete") {
  deleteMovies();
}
