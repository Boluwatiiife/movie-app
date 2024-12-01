const CustomError = require("../Utils/CustomError");

const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
    stackTrace: error.stack,
    error: error,
  });
};

const prodError = (res, error) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.statusCode,
      message: error.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong! Please try again",
    });
  }
};

const castErrorHandler = (err) => {
  const mssg = `Invalid value ${err.path}: ${err.value}!`;
  return new CustomError(mssg, 400);
};

const duplicateKeyErrorHandler = (err) => {
  const name = err.keyValue.name;
  const mssg = `There is already a movie with name ${name} please use another name!`;
  return new CustomError(mssg, 400);
};

const validationErrorHandler = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const errorMessages = errors.join(". ");
  const mssg = `Invalid input data: ${errorMessages}`;

  return new CustomError(mssg, 400);
};

const handleExpiredJWT = (err) => {
  return new CustomError("JWT has expired, please login again!", 401);
};

const handleJWTError = (err) => {
  return new CustomError("Invalid token, please login again!", 401);
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    devErrors(res, error);
  } else if (process.env.NODE_ENV === "production") {
    if (error.name === "CastError") error = castErrorHandler(error);
    if (error.code === 11000) error = duplicateKeyErrorHandler(error);
    if (error.name === "ValidationError") error = validationErrorHandler(error);
    if (error.name === "TokenExpiredError") error = handleExpiredJWT(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError(error);

    prodError(res, error);
  }
};
