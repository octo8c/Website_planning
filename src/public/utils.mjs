/**
     * Prends l'username de l'utilisateur et affiche toutes les reunion auquel il vas avoir lieu dans les prochains jours (tries par ordre d'heure)
     */
export function updateDisplayReunion(mail){
    post_JSON("getReunion", {mail:mail})
    .then(function(res){
        let rows = res.result.rows;
        let rows_invit = res.result_invit.rows;
        $("#Reunion_fix").empty();
        $("#Reunion_flex").empty();
        $("#Reunion_invit").empty();
        var date = new Date();
        var list_date = [];//Liste de liste (chaque liste contient toutes les info de la reunion)
        let ind = 0;
        for(let row of rows){
            if(row.heure_fin.length===1){
                let tabFin = row.heure_fin[0].split(":");
                let tempsMax = parseInt(tabFin[0]) * 60 + parseInt(tabFin[1]);
                let date_split = row.date_reunion[0].split("-");
                let year = parseInt(date_split[0]);
                let month = parseInt(date_split[1]);
                let day = parseInt(date_split[2]);
                if(year>date.getFullYear()||month>date.getMonth()|| day>date.getDay()||tempsMax>date.getHours()*60+date.getMinutes()){ // Si la date est bien suéperieur 
                    list_date.push( [ind,new Date(year,month,day),tempsMax]);
                    ind++;
                }    
            }else{/*Toutes les reunions qui n'ont pas d'horraires definis */
                console.log("Oui il ya bien un ajout");
                $("#Reunion_flex").append("<a href =\"\"id="+row.id_reunion+">Reunion de +"+row.creator_username+"</a><br>");
                $("a#"+row.id_reunion).on('click',function(e){e.preventDefault();viewReunion(getCookie("mail"),row);});
            }
        }
        /**On trie toutes les dates */
        list_date.sort((a,b)=>{
            if(a[1]-b[1]===0){
                return a[2]-b[2];
            }else{
                return a[1]-b[1];
            }
        });
        //On les ajoutes alors au reunion prévus
        for(let i = 0;i<list_date.length;i++){//On n'affiche pas les reunion déja passé
            if (rows[list_date[i][0]].heure.length == 0) {
                continue;
            }
            console.log("Oui les reunions sont vrm ajoutés")
            $("#Reunion_fix").append("<a href =\"\"id="+rows[list_date[i][0]].id_reunion+" >Reunion a "+rows[list_date[i][0]].heure[0].substring(0,5)+" , le "+rows[list_date[i][0]].date_reunion[0].substring(0,10)+".Createur : "+rows[list_date[i][0]].creator_username+"</a><br>");
            $("a#"+rows[list_date[i][0]].id_reunion).on('click',function(e){e.preventDefault();viewReunion(getCookie("mail"),rows[list_date[i][0]]);});
        }

        for(let row of rows_invit){
            $("#Reunion_invit").append("<a href =\"\"id="+row.id_reunion+" >Reunion de +"+row.creator_username+"</a><br>");
            $("a#"+rows[list_date[i][0]].id_reunion).on('click',function(e){e.preventDefault();viewInvit(getCookie("mail"),row)});
        }

    });
}
export function viewInvit(mail,row){
    $("#display-info").append("<h3><b>"+row.nom_reunion+"</b></h3>");
    let createur = "";
    for (let participant of resultats.result.rows){
        if(participant.role_reunion===2){
            createur = participant.mail;
        }
    }
    $("#display-info").append("<h3>L'organisateur : "+createur+"<h3>");
    if(row.date_reunion.length === 1){
        $("#display-info").append("<p>"+row.date_reunion[0] +"</p><br>");
        $("#display-info").append("<p>Reunion de "+row.heure[0]+" : "+row.heure_fin[0]+" </p>");
    }else{
        $("#display-info").append("<p>Horraires possibles : </p>");
        for(let i =0;i<row.date_reunion.length;i++){
            $("#display-info").append("<button id=invit_"+i+">Le"+row.date_reunion[i]+","+row.heure[i]+"->"+row.heure_fin[i]+"</button>");
            $("#invit_"+i).on('click',function(){
                post_JSON('updateProposition',{id_reunion:row.id_reunion,date:row.date_reunion[i],heure:row.heure[i],heure_fin:row.heure_fin[i]});
            });
        }
    }
}

