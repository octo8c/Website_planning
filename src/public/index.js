$(document).ready(function(){
    /**
     * 
     */
    function updateDisplayReunion(){
        /*Recupere toutes les reunions puis les affiche sur le calendrier(Jsp encore comment faire) */
    }

    $("#Create_reunion").on('click',function(){
        $("div#InfoReunion").css("display","inline");
        console.log("Oui ca marche bien (surpris)");
    });

    $("button#bouton_quitter").on('click',function(){
        $("div#InfoReunion").css("display","none");
    });

    $("button#create").on('click',function(){
        if($("input#reunion_name").val().trim()===""){
            $("input#reunion_name").css("border","1px solid red");
        }else{
            $.post("http://localhost:8080/creation",
                {nom_reunion : $("input#reunion_name").val().trim(),
                    date_reunion : $("#date_reunion").val(),
                    username : "test" , /*Jsp encore comment on vas recupere le nom de l'utilisateur qui c'est connecte encore*/
                },function(error,res){//On ajoute la reunion a la bdd
                if(res==="Connection bien passe"){
                    console.log("Bon appriori ca a marche");
                }
                $("div#InfoReunion").hide();
                updateDisplayReunion();
            });
        }
    });

});