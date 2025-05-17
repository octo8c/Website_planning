/**
* Prends l'username de l'utilisateur et affiche toutes les reunion auquel il vas avoir lieu dans les prochains jours (tries par ordre d'heure)
*/
export function updateDisplayReunion(mail) {
    post_JSON("getReunion", { mail: mail })
        .then(function (res) {
            console.log("Ca update pas par ici");
            let rows = res.result.rows;
            let rows_invit = res.result_invit.rows;
            $("#Reunion_fix").empty();
            $("#Reunion_flex").empty();
            $("#Reunion_invit").empty();
            var date = new Date();
            var list_date = [];//Liste de liste (chaque liste contient toutes les info de la reunion)
            let ind = 0;
            for (let row of rows) {
                if (row.heure_fin.length === 1) {
                    let tabFin = row.heure_fin[0].split(":");
                    let tempsMax = parseInt(tabFin[0]) * 60 + parseInt(tabFin[1]);
                    let date_split = row.date_reunion[0].split("-");
                    let year = parseInt(date_split[0]);
                    let month = parseInt(date_split[1]);
                    let day = parseInt(date_split[2]);
                    if (year > date.getFullYear() || month > date.getMonth() || day > date.getDay() || tempsMax > date.getHours() * 60 + date.getMinutes()) { // Si la date est bien suéperieur 
                        list_date.push([ind, new Date(year, month, day), tempsMax]);
                        ind++;
                    }
                } else {/*Toutes les reunions qui n'ont pas d'horraires definis */
                    console.log("Oui il ya bien un ajout");
                    $("#Reunion_flex").append("<a href =\"\"id=" + row.id_reunion + ">Reunion de +" + row.creator_username + "</a><br>");
                    $("a#" + row.id_reunion).on('click', function (e) { e.preventDefault(); viewReunion(getCookie("mail"), row,0); });
                }
            }
            /**On trie toutes les dates */
            list_date.sort((a, b) => {
                if (a[1] - b[1] === 0) {
                    return a[2] - b[2];
                } else {
                    return a[1] - b[1];
                }
            });
            //On les ajoutes alors au reunion prévus
            for (let i = 0; i < list_date.length; i++) {//On n'affiche pas les reunion déja passé
                if (rows[list_date[i][0]].heure.length == 0) {
                    continue;
                }
                $("#Reunion_fix").append("<a href =\"\"id=" + rows[list_date[i][0]].id_reunion + " >Reunion a " + rows[list_date[i][0]].heure[0].substring(0, 5) + " , le " + rows[list_date[i][0]].date_reunion[0].substring(0, 10) + ".Createur : " + rows[list_date[i][0]].creator_username + "</a><br>");
                $("a#" + rows[list_date[i][0]].id_reunion).on('click', function (e) { e.preventDefault(); viewReunion(getCookie("mail"), rows[list_date[i][0]],0); });
            }

            for (let row of rows_invit) {
                $("#Reunion_invit").append("<a href =\"\"id=" + row.id_reunion + " >Reunion de +" + row.creator_username + "</a><br>");
                $("a#" + row.id_reunion).on('click', function (e) { e.preventDefault(); viewReunion(getCookie("mail"), row,1) });
            }

        });
}
let res = -1;

/**
 * 
 * @param {*} mail le mail de l'utilisateurs
 * @param {*} row la ligne a ajouté
 * @param {*} flag Pour 1 se compote comme pour une invitation , pour 2 comme un evenement personnel pour 0 comme un evenements quelconque
 */
