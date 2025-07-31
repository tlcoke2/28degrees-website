/**
 * Success response class for consistent API responses
 */
class ApiResponse {
  /**
   * Create a new ApiResponse instance
   * @param {number} statusCode - HTTP status code
   * @param {*} data - Response data
   * @param {string} [message='Success'] - Response message
   */
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

// Export the ApiResponse class and helper functions
export { ApiResponse, sendResponse, sendError };

// Default export for backward compatibility
export default ApiResponse;

/**
 * Helper function to create a success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {*} data - Response data
 * @param {string} [message='Success'] - Response message
 * @returns {Object} - Express response object
 */
function sendResponse(res, statusCode, data, message = 'Success') {
  const response = new ApiResponse(statusCode, data, message);
  return res.status(statusCode).json({
    success: response.success,
    message: response.message,
    data: response.data,
  });
}

/**
 * Helper function to create an error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Array} [errors=[]] - Additional error details
 * @returns {Object} - Express response object
 */
function sendError(res, statusCode, message, errors = []) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
  });
}
