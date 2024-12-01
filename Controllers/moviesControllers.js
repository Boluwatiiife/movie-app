const Movie = require("../Models/movieModel");
const ApiFeatures = require("../Utils/ApiFeatures");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const CustomError = require("../Utils/CustomError");

// route handler
exports.getHighestRated = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-rating";

  next();
};

exports.getAllMovies = asyncErrorHandler(async (req, res, next) => {
  const features = new ApiFeatures(Movie.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();

  let movies = await features.query;
  res.status(200).json({
    status: "success",
    length: movies.length,
    data: {
      movies,
    },
  });
});

exports.getSingleMovie = asyncErrorHandler(async (req, res, next) => {
  // const movie = await Movie.find({ _id: req.params.id });
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    const error = new CustomError("Movie with that ID is not found!", 404);
    return next(error);
  }

  res.status(201).json({
    status: "success",
    data: {
      movie: movie,
    },
  });
});

exports.postMovies = asyncErrorHandler(async (req, res, next) => {
  const movie = await Movie.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      movie: movie,
    },
  });
});

exports.updateMovie = asyncErrorHandler(async (req, res, next) => {
  const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedMovie) {
    const error = new CustomError("Movie with that ID is not found!", 404);
    return next(error);
  }
  res.status(200).json({
    status: "success",
    data: {
      movie: updatedMovie,
    },
  });
});

exports.deleteMovie = asyncErrorHandler(async (req, res, next) => {
  const deletedMovie = await Movie.findByIdAndDelete(req.params.id);

  if (!deletedMovie) {
    const error = new CustomError("Movie with that ID is not found!", 404);
    return next(error);
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getMovieStat = asyncErrorHandler(async (req, res, next) => {
  const stats = await Movie.aggregate([
    { $match: { rating: { $gte: 4.5 } } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        movieCount: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    count: stats.length,
    data: { stats },
  });
});
