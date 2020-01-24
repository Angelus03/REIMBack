var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;
var Contador = require('./contador');

var EDISchema = new Schema({
    noReferencia: { type: String, unique: true },
    edi: { type: String },
    ruta: { type: String },
    tipo: { type: String, required: [true, 'El Tipo es necesario'] },
    naviera: { type: Schema.Types.ObjectId, ref: 'Cliente', required: [true, 'La Naviera es necesaria'] },
    maniobra: { type: Schema.Types.ObjectId, ref: 'Maniobra' },
    generado: { type: Boolean, default: false, required: [true, 'Generado es necesario'] },
    usuarioAlta: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fAlta: { type: Date, default: Date.now },
    usuarioMod: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    fMod: { type: Date }
}, { collection: 'enviosEDI' });

EDISchema.plugin(uniqueValidator, { message: '{PATH} debe ser unico' });

EDISchema.pre('save', function(next) {
    var doc = this;
    if (this._id && this.generado == false) {
      Contador.findByIdAndUpdate({ _id: 'EDIsCODECO' }, { $inc: { seq: 1 } }, function(error, cont) {
        if (error)
          return next(error);
        doc.noReferencia = cont.seq;
        next();
      });
    } else {
      next();
    }
  });

module.exports = mongoose.model('EDI', EDISchema);