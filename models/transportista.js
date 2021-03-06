var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Schema = mongoose.Schema;

var rolesValidos = {
  values: ['TRANSPORTISTA_ROLE'],
  message: '{VALUE} no es un rol permitido'
};

var transportistaSchema = new Schema({
  // rfc: { type: String, required: [true, 'El RFC es necesario'] },
  rfc: { type: String },
  razonSocial: { type: String, unique: true, requiered: [true, 'La razon social es necesario'] },
  nombreComercial: { type: String, requiered: [true, 'La nombre comercial o ALIAS es necesario'] },
  calle: { type: String, requiered: false },
  noExterior: { type: String, required: false },
  noInterior: { type: String, required: false },
  colonia: { type: String, requiered: false },
  municipio: { type: String, requiered: false },
  ciudad: { type: String, requiered: false },
  usoCFDI: {type: Schema.Types.ObjectId, ref: 'Uso-CFDI', required: [true, 'El Uso CFDI es necesario']},
  estado: { type: String, requiered: [true, 'El estado es necesario'] },
  cp: { type: String, requiered: [true, 'El codigo postal es necesario'] },
  formatoR1: { type: String, required: false },
  correo: { type: String, requiered: false },
  correoFac: { type: String, requiered: false },
  credito: { type: Boolean, requiered: [true, 'EL credito es necesario'], default: false },
  img: { type: String, required: false },
  caat: { type: String, requiered: [true, 'El CAAT es necesario'] },
  role: { type: String, required: true, default: 'TRANSPORTISTA_ROLE', enum: rolesValidos },
  usuarioAlta: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  fAlta: { type: Date, default: Date.now },
  usuarioMod: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  activo: {type: Boolean, required: [true, 'El campo es obligatorio'], default: true},
  fMod: { type: Date }
}, { collection: 'clientes' });

transportistaSchema.plugin(uniqueValidator, { message: '{PATH} debe ser unico' })

module.exports = mongoose.model('Transportista', transportistaSchema);