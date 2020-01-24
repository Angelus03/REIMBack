// Requires
var express = require('express');
// var URL_SERVICIOS = require('../config/config').URL_SERVICIOS;

// Inicializar variables
var app = express();

var mongoose = require('mongoose'),
    jwt = require('jsonwebtoken'),
    bcrypt = require('bcryptjs'),
    Usuario = require('../models/usuario'),
    path = require('path'),
    async = require('async'),
    crypto = require('crypto'),
    _ = require('lodash'),
    hbs = require('nodemailer-express-handlebars'),
    email = process.env.MAILER_EMAIL_ID || 'patiocontenedoresreim@gmail.com',
    pass = process.env.MAILER_PASSWORD || 'fmat*0348',
    nodemailer = require('nodemailer');


var smtpTransport = nodemailer.createTransport({
    service: process.env.MAILER_SERVICE_PROVIDER || 'Gmail',
    auth: {
        user: email,
        pass: pass
    }
});

var handlebarsOptions = {
    viewEngine: 'handlebars',
    viewPath: path.resolve('./templates/'),
    extName: '.html'
};

smtpTransport.use('compile', hbs(handlebarsOptions));


// Rutas
app.get('/', (req, res) => {
    return res.sendFile(path.resolve('./public/forgot-password.html'));
});

app.post('/', (req, res) => {
    async.waterfall([
        (done) => {
            Usuario.findOne({
                email: req.body.email
            }).exec(
                (err, user) => {
                    if (user) {
                        done(err, user);
                    } else {
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'No se encontro usuario con ese correo',
                            errors: err
                        });
                    }
                });
        },
        (user, done) => {
            // create the random token
            crypto.randomBytes(20, (err, buffer) => {
                var token = buffer.toString('hex');
                done(err, user, token);
            });
        },
        (user, token, done) => {
            Usuario.findByIdAndUpdate({ _id: user._id }, { reset_password_token: token, reset_password_expires: Date.now() + 3600000 }, { upsert: true, new: true }).exec(function(err, new_user) {
                done(err, token, new_user);
            });
        },
        (token, user, done) => {
            // var constants = require('../config/config.js')
            var data = {
                to: user.email,
                from: email,
                template: 'forgot-password-email',
                subject: '¡REIM Container Park Restablecimiento de contraseña!',
                context: {
                    url: 'http://ec2-54-167-155-50.compute-1.amazonaws.com:3000/reset_password?token=' + token,
                    name: user.nombre.split(' ')[0]
                }
            };

            smtpTransport.sendMail(data, (err) => {
                if (!err) {
                    return res.json({ message: 'Por favor revise su correo electrónico para obtener más instrucciones' });
                } else {
                    return done(err);
                }
            });
        }
    ], (err) => {
        return res.status(422).json({ message: err });
    });
});



// export
module.exports = app;