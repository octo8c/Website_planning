import { updateDisplayReunion, post_JSON, errorMessage, getCookie } from "./utils.mjs";

$(document).ready(function () {

    let date=new Date();
    let nbr_creneau = 1;

    

    $("#Create_reunion").on('click',function(){
        $(".InfoReunion").css("visibility", "visible");
    });


    $("#closeReuButton").on("click", function(){
        // reset des values
        $(".date_heure").not("#original_creneau").prop("outerHTML", "")
        nbr_creneau = 1;
        $(".InfoReunion input[type='date']").val("");
        $(".InfoReunion").find("*").removeAttr("traiter");
        synchro_date(date);
        $(".InfoReunion").css("visibility", "hidden");
    }); 


    function verif_validité_heure(tab_heure){
        for (let i=0; i<tab_heure.length; i++){
            if (tab_heure[i][0].h > tab_heure[i][1].h || (tab_heure[i][0].h == tab_heure[i][1].h && tab_heure[i][0].m > tab_heure[i][1].m)){ // si l'heure de début de réunion est plus grande que l'heure de fin, pareil pour les minutes si les heures sont égales 
                return false;
            }
        }
        return true
    }

    $("button#create").on('click',function(){
        let heure_reunion = []; // liste de liste, chaque sous liste est un créneau contenant donc 2 objet heure (objet heure = {h:1, m:1})

        // récupération des heures de chaques créneaux
        $(".date_heure").each(function () {
            let unite_temp = []; // liste a uniquement 2 élément normalement
            let date = $(this).find(".date_reunion").val();
            $(this).find(".selectionTime").each(function (){
                unite_temp.push({
                    "h" : $(this).find(".heure-reu").val(),
                    "m" : $(this).find(".minute-reu").val() ,
                    "d" : date
                });
            });
            heure_reunion.push(unite_temp);            
        });


        if($("input#reunion_name").val().trim()===""){
            $("input#reunion_name").css("border","1px solid red");
            errorMessage(".InfoReunion","Erreur,veuillez donnez un nom a la reunion");
        }else if(verif_validité_heure(heure_reunion)){
            post_JSON("creation", {
                    nom_reunion : $("#reunion_name").val().trim(),
                    username : getCookie("username"),/*Jsp encore comment on vas recupere le nom de l'utilisateur qui c'est connecte encore*/
                    creneau : heure_reunion
            })
            .then(function(result){
                console.log(result);
                let resu = result.result;
                for(let i=0;i<resu.length;i++){
                    if(!resu[i]){//Message d'erreur 
                        errorMessage(".InfoReunion",
                        "Erreur vous aurez une autre reunion en cours au creneau "+i+heure_reunion[i].d+","
                        +heure_reunion[i][0].h+":"+heure_reunion[i][0].m+"->"
                        +heure_reunion[i][1].h+":"+heure_reunion[i][1].m);
                    }
                }
                updateDisplayReunion(getCookie("username"));//TODO METTRE LE NOM DE L'UTILISATEUR A LA PLACE
                $("#closeReuButton").click();
            });
        }else{
            errorMessage(".InfoReunion","Mettez une heure de debut inférieur a l'heure de fin");
        }
    });


    /**
     * 
     * @param {*} date determine if we have to add a zero to correctly print the value
     * @returns the value with or without a zero
     */
    function add_zero(date){
        if (date<10){
            return "0"+date;
        } else {
            return date;
        }
    }

    // regle pour direct mettre la date et l'heure a la date et l'heure actuelle dans les champs creer reunion 
    synchro_date(date);

    $("#create_creneau").on("click", ()=>{
        nbr_creneau++;
        let new_creneau = $("#original_creneau").clone();
        new_creneau.removeAttr("id");
        new_creneau.find("*").removeAttr("traiter");
        new_creneau.find(".remove_creneau").css("display", "block");
        new_creneau.find(".number_creneau").html("Créneau "+nbr_creneau+" :");
        $("#container_date_heure").append(new_creneau.prop("outerHTML"));
        synchro_date(date);
    });

    function synchro_date(date_actuelle){
        $(".InfoReunion input[type='date']").each(function (){
            if ($(this).attr("traiter") != "true"){
                $(this).val(date_actuelle.getFullYear()+"-"+add_zero(date_actuelle.getMonth())+"-"+add_zero(date_actuelle.getDate()));
                $(this).attr("traiter", "true");
            }
            else console.log($(this).val());
        });

        $(".selectionTime select.minute-reu").each(function (){
            if ($(this).attr("traiter") != "true"){
                $(this).val(add_zero(date_actuelle.getMinutes() + (5 - (date_actuelle.getMinutes() % 5)))); 
                $(this).attr("traiter", "true");
            }
        });
        $(".selectionTime select.heure-reu").each(function (){
            if ($(this).attr("traiter") != "true"){
                $(this).val(add_zero(date_actuelle.getHours()));
                $(this).attr("traiter", "true");
            }
        });
    }

    $("#container_date_heure").on("click", ".remove_creneau" ,function (){
        $(this).parent().remove();
        nbr_creneau--;
        update_number();
    }); 

    function update_number(){
        let temp = 1;
        $(".date_heure").each(function () {
            $(this).find("p").html("Créneau " + temp + " :");
            temp++;
        });
    }
    
});