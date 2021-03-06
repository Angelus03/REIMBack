var express = require('express');
var mdAutenticacion = require('../middlewares/autenticacion');
var Material = require('../models/material');
var app = express();
const entradasController = require('../controllers/entradasController');
const mermasController = require('../controllers/mermasController');
const materialesController = require('../controllers/materialesController');
const mantenimientosController = require('../controllers/mantenimientosController');

// ==========================================
//  Obtener todos los Materiales
// ==========================================

app.get('/', mdAutenticacion.verificaToken, (req, res) => {
  const resultMateriales = materialesController.getMateriales(req, res);
  resultMateriales.then(materiales => {
    res.status(200).json({
      ok: true,
      materiales,
      totalRegistros: materiales.length
    });
  }).catch(error => {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error cargando materiales',
      errors: error
    });
  });
});

// ==========================================
//  Obtener Material por ID
// ==========================================
app.get('/material/:idMaterial', mdAutenticacion.verificaToken, (req, res) => {
  const getMaterial = materialesController.getMaterialById(req, res);
  getMaterial.then(material => {
    if (material) {
      res.status(200).json({
        ok: true,
        material,
      });
    } else {
      return res.status(400).json({
        ok: false,
        mensaje: `El material con el id ${req.params.id} no existe`,
        errors: { message: 'No existe una material con ese ID' }
      });
    }
  }).catch(error => {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error buscando material',
      errors: error
    });
  });
});

// ==========================================
//  Obtener Stock de Material por ID
// ==========================================
app.get('/material/:idMaterial/stock', mdAutenticacion.verificaToken, async(req, res) => {
  let stock = 0;
  let nombreMaterial;
  let ok = false;
  const material = await materialesController.getMaterialById(req, res);
  if (material && material.tipo === "M")
    stock = 1000;
  if (stock === 0) {
    const entradas = await entradasController.consultaEntradas(req, res);
    entradas.forEach(e => {
      e.detalles.forEach(d => {
        if (d.material._id == req.params.idMaterial) {
          ok = true;
          stock += d.cantidad;
          nombreMaterial = d.material.descripcion;
        }
      });
    });
    const mermas = await mermasController.consultaMermas(req, res);
    mermas.forEach(e => {
      e.materiales.forEach(m => {
        if (m.material._id == req.params.idMaterial) {
          ok = true;
          stock -= m.cantidad;
          // nombreMaterial = m.material.descripcion;
        }
      });
    });
    const mantenimientos = await mantenimientosController.getMantenimientos(req, res);
    mantenimientos.forEach(e => {
      e.materiales.forEach(m => {
        if (m.material._id == req.params.idMaterial) {
          ok = true;
          stock -= m.cantidad;
          //nombreMaterial = m.material.descripcion;
        }
      });
    });
  }

  res.status(200).json({
    ok,
    material: nombreMaterial,
    stock: stock
  });


});

// ==========================================================================
//  Obtener todos los Materiales donde el precio sea menor o igual al costo
// ==========================================================================

app.get('/costo-precio', mdAutenticacion.verificaToken, (req, res) => {
  Material.find({ $expr: { $gte: ["$costo", "$precio"] } })
    // .populate('usuarioAlta', 'nombre email')
    // .populate('usuarioMod', 'nombre email')
    // .populate('unidadMedida', 'descripcion abreviacion')
    .sort({ fAlta: -1 })
    .exec(
      (err, materiales) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            mensaje: 'Error cargando materiales',
            errors: err
          });
        }
        res.status(200).json({
          ok: true,
          materiales: materiales,
          totalRegistros: materiales.length
        });
      });
});


// ==========================================
//  Obtener Validacion Costo VS Precio P.
// ==========================================
app.get('/material/valida/costo/precio/:id', mdAutenticacion.verificaToken, (req, res) => {
  var material = req.params.id;

  var filtro = '{';
  if (material != 'undefined' && material != '')
    filtro += '\"detalles.material\":' + '\"' + material + '\",';

  if (filtro != '{')
    filtro = filtro.slice(0, -1);
  filtro = filtro + '}';
  var json = JSON.parse(filtro);
  Entrada.find(json)
    .populate('detalles.material', 'descripcion costo precio tipo minimo')
    .sort({ fAlta: -1 })
    .exec(
      (err, entradas) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            mensaje: 'Error cargando entradas',
            errors: err
          });
        }

        let stock = 0;
        let material;
        let ok = false;
        if (entradas.length > 0) {
          entradas.forEach(e => {
            e.detalles.forEach(d => {
              if (d.material._id == req.params.id) {
                ok = true;
                stock += d.cantidad;
                material = d.material;
              }
            });

          });
        }

        res.status(200).json({
          ok,
          material: material,
          stock: stock
        });

      });
});

