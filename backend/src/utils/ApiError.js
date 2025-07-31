/**
 * Custom API error class that extends the built-in Error class
 */
class ApiError extends Error {
  /**
   * Create a new ApiError instance
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {boolean} [isOperational=true] - Whether the error is operational (expected) or a programming error
   * @param {string} [stack=''] - Error stack trace
   */
  constructor(
    statusCode,
    message,
    isOperational = true,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Export the ApiError class and createApiError function
export { ApiError, createApiError };

// Default export for backward compatibility
export default ApiError;

// Helper function to create a new ApiError
/**
 * Create a new API error
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {boolean} [isOperational=true] - Whether the error is operational
 * @returns {ApiError} - New ApiError instance
 */
function createApiError(statusCode, message, isOperational = true) {
  return new ApiError(statusCode, message, isOperational);
}