export function viewReunion(mail, row, flag) {
    let createur = "";
    let date = flag==2?row.date_event:row.date_reunion[0];
    let heure = flag==2?row.heure:row.heure[0];
    let heure_fin = flag==2?row.heure_fin:row.heure_fin[0];
    if(flag==1){
        $("#update-res").css("display","inline");
        $("#ajouterUtilisateur").css("display","none");
        $("#userType").css("display","none");
        $("#modal-quitter").css("display","inline");
    }else if(flag==0){
        $("#update-res").css("display","none");
        $("#ajouterUtilisateur").css("display","inline");
        $("#userType").css("display","inline");
        $("#modal-quitter").css("display","inline");
    }else{
        $("#ajouterUtilisateur").css("display","none");
        $("#userType").css("display","none");
        $("#update-res").css("display","none");
        $("#modal-quitter").css("display","none");
    }
    $("#display-info").empty();
    post_JSON("getInfo", { id_reunion: row.id_reunion })
        .then(function (resultats) {
            let participants = "";
            $("#display-info").append("<h3><b>" + (flag==2?row.nom_event:row.nom_reunion) + "</b></h3>");
            if (flag === 2 || row.date_reunion.length === 1) {
                $("#display-info").append("<p>" + date + "</p><br>");
                $("#display-info").append("<p>Reunion de " + heure + " : " + heure_fin + " </p>");
            } else {
                $("#display-info").append("<p>Horraires possibles : </p>");
                for (let i = 0; i < row.date_reunion.length; i++) {
                    if (flag==0) {
                        $("#display-info").append("<p>Le" + date + "," + row.heure[i] + "->" + row.heure_fin[i] + "</p>");
                    } else if(flag==1) {
                        $("#display-info").append("<button id=invit_" + i + ">Le" + row.date_reunion[i] + "," + row.heure[i] + "->" + row.heure_fin[i] + "</button>");
                        $("#invit_" + i).on('click', function () {
                            res = i;
                        });
                    }
                }
            }
            if(flag!==2){
                for (let participant of resultats.result) {
                    participants = participants + ", " + participant.mail;
                    if (participant.role_reunion === 2) {
                        createur = participant.mail;
                    }
                }
                participants = participants.substring(1);
                $("#display-info").append("<p><b>Le créateur de la reunion : " + createur + "</b></p>");
                $("#display-info").append("<p> Les participants :" + participants + "</p>");
            }
            

            $("#popup-overlay").css("display", "inline");//On affiche les display
            $("#modal").css("display", "inline");
            if (flag===1) {
                $("#display-info").append("<p>Voulez vous rejoindre la reunion</p>");
                $("#display-info").append("<label for=rejoindre>Oui</label>");
                $("#display-info").append("<input type=checkbox id=rejoindre>");
                $("#display-info").append("<label for=no_rejoindre>Non</label>");
                $("#display-info").append("<input type=checkbox id=no_rejoindre>");
                $("#rejoindre").on('change', function () {
                    $("#no_rejoindre").prop("checked", false);
                });
                $("#no_rejoindre").on('change', function () {
                    $("#rejoindre").prop("checked", false);
                });
            }
            $("#modalButton").on('click', function () {//Quitte l'affichage sans rien faire
                $("#display-info").empty();
                $("#popup-overlay").css("display", "none");
                $("#modal").css("display", "none");
                $("#update-res").css("display","none");
                $("#userType").css("display", "inline");
            });
            let flag_bool = false;
            $("#ajouterUtilisateur").on('click', function () { //Invite les utilisateurs a la reunion
                if (!flag_bool) {
                    $("#userType").css("display", "inline");
                    flag_bool = true;
                } else {
                    post_JSON("invit", { username: $("#mail_username").val(), id_reunion: row.id_reunion, nom_reunion: row.nom_reunion })
                        .then(res => {
                            if (!res.result) {
                                errorMessage("display-info", "Erreur mail pas envoyez");
                            } else {//On update la liste des participants
                                viewReunion(mail, row,0);
                            }
                        })
                    $("#mail_username").val("");//On vide la valeur
                }
            });

            $("#conf-quittez").on('click', function () {
                post_JSON("quittez-reunion", { mail: mail, id_reunion: row.id_reunion, createur: createur })
                    .then(function (res) {
                        $("#modal-conf").css("display", "none");
                        $("#popup-overlay").css("display", "none");
                        $("#userType").css("display", "inline");

                    });
                updateDisplayReunion(getCookie("mail"));
            });

            $("#update-res").on('click', function () {
                post_JSON('updateProposition', { id_reunion: row.id_reunion, horraire: res, 
                    accepted: $("#rejoindre").is(":checked"), mail: getCookie("mail") });
                res = -1;
            });
        });
}

