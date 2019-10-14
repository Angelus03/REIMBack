var express = require('express');
var mdAutenticacion = require('../middlewares/autenticacion');
var Cliente = require('../models/cliente');
var mongoose = require('mongoose');
var fs = require('fs');
var app = express();
var ParamsToJSON = require('../public/varias');

// ==========================================
// Obtener todos los clientes
// ==========================================
app.get('/', (req, res, next) => {
    var desde = req.query.desde || 0;
    desde = Number(desde);
    var role = 'CLIENT_ROLE';
    Cliente.find({ role: role })
        .skip(desde)
        // .limit(10)
        .populate('empresas', 'razonSocial')
        .populate('usuarioAlta', 'nombre email')
        .exec(
            (err, clientes) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al cargar clientes',
                        errors: err
                    });
                }
                Cliente.countDocuments({ role: role }, (err, conteo) => {
                    res.status(200).json({
                        ok: true,
                        clientes: clientes,
                        total: conteo
                    });
                })
            });
});

// ==========================================
// Obtener todas los clientes por role
// ==========================================
app.get('/role/:role?', (req, res) => {
    var filtro = ParamsToJSON.ParamsToJSON(req);
    //console.log({filtro})
    Cliente.find(filtro)
        .populate('cliente', 'role')
        .exec((err, clientes) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar cliente',
                    errors: err
                });
            }
            if (!clientes) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El cliente con el role' + role + 'no existe',
                    errors: { message: "No existe un cliente con ese role" }
                });
            }
            res.status(200).json({
                ok: true,
                clientes: clientes
            });
        });
});

// ==========================================
// Obtener Clientes por ID
// ==========================================
app.get('/:id', (req, res) => {
    var id = req.params.id;
    Cliente.findById(id)
        // .populate('empresas', 'razonSocial')
        //.populate('usuario', 'nombre email')
        .exec((err, cliente) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar el cliente',
                    errors: err
                });
            }
            if (!cliente) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El cliente con el id ' + id + 'no existe',
                    errors: { message: 'No existe un cliente con ese ID' }
                });
            }
            res.status(200).json({
                ok: true,
                cliente: cliente
            });
        })
})

// ==========================================
// Obtener todas los clientes por id empresas (deben estar separados por ",")
// ==========================================

app.get('/empresa/:id', (req, res) => {
    var desde = req.query.desde || 0;
    desde = Number(desde);
    var id = req.params.id;
    Cliente.find({ 'empresas': new mongoose.Types.ObjectId(id) })
        .exec(
            (err, clientes) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al cargar clientes',
                        errors: err
                    });
                }
                if (!clientes) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'El cliente con el id ' + id + 'no existe',
                        errors: { message: 'No existe un cliente con ese ID' }
                    });
                }
                res.status(200).json({
                    ok: true,
                    clientes: clientes,
                    total: clientes.length
                });
            });
});

// ==========================================
// Obtener todas los clientes por id empresas
// ==========================================

app.get('/empresas/:idsEmpresa', (req, res) => {
    var desde = req.query.desde || 0;
    desde = Number(desde);
    var arrayIdsEmpresa = req.params.idsEmpresa.split(',');

    var filtro = '{\"$or\": [';

    arrayIdsEmpresa.forEach(id => {
        filtro += '{\"empresas\"' + ':' + '\"' + new mongoose.Types.ObjectId(id) + '\" },'
    });

    filtro = filtro.substring(0, filtro.length - 1)
    filtro += ']}';

    var json = JSON.parse(filtro);
    Cliente.find(json)
        .exec(
            (err, clientes) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al cargar clientes',
                        errors: err
                    });
                }
                if (!clientes) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'El cliente con el id ' + id + 'no existe',
                        errors: { message: 'No existe un cliente con ese ID' }
                    });
                }
                res.status(200).json({
                    ok: true,
                    clientes: clientes,
                    total: clientes.length
                });
            });
});

