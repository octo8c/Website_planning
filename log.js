$(document).ready(function(){
    $("input#submitLogin").on("click",function(){
        console.log("Tentaive de login(Il manque le moment ou on fait le login)");
    });
    var tabs = $("Inscription ,Connexion");
    function switchTabs(event,value){
        for(val in tabs){
            $("div#"+val).css('display','none');
        }
        $("div#"+value).css('display','block');

        console.log("Coucou c'est moi ");
    }

    $("div#tabs button").on("click",switchTabs);

    $("div#Connexion").css('display','block');
})