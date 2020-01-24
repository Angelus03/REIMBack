var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;

var Contador = require('./contador');

var maniobraSchema = new Schema({
  cargaDescarga: { type: String, required: true, default: 'D' },
  folio: { type: Number },
  viaje: { type: Schema.Types.ObjectId, ref: 'Viaje' },
  cliente: { type: Schema.Types.ObjectId, ref: 'Cliente' },
  destinatario: { type: String, required: false },
  sello: { type: String},
  agencia: { type: Schema.Types.ObjectId, ref: 'Cliente' },
  naviera: { type: Schema.Types.ObjectId, ref: 'Cliente' },
  transportista: { type: Schema.Types.ObjectId, ref: 'Cliente' },
  camion: { type: Schema.Types.ObjectId, ref: 'Camion' },
  operador: { type: Schema.Types.ObjectId, ref: 'Operador' },
  patio: { type: String, default: 'POLIGONO INDUSTRIAL' },
  contenedor: { type: String },
  tipo: { type: String },
  grado: { type: String },
  peso: { type: String },
  estatus: { type: String, default: 'APROBACIÓN' },
  fLlegada: { type: String },
  hLlegada: { type: String },
  hEntrada: { type: String },
  solicitud: { type: Schema.Types.ObjectId, ref: 'Solicitud' },
  lavado: { type: String },
  lavadoObservacion: { type: String },
  reparaciones: [{
    id: { type: Schema.Types.ObjectId, ref: 'reparacion' },
    reparacion: { type: String, required: [true, 'La reparacion es necesaria'] },
    costo: { type: String },
  }],
  reparacionesObservacion: { type: String },
  mostrarFotosRNaviera: { type: Boolean, default: false },
  mostrarFotosRAA: { type: Boolean, default: false },
  descargaAutorizada: { type: Boolean, default: false },
  hDescarga: { type: String },
  hSalida: { type: String },
  fIniLavado: { type: Date },
  hIniLavado: { type: String },
  hFinLavado: { type: String },
  fIniReparacion: { type: Date },
  hIniReparacion: { type: String },
  fFinReparacion: { type: Date },
  hFinReparacion: { type: String },
  maniobraAsociada: { type: Schema.Types.ObjectId, ref: 'Maniobra' },
  facturaManiobra: { type: String },
  fAsignacionPapeleta: { type: Date },
  fExpiracionPapeleta: { type: Date },
  historial: [{
    bahia: { type: String, required: [true, 'La bahia es necesaria'] },
    posicion: { type: String, required: [true, 'La posicion es necesaria'] }
  }],
  usuarioAlta: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fAlta: { type: Date, default: Date.now },
  usuarioModifico: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  fMod: { type: Date },
}, { collection: 'maniobras' });

maniobraSchema.plugin(uniqueValidator, { message: '{PATH} debe ser unico' });
maniobraSchema.pre('save', function(next) {
  var doc = this;
  if (this.cargaDescarga === 'D' && this.peso != 'VACIO' && (this.folio === undefined || this.folio === '') ||
    (this.cargaDescarga === 'C' && (this.folio === undefined || this.folio === ''))) {
    Contador.findByIdAndUpdate({ _id: 'maniobras' }, { $inc: { seq: 1 } }, function(error, cont) {
      if (error)
        return next(error);
      doc.folio = cont.seq;
      next();
    });
  } else {
    next();
  }
});

module.exports = mongoose.model('Maniobra', maniobraSchema);