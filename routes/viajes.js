var express = require('express');
var mdAutenticacion = require('../middlewares/autenticacion');
var fileUpload = require('express-fileupload');
var fs = require('fs');
var app = express();
var Viaje = require('../models/viaje');
var Maniobra = require('../models/maniobra');
var varias = require('../public/varias');
var moment = require('moment');

app.use(fileUpload());

// ==========================================
// Obtener todas los viajes, de acuerdo a los filtros solicitados.
// las fechas deben ir en formato DD-MM-YYYY
// ==========================================
app.get('/:viaje?:buque?:finiarribo?:ffinarribo?', (req, res, next) => {

  var viaje = req.query.viaje || '';
  var buque = req.query.buque || '';
  var finiarribo = req.query.finiarribo || '';
  var ffinarribo = req.query.ffinarribo || '';
  var filtro = '{';
  if (viaje != 'undefined' && viaje != '')
    filtro += '\"viaje\":{ \"$regex\":' + '\".*' + viaje + '\",\"$options\":\"i\"},';
  if (buque != 'undefined' && buque != '')
    filtro += '\"buque\":' + '\"' + buque + '\",';
  if (finiarribo != '' && ffinarribo) {
    fIni = moment(finiarribo, 'DD-MM-YYYY', true).utc().startOf('day').format();
    fFin = moment(ffinarribo, 'DD-MM-YYYY', true).utc().endOf('day').format();
    filtro += '\"fArribo\":{ \"$gte\":' + '\"' + fIni + '\"' + ', \"$lte\":' + '\"' + fFin + '\"' + '},';
  }
  if (filtro != '{')
    filtro = filtro.slice(0, -1);
  filtro = filtro + '}';
  var json = JSON.parse(filtro);
  //  console.log(json);
  Viaje.find(json)
    .populate('buque', 'nombre')
    .exec(
      (err, viajes) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            mensaje: 'Error al cargar viajes',
            errors: err
          });
        }
        res.status(200).json({
          ok: true,
          viajes: viajes,
          total: viajes.length
        });
      });
});

// ==========================================
//  Obtener viaje por ID
// ==========================================
app.get('/viaje/:id', (req, res) => {
  var id = req.params.id;
  Viaje.findById(id)
    .exec((err, viaje) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar viaje',
          errors: err
        });
      }
      if (!viaje) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El viaje con el id ' + id + 'no existe',
          errors: { message: 'No existe un viaje con ese ID' }
        });
      }
      Maniobra.find({ "viaje": id }).exec(
        (err, maniobras) => {
          if (err) {
            return res.status(500).json({
              ok: false,
              mensaje: 'Error cargando maniobras',
              errors: err
            });
          }
          viaje.contenedores = maniobras;
          res.status(200).json({
            ok: true,
            viaje: viaje
          });
        });
    });
});

// ==========================================
//  Obtener viaje por ID
// ==========================================
app.get('/viaje/:id/includes/', (req, res) => {
  var id = req.params.id;
  Viaje.findById(id)
    .exec((err, viaje) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar viaje',
          errors: err
        });
      }
      if (!viaje) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El viaje con el id ' + id + 'no existe',
          errors: { message: 'No existe un viaje con ese ID' }
        });
      }
      Maniobra.find({ "viaje": id }).exec(
        (err, maniobras) => {
          if (err) {
            return res.status(500).json({
              ok: false,
              mensaje: 'Error cargando maniobras',
              errors: err
            });
          }
          viaje.contenedores = maniobras;
          res.status(200).json({
            ok: true,
            viaje: viaje
          });
        });
    });
});

