const express = require("express");
const path = require("path");
const nodemailer = require('nodemailer');
const app = express();
const port = 8080;
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('image'));   
app.use(express.json());
app.set("view engine","ejs");

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
            res = await client.query("update utilisateur set mot_de_passe = "+motdepasse+"where username="+username);
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
    const reunion_nom = req.body.nom_reunion;
    const username = req.body.username;
    var tab_heure = [],tab_heure_fin = [],date  = [];
    console.log(req.body.creneau);
    for(let i =0;i<req.body.creneau.length;i++){
        date [i] = req.body.creneau[i][0].d;
        tab_heure[i]=req.body.creneau[i][0].h+":"+req.body.creneau[i][0].m+":00";
        tab_heure_fin[i]=req.body.creneau[i][1].h+":"+req.body.creneau[i][1].m+":00";
    }
    console.log("Le tableau d'heure : "+tab_heure)
    const client = await pool.connect();
    let tab = [tab_heure,reunion_nom,username,date,tab_heure_fin];
    let requete = "select id_reunion from reunion where heure=$1 and nom_reunion=$2 and creator_username=$3 and date_reunion=$4";
    console.log(tab);
    await client.query("insert into reunion (heure,nom_reunion, creator_username, date_reunion,heure_fin) values ($1,$2,$3,$4,$5)",tab);
    let id = await client.query(requete,[tab_heure,reunion_nom,username,date]);//Pas 2 reunion qui peuvent commencer au meme horraire
    if(req.body.participe){
        await client.query("insert into participe values ($1,$2,$3)",[id.rows[0].id_reunion,req.body.mail,2]);
    }
    client.release();
    return id.rows[0].id_reunion;
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
    let res_invit = await client.query("select reunion.* from reunion join invite on invite.id_reunion=reunion.id_reunion join utilisateur on utilisateur.mail =invite.mail where utilisateur.id=$1");
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

async function supParticipation(username,id_reunion,createur){
    const client = await pool.connect();
    if(createur === username){//IL faut supprimer la reunion directement
        client.query("delete from reunion where id_reunion=$1",[id_reunion]);
    }else{
        client.query("delete from participe where id_reunion=$1 and username =$2",[id_reunion,username]);
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
    return res;
}

async function getInfoReunion(id_reunion){
    const client = await pool.connect();
    let res = await client.query("select role_reunion,username from participe where id_reunion=$1",[id_reunion]);
    client.release();
    return res;
}

async function invitReunion(username,inviter,id,nom_reunion,remove) {
    const client = await pool.connect();
    let mail = "";
    let flag = false;
    if(!username.includes("@")){
        let res = await client.query("select mail from utilisateur where username=$1",username);
        if(res.rows!==undefined){
            mail = res.rows[0].mail;
        }else{
            return false;
        }
    }else{
        mail = username;
    }
    if(remove){await client.query("delete from invite where mail=$1",[mail]);}
    else{await client.query("insert into invite values($1,$2)",[id,mail]);}
    client.release();
    return flag && (await mail("webprojetprogramation@gmail.com",mail,
        "Invitation pour une reunion",
        "Bonjours vous etes invitez , voulez vous joindre a la reunion "
        +nom_reunion+" ? http://localhost/8080/invit/"+id+"/"+username))!==undefined;
}

async function mail(from,to,subject,text){
    return info = transporter.sendMail({
        from : "webprojetprogramation@gmail.com" , 
        to : mail ,
        subject : "Invitation pour une reunion" , 
        text : "Bonjours vous etes invitez , voulez vous joindre a la reunion "+nom_reunion+" ? http://localhost/8080/invit/"+id+"/"+username ,
    });
}
async function reunion(id_reunion){
    const client = await pool.connect();
    let res = client.query("select * from reunion where id_reunion=$1",[id_reunion]);
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
    console.log(req.body.invites);
    await addReunion(req).then(result=>id=result).catch(err=>{console.log("Reunion déja ajouté erreur : "+err.stack);id=-1;});
    if(id===-1) return 1;
    const client = await pool.connect();
    for(let participant_addr of req.body.invites){
        console.log(participant_addr);
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
async function resInvit(reponse,mail,id_reunion){
    const client = await pool.connect();
    client.query("delete from invite where id_reunion=$1 and mail=$2",[id_reunion,mail]);
    if(reponse){
        client.query("insert into participe values($1,$2)",[id_reunion,mail,0]); 
    }
}
/**
 * Verifie que l'utilisateur a bien été invité a la reunion id_reunion
 * @param {*} id_reunion 
 * @param {*} mail 
 * @returns 
 */
async function checkInvit(id_reunion,mail){
    const client = await pool.connect();
    let res = await client.query("select * from invit where id_reunion=$2 and mail=$1");
    client.release();
    return res.rows[0]===undefined;
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
            getInfoUser(resultats).then(result=>
                res.json({connecte:true, message:"connecté!", id:resultats,info:result.rows[0]})
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
            //TODO ENVOYEZ UN MAIL POUR REINIALISEZ LE MDP (en gros un mail avec un lien localhost:8080/username/newMDP)
            res.json({result: true});
        }
    })
    .catch(erreur =>console.log(erreur.stack));
});

