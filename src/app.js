const express = require("express");
const path = require("path");
const nodemailer = require('nodemailer');
const app = express();
const port = 8080;
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,'public')));

app.use(express.static('image'));   
app.use(express.json());

app.set("view engine","ejs");
app.set('views',path.join(__dirname,'views'));

var operation_reunion = 0; // sera incrémenter à chaque opération faites sur les réunions EST TRES IMPORTANT POUR ECONOMISER LES REQUETES A LA BDD 
 

 

const pg = require('pg');
   let transporter = nodemailer.createTransport({
        host : 'smtp.gmail.com', 
        port : 465 ,
        secure : true , 
        auth:{
            user : process.env.MAIL ,
            pass : process.env.PASS
        }
    });

const pool = new pg.Pool({
    user : process.env.USER , 
    host : process.env.HOST ,
    database : process.env.DATABASE ,
    password : process.env.PASSWORD ,
    port : process.env.PORT
});
/**
 * 
 * @param {*} requete La requete a realise
 * @param {*} username le nom de l'tutlisateur
 * @param {*} motdepasse le mots de passe de l'utilisateur
 * @param {*} mode Le mode de connexion 0 pour la connexion , 1 inscription , 2 mdp oublie
 * @returns Renvoie un entier > 0 si la connexion c'est bien passe
 */
async function operations(username,motdepasse,mail,mode) {
    const client = await pool.connect();
    let res = await client.query ("select * from utilisateur where username='"+username+"'");
    let flag = false;
    for(row of res.rows){
        if(row.mot_de_passe===motdepasse&&mode==0){//Le client est valide
            client.release();
            return row.id;
        }else if (mode===1){
            client.release();
            return -1;//Deja un utilisateur avec le meme pseudo
        }else if(mode===2){
            res = await client.query("update utilisateur set mot_de_passe = $1 where username=$2",[motdepasse,username]);
            client.release();
            return row;
        }
        flag = true;
    }
    if(mode===1){//Tentative d'inscription et aucun utilisateur qui a le meme pseudo 
        await client.query("Insert into utilisateur values ($1,$2,$3)",[username,mail,motdepasse]);
        let res = await client.query("select id from utilisateur where username=$1 and mot_de_passe=$2", [username, motdepasse]);
        if (res.length == 0){
            console.log("impossible d'ajouter l'utilisateur dans la base de donnée");
            return -2;
        }
        client.release();
        return res[0];//L'utilisateur est bien ajouté
    }
    client.release();
    if(flag) return -2;//Pas le bon mdp
    else return -1;//Pas ton nom d'utilisateur
}
/**
 * Creer la reunion et ajoute le createur a la table des participants
 * @param {*} reunion_nom le nom de la reunion
 * @param {*} username le nom du createur de la reunion
 * @param {*} date_reunion la date de la reunion
 * @returns 
 */
async function addReunion(req){
    try {
        const reunion_nom = req.body.nom_reunion;
        const username = req.body.username;
        let tab_heure = [],tab_heure_fin = [],date  = [];
        let red=req.body.red, blue=req.body.blue, green=req.body.green;
        let descr = req.body.description; 

        console.log(req.body.creneau);

        for(let i =0;i<req.body.creneau.length;i++){
            date[i] = req.body.creneau[i][0].d;
            console.log("date"+date[i]);
            tab_heure[i]=req.body.creneau[i][0].h+":"+req.body.creneau[i][0].m+":00";
            console.log("heure"+tab_heure[i]);
            tab_heure_fin[i]=req.body.creneau[i][1].h+":"+req.body.creneau[i][1].m+":00";
            console.log("heure fin"+tab_heure_fin[i]);
        }
        const client = await pool.connect();
        let tab = [tab_heure,reunion_nom,username,date,tab_heure_fin, red, blue, green, descr];
        let requete = "select id_reunion from reunion where heure=$1 and nom_reunion=$2 and creator_username=$3 and date_reunion=$4";
        await client.query("insert into reunion (heure,nom_reunion, creator_username, date_reunion,heure_fin, red, blue, green, descr) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)",tab);
        let id = await client.query(requete,[tab_heure,reunion_nom,username,date]);//Pas 2 reunion qui peuvent commencer au meme horraire
        await client.query("insert into participe values ($1,$2,$3)",[id.rows[0].id_reunion,username,2]);
        if(req.body.participe){
            await client.query("insert into participe values ($1,$2,$3)",[id.rows[0].id_reunion,req.body.mail,2]);
        }
        client.release();
        console.log("ajout d'une réunion !");
        return id.rows[0].id_reunion;
    } catch (err) {
        console.error(err);
        return null;
    }
}

