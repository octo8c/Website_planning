const { post_JSON } = require("./public/utils.mjs");

$(document).ready(function(){
    $("#yes").on('change',function(){
        $("#no").checked = false;
    });
    $("#no").on('change',function(){
        $("#yes").checked = false;
    });
    $("#submitForm").on('click',function(){
        //On envoie au serveur la reponse
    });

    post_JSON('resultInvit',{result:$("#yes").checked,
        mail:$(location).attr('href').split('/')[5],
        id_reunion:$(location).attr('href').split('/')[4]})
        .then(result=>{
            console.log(result);
        });
});