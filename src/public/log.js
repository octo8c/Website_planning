import { post_JSON, getCookie, setCookie, errorMessage, updateUser, 
    updateDisplayReunion, userMessage } from "./utils.mjs";

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


    // pour qu'au début de la page on ait rien visuellement
    $(".tabcontent").hide(); 
    // on redonne la main au jquery pour cacher les éléments, permet d'eviter
    // un effet "fantome" lorsqu'on recharche la page
    $(".tabcontent").css("visibility", "visible"); 

    $("#Connexion .log_button").on('click',function(e){
        e.preventDefault();
        if(checkInput(to_check_log)){
            let usern = $("#user_log").val().trim()
            post_JSON("login", {username: usern, password: $("#pass_log").val().trim()})
            .then(function (res){
                if (res.connecte){
                    setCookie("id", res.id);
                    setCookie("username", usern);
                    setCookie("mail",res.mail);
                    $("#closeLoginButton").click();
                    
                    updateUser();

                    userMessage("#otherDiv", "Bienvenu "+usern+"!", "#4CC747");
                } else {
                    errorMessage("#Connexion", res.message);
                }
            });
        }
    });

    $("#Inscription .log_button").on('click',function(e){
        e.preventDefault();
        if(checkInput(to_check_sub)){
            let usern = $("#user_sub").val().trim();
            post_JSON("inscription",{username : usern, password : 
                $("#pass_sub").val().trim(),mail : $("#mail_sub").val()})
            .then(function(res){
                console.log(res.result);
                if (res.result){
                    setCookie("id", res.id);
                    setCookie("username", usern);
                    setCookie("mail",$("#mail_sub").val());
                    $("#closeLoginButton").click();
                    updateUser();
                    userMessage("#otherDiv", "Bienvenu "+usern+"!", "#4CC747");
                } else {
                    errorMessage("#Inscription", res.message);
                }
            });
        }
    });

    $("#mdpOublie .log_button").on('click',function(e){
        e.preventDefault();
        if(checkInput(to_check_oub)){
            post_JSON("mdpOublie",{username : $("#user_fg").val().trim()})
            .then(function(res){
                if (res.result){
                    $("#closeLoginButton").click();
                    alert("un mail à correctement été envoyé à votre adresse \
                        mail pour réinitialiser votre mot de passe");
                } else {
                    errorMessage("#mdpOublie", res.message);
                }
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
    
    $("#loginButton").on('click', function (){
        $("#popupLogin").css("visibility", "visible");
    });

    $("#closeLoginButton").on('click', function (){
        $("#popupLogin").css('visibility', 'hidden');
        $(".tabcontent").css('visibility', 'hidden');
        $(".tabcontent").css('visibility', 'inherit');
    });
});