// ==========================================
// Crear nuevo viaje
// ==========================================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
  var body = req.body;
  var viaje = new Viaje({
    anio: body.anio,
    naviera: body.naviera,
    viaje: body.viaje,
    buque: body.buque,
    fArribo: body.fArribo,
    fVigenciaTemporal: body.fVigenciaTemporal,
    pdfTemporal: body.pdfTemporal,
    usuarioAlta: req.usuario._id
  });

  varias.MoverArchivoFromTemp('./uploads/temp/', viaje.pdfTemporal, './uploads/viajes/', viaje.pdfTemporal);
  // if (viaje.pdfTemporal != '' && fs.existsSync('./uploads/temp/' + viaje.pdfTemporal)) {
  //   fs.rename('./uploads/temp/' + viaje.pdfTemporal, './uploads/viajes/' + viaje.pdfTemporal, (err) => {
  //     if (err) { console.log(err); }
  //   });
  // }
  viaje.save((err, viajeGuardado) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Error al crear viaje',
        errors: err
      });
    }
    body.contenedores.forEach(function(element) {
      var maniobra;
      if (element.peso == 'VACIO') {
        maniobra = new Maniobra({
          viaje: viaje._id,
          cliente: "5c49e55b6b427b166466c9b3",
          facturarA: "AQUI IRIA NOMBRE DE LA NAVIERA",
          correoFac: 'aqui iria correo del datos que hay en clientes',
          contenedor: element.contenedor,
          tipo: element.tipo,
          peso: element.peso,
          estatus: 'TRANSITO',
          destinatario: element.destinatario,
          usuarioAlta: req.usuario._id
        });
      } else {
        maniobra = new Maniobra({
          viaje: viaje._id,
          contenedor: element.contenedor,
          tipo: element.tipo,
          peso: element.peso,
          estatus: 'APROBACION',
          destinatario: element.destinatario,
          usuarioAlta: req.usuario._id
        });
      }
      maniobra.save((err, maniobraGuardado) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            ok: false,
            mensaje: "Error al cargar la maniobra",
            errors: err
          });
        }
      });
    });
    res.status(201).json({
      ok: true,
      mensaje: 'Viaje dado de alta con éxito',
      viaje: viajeGuardado
    });
  });
});


// ==========================================
// Actualizar Viaje
// ==========================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
  var id = req.params.id;
  var body = req.body;
  Viaje.findById(id, (err, viaje) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar viaje',
        errors: err
      });
    }
    if (!viaje) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El viaje con el id ' + id + ' no existe',
        errors: { message: 'No existe viaje con ese ID' }
      });
    }
    viaje.anio = body.anio;
    viaje.viaje = body.viaje;
    viaje.naviera = body.naviera;
    viaje.buque = body.buque;
    viaje.fArribo = body.fArribo;
    viaje.fVigenciaTemporal = body.fVigenciaTemporal;
    viaje.usuarioMod = req.usuario._id;
    viaje.fMod = new Date();

    if (viaje.pdfTemporal != body.pdfTemporal) {
      if (varias.MoverArchivoFromTemp('./uploads/temp/', body.pdfTemporal, './uploads/viajes/', viaje.pdfTemporal)) {
        console.log('entro');
        viaje.pdfTemporal = body.pdfTemporal;
      }

      // if (fs.existsSync('./uploads/temp/' + body.pdfTemporal)) {
      //   if (viaje.pdfTemporal != undefined || viaje.pdfTemporal != '' && viaje.pdfTemporal != null && fs.existsSync('./uploads/viajes/' + viaje.pdfTemporal)) {
      //     fs.unlink('./uploads/viajes/' + viaje.pdfTemporal, (err) => {
      //       if (err) console.log(err);
      //       else
      //         console.log('File anterior fue borrado con éxito');
      //     });
      //   }
      //   fs.rename('./uploads/temp/' + body.pdfTemporal, './uploads/viajes/' + body.pdfTemporal, (err) => {
      //     if (err) { console.log(err); }
      //   });
      //   viaje.pdfTemporal = body.pdfTemporal;
      // }
    }
    viaje.save((err, viajeGuardado) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Error al actualizar viaje',
          errors: err
        });
      }
      res.status(200).json({
        ok: true,
        mensaje: 'Transportista actualizado con exito',
        viaje: viajeGuardado
      });

    });

  });

});

// ============================================
// Borrar viaje por el id
// ============================================
app.delete('/viaje/:id', mdAutenticacion.verificaToken, (req, res) => {
  var id = req.params.id;
  Maniobra.find({
      $or: [
        { "viaje": id, "peso": "VACIO", "estatus": { $ne: "TRANSITO" } },
        { "viaje": id, "peso": { $ne: "VACIO" }, "estatus": { $ne: "APROBACION" } }
      ]
    })
    .exec(
      (err, maniobras) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            mensaje: 'Error al intentar cargar maniobras asociadas.',
            errors: err
          });
        }
        if (maniobras && maniobras.length > 0) {
          return res.status(400).json({
            ok: false,
            mensaje: 'Existen ' + maniobras.length + ' maniobras asociadas que cuentan movimientos, por lo tanto no se permite eliminar el viaje.',
            errors: { message: 'Existen ' + maniobras.length + ' maniobras asociadas que cuentan con movimientos, por lo tanto no se permite eliminar el viaje..' }
          });
        } else {
          Viaje.findById(id, (err, viajeBorrado) => {
            if (err) {
              return res.status(500).json({
                ok: false,
                mensaje: 'Error al intentar borrar el viaje',
                errors: err
              });
            }
            if (!viajeBorrado) {
              return res.status(400).json({
                ok: false,
                mensaje: 'No existe viaje con ese id',
                errors: { message: 'No existe viaje con ese id' }
              });
            }
            varias.BorrarArchivo('./uploads/viajes/', viajeBorrado.pdfTemporal);
            viajeBorrado.remove();
            res.status(200).json({
              ok: true,
              viaje: viajeBorrado
            });
          });
        }
      });
});


