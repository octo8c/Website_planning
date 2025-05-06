$(document).ready(function () {

    let id_error = 0;
    let date=new Date();
    let nbr_creneau = 1;

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

    $("#Create_reunion").on('click',function(){
        $(".InfoReunion").css("visibility", "visible");
    });


    $("#closeReuButton").on("click", function(){
        // reset des values
        $(".date_heure").not("#original_creneau").prop("outerHTML", "")
        nbr_creneau = 1;
        $(".InfoReunion input[type='date']").val("");
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
            unite_temp = []; // liste a uniquement 2 élément normalement
            $(this).find(".selectionTime").each(function (){
                unite_temp.push({
                    "h" : $(this).find(".heure-reu").val(),
                    "m" : $(this).find(".minute-reu").val()
                });
            });
            heure_reunion.push(unite_temp);            
        });

        console.log(heure_reunion);

        if($("input#reunion_name").val().trim()===""){
            $("input#reunion_name").css("border","1px solid red");
            errorMessage(".InfoReunion","Erreur veuillez donnez un nom a la reunion");
        }else if(verif_validité_heure(heure_reunion)){

            $.post("http://localhost:8080/creation",
                {
                    nom_reunion : $("#reunion_name").val().trim(),
                    date_reunion : $("#date_reunion").val(),
                    username : "test" ,/*Jsp encore comment on vas recupere le nom de l'utilisateur qui c'est connecte encore*/
                    creneau : heure_reunion,
                    heure : $("#heure_reunion").val() , 
                    heure_fin : $("#heure_fin_reunion").val()
                },function(res){
                if(!res){//Message d'erreur 
                    errorMessage(".InfoReunion","Erreur vous aurez une autre reunion en cours a ce moment la");
                }
                updateDisplayReunion('test');//TODO METTRE LE NOM DE L'UTILISATEUR A LA PLACE
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
        new_creneau.find(".remove_creneau").css("display", "block");
        new_creneau.find(".number_creneau").html("Créneau "+nbr_creneau+" :");
        $("#container_date_heure").append(new_creneau.prop("outerHTML"));
        synchro_date(date);
    });

    function synchro_date(date_actuelle){
        $(".InfoReunion input[type='date']").each(function (){
            if ($(this).val() == "") $(this).val(date_actuelle.getFullYear()+"-"+add_zero(date_actuelle.getMonth())+"-"+add_zero(date_actuelle.getDate()));
            else console.log($(this).val());
        });
        $(".selectionTime select.heure-reu").val(add_zero(date_actuelle.getHours()));
        $(".selectionTime select.minute-reu").val(add_zero(date_actuelle.getMinutes() + (5 - (date_actuelle.getMinutes() % 5)))); 
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