const express = require("express");
const path = require("path");
const app = express();
const port = 8080;
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('image'));   

const pg = require('pg');

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
 * @returns Renvoie si la connexion c'est bien passe
 */
async function operations(requete,username,motdepasse,mail,mode) {
    const client = await pool.connect();
    let res = await client.query (requete);
    let flag = false;
    for(row of res.rows){
        if(row.mot_de_passe===motdepasse&&mode==0){//Le client est valide
            client.release();
            return 2;
        }else if (mode===1){
            client.release();
            return 0;//Deja un utilisateur avec le meme pseudo
        }else if(mode===2){
            res = await client.query("update utilisateur set mot_de_passe = "+motdepasse+"where username="+username);
            client.release();
            return 2;
        }
        flag = true;
    }
    if(mode===1){//Tentaive d'inscription et aucun utilisateur qui a le meme pseudo 
        client.query("Insert into utilisateur values ($1,$2,$3)",[username,mail,motdepasse]);
        let res = client.query("select * from utilisateur");
        client.release();
        return 1;//L'utilisateur est bien ajouté
    }
    client.release();
    if(flag) return 1;//Pas le bon mdp
    else return 0;//Pas ton nom d'utilisateur
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
    const date_reunion = req.body.date_reunion;
    const heure = req.body.heure;
    const heure_fin_reunion = req.body.heure_fin;
    const date_fin = req.body.date_fin;
    const descr = req.body.descr;
    const client = await pool.connect();
    let new_date = date_reunion.replaceAll("/","-");
    let new_date_fin = date_fin.replaceAll("/","-");
    let tab = [reunion_nom,descr,username,new_date,new_date_fin,heure+":00",heure_fin_reunion+":00"];
    let requete = "select id_reunion from reunion where heure=$1 and nom_reunion=$2 and creator_username=$3 and date_reunion=$4";
    await client.query("insert into reunion (nom_reunion,descr, creator_username, date_reunion,date_fin,heure,heure_fin) values ($1,$2,$3,$4,$5,$6,$7)",tab);
    let id = await client.query(requete,[heure,reunion_nom,username,date_reunion]);
    await client.query("insert into participe values ($1,$2,$3)",[id.rows[0].id_reunion,username,2]);
    client.release();
    return id;
}

async function getReunion(username){
    const client = await pool.connect();
    let requete = "select reunion.* from reunion join participe on participe.id_reunion = reunion.id_reunion"
    +" where participe.username=$1 and reunion.date_reunion >= CURRENT_DATE order by ABS(reunion.date_reunion - CURRENT_DATE),reunion.heure";
    let res = await client.query(requete,[username]);
    client.release();
    return res;
}

