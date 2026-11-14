/**
 * /api/categories
 *   GET    /api/categories        Público: lista con productCount
 *   POST   /api/categories        Admin: { name, description?, slug? }
 *   PATCH  /api/categories/:id    Admin
 *   DELETE /api/categories/:id    Admin (409 si tiene productos)
 */
const { Router } = require('express');
const auth = require('../../middlewares/auth');
const requireRole = require('../../middlewares/requireRole');
const validate = require('../../middlewares/validate');
const { ROLES } = require('../../utils/roles');
const controller = require('./categories.controller');
const { idParams, createCategoryBody, updateCategoryBody } = require('./categories.schema');

const router = Router();
const adminOnly = [auth, requireRole(ROLES.ADMIN)];

router.get('/', controller.list);
router.post('/', ...adminOnly, validate({ body: createCategoryBody }), controller.create);
router.patch('/:id', ...adminOnly, validate({ params: idParams, body: updateCategoryBody }), controller.update);
router.delete('/:id', ...adminOnly, validate({ params: idParams }), controller.remove);

module.exports = router;
