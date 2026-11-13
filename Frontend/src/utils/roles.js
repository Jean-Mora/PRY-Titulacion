/** Roles definidos por el backend (users.role). */
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  VENDEDOR: 'vendedor',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.VENDEDOR]: 'Vendedor',
});

/** true si el usuario tiene alguno de los roles; sin lista de roles, basta con tener sesión. */
export function hasRole(user, roles) {
  if (!user) return false;
  if (!roles || roles.length === 0) return true;
  return roles.includes(user.role);
}
