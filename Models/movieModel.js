const mongoose = require("mongoose");
const fs = require("fs");
const validator = require("validator");

const movieSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required!"],
      unique: true,
      maxlength: [100, "Movie must not have more than 100 charater"],
      minlength: [4, "Movie name must have at least 4 charater"],

      trim: true,
      // validate: [validator.isAlpha, "movie name should be just alphabets"],
    },
    description: String,
    duration: { type: Number, required: [true, "Duration is required egbon!"] },
    rating: {
      type: Number,
      validate: {
        validator: function (value) {
          return value >= 1 && value <= 10;
        },
        message: "Rating ({VALUE}) should be above 1 and less than 10",
      },
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    createdBy: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

movieSchema.virtual("durationInHours").get(function () {
  return this.duration / 60;
});

movieSchema.pre("save", function (next) {
  this.createdBy = "Lawhizzi the great!";
  next();
});

movieSchema.post("save", function (doc, next) {
  const content = `A new movie document with name ${doc.name} has been created by ${doc.createdBy}\n `;
  fs.writeFileSync("./Log/log.txt", content, { flag: "a" }, (err) => {
    console.log(err.message);
  });
  next();
});

movieSchema.pre("find", function (next) {
  next();
});

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;
