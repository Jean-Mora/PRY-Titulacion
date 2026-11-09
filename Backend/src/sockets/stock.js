/**
 * Tiempo real del inventario (Socket.io).
 *
 *   stock:updated  → a todos (catálogo público y pantalla de venta)
 *   stock:low      → solo a la sala "staff" (panel)
 *
 * El socket solo emite desde el servidor: no se registran manejadores para
 * eventos que envíe el cliente. Los usuarios del panel entran a "staff"
 * enviando su JWT al conectar:  io({ auth: { token } }).
 * Los visitantes del catálogo se conectan sin token.
 *
 * En el incremento 1 queda lista la conexión y la sala; movements.service
 * llamará a emitStockUpdated / emitStockLow en el incremento 3.
 */
const { verifyToken } = require('../utils/jwt');
const User = require('../modules/users/users.model');
const logger = require('../utils/logger');

const STAFF_ROOM = 'staff';
let io = null;

async function joinStaffIfAuthenticated(socket) {
  const token = socket.handshake.auth?.token;
  if (!token) return;
  try {
    const { sub } = verifyToken(token);
    const user = await User.findById(sub).select('active role').lean();
    if (user?.active) {
      socket.data.user = { id: sub, role: user.role };
      socket.join(STAFF_ROOM);
    }
  } catch {
    // Token inválido o vencido: queda conectado como visitante, sin sala staff.
  }
}

function initStockSocket(server) {
  io = server;
  io.on('connection', async (socket) => {
    await joinStaffIfAuthenticated(socket);
    logger.info(`socket conectado ${socket.id}${socket.data.user ? ' (staff)' : ''}`);
  });
  return io;
}

/** @param {{ productId: string, variantId: string, stock: number }} payload */
function emitStockUpdated(payload) {
  io?.emit('stock:updated', payload);
}

/** @param {{ productId: string, variantId: string, name: string, stock: number, stockMin: number }} payload */
function emitStockLow(payload) {
  io?.to(STAFF_ROOM).emit('stock:low', payload);
}

module.exports = { initStockSocket, emitStockUpdated, emitStockLow, STAFF_ROOM };
