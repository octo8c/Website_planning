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
});