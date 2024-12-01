const express = require("express");
const moviesController = require("../Controllers/moviesControllers");
const authController = require("../Controllers/authController");

const router = express.Router();

// router.param("id", moviesController.checkId);

router
  .route("/highest-rated")
  .get(moviesController.getHighestRated, moviesController.getAllMovies);

router.route("/movie-stats").get(moviesController.getMovieStat);
// router.route("/movie-genre/:genre").get(moviesController.getMovieByGenre);

router
  .route("/")
  .get(authController.protect, moviesController.getAllMovies)
  .post(moviesController.postMovies);

router
  .route("/:id")
  .get(authController.protect, moviesController.getSingleMovie)
  .patch(moviesController.updateMovie)
  .delete(
    authController.protect,
    authController.restrict("admin"),
    moviesController.deleteMovie
  );

module.exports = router;
