/**
 * /api/products — listado interno (con costo y stock) y gestión.
 *
 *   GET    /api/products        Admin, vendedor (?page, limit, q, categoryId, active)
 *   GET    /api/products/:id    Admin, vendedor
 *   POST   /api/products        Admin
 *   PATCH  /api/products/:id    Admin (variantes: ver products.service)
 *   DELETE /api/products/:id    Admin (409 si tiene movimientos o stock)
 *
 * Imagen a S3 (POST /:id/image) e importación CSV (POST /import) se agregan
 * en la segunda parte del incremento 2.
 */
const { Router } = require('express');
const auth = require('../../middlewares/auth');
const requireRole = require('../../middlewares/requireRole');
const validate = require('../../middlewares/validate');
const { ROLES } = require('../../utils/roles');
const controller = require('./products.controller');
const { idParams, createProductBody, updateProductBody, listProductsQuery } = require('./products.schema');

const router = Router();
const staff = requireRole(ROLES.ADMIN, ROLES.VENDEDOR);
const adminOnly = requireRole(ROLES.ADMIN);

router.use(auth);

router.get('/', staff, validate({ query: listProductsQuery }), controller.list);
router.get('/:id', staff, validate({ params: idParams }), controller.getById);
router.post('/', adminOnly, validate({ body: createProductBody }), controller.create);
router.patch('/:id', adminOnly, validate({ params: idParams, body: updateProductBody }), controller.update);
router.delete('/:id', adminOnly, validate({ params: idParams }), controller.remove);

module.exports = router;
