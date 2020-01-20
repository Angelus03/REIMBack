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
    console.log('FTP CONNECTED:' + ftp.client.isConnect)

    ftp.upload(ruta + nombreArchivo, "/Test_MYT/" + nombreArchivo)

    // ftp.on('open', function () {
    //     // ftp.upload(csvName, "/csvs/", function (err) {
    //     //   // process upload result
    //     // });
    //     ftp.ls("/javi/", function (err, list) {
    //         if (err) {
    //             console.log(err);
    //         }
    //         else {
    //             console.log(list)
    //         }
    //     });
    //     console.log('FTP CONNECTED:' + ftp.client.isConnect)
    //     // console.log(ftp.client)
    // });


    // ftp.upload("C:\EDIs\Out\javi.txt", "/javi.txt")
    // .then(console.log)
    // .catch(console.error)
    // ftp.upload()

    // ftp.mkdir("/Test_MYT", function (err) {
    //     if (err)
    //         console.log(err);
    // });


    ftp.close();
}

// exports.DeleteFile = function DeleteFile(nombreArchivo) {
//     ftp.connect(config);
//     console.log('FTP CONNECTED:' + ftp.client.isConnect)

//     ftp.rm("/Test_MYT/212c6100-3bd9-11ea-99ba-4165eb4b23a1.txt", function(err){});

//     ftp.close();
// }