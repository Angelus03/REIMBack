// Requires
var express = require('express');
var mdAutenticacion = require('../middlewares/autenticacion');
var bcrypt = require('bcryptjs');
var fs = require('fs');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var Usuario = require('../models/usuario');
var SEED = require('../config/config').SEED;
const sentMail = require('../routes/sendAlert');
var variasBucket = require('../public/variasBucket');
// Inicializar variables
var app = express();

var varias = require('../public/varias');

// =======================================
// Obtener Usuarios
// =======================================
app.get('/', (req, res, netx) => {
  Usuario.find({})
    .populate('empresas', 'razonSocial nombreComercial')
    .sort({ nombre: 1})
    .exec(
      (err, usuarios) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo los usuarios',
            errors: err
          });
        }
        res.status(200).json({
          ok: true,
          usuarios: usuarios,
          total: usuarios.length
        });
      });
});

// ==========================================
//  Obtener usuario por ID
// ==========================================
app.get('/usuario/:id', (req, res) => {
  var id = req.params.id;
  Usuario.findById(id)
    .exec((err, usuario) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar usuario',
          errors: err
        });
      }
      if (!usuario) {
        return res.status(400).json({
          ok: false,
          mensaje: 'La usuario con el id ' + id + 'no existe',
          errors: { message: 'No existe un usuario con ese ID' }
        });
      }
      res.status(200).json({
        usuario: usuario
      });
    });
});

// ==========================================
//  Obtener usuario por ID
// ==========================================
app.get('/usuario/:id/includes', (req, res) => {
  var id = req.params.id;
  Usuario.findById(id)
    .populate('empresas', 'razonSocial nombreComercial')
    .exec((err, usuario) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar usuario',
          errors: err
        });
      }
      if (!usuario) {
        return res.status(400).json({
          ok: false,
          mensaje: 'La usuario con el id ' + id + 'no existe',
          errors: { message: 'No existe un usuario con ese ID' }
        });
      }
      res.status(200).json({
        usuario: usuario
      });
    });
});
// =======================================
// Crear Usuarios
// =======================================


app.post('/usuario', mdAutenticacion.verificaToken, (req, res) => {
  var body = req.body;
  var usuario = new Usuario({
    nombre: body.nombre,
    email: body.email,
    password: bcrypt.hashSync(body.password, 10),
    role: body.role,
    empresas: body.empresas,
    permiso: body.permiso,
    img: body.img,
    observaciones: body.observaciones,
    usuarioAlta: req.usuario._id
  });

  if (usuario.empresas.length <= 0) {
    usuario.empresas = undefined;
  }

  variasBucket.MoverArchivoBucket('temp/', usuario.img, 'usuarios/');

  usuario.save((err, usuarioGuardado) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Error al crear usuario',
        errors: err
      });
    }
    usuarioGuardado.password = '=)';
    res.status(201).json({
      ok: true,
      usuario: usuarioGuardado,
      usuarioToken: req.usuario
    });
  });
});


// =======================================
// Actualizar Usuarios
// =======================================
app.put('/usuario/:id', [mdAutenticacion.verificaToken, mdAutenticacion.verificaADMIN_o_MismoUsuario], (req, res) => {
  var id = req.params.id;
  var body = req.body;
  Usuario.findById(id, (err, usuario) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar usuario',
        errors: err
      });
    }
    if (!usuario) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El usuario con el id ' + id + ' no existe',
        errors: { message: 'No existe un usuario con ese ID' }
      });
    }
    usuario.nombre = body.nombre;
    usuario.email = body.email;
    if (body.empresas && body.empresas.length > 0) {
      usuario.empresas = body.empresas;
      usuario.permiso = body.permiso;
    } else {
      usuario.empresas = undefined;
      usuario.permiso = undefined;
    }
    usuario.observaciones = body.observaciones;
    usuario.usuarioMod = req.usuario._id;
    usuario.fMod = new Date();

    if (usuario.img != body.img) {
      if (variasBucket.MoverArchivoBucket('temp/', body.img, 'usuarios/')) {
        if (usuario.img != null && usuario.img != undefined && usuario.img != '') { //BORRAR EL ACTUAL
          variasBucket.BorrarArchivoBucket('usuarios/', usuario.img);
        }
        usuario.img = body.img;
      }
    }

    usuario.save((err, usuarioGuardado) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Error al actualizar usuario',
          errors: err
        });
      }
      usuarioGuardado.password = '=)';
      res.status(200).json({
        ok: true,
        mensaje: 'Usuario Actualizado con éxito',
        usuario: usuarioGuardado
      });
    });
  });
});