// ==========================================
// Crear un nuevo material
// ==========================================
app.post('/material/', mdAutenticacion.verificaToken, (req, res) => {
  var body = req.body;
  var material = new Material({
    codigo: body.codigo,
    descripcion: body.descripcion,
    unidadMedida: body.unidadMedida,
    costo: body.costo,
    precio: body.precio,
    activo: body.activo,
    tipo: body.tipo,
    minimo: body.minimo,
    usuarioAlta: req.usuario._id
  });

  material.save((err, materialGuardado) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Error al crear material',
        errors: err
      });
    }
    res.status(201).json({
      ok: true,
      mensaje: 'material creado con éxito.',
      material: materialGuardado
    });
  });
});

// ==========================================
// Actualizar material
// ==========================================

app.put('/material/:id', mdAutenticacion.verificaToken, (req, res) => {
  var id = req.params.id;
  var body = req.body;
  Material.findById(id, (err, material) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar al material',
        errors: err
      });
    }
    if (!material) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El material con el id ' + id + ' no existe',
        errors: { message: 'No existe un material con ese ID' }
      });
    }
    material.codigo = body.codigo;
    material.descripcion = body.descripcion;
    material.unidadMedida = body.unidadMedida;
    material.costo = body.costo;
    material.precio = body.precio;
    material.activo = body.activo;
    material.tipo = body.tipo;
    material.minimo = body.minimo;
    material.usuarioMod = req.usuario._id;
    material.fMod = new Date();

    material.save((err, materialGuardado) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Error al actualizar al material',
          errors: err
        });
      }
      res.status(200).json({
        ok: true,
        material: materialGuardado
      });
    });
  });
});

// =======================================
// HABILITAR DESHABILITAR Material
// =======================================

app.put('/material/:id/habilita_deshabilita', mdAutenticacion.verificaToken, (req, res) => {
  var id = req.params.id;
  var body = req.body;
  Material.findById(id, (err, material) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar material',
        errors: err
      });
    }
    if (!material) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El material con el id ' + id + ' no existe',
        errors: { message: 'No existe un material con ese ID' }
      });
    }
    if (material.activo === body.activo) {
      var hab = ''
      if (body.activo === 'true') {
        hab = 'Activo'
      } else {
        hab = 'Inactivo'
      }
      return res.status(400).json({
        ok: false,
        mensaje: 'El estatus del material ' + material.descripcion + ' ya se encuentra en ' + hab,
        errors: { message: 'El estatus del material' + material.descripcion + ' ya se encuentra en ' + hab }
      });
    }
    material.activo = body.activo;
    material.save((err, materialGuardado) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Error al actualizar material',
          errors: err
        });
      }
      res.status(200).json({
        ok: true,
        material: materialGuardado
      });
    });
  });
});

// ============================================
//  Borrar un Material por el id
// ============================================
app.delete('/material/:id', mdAutenticacion.verificaToken, async(req, res) => {
  var id = req.params.id;

  const entradas = await entradasController.consultaEntradas(req, res);

  if (entradas && entradas.length > 0) {
    res.status(400).json({
      ok: false,
      mensaje: 'El material ya se encuentra en entradas registradas, por lo tanto no puede eliminarse.',
      errors: { message: 'El material ya se encuentra en entradas registradas, por lo tanto no puede eliminarse.' }
    });
  } else {
    Material.findByIdAndRemove(id, (err, materialBorrado) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al borrar material',
          errors: err
        });
      }
      if (!materialBorrado) {
        return res.status(400).json({
          ok: false,
          mensaje: 'No existe un material con ese id',
          errors: { message: 'No existe un material con ese id' }
        });
      }
      res.status(200).json({
        ok: true,
        material: materialBorrado
      });
    });
  }

  // DetalleMaterial.find({
  //     $or: [
  //       { 'material': id }
  //     ]
  //   })
  //   .exec(
  //     (err, detalleMaterial) => {
  //       if (err) {
  //         return res.status(500).json({
  //           ok: false,
  //           mensaje: 'Error al intentar validar la eliminacion del material',
  //           errors: err
  //         });
  //       }
  //       if (detalleMaterial && detalleMaterial.length > 0) {
  //         res.status(400).json({
  //           ok: false,
  //           mensaje: 'El material ya tiene detalles registrados, por lo tanto no puede eliminarse.',
  //           errors: { message: 'El material ya tiene detalles registrados, por lo tanto no puede eliminarse.' },
  //           resultadoError: detalleMaterial
  //         });
  //       }
  //       Material.findByIdAndRemove(id, (err, materialBorrado) => {
  //         if (err) {
  //           return res.status(500).json({
  //             ok: false,
  //             mensaje: 'Error al borrar material',
  //             errors: err
  //           });
  //         }
  //         if (!materialBorrado) {
  //           return res.status(400).json({
  //             ok: false,
  //             mensaje: 'No existe un material con ese id',
  //             errors: { message: 'No existe un material con ese id' }
  //           });
  //         }
  //         res.status(200).json({
  //           ok: true,
  //           material: materialBorrado
  //         });
  //       });
  //     });
});
module.exports = app;