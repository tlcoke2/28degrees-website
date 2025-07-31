/**
 * Async handler to wrap around async route handlers
 * @param {Function} fn - The async route handler function
 * @returns {Function} - A middleware function that handles async/await errors
 */
/**
 * Async handler to wrap around async route handlers
 * @param {Function} fn - The async route handler function
 * @returns {Function} - A middleware function that handles async/await errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Export the asyncHandler function
export { asyncHandler };

// Default export for backward compatibility
export default asyncHandler;
