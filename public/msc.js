const varias = require('../public/varias');
const sentMail = require('../routes/sendAlert');
var correosTI = require('../config/config').correosTI;

////////////////////////////////////////////////////////////////////////
////                            VARIABLES                           ////
////////////////////////////////////////////////////////////////////////

var d = new Date(),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear(),
    hr = d.getHours(),
    min = d.getMinutes();

var fechaEnvio = year.toString().substring(2, year.toString().length) + varias.zFill(month, 2) + day;
var fechaEnvioYYYY = year.toString() + varias.zFill(month, 2) + varias.zFill(day, 2);
var horaEnvio = varias.zFill(hr.toString(), 2) + varias.zFill(min.toString(), 2);

const TIPOS_CONTENEDOR = {
    tipos: [{ tipo: '20 DC', codigoISO: "22G1" },
    { tipo: '40 DC', codigoISO: "42G1" },
    { tipo: '40 HC/HQ', codigoISO: "45G1" },
    { tipo: '40 HC', codigoISO: "45G1" },
    { tipo: '40 HQ', codigoISO: "45G1" },
    { tipo: '20 HC', codigoISO: "" },
    { tipo: '20 RF', codigoISO: "22R1" },
    { tipo: '40 RF', codigoISO: "42R0" },
    { tipo: '40 HRF', codigoISO: "45R1" },
    { tipo: '20 OT', codigoISO: "22U1" },
    { tipo: '40 OT', codigoISO: "42U1" },
    { tipo: '40 FB', codigoISO: "42P1" },
    { tipo: '40 FS', codigoISO: "42P3" },
    { tipo: '20 FR', codigoISO: "22P3" },
    { tipo: '40 FR', codigoISO: "48P0" }]
};
// export const TIPOS_CONTENEDOR_ARRAY = ['A', 'B', 'C', 'PT'];

////////////////////////////////////////////////////////////////////////
////                        CREA EDI CODECO                         ////
////////////////////////////////////////////////////////////////////////

