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
    host:"127.0.0.1",
    type:"FTP",
    port:"21",
    username:"javi",
    password:"javi08"
    };


// function Connect() {
//     ftp.connect(config);
// }

exports.EnviaArchivo = function EnviaArchivo(rutaArchivo) {
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


    
    ftp.connect(config);

    
    
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

// ftp.upload("/test/test.txt", "/test.txt", function(err){
// if (err) throw err;
// ftp.close();
// });