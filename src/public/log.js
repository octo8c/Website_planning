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
        if(!remplis){
            console.log("Les champs ne sont pas remplis");
        }
        return remplis;
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

    $("#Connexion").on('submit',function(e){
        e.preventDefault();
        if(checkInput(to_check_log)){
            $.post("http://localhost:8080/login",{username : $("#user_log").val().trim(),password : $("#pass_log").val().trim()},function(error,res){
                if(res){
                    console.log("OE bien recu que la connexion a marche");
                }else{
                    console.log("Aie nan pas bien recu");
                }
            });
        }
    });

    $("#Inscription").on('submit',function(e){
        e.preventDefault();
        if(checkInput(to_check_sub)){
            console.log("oui on poste bien");
            $.post("http://localhost:8080/inscription",{username : $("#user_sub").val().trim(),password : $("#pass_sub").val().trim()},function(error,res){
                if(res){
                    console.log("OE bien recu que la connexion a marche");
                }else{
                    console.log("Aie nan pas bien recu");
                }
            });
        }
    });

    $("#mdpOublie").on('submit',function(e){
        e.preventDefault();
        if(checkInput(to_check_oub)){
            $.post("http://localhost:8080/mdpOublie",{username : $("#user_fg").val().trim()},function(error,res){
                if(res){
                    console.log("OE bien recu que le mdp a été reinialise");
                }else{
                    console.log("Aie nan pas bien recu");
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
    $("div#Connexion").css('display','block');
});
