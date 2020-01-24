var EasyFtp = require("easy-ftp");
var ftp = new EasyFtp();
var fs = require('fs');
var envJSON = require("../config/env.variables.json");


var config = envJSON["development"]["configFTP_MSC"];

exports.UploadFile = function UploadFile(ruta, nombreArchivo, eliminarDespues) {
    ftp.connect(config);
    // console.log('FTP CONNECTED:' + ftp.client.isConnect)

    ftp.upload(ruta + nombreArchivo, "/Test_MYT/" + nombreArchivo, function (err) {
        if (fs.existsSync(ruta + nombreArchivo)) {
            if (err) {
                console.log(err)
            } else {
                if (eliminarDespues) {
                    fs.unlink(ruta + nombreArchivo, (err) => {
                        if (err) {
                            console.error(err)
                            // return
                        }
                    })
                }
            }
        }
    });
    //ftp.close();
}

exports.DeleteFile = function DeleteFile(nombreArchivo) {

    ftp.connect(config);
    // console.log('FTP CONNECTED:' + ftp.client.isConnect)

    ftp.rm("/Test_MYT/" + nombreArchivo, function (err) { });

    //ftp.close();
}