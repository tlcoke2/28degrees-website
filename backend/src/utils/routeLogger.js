import listEndpoints from 'express-list-endpoints';

/**
 * Middleware to log all registered routes
 * This helps in debugging route registration issues
 * @param {import('express').Application} app - Express application instance
 */
export const logRoutes = (app) => {
  console.log('\n📡 Registered Routes:');
  const routes = listEndpoints(app);
  
  routes.forEach(route => {
    route.methods.forEach(method => {
      console.log(`${method.padEnd(6)} ${route.path}`);
    });
  });
  console.log('\n');
};

export default logRoutes;
