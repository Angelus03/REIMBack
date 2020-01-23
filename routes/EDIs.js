var fs = require('fs');
var express = require('express');
var mongoose = require('mongoose');
var mdAutenticacion = require('../middlewares/autenticacion');
var app = express();
var EDI = require('../models/EDI');
var uuid = require('uuid/v1');
const MSC = require('../public/msc');
var Maniobra = require('../models/maniobra');
const varias = require('../public/varias');

// ==========================================
// Crear nuevo EDI
// ==========================================
app.post('/nuevo/', mdAutenticacion.verificaToken, (req, res) => {
  var ok = false;
  var body = req.body;

  var edi = new EDI({
    noReferencia: req.query.noReferencia,
    edi: req.query.edi,
    //ruta: rutaCompleta,
    tipo: req.query.tipo,
    naviera: req.query.naviera,
    usuarioAlta: req.usuario._id,
    fAlta: new Date()
  });

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

// ==========================================
//  Prueba Llena CODECO
// ==========================================
app.get('/javi/', (req, res) => {
  var id = req.query.id;
  var rutaCompleta = req.query.ruta;
  var nombreArchivo = `${uuid()}.txt`;
  rutaCompleta += nombreArchivo;

  Maniobra.findById(id)
    .populate('solicitud', '_id blBooking facturarA')
    .exec((err, maniobra) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar maniobra',
          errors: err
        });
      }
      if (!maniobra) {
        return res.status(400).json({
          ok: false,
          mensaje: 'La maniobra con el id ' + id + 'no existe',
          errors: { message: 'No existe una maniobra con ese ID' }
        });
      }

      var contenidoEDI = MSC.CreaCODECO(maniobra)

      if (contenidoEDI != '') {
        varias.creaArchivoTXT(rutaCompleta, contenidoEDI.replace('\n', ''));       
      } else {
        return res.status(400).json({
          ok: false,
          mensaje: 'El ContenidoEDI es VACIO',
          errors: { message: 'El ContenidoEDI es VACIO' }
        });
      }

      // FTP.UploadFile(req.query.ruta, nombreArchivo, true);

      res.status(200).json({
        ok: true,
        //maniobra: maniobra,
        contenido: contenidoEDI
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