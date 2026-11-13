/**
 * Controlador de usuarios: lee la petición, llama al servicio y responde.
 */
const usersService = require('./users.service');

async function list(req, res) {
  res.json(await usersService.list(req.validated.query));
}

async function getById(req, res) {
  res.json({ user: await usersService.getById(req.validated.params.id) });
}

async function create(req, res) {
  const user = await usersService.create(req.validated.body);
  res.status(201).json({ user });
}

async function update(req, res) {
  const user = await usersService.update(req.validated.params.id, req.validated.body, req.user.id);
  res.json({ user });
}

module.exports = { list, getById, create, update };
