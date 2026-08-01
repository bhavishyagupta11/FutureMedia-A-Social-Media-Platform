const { errorResponse } = require("../utils/responseHandler");
const LoggerService = require("../services/LoggerService");

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  
  // Format validation errors
  let errors = null;
  let finalMessage = err.message || "Internal Server Error";
  let finalStatus = statusCode;

  if (err.name === 'ValidationError') {
    errors = Object.values(err.errors).map(val => ({ field: val.path, message: val.message }));
    finalStatus = 400;
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    finalMessage = "Duplicate field error";
    errors = [{ field, message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.` }];
    finalStatus = 400;
  } else if (err.errors && Array.isArray(err.errors)) {
    errors = err.errors; // pre-formatted
  } else if (process.env.NODE_ENV !== "production" && err.stack) {
    errors = [{ field: "stack", message: err.stack }];
  }

  // Log
  if (statusCode >= 500) {
    LoggerService.error(`Unhandled Error: ${err.message}`, err, { url: req.originalUrl, method: req.method });
  }

  return errorResponse(res, finalStatus, finalMessage, errors);
};

module.exports = { notFound, errorHandler };