exports.CreaCODECO = function CreaCODECO(maniobra, referenceNumber) {
    var cadenaCODECO = '';
    var ID = referenceNumber;
    var codigoISO;
    var IE;
    var FE;
    var booking;
    var freeTextCode;
    var codeListQualifier;
    var ok;
    var marca;
    var error = false;

    for (var i = 0; i < TIPOS_CONTENEDOR.tipos.length; i++) {
        // console.log('TIPOS_CONTENEDOR ' + TIPOS_CONTENEDOR.tipos[i].tipo)
        // console.log('CODIGO ISO ' + TIPOS_CONTENEDOR.tipos[i].codigoISO)
        if (TIPOS_CONTENEDOR.tipos[i].tipo.toString() == maniobra.tipo) {
            codigoISO = TIPOS_CONTENEDOR.tipos[i].codigoISO.toString();
        }
    }

    if (maniobra.peso.includes("IMPORT")) {
        IE = '3';
    } else {
        if (maniobra.peso.includes("EXPORT")) {
            IE = '2';
        } else {
            if (maniobra.peso == 'VACIO') {
                IE = '3';
            }
        }
    }

    if (maniobra.peso.includes("LLENO")) {
        FE = '5';
    } else {
        if (maniobra.peso.includes("VACIO")) {
            FE = '4';
        }
    }

    if (maniobra.solicitud && maniobra.solicitud.blBooking) {
        booking = maniobra.solicitud.blBooking;
    }

    if (maniobra.reparaciones && maniobra.reparaciones.length > 0) {
        freeTextCode = "10";
    } else {
        freeTextCode = "OK";
    }

    if (IE == '3') {
        codeListQualifier = "NA";
    } else {
        if (IE == '2') {
            codeListQualifier = "";
        }
    }

    if (freeTextCode == 'OK') {
        ok = 'GC';
    } else {
        if (freeTextCode == '10') {
            ok = 'D';
        }
    }

    if (maniobra.solicitud && maniobra.solicitud.facturarA && maniobra.solicitud.facturarA == 'Naviera') {
        marca = 'CARRIER';
    } else {
        marca = 'MERCHANT';
    }

    ////////////////////////////////////// VALIDO SI TIENE ERRORES//////////////////////////////////////////
    var cuerpoCorreo;
    cuerpoCorreo = `No se pudo generar la cadena para mensaje EDI CODECO, debido a los siguientes errores:
    `;

    if (codigoISO == undefined || codigoISO == '') {
        cuerpoCorreo += `
        • Codigo ISO = (${codigoISO})`;
        error = true;
    }

    if (IE == undefined || IE == '' || (IE != '2' && IE != '3')) {
        cuerpoCorreo += `   
        • Import - Export = (${IE})`;
        error = true;
    }

    if (FE == undefined || FE == '' || (FE != '4' && FE != '5')) {
        cuerpoCorreo += `   
        • Full - Empty = (${FE})`;
        error = true;
    }

    if ((booking == undefined || booking == '') && IE == '2') {
        cuerpoCorreo += `   
        • Booking = (${booking})`;
        error = true;
    }

    if (freeTextCode == undefined || freeTextCode == '' || (freeTextCode != '10' && freeTextCode != 'OK')) {
        cuerpoCorreo += `   
        • FreeTextCode (10/OK) = (${freeTextCode})`;
        error = true;
    }

    if (codeListQualifier == undefined || (codeListQualifier != 'NA' && codeListQualifier != '')) {
        cuerpoCorreo += `   
        • codeListQualifier (''/NA) = (${codeListQualifier})`;
        error = true;
    }

    if (ok == undefined || ok == '' || (ok != 'GC' && ok != 'D')) {
        cuerpoCorreo += `   
        • ok (GC/D) = (${ok})`;
        error = true;
    }

    if (marca == undefined || marca == '' || (marca != 'MERCHANT' && marca != 'CARRIER')) {
        cuerpoCorreo += `   
        • Marca = (${marca})`;
        error = true;
    }



    if (error) {
        cuerpoCorreo += `

    ========== DATOS DE MANIOBRA ==========

    Refence Number (ID) : ${referenceNumber}
    IdManiobra : ${maniobra._id}
    Estatus : ${maniobra.estatus}
    Carga-Descarga : ${maniobra.cargaDescarga}
    Contenedor : ${maniobra.contenedor ? maniobra.contenedor : ''}
    Tipo : ${maniobra.tipo}
    Peso : ${maniobra.peso}
    `;

    sentMail('Compañero de TI', correosTI, 'Error CODECO - Reference Number : ' + referenceNumber, cuerpoCorreo, 'emailAlert');

    return cadenaCODECO;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (maniobra) {

        var CODECO = {
            UNB: {
                SYNTAX_IDENTIFIER: {
                    Syntax_Identifier: "UNOA",
                    Version_Number: "2"
                },
                INTERCHANGE_SENDER: {
                    Sender_Identification: "MXPGOAB"
                },
                INTERCHANGE_RECIPIENT: {
                    Recipient_Identification: "MSC"
                },
                DATE_TIME_OF_PREPARATION: {
                    Date: fechaEnvio,
                    Time: horaEnvio
                },
                INTERCHANGE_CONTROL_REFERENCE: {
                    Message_Reference_number: ID
                }
            },
            UNH: {
                MESSAGE_REFERENCE_NUMBER: ID,
                MESSAGE_IDENTIFIER: {
                    Message_Type_Identifier: "CODECO",
                    Message_Type_Version_Number: "D",
                    Message_Type_Release_Number: "95B",
                    Contolling_Agency: "UN",
                    Association_Assigned_Code: "ITG14"
                }
            },
            BGM: {
                DOCUMENT_MESSAGE_NAME: {
                    Document_messagename: maniobra.cargaDescarga == 'C' ? '36' : maniobra.cargaDescarga == 'D' ? '34' : ''
                },
                DOCUMENT_MESSAGE_NUMBER: ID,
                MESSAGE_FUNCTION_CODED: "9"
            },
            NAD: {
                PARTY_QUALIFIER: "CF",
                PARTY_IDENTIFICATION_DETAILS: {
                    Party_Id_Identification: "MXPGOAB",
                    Code_List_Qualifier: "160",
                    Code_List_Responsible_Agency_Coded: "20"
                }
            },
            EQD: {
                EQUIPMENT_QUALIFIER: "CN",
                EQUIPMENT_IDENTIFICATION: {
                    Equipment_Identification_Number: maniobra.contenedor
                },
                EQUIPMENT_SIZE_AND_TYPE: {
                    Equipment_Size_And_Type_Identification: codigoISO,
                    Code_List_Qualifier: "102",
                    Code_List_Responsible_Agency_Coded: "5"
                },
                EQUIPMENT_SUPPLIER_CODED: "",
                EQUIPMENT_STATUS_CODED: IE,
                FULL_EMPTY_INDICATOR_CODED: FE
            },
            RFF: {
                REFERENCE: {
                    Qualifier: "BN",
                    Reference_Number: booking
                }
            },
            DTM: {
                DATE_TIME_PERIOD: {
                    Date_Time_Period_Qualifier: "7",
                    Date_Time_Period: fechaEnvioYYYY + horaEnvio,
                    Format_Qualifier: "203"
                }
            },
            FTX: {
                TEXT_SUBJECT_QUALIFIER: "DAR",
                TEXT_FUNCTION_CODED: "",
                TEXT_REFERENCE: {
                    Free_Text_Coded: freeTextCode,
                    Code_List_Qualifier: codeListQualifier,
                    Code_List_Responsible_Agency_Coded: "184"
                },
                TEXT_LITERAL: "" // Se llena en base a si tiene daño o no en el foreach de reparaciones
            },
            DAM: {
                DAMAGE_DETAILS_QUALIFIER: "1",
                TYPE_OF_DAMAGE: {
                    Type_Of_Damage_Coded: "NA",
                    Code_List_Qualifier: "",
                    Code_List_Responsible_Agency_Coded: ""
                    //Type_Of_Damage: "" //35 caracteres SE LLENARA DIRECTO DE MANIOBRA.REPARACIONES
                }
            },
            TDT: {
                TRANSPORT_STAGE_QUALIFIER: "1",
                CONVEYANCE_REFERENCE_NUMBER: "",
                MODE_OF_TRANSPORT: {
                    Mode_Of_Transport_Code: "3"
                },
                TRANSPORT_MEANS: {
                    Type_Of_Means_Of_Transport_Identification: "31"
                },
                CARRIER: "NA/NA",
                TRANSIT_DIRECTION_CODED: "",
                EXCESS_TRANSPORTATION_INFORMATION: "",
                TRANSPORT_IDENTIFICATION: marca
            },
            CNT: {
                CONTROL: {
                    Control_Qualifier: "16",
                    Control_Value: "1"
                }
            },
            UNT: {
                NUMBER_OF_SEGMENTS_IN_A_MESSAGE: "", // Se calcula al armar la cadena
                MESSAGE_REFERENCE_NUMBER: ID
            },
            UNZ: {
                INTERCHANGE_CONTROL_COUNT: "1",
                INTERCHANGE_CONTROL_REFERENCE: ID
            }
        }



        cadenaCODECO += '' +
            'UNB+' + CODECO.UNB.SYNTAX_IDENTIFIER.Syntax_Identifier + ':' + CODECO.UNB.SYNTAX_IDENTIFIER.Version_Number + '+' + CODECO.UNB.INTERCHANGE_SENDER.Sender_Identification + '+' + CODECO.UNB.INTERCHANGE_RECIPIENT.Recipient_Identification + '+' + CODECO.UNB.DATE_TIME_OF_PREPARATION.Date + ':' + CODECO.UNB.DATE_TIME_OF_PREPARATION.Time + '+' + CODECO.UNB.INTERCHANGE_CONTROL_REFERENCE.Message_Reference_number + "'" + '\n' +
            'UNH+' + CODECO.UNH.MESSAGE_REFERENCE_NUMBER + '+' + CODECO.UNH.MESSAGE_IDENTIFIER.Message_Type_Identifier + ':' + CODECO.UNH.MESSAGE_IDENTIFIER.Message_Type_Version_Number + ':' + CODECO.UNH.MESSAGE_IDENTIFIER.Message_Type_Release_Number + ':' + CODECO.UNH.MESSAGE_IDENTIFIER.Contolling_Agency + ':' + CODECO.UNH.MESSAGE_IDENTIFIER.Association_Assigned_Code + "'" + '\n' +
            'BGM+' + CODECO.BGM.DOCUMENT_MESSAGE_NAME.Document_messagename + '+' + CODECO.BGM.DOCUMENT_MESSAGE_NUMBER + '+' + CODECO.BGM.MESSAGE_FUNCTION_CODED + "'" + '\n' +
            'NAD+' + CODECO.NAD.PARTY_QUALIFIER + '+' + CODECO.NAD.PARTY_IDENTIFICATION_DETAILS.Party_Id_Identification + ':' + CODECO.NAD.PARTY_IDENTIFICATION_DETAILS.Code_List_Qualifier + ':' + CODECO.NAD.PARTY_IDENTIFICATION_DETAILS.Code_List_Responsible_Agency_Coded + "'" + '\n' +
            'EQD+' + CODECO.EQD.EQUIPMENT_QUALIFIER + '+' + CODECO.EQD.EQUIPMENT_IDENTIFICATION.Equipment_Identification_Number + '+' + CODECO.EQD.EQUIPMENT_SIZE_AND_TYPE.Equipment_Size_And_Type_Identification + ':' + CODECO.EQD.EQUIPMENT_SIZE_AND_TYPE.Code_List_Qualifier + ':' + CODECO.EQD.EQUIPMENT_SIZE_AND_TYPE.Code_List_Responsible_Agency_Coded + '+' + CODECO.EQD.EQUIPMENT_SUPPLIER_CODED + '+' + CODECO.EQD.EQUIPMENT_STATUS_CODED + '+' + CODECO.EQD.FULL_EMPTY_INDICATOR_CODED + "'" + '\n';

        //Solo en Export
        if (IE == '2') {
            cadenaCODECO += 'RFF+' + CODECO.RFF.REFERENCE.Qualifier + ':' + CODECO.RFF.REFERENCE.Reference_Number + "'" + '\n'
        }
        cadenaCODECO += 'DTM+' + CODECO.DTM.DATE_TIME_PERIOD.Date_Time_Period_Qualifier + ':' + CODECO.DTM.DATE_TIME_PERIOD.Date_Time_Period + ':' + CODECO.DTM.DATE_TIME_PERIOD.Format_Qualifier + "'" + '\n' +
            'FTX+' + CODECO.FTX.TEXT_SUBJECT_QUALIFIER + '+' + CODECO.FTX.TEXT_FUNCTION_CODED + '+' + CODECO.FTX.TEXT_REFERENCE.Free_Text_Coded + ':' + CODECO.FTX.TEXT_REFERENCE.Code_List_Qualifier + ':' + CODECO.FTX.TEXT_REFERENCE.Code_List_Responsible_Agency_Coded + "'" + '\n';

        //Este FTX solo ira en Gate-In
        if (maniobra.cargaDescarga == 'D') {
            cadenaCODECO += 'FTX+' + CODECO.FTX.TEXT_SUBJECT_QUALIFIER + '+++' + ok + "'" + '\n';
        }

        if (maniobra.reparaciones && maniobra.reparaciones.length > 0) {
            maniobra.reparaciones.forEach(r => {
                cadenaCODECO += 'DAM+' + CODECO.DAM.DAMAGE_DETAILS_QUALIFIER + '+' + CODECO.DAM.TYPE_OF_DAMAGE.Type_Of_Damage_Coded + ':' + CODECO.DAM.TYPE_OF_DAMAGE.Code_List_Qualifier + ':' + CODECO.DAM.TYPE_OF_DAMAGE.Code_List_Responsible_Agency_Coded + ':' + r.reparacion + "'" + '\n';
            });
        }

        cadenaCODECO += 'TDT+' + CODECO.TDT.TRANSPORT_STAGE_QUALIFIER + '+' + CODECO.TDT.CONVEYANCE_REFERENCE_NUMBER + '+' + CODECO.TDT.MODE_OF_TRANSPORT.Mode_Of_Transport_Code + '+' + CODECO.TDT.TRANSPORT_MEANS.Type_Of_Means_Of_Transport_Identification + '+' + CODECO.TDT.CARRIER + '+' + CODECO.TDT.TRANSIT_DIRECTION_CODED + '+' + CODECO.TDT.EXCESS_TRANSPORTATION_INFORMATION + '+' + CODECO.TDT.TRANSPORT_IDENTIFICATION + "'" + '\n' +
            'CNT+' + CODECO.CNT.CONTROL.Control_Qualifier + ':' + CODECO.CNT.CONTROL.Control_Value + "'" + '\n';

        var contadorSegmentos = [];

        for (var i = 0; i < cadenaCODECO.length; i++) {
            if (cadenaCODECO[i].toLowerCase() === "\n") contadorSegmentos.push(i);
        }

        cadenaCODECO += 'UNT+' + contadorSegmentos.length + ':' + CODECO.UNT.MESSAGE_REFERENCE_NUMBER + "'" + '\n' +
            'UNZ+' + CODECO.UNZ.INTERCHANGE_CONTROL_COUNT + '+' + CODECO.UNZ.INTERCHANGE_CONTROL_REFERENCE + "'";

        return cadenaCODECO;
    }
}

////////////////////////////////////////////////////////////////////////
