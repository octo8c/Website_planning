const express = require("express");
const path = require("path");
const app = express();
const port = 8080;
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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
async function operations(requete,username,motdepasse,mode) {
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
        console.log("OUI TOUT A BIEN MARCHE");
        client.query("Insert into utilisateur values ('"+username+"' , '"+motdepasse+"')");
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
    const reunion_nom = req.body.reunion_nom;
    const username = req.body.username;
    const date_reunion = req.body.date_reunion;
    const heure = req.body.heure;
    const client = await pool.connect();
    let new_date = date_reunion.replaceAll("/","-");
    let tab = [heure+":00",reunion_nom,username,new_date];
    let requete = "select id_reunion from reunion where heure=$1 and nom_reunion=$2 and creator_username=$3 and date_reunion=$4";
    await client.query("insert into reunion (heure,nom_reunion, creator_username, date_reunion) values ($1,$2,$3,$4)",tab);
    let id = await client.query(requete,tab);
    await client.query("insert into participe values ($1,$2)",[id.rows[0].id_reunion,username]);
    client.release();
    return 0;
}

async function getReunion(username){
    const client = await pool.connect();
    let res = await client.query("select reunion.* from reunion join participe on participe.id_reunion = reunion.id_reunion where participe.username=$1",[username]);
    console.log("Affichage du resultats des requetes : "+res.rows);
    client.release();
    return res;
}

async function checkReunion(username,date,heure,duree){
    const client = await pool.connect();
    let res = await client.query("select reunion.duree , reunion.heure from reunion join participe on participe.id_reunion = reunion.id_reunion where participe.username=$1 and reunion.date=$2",[username,date]);
    const nmbMinute = duree % 60;
    const nmbHeure = Math.floor(duree / 60);
    var tab = heure.split(":");
    var heureMin = parseInt(tab[0]) * 60 + parseInt(tab[1]);
    var heureMax = heureMin + duree;
    var flag = true;
    for(row in res.rows){
        let tmpTab = res.heure.split(":");
        let tmpMin = parseInt(tmpTab[0]) * 60 + parseInt(tmpTab[1]);
        let tmpMax = tmpMin + parseInt(res.duree);
        if((tmpMin < heureMin && tmpMax < heureMin)||(tmpMax>heureMax && tmpMin > heureMax)||(heureMin < tmpMin && heureMax < tmpMin)||(heureMax>tmpMax && heureMin > tmpMax)){
            flag = false;
            break;
        }
    }
    client.release();
    return flag;
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post("/inscription",(req,res)=>{
    operations("select * from utilisateur where username='"+req.body.username+"'",req.body.username,req.body.password,1)
    .then(resultats =>{
    if(resultats==1){
        res.send("Bien joue tu a reussi");
    }else if(resultats == 0){
        let variable = "Erreur nom d'utilisateur deja trouve" ;
        res.send(variable);
    }else{
        console.log("erreur ");
    }})
    .catch(erreur =>console.log(erreur.stack));
});

app.post("/login",(req,res)=>{
    operations("select * from utilisateur where username='"+req.body.username+"'",req.body.username,req.body.password,0)
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

app.post('/creation',(req,res)=>{
    console.log("Oui j'ai bien recu la connection : "+req.body.heure);
    addReunion(req);
    console.log("Affichage bien passe");
    res.send("Connection bien passé");
});

app.post('/getReunion',(req,res)=>{
    getReunion(req.body.username)
    .then(result=>res.send(result))
    .catch(error => res.send("Erreur d'username"));
});

app.listen(port);