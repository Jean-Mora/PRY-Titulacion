/**
 * Cliente de Amazon S3 para las imágenes de productos.
 *
 * No recibe llaves: en EC2 las credenciales vienen del rol de IAM de la
 * instancia, y en desarrollo del perfil local de AWS (cadena de credenciales
 * por defecto del SDK). Se crea al primer uso para que el arranque y las
 * pruebas no dependan de AWS. La subida de imágenes se implementa en el
 * incremento 2 (products).
 */
const { S3Client } = require('@aws-sdk/client-s3');
const env = require('./env');

let client = null;

function getS3Client() {
  if (!client) client = new S3Client({ region: env.AWS_REGION });
  return client;
}

module.exports = { getS3Client, bucket: env.S3_BUCKET_IMAGES };
