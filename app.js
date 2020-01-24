// Requires
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var entorno = require('./config/config').config();


// Inicializar variables
var app = express();

var corsOptions = {
  origin: '*',
  methods: ['POST, GET, PUT, DELETE, OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'contentType', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parser
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Importar Rutas
var appRoutes = require('./routes/app');
var exceltojson = require('./routes/exceltojson');
var uploadFileTemp = require('./routes/uploadFileTemp');
var uploadFileTempBucket = require('./routes/uploadFileTempBucket');
var documentosRoutes = require('./routes/documentos');

var reparacionesRoutes = require('./routes/reparaciones');

var loginRoutes = require('./routes/login');
var usuariosRoutes = require('./routes/usuarios');
var navieraRoutes = require('./routes/navieras');
var agenciaRoutes = require('./routes/agencias');
var transportistaRoutes = require('./routes/transportistas');
var buqueRoutes = require('./routes/buques');
var operadorRoutes = require('./routes/operadores');
var camionRoutes = require('./routes/camiones');

var tiposContenedorRoutes = require('./routes/tiposContenedor');
var registroRoutes = require('./routes/registros');

var uploadRoutes = require('./routes/upload');
var dropzoneRoutes = require('./routes/dropzone');
var imagenesRoutes = require('./routes/imagenes');
var maniobraRoutes = require('./routes/maniobra');
var maniobrasRoutes = require('./routes/maniobras');
var clienteRoutes = require('./routes/clientes');
var viajesRoutes = require('./routes/viajes');
var forgotpass = require('./routes/forgotpass');
var resetpass = require('./routes/resetpass');
var UploadFile = require('./routes/uploadfile');
var solicitudRoute = require('./routes/solicitud');
var solicitudesRoute = require('./routes/solicitudes');
var coordenadasRoutes = require('./routes/coordenadas');
var EDIRoutes = require('./routes/EDIs');

// Conexión a la base de datos Mongoose
mongoose.Promise = Promise;
mongoose.connection.on('connected', () => {
  console.log('Base de datos Mongoose: \x1b[32m%s\x1b[0m', 'online');
});
mongoose.connection.on('reconnected', () => {
  console.log('Connection Reestablished');
});

mongoose.connection.on('disconnected', () => {
  console.log('Connection Disconnected');
});

mongoose.connection.on('close', () => {
  console.log('Connection Closed');
});

mongoose.connection.on('error', (error) => {
  console.log('ERROR: ' + error);
});

const run = async() => {

  await mongoose.connect(entorno.CONEXION_MONGO, {
    autoReconnect: true,
    reconnectTries: 1000000,
    reconnectInterval: 3000,
    useCreateIndex: true,
    useNewUrlParser: true
  });
};

run().catch(error => console.error(error));

// Rutas
app.use('/login', loginRoutes);
app.use('/uploadFile', UploadFile);
app.use('/uploadFileTemp', uploadFileTemp);
app.use('/uploadBucketTemp', uploadFileTempBucket);
app.use('/exceltojson', exceltojson);
app.use('/documentos', documentosRoutes);
app.use('/usuarios', usuariosRoutes); //ANGELUS
app.use('/reparaciones', reparacionesRoutes);
app.use('/navieras', navieraRoutes);
app.use('/agencias', agenciaRoutes);
app.use('/transportistas', transportistaRoutes);
app.use('/buques', buqueRoutes);
app.use('/operadores', operadorRoutes);
app.use('/registros', registroRoutes);
app.use('/camiones', camionRoutes);
app.use('/tipos_contenedores', tiposContenedorRoutes);
app.use('/reset_password', resetpass);
app.use('/forgot_password', forgotpass);
app.use('/viajes', viajesRoutes);
app.use('/clientes', clienteRoutes);
app.use('/maniobra', maniobraRoutes);
app.use('/maniobras', maniobrasRoutes);
app.use('/solicitudes', solicitudesRoute);
app.use('/solicitud', solicitudRoute);
app.use('/img', imagenesRoutes);
app.use('/dropzone', dropzoneRoutes);
app.use('/upload', uploadRoutes);
app.use('/coordenadas', coordenadasRoutes);
app.use('/EDI', EDIRoutes);
app.use('/', appRoutes);

// Escuchar peticiones
app.listen(3000, () => {
  console.log('Express server puerto 3000: \x1b[32m%s\x1b[0m', 'online');
  console.log(entorno.CONEXION_MONGO);
  console.log(process.env.NODE_ENV);
});