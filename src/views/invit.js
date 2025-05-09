const { post_JSON } = require("../public/utils.mjs");

$(document).ready(function(){
    $("#yes").on('change',function(){
        $("#no").prop("checked",false);
    });
    $("#no").on('change',function(){
        $("#yes").prop("checked",false);
    });
    $("#submitForm").on('click',function(){
        //On envoie au serveur la reponse
        console.log("ERRREE8AHEUIA");
    });

    post_JSON('resultInvit',{result:$("#yes").is(':checked'),
        mail:$(location).attr('href').split('/')[5],
        id_reunion:$(location).attr('href').split('/')[4]})
        .then(result=>{
            console.log(result);
        }
    );
});