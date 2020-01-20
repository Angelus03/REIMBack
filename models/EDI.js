var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;

var EDISchema = new Schema({
    noReferencia: { type: String, unique: true, required: [true, 'El No. de Referencia es necesario'] },
    edi: { type: String, required: [true, 'El contenido del EDI es necesario'] },
    ruta: { type: String, required: [true, 'La Ruta es necesaria'] },
    tipo: { type: String, required: [true, 'El Tipo es necesario'] },
    naviera: { type: Schema.Types.ObjectId, ref: 'Cliente', required: [true, 'La Naviera es necesaria'] },
    usuarioAlta: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fAlta: { type: Date, default: Date.now },
    usuarioMod: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fMod: { type: Date }
}, { collection: 'enviosEDI' });

EDISchema.plugin(uniqueValidator, { message: '{PATH} debe ser unico' });

module.exports = mongoose.model('EDI', EDISchema);