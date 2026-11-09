/**
 * Recepción de archivos con multer, en memoria (no se escribe nada en el
 * disco de EC2): las imágenes se reenvían a S3 y el CSV se procesa en el
 * momento. Se usan en el incremento 2:
 *
 *   router.post('/:id/image', auth, requireRole(ADMIN), uploadImage, controller.uploadImage)
 *   router.post('/import',    auth, requireRole(ADMIN), uploadCsv,   controller.importCsv)
 */
const multer = require('multer');
const AppError = require('../utils/AppError');

const MB = 1024 * 1024;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CSV_TYPES = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];

function fileFilter(allowed, message) {
  return (_req, file, cb) => {
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(AppError.badRequest(message, undefined, 'INVALID_FILE_TYPE'));
  };
}

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * MB, files: 1 },
  fileFilter: fileFilter(IMAGE_TYPES, 'La imagen debe ser JPG, PNG o WebP.'),
}).single('image');

const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * MB, files: 1 },
  fileFilter: fileFilter(CSV_TYPES, 'El archivo debe ser un CSV.'),
}).single('file');

module.exports = { uploadImage, uploadCsv, IMAGE_TYPES, CSV_TYPES };