/**
 * Renvoie les info de toutes les reunion ou l'utilisateur est invité / participe
 * @param {*} mail
 * @returns 
 */
async function getReunion(mail){
    const client = await pool.connect();
    let requete = "select reunion.* from reunion join participe on participe.id_reunion = reunion.id_reunion"
    +" where participe.mail=$1";
    let res = await client.query(requete,[mail]);
    let res_invit = await client.query("select reunion.* from reunion join invite on invite.id_reunion=reunion.id_reunion where invite.mail=$1",[mail]);
    client.release();
    return [res,res_invit];
}



/**
 * Verifie si la reunion peut bien etre ajouté
 * @param {*} username 
 * @param {*} date 
 * @param {*} heure 
 * @param {*} heure_fin 
 * @returns 
 */
async function checkReunion(mail,creneau_list){
    const client = await pool.connect();
    let list_result = [];
    for(let ind =0;ind<creneau_list.length;ind++){
        let res = await client.query("select reunion.heure_fin , reunion.heure from reunion join participe on participe.id_reunion = reunion.id_reunion where participe.mail=$1 and reunion.date_reunion=$2",[mail,[creneau_list[ind][0].d]]);
        var heure = creneau_list[ind][0];
        var heure_fin = creneau_list[ind][1];
        var heureMin = parseInt(heure.h) * 60 + parseInt(heure.m);
        var heureMax = parseInt(heure_fin.h) * 60 + parseInt(heure_fin.m);
        var flag = true;
        console.log("Heure reunion :"+heureMin+"le temps max "+heureMax);
        for(let row of res.rows){
            let tmpTab = row.heure;
            let tmpTabFin = row.heure_fin;
            let tmpMin = parseInt(tmpTab.h) * 60 + parseInt(tmpTab.m);
            let tmpMax = parseInt(tmpTabFin.h) * 60 + parseInt(tmpTab.m);
            if((tmpMin < heureMin && tmpMax < heureMin)||(tmpMax >heureMax && tmpMin > heureMax)||
            (heureMin < tmpMin && heureMax < tmpMin)||(heureMax>tmpMax && heureMin >tmpMax)){
                continue;
            }
            flag = false;
            break;
        }
        list_result.push(flag);
    }
    client.release();
    return list_result;
}

async function supParticipation(mail,id_reunion,createur){
    const client = await pool.connect();
    let res = await client.query("select role_reunion from participe where mail=$1",[mail]);
    if(res.rows[0]!==undefined && res.rows[0].role_reunion === 2){//IL faut supprimer la reunion directement
        client.query("delete from reunion where id_reunion=$1",[id_reunion]);
    }else{
        client.query("delete from participe where id_reunion=$1 and mail =$2",[id_reunion,mail]);
    }
    client.release();
}
/**
 * Renvoie toutes les info de l'utilisateur 
 * @param {*} id L'id de l'utilisateur a recupere
 * @returns Toutes les info
 */
async function getInfoUser(id){
    const client = await pool.connect();
    let res= await client.query("select * from utilisateur where id=$1",[id]);
    client.release();
    return res.rows[0];
}

async function getInfoReunion(id_reunion){
    const client = await pool.connect();
    let res = await client.query("select role_reunion,mail from participe where id_reunion=$1",[id_reunion]);
    client.release();
    return res;
}

async function invitReunion(username,id,nom_reunion,remove) {
    const client = await pool.connect();
    let adresse_mail = "";
    if(!username.includes("@")){
        let res = await client.query("select mail from utilisateur where username=$1",username);
        if(res.rows!==undefined){
            adresse_mail = res.rows[0].mail;
        }else{
            return false;
        }
    }else{
        adresse_mail = username;
    }
    if(remove){await client.query("delete from invite where mail=$1",[adresse_mail]);}
    else{await client.query("insert into invite values($1,$2)",[id,adresse_mail]);}
    client.release();
    
    return await mail(process.env.MAIL,adresse_mail,
        "Invitation pour une reunion",
        "Bonjours vous etes invitez , voulez vous joindre a la reunion "
        +nom_reunion+" ? http://localhost:8080/invit/"+id+"/"+username)!==undefined;
}