export function post_JSON(url, json_to_send) {
    return $.post("http://localhost:8080/" + url, json_to_send);
}

export function get_JSON(url) {
    return $.get("http://localhost:8080/" + url);
}

export function setCookie(name, value) {
    document.cookie = name + "=" + value + "; path=/";
}

export function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
        const [nom, valeur] = cookie.split("=");
        if (nom == name) return valeur;
    }
    return undefined;
}

export function removeCookie(name) {
    document.cookie = name + "=0; expires=Sat, 01 Jan 2000 00:00:00 UTC; path=/;";
}

let id_error = 0;

export function setIdError(new_value) {
    id_error = new_value;
}

export function errorMessage(zone,text){
    userMessage(zone, text, "red");
}

export function userMessage(zone, text, color){
    $(zone).append("<p style='font-size:larger;font-weight:bold; color:"+color+"' id=errorMessage"+id_error+">"+text+"</p>");
    let erreur = id_error;
    id_error++;
    setTimeout(() => {
        $("#errorMessage" + erreur).fadeOut(1000, function () {
            $(this).remove();
        });
    }, 3000);
}


export function updateUser() {
    updateDisplayReunion(getCookie("mail"));
    updateEventInCalendar(true);
    if (getCookie("id") != undefined){ // si l'user est connecté
        $("#loginButton").css("display", "none");
        $("#disconnectButton").css("display", "block");
        $("#Create_reunion").css("visibility", "visible");
    } else {
        $("#disconnectButton").css("display", "none");
        $("#loginButton").css("display", "block");
        $("#Create_reunion").css("visibility", "hidden");
    }
}


var nbr_event_possible_visuellement = 5;

// Affichage des évènements dans le calendrier, si force=true on skip les vérifications de l'utilisateur 
export async function updateEventInCalendar(force=false){
    if (getCookie("id") == undefined && !force){
        setTimeout(updateEventInCalendar, 10000);
        return;
    }

    updateDisplayReunion(getCookie("mail"));

    post_JSON("getReunion", {mail: getCookie("mail")})
    .then(function(resultat) {
        $(".event").empty();
        updateViewCalendar(resultat,true);
        updateViewCalendar(resultat,false);
        updateDisplayReunion(getCookie("mail"));
        if (force==false) setTimeout(updateEventInCalendar, 20000);
    });
}

function updateViewCalendar(resultat,flag){
    let rows = flag ? resultat.res_personnal.rows : resultat.result.rows ;
    for (let row of rows){
        for (let i=0; i<(flag?1:row.date_reunion.length); i++){ 
            let date = flag ? new Date(row.date_event.substring(0,10).replaceAll("-",","))
             : new Date(row.date_reunion[i].substring(0,10).replaceAll("-",","));
            let heure = flag ? row.heure : row.heure[i];
            let id = flag ? row.id_event : row.id_reunion;
            let nom = flag ? row.nom_event : row.nom_reunion;
            date.setDate(date.getDate()+1) // je ne sais pas pourquoi la base de donnée renvoie une date avec le jour -1
            let borne_min = new Date(new Number($(".agenda-case").first().attr("id")));
            let borne_max = new Date(new Number($(".agenda-case").last().attr("id")));
            if (date >= borne_min && date <= borne_max){
                let calendar_case = $("#"+date.getTime());
                if (calendar_case.find(".event").length <= nbr_event_possible_visuellement){
                    let luminescance = 0.299 * row.red + 0.587 * row.green + 0.114 * row.blue;
                    calendar_case.find(".event").append("<a href='' id='reu-n"+ id + "h" +(heure.replaceAll(":","W")) +
                     "' class='event_unit' style='color:"+ (luminescance > 128 ? "black" : "white") +
                     ";background-color:rgb("+row.red+","+row.green+","+row.blue+")'>"+ nom +"</a>");
                    $("#reu-n"+id+"h"+(heure.replaceAll(":","W"))).on("click", function() {
                        console.log($(this));
                        viewReunion(getCookie("mail"), row,flag?2:0);
                        return false; // empeche la redirection du lien
                    });                    
                }
            }
        }
    }
}