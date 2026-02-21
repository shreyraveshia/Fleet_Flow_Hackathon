/**
 * asyncHandler — wraps async route handlers to forward errors to Express
 * error middleware instead of crashing the process.
 *
 * Usage: router.get('/route', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
