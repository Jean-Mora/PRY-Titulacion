/**
 * /api/users — gestión de usuarios. Solo administradores.
 *
 *   GET    /api/users          listado paginado (?page, limit, q, role, active)
 *   GET    /api/users/:id      detalle
 *   POST   /api/users          alta { name, email, password, role }
 *   PATCH  /api/users/:id      cambios parciales { name?, email?, password?, role?, active? }
 *
 * No hay DELETE: un usuario se desactiva (active: false) para conservar la
 * trazabilidad de sus movimientos y cotizaciones.
 */
const { Router } = require('express');
const auth = require('../../middlewares/auth');
const requireRole = require('../../middlewares/requireRole');
const validate = require('../../middlewares/validate');
const { ROLES } = require('../../utils/roles');
const controller = require('./users.controller');
const { idParams, createUserBody, updateUserBody, listUsersQuery } = require('./users.schema');

const router = Router();

router.use(auth, requireRole(ROLES.ADMIN));

router.get('/', validate({ query: listUsersQuery }), controller.list);
router.get('/:id', validate({ params: idParams }), controller.getById);
router.post('/', validate({ body: createUserBody }), controller.create);
router.patch('/:id', validate({ params: idParams, body: updateUserBody }), controller.update);

module.exports = router;