export function viewReunion(mail,row){
    let createur = "";
    $("#display-info").empty();
    console.log(row+"L'id de la reunion"+row.id_reunion);
    post_JSON("getInfo", {id_reunion:row.id_reunion})
    .then(function(resultats){
        let participants = "";
        $("#display-info").append("<h3><b>"+row.nom_reunion+"</b></h3>");
        if(row.date_reunion.length === 1){
            $("#display-info").append("<p>"+row.date_reunion[0] +"</p><br>");
            $("#display-info").append("<p>Reunion de "+row.heure[0]+" : "+row.heure_fin[0]+" </p>");
        }else{
            $("#display-info").append("<p>Horraires possibles : </p>");
            for(let i =0;i<row.date_reunion.length;i++){
                $("#display-info").append("<p>Le"+row.date_reunion[i]+","+row.heure[i]+"->"+row.heure_fin[i]+"</p>");
            }
        }
        for (let participant of resultats.result.rows){
            participants = participants + ", " + participant.mail;
            if(participant.role_reunion===2){
                createur = participant.mail;
            }
        }
        participants = participants.substring(1);
        $("#display-info").append("<p><b>Le créateur de la reunion : "+createur+"</b></p>");
        $("#display-info").append("<p> Les participants :"+participants+"</p>");

        $("#popup-overlay").css("display","inline");//On affiche les display
        $("#modal").css("display","inline");
    
        $("#modalButton").on('click',function(){//Quitte l'affichage sans rien faire
            $("#display-info").empty();
            $("#popup-overlay").css("display","none");
            $("#modal").css("display","none");
            $("#userType").css("display","inline");
        });
        let flag = false;
        $("#ajouterUtilisateur").on('click',function(){ //Invite les utilisateurs a la reunion
            if(!flag){
                $("#userType").css("display","inline");
                flag = true;
            }else{
                post_JSON("invit",{username:$("#mail_username").val(),id_reunion:row.id_reunion,nom_reunion:row.nom_reunion})
                .then(res=>{
                    if(!res.result){
                        errorMessage("display-info","Erreur mail pas envoyez");
                    }else{//On update la liste des participants
                        console.log("Oui j'ai bien ajouté : "+row.id_reunion+"mail : "+mail);
                        viewReunion(mail,row);
                    }
                })
                $("#mail_username").val("");//On vide la valeur
            }
        });
    
        $("#conf-quittez").on('click',function(){
            post_JSON("quittez-reunion", {mail:mail, id_reunion:row.id_reunion, createur:createur})
            .then(function(res){      
                $("#modal-conf").css("display","none");
                $("#popup-overlay").css("display","none");
                $("#userType").css("display","inline");

            });
            updateDisplayReunion(getCookie("mail"));
        });
    });
}

export function post_JSON(url, json_to_send){
    return $.post("http://localhost:8080/"+url, json_to_send);
}

export function get_JSON(url){
    return $.get("http://localhost:8080/"+url);   
}

export function setCookie(name, value){
    document.cookie = name+"="+value+"; path=/";
}

export function getCookie(name){
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies){
        const [nom, valeur] = cookie.split("=");
        if (nom==name) return valeur;
    }
    return undefined;
}

export function removeCookie(name){
    document.cookie= name+"=0; expires=Sat, 01 Jan 2000 00:00:00 UTC; path=/;";
}

let id_error = 0;

export function setIdError(new_value){
    id_error = new_value;
}

export function errorMessage(zone,text){
    $(zone).append("<p style=color:red id=errorMessage"+id_error+">"+text+"</p>");
    let erreur = id_error;
    id_error++;
    setTimeout(()=>{
        $("#errorMessage"+erreur).fadeOut(1000,function(){
            $(this).remove();
        });
    },3000);
}


export function updateUser(){
    updateDisplayReunion(getCookie("mail"));
    if (getCookie("id") != undefined){ // si l'user est connecté
        $("#loginButton").css("display", "none");
        $("#disconnectButton").css("display", "block");
        $("#Create_reunion").css("visibility","visible");
    } else {
        $("#disconnectButton").css("display", "none");
        $("#loginButton").css("display", "block");
        $("#Create_reunion").css("visibility","hidden");
    }
}