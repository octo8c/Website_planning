$(document).ready(function(){
    /**
     * Prends l'username de l'utilisateur et affiche toutes les reunion auquel il vas avoir lieu dans les prochains jours (tries par ordre d'heure)
     */
    function updateDisplayReunion(username){
        $.post('http://localhost:8080/getReunion',{username : username},function(res){
            console.log("Affichage du message : "+res);
            for( row in res.rows){
                //ajoutez les dates a droite
                $("#voirReunionDiv").append("<a id="+""+"> Reunion a :"+row.heure+"AM "+row.date_reunion+" de :"+row.creator_username+"</a>");
            }
        });
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
                {
                    nom_reunion : $("#reunion_name").val().trim(),
                    date_reunion : $("#date_reunion").val(),
                    username : "test" ,
                    heure : $("#heure_reunion").val() , 
                    duree : $("#duree_reunion").val() /*Jsp encore comment on vas recupere le nom de l'utilisateur qui c'est connecte encore*/
                },function(error,res){//On ajoute la reunion a la bdd
                if(res==="Connection bien passe"){
                    console.log("Bon appriori ca a marche"+$("#reunion_name").val());
                }
                $("div#InfoReunion").hide();
                updateDisplayReunion('test');//TODO METTRE LE NOM DE L'UTILISATEUR A LA PLACE
            });
        }
    });

});