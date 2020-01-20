var fs = require('fs');
var express = require('express');
var mdAutenticacion = require('../middlewares/autenticacion');
var app = express();
var EDI = require('../models/EDI');
var uuid = require('uuid/v1');
const FTP = require('../public/ftp');

// ==========================================
// Crear nuevo EDI
// ==========================================
app.post('/nuevo/', mdAutenticacion.verificaToken, (req, res) => {
  var ok = false;
  var body = req.body;
  var rutaCompleta = req.query.ruta;
  var nombreArchivo = `${uuid()}.txt`;
  rutaCompleta += nombreArchivo;
  var edi = new EDI({
    noReferencia: req.query.noReferencia,
    edi: req.query.edi,
    ruta: rutaCompleta,
    tipo: req.query.tipo,
    naviera: req.query.naviera,
    usuarioAlta: req.usuario._id,
    fAlta: new Date()
  });


  var EasyFtp = require("easy-ftp");
  var ftp = new EasyFtp();

  const config = {
    host: "127.0.0.1",
    type: "FTP",
    port: "21",
    username: "javi",
    password: "javi08"
  };

  ftp.connect(config);
  console.log('FTP CONNECTED:' + ftp.client.isConnect)

  // ftp.mkdir("/Test_MYT", function (err) {
  //       if (err)
  //           console.log(err);
  //   });

  fs.writeFile(edi.ruta, edi.edi, function (err) {
    if (err)
      throw err;
  });


  ftp.upload(rutaCompleta, "/Test_MYT/" + nombreArchivo)




  edi.save((err, EDIGuardado) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Error al crear el EDI',
        errors: err
      });
    }

    res.status(201).json({
      ok: true,
      EDI: EDIGuardado
    });
  });
});

// // Leer archivo
// fs.readFile('data.txt', function (err, data) {
//   if (err)
//     throw err;
//   if (data)
//     console.log(data.toString('utf8'));
// });

// // Escribir Archivo
// fs.writeFile('data2.txt', 'Hello, World!', function (err) {
//     if (err)
//       throw err;
// });

module.exports = app;