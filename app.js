// import package
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const sanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const CustomError = require("./Utils/CustomError");
const globalErrorHandler = require("./Controllers/errorController");

const moviesRouter = require("./Routes/moviesRoutes");
const authRouter = require("./Routes/authRouter");
const userRouter = require("./Routes/userRoute");

let app = express();

app.use(helmet());

let limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message:
    "we have recieved too many request from this ip, please try after 1 hour",
});

app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));

app.use(sanitize()); // looks for nosql query and filter out all the $ and . signs

app.use(xss()); // clean any user input from the mailcious html code

app.use(hpp({ whitelist: ["duration", "rating", "description"] }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// USING ROUTES
app.use("/api/v1/movies", moviesRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.all("*", (req, res, next) => {
  // it should always come last in the defined routes
  const err = new CustomError(
    `Cannot find ${req.originalUrl} on the server!`,
    404
  );
  next(err);
});

app.use(globalErrorHandler);

module.exports = app;
