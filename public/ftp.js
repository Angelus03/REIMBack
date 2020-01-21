var EasyFtp = require("easy-ftp");
var ftp = new EasyFtp();

// var config = {
//     host: "ftp://148.245.62.85",
//     type: "ftp",
//     port: "21",
//     username: "MIERYTERAN",
//     password: "pd06lfCJ"
// };

const config = {
    host: "127.0.0.1",
    type: "FTP",
    port: "21",
    username: "javi",
    password: "javi08"
};


exports.UploadFile = function UploadFile(ruta, nombreArchivo) {

    ftp.connect(config);
    // console.log('FTP CONNECTED:' + ftp.client.isConnect)

    ftp.upload(ruta + nombreArchivo, "/Test_MYT/" + nombreArchivo, function(err){});   

    //ftp.close();
}

exports.DeleteFile = function DeleteFile(nombreArchivo) {

    ftp.connect(config);
    // console.log('FTP CONNECTED:' + ftp.client.isConnect)

    ftp.rm("/Test_MYT/" + nombreArchivo, function(err){});   

    //ftp.close();
}