// ==========================================
// Alta cliente
// ==========================================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
    var body = req.body;
    var cliente = new Cliente({
        rfc: body.rfc,
        razonSocial: body.razonSocial,
        nombreComercial: body.nombreComercial,
        calle: body.calle,
        noExterior: body.noExterior,
        noInterior: body.noInterior,
        colonia: body.colonia,
        municipio: body.municipio,
        ciudad: body.ciudad,
        estado: body.estado,
        cp: body.cp,
        formatoR1: body.formatoR1,
        correo: body.correo,
        correoFac: body.correoFac,
        credito: body.credito,
        empresas: body.empresas,
        img: body.img,
        usuarioAlta: req.usuario._id
    });

    if (cliente.img != '' && fs.existsSync('./uploads/temp/' + cliente.img)) {
        fs.rename('./uploads/temp/' + cliente.img, './uploads/clientes/' + cliente.img, (err) => {
            if (err) { console.log(err); }
        });
    }
    if (cliente.formatoR1 != '' && fs.existsSync('./uploads/temp/' + cliente.formatoR1)) {
        fs.rename('./uploads/temp/' + cliente.formatoR1, './uploads/clientes/' + cliente.formatoR1, (err) => {
            if (err) { console.log(err); }
        });
    }

    cliente.save((err, clienteGuardado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear cliente',
                errors: err
            });
        }
        res.status(201).json({
            ok: true,
            mensaje: 'Cliente creado con éxito.',
            cliente: clienteGuardado
        });
    });
});


// ==========================================
// Actualizar Cliente
// ==========================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;
    Cliente.findById(id, (err, cliente) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar cliente',
                errors: err
            });
        }
        if (!cliente) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El cliente con el id ' + id + ' no existe',
                errors: { message: 'No existe cliente con ese ID' }
            });
        }
        cliente.rfc = body.rfc;
        cliente.razonSocial = body.razonSocial;
        cliente.nombreComercial = body.nombreComercial;
        cliente.calle = body.calle;
        cliente.noExterior = body.noExterior;
        cliente.noInterior = body.noInterior;
        cliente.colonia = body.colonia;
        cliente.municipio = body.municipio;
        cliente.ciudad = body.ciudad;
        cliente.estado = body.estado;
        cliente.cp = body.cp;
        cliente.correo = body.correo;
        cliente.correoFac = body.correoFac;
        cliente.credito = body.credito;
        cliente.empresas = body.empresas;
        cliente.usuarioMod = req.usuario._id;
        cliente.fMod = new Date();

        if (cliente.img != body.img) {
            if (fs.existsSync('./uploads/temp/' + body.img)) {
                if (cliente.img != undefined || cliente.img != '' && cliente.img != null && fs.existsSync('./uploads/clientes/' + cliente.img)) {
                    fs.unlink('./uploads/clientes/' + cliente.img, (err) => {
                        if (err) console.log(err);
                        else
                            console.log('Imagen anterior fue borrada con éxito');
                    });
                }
                fs.rename('./uploads/temp/' + body.img, './uploads/clientes/' + body.img, (err) => {
                    if (err) { console.log(err); }
                });
                cliente.img = body.img;
            }
        }
        if (cliente.formatoR1 != body.formatoR1) {
            if (fs.existsSync('./uploads/temp/' + body.formatoR1)) {
                if (cliente.formatoR1 != undefined || cliente.formatoR1 != '' && cliente.formatoR1 != null && fs.existsSync('./uploads/clientes/' + cliente.formatoR1)) {
                    fs.unlink('./uploads/clientes/' + cliente.formatoR1, (err) => {
                        if (err) console.log(err);
                        else
                            console.log('Imagen anterior fue borrada con éxito');
                    });
                }
                fs.rename('./uploads/temp/' + body.formatoR1, './uploads/clientes/' + body.formatoR1, (err) => {
                    if (err) { console.log(err); }
                });
                cliente.formatoR1 = body.formatoR1;
            }
        }

        cliente.save((err, clienteGuardado) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar cliente',
                    errors: err
                });
            }
            res.status(200).json({
                ok: true,
                mensaje: 'Cliente actualizado con exito',
                cliente: clienteGuardado
            });

        });
    });
});


// ============================================
//   Borrar clientes por el id
// ============================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    Cliente.findByIdAndRemove(id, (err, clienteBorrado) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar cliente',
                errors: err
            });
        }
        if (!clienteBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe cliente con ese id',
                errors: { message: 'No existe cliente con ese id' }
            });
        }
        res.status(200).json({
            ok: true,
            mensaje: 'Cliente borrado con exito',
            cliente: clienteBorrado
        });
    });
});


module.exports = app;