//"Bonjours vous etes invitez , voulez vous joindre a la reunion "+nom_reunion+" ? http://localhost/8080/invit/"+id+"/"+username 
async function mail(from,to,subject,text){
    return info = transporter.sendMail({
        from : from , 
        to : to ,
        subject : subject , 
        text : text,
    });
}
async function reunion(id_reunion){
    console.log("L'id _reunion"+id_reunion);
    const client = await pool.connect();
    let res = await client.query("select * from reunion where id_reunion=$1",[id_reunion]);
    console.log("Le resultats de la requete"+res.rows);
    client.release();
    return res;
}

async function exists(username){
    const client = await pool.connect();
    let res = await client.query("select * from utilisateur where username=$1",[username]);
    let flag = !(res.rows===undefined || res.rows[0]===undefined);
    client.release();
    return flag;
}
/**
 * Ajoute tout les utilisateur de la reunion
 * @param {*} req 
 */
async function importReunion(req){
    let id =0 ;
    if(!exists(req.body.organisateur)||!checkReunion(req.body.organisateur,req.body.date_debut,req.body.heure_debut,req.body.heure_fin)){
        console.log("PAS PASSE CHECK REUNION//reunion déja ajouté");
        return 2;
    }
    await addReunion(req).then(result=>id=result).catch(err=>{console.log("Reunion déja ajouté erreur : "+err.stack);id=-1;});
    if(id===-1) return 1;
    const client = await pool.connect();
    for(let participant_addr of req.body.invites){
        let res = await client.query("select username from utilisateur where mail=$1",[participant_addr]);
        let pseudo = "";
        if(res.rows[0]!==undefined){
            pseudo = res.rows[0].username;
            //Normalement c'est pas possible sinon la reunion aurait déja été ajouté
            
        }else{
            console.log("ENVOIE D'UNE REQUETE");
            pseudo = participant_addr.split("@")[0];
            console.log("Le nouveau pseudo :"+pseudo);
            await client.query("insert into utilisateur(username,mail) values ($1,$2)",[pseudo,participant_addr]);
        }
        console.log("Le pseudo : "+pseudo+" id : "+id);
        //await client.query("insert into participe values ($1,$2,0)",[id,pseudo]);
    }
    return 0;
}
/**
 * Supprime l'utilisateur de la table invit et l'ajoute a la table participe si il la souhaite
 * @param {*} reponse 
 * @param {*} mail 
 * @param {*} id_reunion 
 */
async function resInvit(reponse,mail,id_reunion,horraire){
    const client = await pool.connect();
    client.query("delete from invite where id_reunion=$1 and mail=$2",[id_reunion,mail]);
    if(reponse){
        client.query("insert into participe values($1,$2,0)",[id_reunion,mail,horraire]); 
    }
    operation_reunion++;
}
/**
 * Verifie que l'utilisateur a bien été invité a la reunion id_reunion
 * @param {*} id_reunion 
 * @param {*} mail 
 * @returns 
 */
