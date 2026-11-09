/**
 * Registra los 5 modelos de Mongoose en un solo lugar. server.js y las
 * pruebas lo importan para que todos los índices se creen al arrancar.
 */
module.exports = {
  User: require('./modules/users/users.model'),
  Category: require('./modules/categories/categories.model'),
  Product: require('./modules/products/products.model'),
  Movement: require('./modules/movements/movements.model'),
  Quotation: require('./modules/quotations/quotations.model'),
};
