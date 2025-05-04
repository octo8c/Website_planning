$(document).ready(function(){
    /* Variables dépendant du contexte JQuery */
    var tabs = $("#Inscription,#Connexion,#mdpOublie");
    var current = "#Connexion";

    var to_check_sub = $("#user_sub,#pass_sub");
    var to_check_oub = $("#user_fg");
    var to_check_log = $("#user_log,#pass_log");
    
    function checkInput(toCheck){
        let remplis = true;
        toCheck.each((index,element)=>{
            if($(element).val().trim()===""){
                $(element).css("border","1px solid red");
                remplis = false;
            }
        });
        return remplis;
    }
    function switchTabs(value){
        tabs.each(function(){
            $(this).hide();
        });
        if (value != undefined) $("#"+value).show();
    }
    function update_view_button(el){
        if (el.hasClass("log_selected")){
            switchTabs(undefined);
            $("button").removeClass("log_selected");
            return;
        }
        $("button").removeClass("log_selected");  
        el.addClass("log_selected");
    }


    $(".tabcontent").hide(); // pour qu'au début de la page on ait rien visuellement
    $(".tabcontent").css("visibility", "visible"); // on redonne la main au jquery pour cacher les éléments, permet d'eviter un effet "fantome" lorsqu'on recharche la page

    $("#Connexion").on('submit',function(e){
        e.preventDefault();
        if(checkInput(to_check_log)){
            $.post("http://localhost:8080/login",{username : $("#user_log").val().trim(),password : $("#pass_log").val().trim()},function(res){
                //TODO faire quelque chose apres que la connection est marche
            });
        }
    });

    $("#Inscription").on('submit',function(e){
        e.preventDefault();
        if(checkInput(to_check_sub)){
            $.post("http://localhost:8080/inscription",{username : $("#user_sub").val().trim(),password : $("#pass_sub").val().trim(),mail : $("#mail_sub").val()},function(res){
                //TODO faire quelque chose si la connection a marche
            });
        }
    });

    $("#mdpOublie").on('submit',function(e){
        e.preventDefault();
        if(checkInput(to_check_oub)){
            $.post("http://localhost:8080/mdpOublie",{username : $("#user_fg").val().trim()},function(res){
                //TODO faire quelque chose si la demande de mdp est passe envoyez un mail
            });
        }
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
