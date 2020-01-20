var EasyFtp = require("easy-ftp");
var ftp = new EasyFtp();

// var config = {
//     host: "ftp://148.245.62.85",
//     type: "ftp",
//     port: "21",
//     username: "MIERYTERAN",
//     password: "pd06lfCJ"
// };


exports.EnviaArchivo = function EnviaArchivo(ruta, nombreArchivo) {
    const config = {
        host: "127.0.0.1",
        type: "FTP",
        port: "21",
        username: "javi",
        password: "javi08"
    };
    ftp.connect(config);
    // console.log('FTP CONNECTED:' + ftp.client.isConnect)

    ftp.upload(ruta + nombreArchivo, "/Test_MYT/" + nombreArchivo, function(err){});   

    ftp.close();
}

// ftp.upload("/test/test.txt", "/test.txt", function(err){
// if (err) throw err;
// ftp.close();
// });