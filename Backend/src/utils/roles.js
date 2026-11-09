/** Roles del sistema. Deben coincidir con Frontend/src/utils/roles.js. */
const ROLES = Object.freeze({
  ADMIN: 'admin',
  VENDEDOR: 'vendedor',
});

const ROLE_VALUES = Object.values(ROLES);

module.exports = { ROLES, ROLE_VALUES };
