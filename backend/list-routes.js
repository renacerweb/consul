const app = require('./dist/index.js');
const server = app.listen(0, () => {
  console.log('=== RUTAS REGISTRADAS ===');
  function printRoutes(stack, prefix = '') {
    if (!stack) return;
    stack.forEach(layer => {
      if (layer.route) {
        console.log(`${Object.keys(layer.route.methods).join(',')} ${prefix}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        printRoutes(layer.handle.stack, prefix + (layer.regexp.source.match(/\/(?:[^\/]+\/)?/g)?.join('') || '/'));
      }
    });
  }
  printRoutes(app._router.stack);
  server.close();
});
