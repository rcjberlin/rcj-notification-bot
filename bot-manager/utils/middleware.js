/**
 * Middleware function to respond with a 404 in JSON format
 */
function routeNotFound(req, res, next) {
  res.status(404).json({
    successful: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Middleware function handling internal server errors and responding with a 500 in JSON format
 */
function internalServerError(err, req, res, next) {
  console.error(err);
  res.status(500).json({
    successful: false,
    message: "Internal Server Error",
  });
}

module.exports = {
  routeNotFound,
  internalServerError,
};
