$(document).ready(function(){
    $("input#submitLogin").on("click",function(){
        console.log("Tentaive de login(Il manque le moment ou on fait le login)");
    });

    function existsUsername(username){
        console.log("FAIREE");
    }
    var tabs = $("#Inscription,#Connexion,#mdpOublie");
    var current = "#Connexion";
    function switchTabs(value){
        tabs.each(function(){
            $(this).css('display','none');
            console.log(this);
        });
        $("div#"+value).css('display','block');

        console.log("Coucou c'est moi ");
    }

    

    $("button#inscr").on("click",() =>switchTabs('Inscription'));
    $("button#conex").on("click",() => switchTabs('Connexion'));
    $("a#lostPassword").on("click",function (e) { 
        e.preventDefault();
        switchTabs('mdpOublie');
     });
    console.log("Affichage que c'est bien arrive jusque la ");
    $("div#Connexion").css('display','block');
})