app.post('/creation',async (req,res)=>{
    checkReunion(req.body.username,req.body.creneau)
    .then(result=>{
        for(let i=0;i<result.length;i++){
            if(!result[i]){
                req.body.creneau.splice(i,1);//On retire tout les horraires qui ne sont pas possibles
            }
        }
        console.log("Les reunion restantes : "+req.body.creneau);
        addReunion(req);
        res.json({result: result});
    })
    .catch(err=>{res.json({result : [false]});console.log(err);});
});

app.post('/getReunion',(req,res)=>{
    getReunion(req.body.mail)
    .then(result=>res.json({result: result}))
    .catch(error =>{console.log("Erreur ..."+error);res.json({result:"Erreur d'username"});});
});
app.post('/getInfo',(req,res)=>{ //En gros envoyez via res.json toutes les reunion auquels l'utilisateur peut accepter de participer
    getInfoReunion(req.body.id_reunion)
    .then(result=>res.json({result: result}))
    .catch(err=>{res.json({result: err});console.log(err.stack);});
});

app.post('/quittez-reunion',(req,res)=>{
    supParticipation(req.body.username,req.body.id_reunion,req.body.createur);
    res.json({result: true});//On envoie pour confirmer ca a bien été enregistré
});

app.post('/invit',(req,res)=>{
    invitReunion(req.body.username,req.body.inviter,req.body.id,req.body.nom_reunion)
    .then(result=>res.json({result: result}))
    .catch(err=>{console.log("Erreur mail :"+err);res.json({result: false});})
});

app.post('/horraireReunion',(req,res)=>{
    reunion(req.body.id_reunion).then(result=>
        res.json({heure:result.rows[0].heure,
            heure_fin:result.rows[0].heure_fin,
            date:result.rows[0].date}))
        .catch(err=>{console.log(err);res.json({err:err});});
});

app.post('/resultInvit',(req,res)=>{
    resInvit(req.body.reponse,req.body.mail,req.body.id_reunion)
    .then(result=>res.json({ok:true}))
    .catch(err=>{console.log(err);res.json({ok:false})});
});
/**
 * Renvoie les info de l'utilisateur
 */
app.post('/infoUser',(req,res)=>{
    getInfoUser(req.body.id)
    .then(result=>res.json({requete:result}))
    .catch(err=>{console.log(err);res.json({requete:undefined})});
})

app.post('/importReunion',(req,res)=>{
    importReunion(req)
    .then(_result=>res.json({result: true}))
    .catch(error=>{console.log(error.stack);res.json({result: false});});
});

app.get('/invit/:index/:mail',(req,res)=>{//L'id de la reunion 
    checkInvit(req.params.index,req.params.mail).then(result=>{
        if (result){
            res.render("invit",{cons:reunion(req.params.index)});
            res.sendFile(path.join(__dirname,'public/views/invit.ejs'));
        }else{
            res.render("erreur",{nom:req.params.mail});
            res.sendFile(path.join(__dirname,'public/views/erreur.html'));
        }
    });
});
//recuperez toutes les info des reunion et supprimez les invit quand ils ont clique sur le bouton du fichier invit
app.get('mdp/:username',(req,res)=>{
    console.log("Bonjour "+req.params.username+"Le site est pas encore finis...");
});

app.listen(port);