async function checkReunion(username,date,heure,heure_fin){
    const client = await pool.connect();
    let res = await client.query("select reunion.heure_fin , reunion.heure from reunion join participe on participe.id_reunion = reunion.id_reunion where participe.username=$1 and reunion.date_reunion=$2",[username,date]);
    client.release();
    var tab = heure.split(":");
    var tab_fin = heure_fin.split(":");
    var heureMin = parseInt(tab[0]) * 60 + parseInt(tab[1]);
    var heureMax = parseInt(tab_fin[0]) * 60 + parseInt(tab_fin[1]);
    var flag = true;
    for(let row of res.rows){
        let tmpTab = row.heure.split(":");
        let tmpTabFin = row.heure_fin.split(":");
        let tmpMin = parseInt(tmpTab[0]) * 60 + parseInt(tmpTab[1]);
        let tmpMax = parseInt(tmpTabFin[0]) * 60 + parseInt(tmpTabFin[1]);
        if((tmpMin < heureMin && tmpMax < heureMin)||(tmpMax >heureMax && tmpMin > heureMax)||
        (heureMin < tmpMin && heureMax < tmpMin)||(heureMax>tmpMax && heureMin >tmpMax)){
            continue;
        }
        flag = false;
        break;
    }
    return flag;
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

async function getInfoReunion(id_reunion){
    const client = await pool.connect();
    let res = await client.query("select role_reunion,username from participe where id_reunion=$1",[id_reunion]);
    return res;
}

async function invitReunion(username) {
    const client = await pool.connect();
    let mail = "";
    let flag = false;
    if(!username.contains("@")){
        let res = await client.query("select adresse_mail from utilisateur where username=$1",username);
        if(res.rows!==undefined){
            mail = res.rows[0].adresse_mail;
        }
    }else{
        mail = username;
    }
    //TODO FAIRE L'ENVOIE DE MAIL
    return flag;
}
/**
 * Ajoute tout les utilisateur de la reunion
 * @param {*} req 
 */
async function importReunion(req,id_reunion){
    let id = addReunion(req);
    const client = await pool.connect();
    for(let participant_addr of req.body.invites){
        let res = await client.query("select username from utilisateur where adresse_mail=$1",[participant_addr]);
        let pseudo = "";
        if(res.username!==undefined){
            pseudo = res.username;
        }else{
            let pseudo = participant_addr.split("@")[0];
            await client.query("insert into utilisateur(username,adresse_mail) values ($1,$2)",[pseudo,participant_addr]);
        }
        await client.query("insert into participe values ($1,$2,0)",[id,pseudo]);
    }
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post("/inscription",(req,res)=>{
    operations("select * from utilisateur where username='"+req.body.username+"'",req.body.username,req.body.password,req.body.mail,1)
    .then(resultats =>{
    if(resultats==1){
        res.send(true);
    }else if(resultats == 0){
        let variable = "Erreur nom d'utilisateur deja trouve" ;
        res.send(variable);
    }else{
        res.send("erreur ")
    }})
    .catch(erreur =>console.log(erreur.stack));
});

app.post("/login",(req,res)=>{
    operations("select * from utilisateur where username='"+req.body.username+"'",req.body.username,req.body.password,req.body.mail,0)
    .then(resultats =>{
    if(resultats==2){
        res.send("Bien joue tu a reussi");
    }else if(resultats == 1|| resultats == 0){
        res.status(403);
        let variable = resultats ==1 ? "Erreur mot de passe incorect":"Erreur utilisateur introuvable" ;
        res.send(variable);
    }})
    .catch(erreur =>console.log(erreur.stack));
});

app.post("/mdpOublie",(req,res)=>{
    operations("select * from utilisateur where username='"+req.body.username+"'",req.body.username,req.body.username,2)
    .then(resultats =>{if(resultats==1){
        //TODO ENVOYEZ UN MAIL POUR REINIALISEZ LE MDP (en gros un mail avec un lien localhost:8080/username/newMDP)
        res.send("Bien joue tu a reussi");
    }else if(resultats == 1){
        res.status(403);
        let variable = resultats ==1 ? "Erreur mot de passe incorect":"Erreur utilisateur introuvable" ;
        res.send(variable);
    }})
    .catch(erreur =>console.log(erreur.stack));
});

app.post('/creation',async (req,res)=>{
    checkReunion(req.body.username,req.body.date_reunion,req.body.heure,req.body.heure_fin)
    .then(result=>{
        if(result){
            addReunion(req)
            .catch(err=>console.log(err.stack));
        }
        res.send(result);})
    .catch(err=>{res.send(false);console.log(err.stack);});
});

app.post('/getReunion',(req,res)=>{
    getReunion(req.body.username)
    .then(result=>res.send(result))
    .catch(error =>{console.log("Erreur ...");res.send("Erreur d'username");});
});
app.post('/getInfo',(req,res)=>{
    getInfoReunion(req.body.id_reunion)
    .then(result=>res.send(result))
    .catch(err=>{res.send(err);console.log(err.stack);});
});

app.post('/quittez-reunion',(req,res)=>{
    supParticipation(req.body.username,req.body.id_reunion,req.body.createur);
    res.send(true);//On envoie pour confirmer ca a bien été enregistré
});

app.post('/invit',(req,res)=>{
    invitReunion(req.body.username);
});

app.post('/importReunion',(req,res)=>{
    importReunion(req)
    .then(result=>res.send(true))
    .catch(error=>{console.log(error.stack);res.send(false);});
});

app.listen(port);