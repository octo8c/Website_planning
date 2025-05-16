import { getCookie, post_JSON, removeCookie, updateUser } from "./utils.mjs";

$(document).ready(function(){

    updateUser();

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
        const fileReader = new FileReader();
        fileReader.onload = function(e){
            var lines = e.target.result.split("\n");
            var tab = [];
            let attendees = [];
            let ind = 0;
            lines.forEach(element => {
                if(element.substring(0,6)==="BEGIN:"){
                    tab = [];
                    attendees = [];
                    ind = 0;
                }else if (element.substring(0,8)==="DTSTART:"){
                    tab[0]=construct_date(element.split(":")[1]);
                    tab[2]=construct_time(element.split("T")[4]);
                }else if(element.substring(0,6)==="DTEND:"){
                    tab[1]=construct_date(element.split(":")[1]);
                    tab[3]=construct_time(element.split("T")[2]);
                }else if (element.substring(0,8)==="SUMMARY:"){
                    tab[4] = element.split("SUMMARY:")[1];
                }else if (element.substring(0,12)==="DESCRIPTION:"){
                    tab[5] = element.split("DESCRIPTION:")[1];
                }else if (element.substring(0,9)==="LOCATION:"){
                    tab[7] = element.split(":")[1];
                }else if (element.substring(0,9)==="ORGANIZER"){
                    tab[6]=element.split("CN=")[1].split(":")[0];//On suppose qu'on 
                }else if (element.substring(0,9)==="ATTENDEE;"){
                    attendees[ind] =element.split("MAILTO:")[1];
                    ind++;
                }else if (element.substring(0,4)==="END:"){
                    if(element.substring(4)==="VEVENT"){
                        post_JSON('importReunion',{
                            date_debut : tab[0] ,
                            date_fin : tab[1] , 
                            heure_debut : tab[2] ,
                            heure_fin : tab[3] , 
                            nom_reunion : tab[4] ,
                            descr : tab[5] , 
                            organisateur : tab[6] ,
                            invites : attendees
                        })
                        .then(function(res){
                            if(!res.result){
                                errorMessage("#InfoReunion","Erreur fichier au mauvais format");
                            }else{
                                updateUser();
                            }
                        });
                    }
                }
        });
        }
        fileReader.readAsText(this.files[0],'UTF-8');
    });


    // regle pour ajouter un input de selection d'heure et de minute personnalisé dès le début de la page ! A GARDER
    $(".selectionTime").append($("#selection-heure-reu").html());
    // on enleve le hidden
    $(".selectionTime").css("display : block");
    $(".selectionTime").find("*").removeAttr("hidden");

    // on enleve l'ID de l'element pour eviter des doublons d'ID
    $(".selectionTime").find("*").removeAttr("id");
    
    // on retire la class de l'élément précédent car inutile
    $("#selection-heure-reu .heure-reu").removeClass("heure-reu");
    $("#selection-heure-reu .minute-reu").removeClass("minute-reu");


    $("#disconnectButton").on("click", function (){
        removeCookie("id");
        removeCookie("username");
        removeCookie("mail");
        updateUser();
    });




});
