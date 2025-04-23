$(document).ready(function(){
    /**
     * Prends l'username de l'utilisateur et affiche toutes les reunion auquel il vas avoir lieu dans les prochains jours (tries par ordre d'heure)
     */
    function updateDisplayReunion(username){
        $.post('http://localhost:8080/getReunion',{username : username},function(res){
            $("#voirReunionDiv").empty();
            var date = new Date();
            /*Ajoute les dates dans le cadre a droite */
            for( row of res.rows){
                let heure = parseInt(row.heure.split(":")[0]);
                let minute = parseInt(row.heure.split(":")[1]);
                let tempsMax = heure * 60 + minute + parseInt(row.duree);
                let date_split = row.date_reunion.split("-");
                let year = parseInt(date_split[0]);
                let month = parseInt(date_split[1]);
                let day = parseInt(date_split[2]);
                //On pars du principe que les dates sont superieur >
                if(year>date.getFullYear()||month>date.getMonth()|| day>date.getDay()||tempsMax>date.getHours()*60+date.getMinutes()){ // Si la date est bien suéperieur 
                    $("#voirReunionDiv").append("<a href =\"\"id="+""+">Reunion a :"+row.heure.substring(0,5)+"AM le "+row.date_reunion.substring(0,10)+".Createur : "+row.creator_username+"</a><br>");
                }
            }
        });
    }

    $("#Create_reunion").on('click',function(){
        $("div#InfoReunion").css("display","inline");
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
                    username : "test" ,/*Jsp encore comment on vas recupere le nom de l'utilisateur qui c'est connecte encore*/
                    heure : $("#heure_reunion").val() , 
                    duree : $("#duree_reunion").val() 
                },function(res){
                if(!res){//Message d'erreur 
                    $("#otherDiv").append("<p style=color:red id=errorMessage>Erreur vous aurez une autre reunion en cours a ce moment la</p>");
                    setTimeout(()=>{
                        $("#errorMessage").fadeOut(1000,function(){
                            $(this).remove();
                        });
                    },5000);
                }
                $("div#InfoReunion").hide();
                updateDisplayReunion('test');//TODO METTRE LE NOM DE L'UTILISATEUR A LA PLACE
            });
        }
    });

});