const { post_JSON } = require("./utils.mjs");

$(document).ready(function(){
    /*$("#yes").on('change',function(){
        $("#no").prop("checked",false);
    });
    $("#no").on('change',function(){
        $("#yes").prop("checked",false);
    });
    $("#submitForm").on('click',function(){
        //On envoie au serveur la reponse
        console.log("ERRREE8AHEUIA");
        post_JSON('resultInvit',{result:$("#yes").is(':checked'),
            mail:$(location).attr('href').split('/')[5],
            id_reunion:$(location).attr('href').split('/')[4]})
            .then(result=>{
                console.log(result);
            }
        ).then(result=>{
            console.log(result);
            if(result){
                $("body").empty();
                $("body").append("<h1>Vous etes instrict dans les participants</h1>");
            }
        });
    });
    console.log("Oui je suis bien chargé");

    */
});