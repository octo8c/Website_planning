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
    let flag = false;

    function viewReunion(username,row){
        let createur = "";
        $.post('http://localhost:8080/getInfo',{id_reunion:row.id_reunion},function(resultats){
            let participants = "";
            $("#display-info").append("<h3><b>"+row.nom_reunion+"</b></h3>");
            $("#display-info").append("<p> Du "+row.date_reunion +"Au "+row.date_fin+"</p><br>");
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
            $("#display-info").append("<p>Description de la reunion : "+row.descr+"</p>")
        });
        $("#popup-overlay").css("display","inline");//On affiche les display
        $("#modal").css("display","inline");

        $("#modalButton").on('click',function(){
            $("#display-info").empty();
            $("#popup-overlay").css("display","none");
            $("#modal").css("display","none");
            flag = false;
        });

        $("#conf-quittez").on('click',function(){
            $.post('http://localhost:8080/quittez-reunion',{username : username,id_reunion:row.id_reunion,createur :createur },
                function(res){
                    $("#modal-conf").css("display","none");
                    $("#popup-overlay").css("display","none");
            });
            updateDisplayReunion(username);
        });
        $("#ajouterUtilisateur").on('click',function(){
            if(!flag){
                $("#userType").css("display","inline");
                flag = true;
            }else{
                if($("#mail_username").val()!==""){
                    console.log("Coucou je suis la "+$("#mail_username").val());
                    $.post('http://localhost:8080/invit',{username : $("#mail_username").val(),inviter : createur,id:row.id_reunion,nom_reunion:row.nom_reunion},
                    function(result){
                        if(!result){
                            errorMessage("#InfoReunion","Erreur ajout user");
                        }
                    });
                    $("#modalButton").click();
                }else{
                    errorMessage("#modal","Vous devez tapez le nom de l'utilisateur");
                }
            }
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

    function construct_date(date){
        var date_separated = date.substring(0,8);
        return date_separated.substring(0,4)+"-"+date_separated.substring(4,6)+"-"+date_separated.substring(6,8);
    }
    /**
     * Prends un temps d'un calendrier ics et le transforme en temps pour la base de données
     * @param {*} time Au format [1-9]*T
     * Renvoie le temps au bon format pour la base de données
     */
    function construct_time(time){
        let tmp = time.substring(0,time.length-1);
        return tmp.substring(0,2)+":"+tmp.substring(2,4);
    }
    $("#selectFile").on('click',function(){
        $("#fileImport").click();
    });
    $("#fileImport").on('change',function(event){
        const file = this.files[0];
        if(!this.files ||!this.files[0]){
            return;
        }
        console.log($("#fileImport").val());
        const fileReader = new FileReader();
        console.log("COucou j'aimerais affichez des trucs j'espere");
        fileReader.onload = function(e){
            var lines = e.target.result.split("\n");
            var tab = [];
            let attendees = [];
            let ind = 0;
            lines.forEach(element => {
                console.log(element);
                if(element.substring(0,6)==="BEGIN:"){
                    tab = [];
                    attendees = [];
                    ind = 0;
                    console.log("BEGIN");                    
                }else if (element.substring(0,8)==="DTSTART:"){
                    tab[0]=construct_date(element.split(":")[1]);
                    tab[2]=construct_time(element.split("T")[4]);
                    console.log("DTSTART");
                }else if(element.substring(0,6)==="DTEND:"){
                    tab[1]=construct_date(element.split(":")[1]);
                    tab[3]=construct_time(element.split("T")[2]);
                    console.log("DTEND:");
                }else if (element.substring(0,8)==="SUMMARY:"){
                    tab[4] = element.split("SUMMARY:")[1];
                    console.log("SUMMARY:");
                }else if (element.substring(0,12)==="DESCRIPTION:"){
                    tab[5] = element.split("DESCRIPTION:")[1];
                    console.log("DESCRIPTION:");
                }else if (element.substring(0,9)==="LOCATION:"){
                    tab[7] = element.split(":")[1];
                    console.log("LOCATION");
                }else if (element.substring(0,9)==="ORGANIZER"){
                    tab[6]=element.split("CN=")[1].split(":")[0];//On suppose qu'on 
                    console.log("ORGANIZER");
                }else if (element.substring(0,9)==="ATTENDEE;"){
                    attendees[ind] =element.split("MAILTO:")[1];
                    ind++;
                    console.log("ATTENDEE");
                }else if (element.substring(0,4)==="END:"){
                    console.log("END:");
                    console.log(attendees);
                    if(element.substring(4)==="VEVENT"){
                        console.log(""+tab);
                        $.post('http://localhost:8080/importReunion',{
                            date_debut : tab[0] ,
                            date_fin : tab[1] , 
                            heure_debut : tab[2] ,
                            heure_fin : tab[3] , 
                            nom_reunion : tab[4] ,
                            descr : tab[5] , 
                            organisateur : tab[6] ,
                            invites : attendees
                        },function(res){
                            if(!res){
                                errorMessage("#InfoReunion","Erreur fichier au mauvais format");
                            }else{
                                updateDisplayReunion("test");
                            }
                        });
                    }
                }else{
                    /*On fait rien avec tout ca donc on s'en fous*/
                }
        });
        }
        fileReader.readAsText(this.files[0],'UTF-8');
    });


    // regle pour ajouter un input de selection d'heure et de minute personnalisé
    $(".selectionTime").append($("#selection-heure-reu").html());
    // on enleve le hidden
    $(".selectionTime").css("display : block");
    $(".selectionTime").find("*").removeAttr("hidden");

    // on enleve l'ID de l'element pour eviter des doublons d'ID
    $(".selectionTime").find("*").removeAttr("id");



});
