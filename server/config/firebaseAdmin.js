const admin = require('firebase-admin');
const path = require('path');

// Ruta al archivo de la clave del servicio
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
