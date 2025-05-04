$(document).ready(function(){
    /**
     * Prends l'username de l'utilisateur et affiche toutes les reunion auquel il vas avoir lieu dans les prochains jours (tries par ordre d'heure)
     */
    function updateDisplayReunion(username){
        $.post('http://localhost:8080/getReunion',{username : username},function(res){
            $("#voirReunionDiv").empty();
            var date = new Date();
            /*Ajoute les dates dans le cadre a droite */
            for(let row of res.rows){
                let tabFin = row.heure_fin.split(":");
                let tempsMax = parseInt(tabFin[0]) * 60 + parseInt(tabFin[1]);
                let date_split = row.date_reunion.split("-");
                let year = parseInt(date_split[0]);
                let month = parseInt(date_split[1]);
                let day = parseInt(date_split[2]);
                //On pars du principe que les dates sont superieur >
                if(year>date.getFullYear()||month>date.getMonth()|| day>date.getDay()||tempsMax>date.getHours()*60+date.getMinutes()){ // Si la date est bien suéperieur 
                    $("#voirReunionDiv").append("<a href =\"\"id="+row.id_reunion+" >Reunion a "+row.heure.substring(0,5)+" , le "+row.date_reunion.substring(0,10)+".Createur : "+row.creator_username+"</a><br>");
                    $("a#"+row.id_reunion).on('click',function(e){e.preventDefault();viewReunion(username,row);});
               }
            }
        });
    }

    function viewReunion(username,row){
        let createur = "";
        $.post('http://localhost:8080/getInfo',{id_reunion:row.id_reunion},function(resultats){
            let participants = "";
            $("#display-info").append("<h3><b>"+row.nom_reunion+"</b></h3>");
            $("#display-info").append("<p>"+row.date_reunion +"</p><br>");
            $("#display-info").append("<p>Reunion de "+row.heure+" : "+row.heure_fin+" </p>");
            for (let participant of resultats.rows){
                participants = participants + ", " + participant.username;
                if(participant.role_reunion===2){
                    createur = participant.username;
                }
            }
            participants = participants.substring(1);
            participants = participants+".";
            $("#display-info").append("<p><b>Le créateur de la reunion : "+createur+"</b></p>");
            $("#display-info").append("<p> Les participants :"+participants+"</p>");
        });
        $("#popup-overlay").css("display","inline");//On affiche les display
        $("#modal").css("display","inline");

        $("#modalButton").on('click',function(){
            $("#display-info").empty();
            $("#popup-overlay").css("display","none");
            $("#modal").css("display","none");
        });

        $("#conf-quittez").on('click',function(){
            $.post('http://localhost:8080/quittez-reunion',{username : username,id_reunion:row.id_reunion,createur :createur },
                function(res){
                    $("#modal-conf").css("display","none");
                    $("#popup-overlay").css("display","none");
            });
            updateDisplayReunion(username);
        });
    }

    $("#modal-quitter").on('click',function(){
        $("#modal").css("display","none");
        $("#modal-conf").css("display","inline");
    });

    $("#conf-cancel").on('click',function(){
        $("#modal-conf").css("display","none");
        $("#modal").css("display","inline");
    });

    let flag = false;
    $("#ajouterUtilisateur").on('click',function(){
        if(!flag){
            $("#userType").css("display","inline");
        }else{
            if($("#mail/username").val()!==""){
                $.post('http://localhost:8080/invit',{username : $("#mail/username").val()},function(result){
                    if(result){
                        //TODO MANQUE TRAITEMENT DES MAILS
                    }else{

                    }
                });
            }else{

            }
        }
    });


    // regle pour ajouter un input de selection d'heure et de minute personnalisé
    $(".selectionTime").append($("#selection-heure-reu").html());
    // on enleve le hidden
    $(".selectionTime").css("display : block");
    $(".selectionTime").find("*").removeAttr("hidden");

    // on enleve l'ID de l'element pour eviter des doublons d'ID
    $(".selectionTime").find("*").removeAttr("id");



});