// ==========================================
// Agregar Contenedor al viaje
// ==========================================

app.put('/viaje/addcontenedor/:id&:contenedor&:tipo&:peso&:destinatario', mdAutenticacion.verificaToken, (req, res) => {
  var id = req.params.id;
  var contenedor = req.params.contenedor;
  var tipo = req.params.tipo;
  var peso = req.params.peso;
  var destinatario = req.params.destinatario;
  if (peso == 'VACIO') {
    maniobra = new Maniobra({
      viaje: id,
      facturarA: "AQUI IRIA NOMBRE DE LA NAVIERA",
      contenedor: contenedor,
      tipo: tipo,
      peso: peso,
      estatus: 'APROBADO',
      destinatario: destinatario,
      usuarioAlta: req.usuario._id
    });
  } else {
    maniobra = new Maniobra({
      viaje: id,
      contenedor: contenedor,
      tipo: tipo,
      peso: peso,
      estatus: 'APROBACION',
      destinatario: destinatario,
      usuarioAlta: req.usuario._id
    });
  }
  maniobra.save((err, maniobraGuardado) => {
    if (err) {
      console.log(err);
      return res.status(400).json({
        ok: false,
        mensaje: "Error al cargar la maniobra",
        errors: err
      });
    }
    res.status(201).json({
      ok: true,
      mensaje: 'Contenedor Agregado con éxito.',
      contenedor: maniobraGuardado
    });
  });
});

// ==========================================
// Remover contenedores del viaje
// ==========================================

app.put('/viaje/removecontenedor/:id&:contenedor', mdAutenticacion.verificaToken, (req, res) => {
  var id = req.params.id;
  var body = req.body;
  var contenedor = req.params.contenedor;
  Maniobra.findOne({ 'viaje': id, 'contenedor': contenedor })
    .exec((err, conte) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar viaje - Contenedor',
          errors: err
        });
      }
      if (!conte) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El contenedor ' + contenedor + ' no existe',
          errors: { message: 'No existe un contendor con ese Numero' }
        });
      } else if ((conte.peso != 'VACIO' && conte.estatus != "APROBACION") || (conte.peso == 'VACIO' && conte.estatus != "TRANSITO")) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El contenedor ' + contenedor + ' no se puede eliminar porque ya tiene movimiento de ' + conte.estatus,
          errors: { message: 'El contenedor ' + contenedor + ' no se puede eliminar porque ya tiene movimiento de ' + conte.estatus }
        });
      }
      conte.remove();
      res.status(200).json({
        ok: true,
        contenedor: conte.contenedor
      });
    });
});






// ==========================================
// Obtener los ultimos N viajes JAVI
// ==========================================
app.get('/anio/:anio', (req, res, next) => {
  var fechaFin = req.params.anio;
  //var fechaInicio = req.params.anio;
  //console.log("fechaInicio: " + fechaInicio + "y fechaFin: " + fechaFin)


  fechaFin = new Date(fechaFin);
  fFin = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate(), 23, 59, 59);
  //console.log("fechaFin: " + fechaFin + "y fFin: " + fFin)

  //fechaInicio = new Date(fechaInicio);
  // fechaInicio.setFullYear(2018);
  fIni = new Date(fechaFin.getFullYear() - 1, fechaFin.getMonth(), fechaFin.getDate(), 0, 0, 0);
  //console.log("fechaInicio: " + fechaInicio + "y fIni: " + fIni)

  // console.log("fIni: " + fIni);
  // console.log("fFin: " + fFin);
  // console.log('"anio": { "$gte":' + fIni + ', "$lte": ' + fFin + '}')

  Viaje.find({ "anio": { "$gte": fIni, "$lt": fFin } })
    .populate('buque', 'nombre')
    .exec(
      (err, viajes) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            mensaje: 'Error al cargar viajes',
            errors: err
          });
        }
        res.status(200).json({
          ok: true,
          viajes: viajes,
          total: viajes.length
        });
      });
});


module.exports = app;