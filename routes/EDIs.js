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
var IdMSC = require('../config/config').IdMSC;

// ==========================================
// Crear nuevo EDI
// ==========================================
app.post('/nuevo/', mdAutenticacion.verificaToken, (req, res) => {
  var ok = false;
  var body = req.body;

  if (req.query.naviera && req.query.naviera == IdMSC) {
    var edi = new EDI({
      //noReferencia: req.query.noReferencia,
      edi: req.query.edi,
      //ruta: rutaCompleta,
      tipo: req.query.tipo,
      naviera: req.query.naviera,
      maniobra: req.query.maniobra,
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
  } else {
    return res.status(400).json({
      ok: false,
      mensaje: 'La naviera no pertenece a MSC',
      errors: { message: 'La naviera no pertenece a MSC' }
    });
  }
});

// ==========================================
//  Crea Cadena CODECO
// ==========================================
app.get('/CODECO/', (req, res) => {
  var idManiobra = req.query.maniobra;
  var referenceNumber = req.query.referenceNumber;
  var rutaCompleta = req.query.ruta;
  var nombreArchivo = `${uuid()}.txt`;
  rutaCompleta += nombreArchivo;

  Maniobra.findById(idManiobra)
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
          mensaje: 'La maniobra con el id ' + idManiobra + ' no existe',
          errors: { message: 'No existe una maniobra con ese ID' }
        });
      }

      if (maniobra.naviera && maniobra.naviera == IdMSC) {
        if (maniobra.estatus == 'LAVADO_REPARACION' ||
          maniobra.estatus == 'DISPONIBLE' ||
          maniobra.estatus == 'CARGADO') {

          var contenidoEDI = MSC.CreaCODECO(maniobra, referenceNumber)

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
            contenido: contenidoEDI,
            ruta: rutaCompleta,
            referenceNumber: referenceNumber
          });

        } else {
          return res.status(400).json({
            ok: false,
            mensaje: 'La maniobra no se encuentra en un estado válido',
            errors: { message: 'La maniobra no se encuentra en un estado válido' }
          });
        }
      } else {
        return res.status(400).json({
          ok: false,
          mensaje: 'La maniobra no pertenece a MSC',
          errors: { message: 'La maniobra no pertenece a MSC' }
        });
      }
    });
});

app.put('/update/', mdAutenticacion.verificaToken, (req, res) => {
  var id = req.query.id;
  //var body = req.body;
  EDI.findById(id, (err, EDI) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar EDI',
        errors: err
      });
    }
    if (!EDI) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El EDI con el id ' + id + ' no existe',
        errors: { message: 'No existe EDI con ese ID' }
      });
    }

    if (EDI.naviera && EDI.naviera == IdMSC) {

      EDI.ruta = req.query.ruta;
      EDI.edi = req.query.edi;
      EDI.generado = req.query.generado;
      EDI.usuarioMod = req.usuario._id;
      EDI.fMod = new Date();
      EDI.save((err, EDIGuardado) => {
        if (err) {
          return res.status(400).json({
            ok: false,
            mensaje: 'Error al actualizar EDI',
            errors: err
          });
        }
        res.status(200).json({
          ok: true,
          EDI: EDIGuardado
        });
      });
    } else {
      return res.status(400).json({
        ok: false,
        mensaje: 'La naviera no pertenece a MSC',
        errors: { message: 'La naviera no pertenece a MSC' }
      });
    }
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