async function checkInvit(id_reunion,mail){
    const client = await pool.connect();
    console.log("L'id reunion"+id_reunion+"Le mail : "+mail);
    let res = await client.query("select * from invite where id_reunion=$1 and mail=$2",[id_reunion,mail]);
    client.release();
    return res.rows[0]!==undefined;
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post("/inscription",(req,res)=>{
    operations(req.body.username,req.body.password,req.body.mail,1)
    .then(resultats =>{
        if(resultats>0){
            res.json({ result: true, id: resultats });
        }else if(resultats == -1){
            res.json({result: false, message: "Erreur nom d'utilisateur deja utilisé", id: -1});
        }else{
            res.json({result: false, message: "erreur ", id: -1});
        }})
    .catch(erreur =>console.log(erreur.stack));
});

app.post("/login",(req,res)=>{
    operations(req.body.username,req.body.password,req.body.mail,0)
    .then(resultats =>{
        if(resultats>0){
            getInfoUser(resultats).then(result=>{
                console.log("Coucou "+result.mail);
                res.json({connecte:true, message:"connecté!", id:resultats,mail:result.mail});}
            );
        }else if(resultats == -1){
            res.json({connecte:false, message:"nom d'utilisateur inconnu!", id:-1});
        }else if(resultats == -2){
            res.json({connecte:false, message:"mot de passe incorrect", id: -1});
        } else {
            res.json({connecte:false, message:"erreur inconnue", id:-1});
        }
    })
    .catch(erreur =>console.log(erreur.stack));
});

app.post("/mdpOublie",(req,res)=>{
    operations(req.body.username,req.body.username,2)
    .then(resultats =>{
        if (resultats < 0) {
            res.json({result: false, message: "Erreur: utilisateur introuvable!"});
        }else{
            mail(process.env.MAIL,resultats.mail,"Reinitialisation Mot de passe",
                "Cliquez sur ce lien pour reinitialisez votre mot de passe : http://localhost:8080/mdp/"+req.body.username);
            res.json({result: true});
        }
    })
    .catch(erreur =>console.log(erreur.stack));
});

app.post('/creation',async (req,res)=>{
        console.log("Les reunion restantes : "+req.body.creneau);
        addReunion(req).then(result=>res.json({result: true})).catch(err=>{console.log(err);res.json({result:false});});
});

app.post('/getReunion',(req,res)=>{
    getReunion(req.body.mail)
    .then(result=>res.json({result: result[0],result_invit:result[1]}))
    .catch(error =>{console.log("Erreur ..."+error);res.json({result:"Erreur de mail"});});
});
app.post('/getInfo',(req,res)=>{ //En gros envoyez via res.json toutes les reunion auquels l'utilisateur peut accepter de participer
    getInfoReunion(req.body.id_reunion)
    .then(result=>res.json({result: result}))
    .catch(err=>{res.json({result: err});console.log(err.stack);});
});

app.post('/quittez-reunion',(req,res)=>{
    operation_reunion++;    
    supParticipation(req.body.mail,req.body.id_reunion,req.body.createur);
    res.json({result: true});//On envoie pour confirmer ca a bien été enregistré
});

app.post('/invit',(req,res)=>{
    invitReunion(req.body.username,req.body.id_reunion,req.body.nom_reunion)
    .then(result=>{console.log("L'envoie du mail c'est ...."+result);res.json({result: result});})
    .catch(err=>{console.log("Erreur mail :"+err);res.json({result: false});})
});
/**
 * Renvoie les différents horraires d'une reunion
 */
app.post('/horraireReunion',(req,res)=>{
    reunion(req.body.id_reunion).then(result=>
        res.json({heure:result.rows[0].heure,
            heure_fin:result.rows[0].heure_fin,
            date:result.rows[0].date}))
        .catch(err=>{console.log(err);res.json({err:err});});
});

app.post('/resultInvit',(req,res)=>{
    //TODO ajoutez le choix d'horraires 
    resInvit(req.body.reponse,req.body.mail,req.body.id_reunion,req.body.horraire)
    .then(result=>res.json({ok:true}))
    .catch(err=>{console.log(err);res.json({ok:false})});
});
/**
 * Renvoie les info de l'utilisateur
 */
app.post('/infoUser',(req,res)=>{
    console.log("Coucou tu a bien demandé les infos");
    getInfoUser(req.body.id)
    .then(result=>{console.log(result);res.json({result:result});})
    .catch(err=>{console.log(err);res.json({result:undefined})});
})

app.post('/importReunion',(req,res)=>{
    importReunion(req)
    .then(_result=>res.json({result: true}))
    .catch(error=>{console.log(error.stack);res.json({result: false});});
});

app.get('/invit/:index/:mail',(req,res)=>{//L'id de la reunion 
        checkInvit(req.params.index,req.params.mail).then(result=>{
            if (result){
                reunion(req.params.index).then(result=>{res.render("invit",{cons:result.rows[0]});
            });
            }else{
                res.render("erreur",{nom:req.params.mail});
            }
        });
    }
);
//recuperez toutes les info des reunion et supprimez les invit quand ils ont clique sur le bouton du fichier invit
app.get('mdp/:username',(req,res)=>{
    console.log("Bonjour "+req.params.username+"Le site est pas encore finis...");
});

app.get('/nbr_reu', (req, res)=>{
    res.json({result: operation_reunion});
});

app.listen(port);