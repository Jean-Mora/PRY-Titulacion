/**
 * Crea el primer administrador (no hay registro público: los usuarios los da
 * de alta un admin desde POST /api/users, así que el primero se crea aquí).
 *
 *   ADMIN_PASSWORD='...' npm run seed:admin -- --name "Jean Pierre Mora" --email admin@jeanfabri.com
 *
 * La contraseña va por variable de entorno para que no quede en el historial
 * de comandos junto con el resto de argumentos. Si el correo ya existe, no
 * hace nada.
 */
const { parseArgs } = require('node:util');
const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const { User } = require('../src/models');
const usersService = require('../src/modules/users/users.service');
const { createUserBody } = require('../src/modules/users/users.schema');
const { ROLES } = require('../src/utils/roles');

async function main() {
  const { values } = parseArgs({
    options: { name: { type: 'string' }, email: { type: 'string' } },
  });

  const parsed = createUserBody.safeParse({
    name: values.name,
    email: values.email,
    password: process.env.ADMIN_PASSWORD,
    role: ROLES.ADMIN,
  });
  if (!parsed.success) {
    console.error('Datos inválidos:');
    for (const i of parsed.error.issues) console.error(`  - ${i.path.join('.') || 'valor'}: ${i.message}`);
    console.error('\nUso: ADMIN_PASSWORD=... npm run seed:admin -- --name "Nombre" --email correo@dominio.com');
    process.exitCode = 1;
    return;
  }

  await connectDB(env.MONGODB_URI);
  try {
    if (await User.exists({ email: parsed.data.email })) {
      console.log(`Ya existe un usuario con el correo ${parsed.data.email}. No se hizo ningún cambio.`);
      return;
    }
    const user = await usersService.create(parsed.data);
    console.log(`Administrador creado: ${user.name} <${user.email}>`);
  } finally {
    await disconnectDB();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
