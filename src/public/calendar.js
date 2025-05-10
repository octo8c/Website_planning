import { updateEventInCalendar } from "./utils.mjs";


$(document).ready(function(){
    $(window).on("resize", () => {
        if ($(window).width() < 800) {
            $(".jour-agenda").html("<li>Lun</li><li>Mar</li><li>Mer</li><li>Jeu</li><li>Ven</li><li>Sam</li><li>Dim</li>");
        } else {
            $(".jour-agenda").html("<li>Lundi</li><li>Mardi</li><li>Mercredi</li><li>Jeudi</li><li>Vendredi</li><li>Samedi</li><li>Dimanche</li>");
        }
    });

    $(window).trigger("resize");  // pour permettre aux écran nativement petit, et non redimensionné d'avoir les petite écritures

    var real_date = new Date(); real_date.setHours(0, 0, 0, 0)
    var date = new Date(real_date.getTime()); // date étant modifiée quand l'user passe au mois d'apres ou d'avant

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
        date.setHours(0,0,0,0);
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


        let value_of_first_day = first_day_of_the_first_week(date.getFullYear(), date.getMonth());
        let temp_d = new Date(date);
        temp_d.setDate(value_of_first_day - last_day_in_month(date.getFullYear(), date.getMonth()-1));

        if (value_of_first_day != 1){   
            for (let i=value_of_first_day; i<=last_day_in_month(date.getFullYear(), date.getMonth()-1); i++){ // start of the week from potentially the previous month
                $("#numero-jour").append("<li class='disabled agenda-case' id='"+ temp_d.getTime() +"'>"+ i +"<div class='event'> </div> </li>");
                temp_d.setDate(temp_d.getDate()+1);
            }
        }
        
        temp_d = new Date(date);
        for (let i=1; i<=last_day_in_month(date.getFullYear(), date.getMonth()); i++){
            temp_d.setDate(i);
            $("#numero-jour").append("<li class='agenda-case' id='"+ temp_d.getTime() +"'>"+i+"<div class='event'> </div> </li>");
        }

        let indice_jour=1;
        let totalDays = $("#numero-jour li").length;
        temp_d.setDate(temp_d.getDate()+1);
        while (totalDays % 7 !== 0) {
            $("#numero-jour").append('<li class="disabled agenda-case" id="'+ temp_d.getTime() +'">'+indice_jour+" <div class='event'> </div> </li>");
            temp_d.setDate(temp_d.getDate()+1);
            indice_jour++;
            totalDays++;
        }

        
    }

    function last_day_in_month(year, month){
        return new Date(year, month+1, 0).getDate();
    }



    function first_day_of_the_first_week(year, month){
        let date_temp = new Date(year, month, 1);
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

        // affichage quand on doubleclick sur un jour
        $(".agenda-case").on("dblclick", function () {
            let t_date = new Date(new Number($(this).attr("id")));
            //alert("a faire");   

            $("#Create_reunion").trigger("click"); // on trigger l'evenement création réunion
            $("#original_creneau .date_reunion").val(t_date.getFullYear()+"-"+add_zero(t_date.getMonth()+1)+"-"+add_zero(t_date.getDate()))
        });
        updateEventInCalendar(true);
    }


    
    updateEventInCalendar();
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