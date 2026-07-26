/**
 * Standardized API Response Wrapper
 */
const successResponse = (res, statusCode = 200, message = "Operation completed successfully.", data = {}, meta = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
    errors: null
  });
};

const errorResponse = (res, statusCode = 500, message = "Server Error", errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    meta: null,
    errors
  });
};

module.exports = { successResponse, errorResponse };
