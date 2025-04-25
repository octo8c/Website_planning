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

    $("#Create_reunion").on('click',function(){
        $("div#InfoReunion").css("display","inline");
    });

    $("button#bouton_quitter").on('click',function(){
        $("div#InfoReunion").css("display","none");
    });

    let id_error = 0;

    function errorMessage(zone,text){
        $(zone).append("<p style=color:red id=errorMessage"+id_error+">"+text+"</p>");
        let erreur = id_error;
        id_error++;
        setTimeout(()=>{
            $("#errorMessage"+erreur).fadeOut(1000,function(){
                $(this).remove();
            });
        },3000);
    }

    $("button#create").on('click',function(){
        if($("input#reunion_name").val().trim()===""){
            $("input#reunion_name").css("border","1px solid red");
            errorMessage("#InfoReunion","Erreur veuillez donnez un nom a la reunion");
        }else if ($("#heure_reunion").val().trim()==="" || $("#heure_fin_reunion").val().trim()===""){
            errorMessage("#InfoReunion","Erreur veuillez renseignez une heure de début et de fin de reunion");
        }else if($("#heure_reunion").val()<$("#heure_fin_reunion").val()){

            $.post("http://localhost:8080/creation",
                {
                    nom_reunion : $("#reunion_name").val().trim(),
                    date_reunion : $("#date_reunion").val(),
                    username : "test" ,/*Jsp encore comment on vas recupere le nom de l'utilisateur qui c'est connecte encore*/
                    heure : $("#heure_reunion").val() , 
                    heure_fin : $("#heure_fin_reunion").val() 
                },function(res){
                if(!res){//Message d'erreur 
                    errorMessage("#otherDiv","Erreur vous aurez une autre reunion en cours a ce moment la");
                }
                $("div#InfoReunion").hide();
                updateDisplayReunion('test');//TODO METTRE LE NOM DE L'UTILISATEUR A LA PLACE
            });
        }else{
            errorMessage("#InfoReunion","Mettez une heure de debut inférieur a l'heure de fin");
        }
    });
    $(window).on("resize", () => {
        if ($(window).width() < 800) {
            $(".jour-agenda").html("<li>Lun</li><li>Mar</li><li>Mer</li><li>Jeu</li><li>Ven</li><li>Sam</li><li>Dim</li>");
        } else {
            $(".jour-agenda").html("<li>Lundi</li><li>Mardi</li><li>Mercredi</li><li>Jeudi</li><li>Vendredi</li><li>Samedi</li><li>Dimanche</li>");
        }
    });

    $(window).trigger("resize");  // pour permettre aux écran nativement petit, et non redimensionné d'avoir les petite écritures

    real_date = new Date();
    date = new Date(real_date.getTime());

    updateCalendar(date, real_date);

    $("#prevMonth").on("click", () => {
        date.setMonth(date.getMonth()-1);
        updateCalendar(date, real_date);
    });

    $("#nextMonth").on("click", ()=>{
        date.setMonth(date.getMonth()+1);
        updateCalendar(date, real_date);
    });

    $("#today").on("click", ()=> {
        date = new Date();
        updateCalendar(date, real_date);
    });

    $(".agenda-case").hover(function () {$(this).addClass("selected");}, function () {$(this).removeClass("selected");});

function month_to_string(x){
    switch (x){
        case 0 : return "Janvier";
        case 1 : return "Fevrier";
        case 2 : return "Mars";
        case 3 : return "Avril";
        case 4 : return "Mai";
        case 5 : return "Juin";
        case 6 : return "Juillet";
        case 7 : return "Août";
        case 8 : return "Septembre";
        case 9 : return "Octobre";
        case 10 : return "Novembre";
        case 11 : return "Décembre";
    }
}

function construct_days(date){  // first day of the week must have to be the number of the monday from the first week of the month
    $("#numero-jour").html("");


    value_of_first_day = first_day_of_the_first_week(date.getFullYear(), date.getMonth());
    console.log(value_of_first_day);
    console.log(last_day_in_month(date.getFullYear(), date.getMonth()-1));
    if (value_of_first_day != 1){
        for (let i=value_of_first_day; i<=last_day_in_month(date.getFullYear(), date.getMonth()-1); i++){ // start of the week from potentially the previous month
            $("#numero-jour").append("<li class='disabled agenda-case'>"+ i +"</li>");
        }
    }
    
    
    for (let i=1; i<=last_day_in_month(date.getFullYear(), date.getMonth()); i++){
        $("#numero-jour").append("<li class='agenda-case'>"+i+"</li>");
    }

    let indice_jour=1;
    let totalDays = $("#numero-jour li").length;
    while (totalDays % 7 !== 0) {
        $("#numero-jour").append('<li class="disabled agenda-case">'+indice_jour+'</li>');
        indice_jour++;
        totalDays++;
    }    

    
}


function last_day_in_month(year, month){
    return new Date(year, month+1, 0).getDate();
}



function first_day_of_the_first_week(year, month){
    date_temp = new Date(year, month, 1);
    while (date_temp.getDay() != 1){ // until we found the monday
        date_temp.setDate(date_temp.getDate()-1);
    }
    return date_temp.getDate(); // return the monday
}


function updateCalendar(date, real_date){
    $("#monthYear").html(month_to_string(date.getMonth()) + " " + date.getFullYear());
    construct_days(date);
    $(".agenda-case").hover(function () {$(this).addClass("selected");}, function () {$(this).removeClass("selected");});
    
    if (date.getMonth() == real_date.getMonth()) {
        $(".agenda-case").not(".disabled").filter(function () {
            return ($(this).html() == real_date.getDate());
        }).addClass("today");
    }
}
});
