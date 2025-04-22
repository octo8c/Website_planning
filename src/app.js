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

app.listen(port);