// =======================================
// Actualizar Usuarios
//Al ser perfil solo se modifica , nombre, correo y fotografia si es necesario..
// =======================================
app.put('/usuario/:id/perfil', [mdAutenticacion.verificaToken, mdAutenticacion.verificaADMIN_o_MismoUsuario], (req, res) => {
  var id = req.params.id;
  var body = req.body;
  Usuario.findById(id, (err, usuario) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar usuario',
        errors: err
      });
    }
    if (!usuario) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El usuario con el id ' + id + ' no existe',
        errors: { message: 'No existe un usuario con ese ID' }
      });
    }
    usuario.nombre = body.nombre;
    usuario.email = body.email;
    usuario.usuarioMod = req.usuario._id;
    usuario.fMod = new Date();

    if (usuario.img != body.img) {
      if (variasBucket.MoverArchivoBucket('temp/', body.img, 'usuarios/')) {
        if (usuario.img != null && usuario.img != undefined && usuario.img != '') { //BORRAR EL ACTUAL
          variasBucket.BorrarArchivoBucket('usuarios/', usuario.img)
        }
        usuario.img = body.img;
      }
    }
    usuario.save((err, usuarioGuardado) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Error al actualizar perfil',
          errors: err
        });
      }
      usuarioGuardado.password = '=)';
      res.status(200).json({
        ok: true,
        mensaje: 'Perfil Actualizado con éxito',
        usuario: usuarioGuardado
      });
    });
  });
});

// =======================================
// Actualizar Usuarios    HABILITAR DESHABILITAR
// =======================================
app.put('/usuario/:id/habilita_deshabilita', [mdAutenticacion.verificaToken, mdAutenticacion.verificaADMIN_o_MismoUsuario], (req, res) => {
  var id = req.params.id;
  var body = req.body;
  Usuario.findById(id, (err, usuario) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar usuario',
        errors: err
      });
    }
    if (!usuario) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El usuario con el id ' + id + ' no existe',
        errors: { message: 'No existe un usuario con ese ID' }
      });
    }
    usuario.activo = body.activo;
    usuario.save((err, usuarioGuardado) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Error al actualizar usuario',
          errors: err
        });
      }
      res.status(200).json({
        ok: true,
        mensaje: 'Usuario Actualizado con éxito',
        usuario: usuarioGuardado
      });
    });
  });
});

// =======================================
// Actualizar Usuarios    Loguot - status : false
// =======================================
app.put('/usuario/:id/user/logout', (req, res) => {
  var id = req.params.id;
  var body = req.body;
  Usuario.findById(id, (err, usuario) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar usuario',
        errors: err
      });
    }
    if (!usuario) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El usuario con el id ' + id + ' no existe',
        errors: { message: 'No existe un usuario con ese ID' }
      });
    }
    usuario.status = false;
    usuario.fActivo = undefined;
    usuario.save((err, usuarioGuardado) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Error al actualizar usuario',
          errors: err
        });
      }
      res.status(200).json({
        ok: true,
        mensaje: 'Usuario Actualizado con éxito',
        usuario: usuarioGuardado
      });
    });
  });
});

// // =======================================
// // Borrar Usuarios
// // =======================================
// app.delete('/:id', [mdAutenticacion.verificaToken, mdAutenticacion.verificaADMIN_ROLE], (req, res) => {
//   var id = req.params.id;
//   Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {

//     if (err) {
//       return res.status(500).json({
//         ok: false,
//         mensaje: 'Error al borrar usuario',
//         errors: err
//       });
//     }

//     if (!usuarioBorrado) {
//       return res.status(400).json({
//         ok: false,
//         mensaje: 'No existe un usuario con ese id',
//         errors: { message: 'No existe un usuario con ese id' }
//       });
//     }

//     res.status(200).json({
//       ok: true,
//       usuario: usuarioBorrado
//     });
//   });
// });

// export

//  =======================================
//  Enviar Correo
// =======================================

app.get('/usuario/:id/enviacorreo', (req, res) => {
  var id = req.params.id;
  var token = req.params.reset_password_token;
  Usuario.findById(id, token)
    .exec((err, usuario) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar usuario',
          errors: err
        });
      }
      if (!usuario) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El usuario con el id ' + id + ' no existe',
          errors: { message: 'No existe un usuario con ese ID' }
        });
      } else {
        if (usuario.id) {
          crypto.randomBytes(20, (err, buffer) => {
            var token = buffer.toString('hex');

            Usuario.findByIdAndUpdate({ _id: usuario._id }, { reset_password_token: token, reset_password_expires: Date.now() + 3600000 }, { upsert: true, new: true }).exec(function (err, new_usuario) {
               
            });
            
            var url = 'https://app.reimcontainerpark.com.mx/reset_password?token=' + token;
            var cuerpoCorreo = ` Usted está recibiendo este correo porque se ha solicitado que se restablezca la contraseña de su cuenta.` ;

            
            if (usuario.email != null) {
              sentMail(usuario.nombre, usuario.email, 'Restablecer Correo', cuerpoCorreo, 'emailPass', url)
              
            } else {
              return res.status(500).json({
                ok: false,
                mensaje: 'No existe correo de destino',
                errors: err
              });
              
            }
            usuario.save((err, usuarioGuardado) => {
              res.status(200).json({
                ok: true,
                mensaje: 'enviado',
                usuario: usuarioGuardado
              });
            });
          });
      }
    }
  });
  });


module.exports = app;