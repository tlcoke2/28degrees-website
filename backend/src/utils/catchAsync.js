/**
 * Wraps an async function to catch any errors and pass them to the next middleware
 * @param {Function} fn - The async function to wrap
 * @returns {Function} A middleware function that handles errors
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    // Execute the async function and catch any errors
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

export default catchAsync;
