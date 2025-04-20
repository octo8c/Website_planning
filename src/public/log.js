$(document).ready(function(){
    /* Variables dépendant du contexte JQuery */
    var tabs = $("#Inscription,#Connexion,#mdpOublie");
    var current = "#Connexion";

    /* Fonction dépendant du contexte JQuery */    
    function existsUsername(username){
        console.log("FAIREE");
    }
    function checkPassword(username,password){
    }
    function switchTabs(value){
        tabs.each(function(){
            $(this).hide();
            console.log(this);
        });
        if (value != undefined) $("#"+value).show();
    }
    function update_view_button(el){
        if (el.hasClass("selected")){
            switchTabs(undefined);
            $("button").removeClass("selected");
            return;
        }
        $("button").removeClass("selected");  
        el.addClass("selected");
    }


    $(".tabcontent").hide(); // pour qu'au début de la page on ait rien visuellement
    $(".tabcontent").css("visibility", "visible"); // on redonne la main au jquery pour cacher les éléments, permet d'eviter un effet "fantome" lorsqu'on recharche la page

    $("input#submitLogin").on("click",function(){
        console.log("Tentaive de login(Il manque le moment ou on fait le login)");
    });

    $("button#inscr").on("click",function(){
        switchTabs('Inscription');
        update_view_button($(this));
    });

    $("button#conex").on("click",function(){
        switchTabs('Connexion');
        update_view_button($(this));
    });
    $("a#lostPassword").on("click",function (e) { 
        e.preventDefault();
        switchTabs('mdpOublie');
     });
    $("div#Connexion").css('display','block');
});
