const express = require("express");
const path = require("path");
const nodemailer = require('nodemailer');
const app = express();
const port = 8080;
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static('image'));
app.use(express.json());

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

if (process.env.INITIALISED == "false"){
    console.log("erreur, le fichier .env n'est pas rempli, veuillez entrer la commande '/make' pour le re-remplir");
    exit(0);
}
 




const pg = require('pg');
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL,
        pass: process.env.PASS
    }
});

const pool = new pg.Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT
});
/**
 * 
 * @param {*} requete La requete a realise
 * @param {*} username le nom de l'tutlisateur
 * @param {*} motdepasse le mots de passe de l'utilisateur
 * @param {*} mode Le mode de connexion 0 pour la connexion , 1 inscription , 2 mdp oublie
 * @returns Renvoie un entier > 0 si la connexion c'est bien passe
 */
async function operations(username, motdepasse, mail, mode) {
    const client = await pool.connect();
    let res = await client.query("select * from utilisateur where username=$1", [username]);
    let flag = false;
    for (row of res.rows) {
        if (row.mot_de_passe === motdepasse && mode == 0) {//Le client est valide
            client.release();
            return row.id;
        } else if (mode === 1) {
            client.release();
            return -1;//Deja un utilisateur avec le meme pseudo
        }else if(mode===2){
            res = await client.query("update utilisateur set mot_de_passe = $1 where username=$2",[motdepasse,username]);
            client.release();
            return row.id;
        }
        flag = true;
    }
    if (mode === 1) {//Tentative d'inscription et aucun utilisateur qui a le meme pseudo 
        await client.query("Insert into utilisateur values ($1,$2,$3)", [username, mail, motdepasse]);
        let res = await client.query("select id from utilisateur where username=$1 and mot_de_passe=$2", [username, motdepasse]);
        if (res.rows.length == 0){
            console.log("impossible d'ajouter l'utilisateur dans la base de donnée");
            return -2;
        }
        console.log(res.rows[0]);

        client.release();
        return res.rows[0].id;//L'utilisateur est bien ajouté
    }
    client.release();
    if (flag) return -2;//Pas le bon mdp
    else return -1;//Pas ton nom d'utilisateur
}
/**
 * Creer la reunion et ajoute le createur a la table des participants
 * @param {*} reunion_nom le nom de la reunion
 * @param {*} username le nom du createur de la reunion
 * @param {*} date_reunion la date de la reunion
 * @returns 
 */
async function addReunion(req) {
    try {
        const reunion_nom = req.body.nom_reunion;
        const username = req.body.username;
        let tab_heure = [], tab_heure_fin = [], date = [];
        let red = req.body.red, blue = req.body.blue, green = req.body.green;
        let descr = req.body.description;

        console.log(req.body.creneau);

        for (let i = 0; i < req.body.creneau.length; i++) {
            date[i] = req.body.creneau[i][0].d;
            console.log("date" + date[i]);
            tab_heure[i] = req.body.creneau[i][0].h + ":" + req.body.creneau[i][0].m + ":00";
            console.log("heure" + tab_heure[i]);
            tab_heure_fin[i] = req.body.creneau[i][1].h + ":" + req.body.creneau[i][1].m + ":00";
            console.log("heure fin" + tab_heure_fin[i]);
        }
        const client = await pool.connect();
        let tab = [tab_heure, reunion_nom, username, date, tab_heure_fin, red, blue, green, descr];
        let requete = "select id_reunion from reunion where heure=$1 and nom_reunion=$2 and creator_username=$3 and date_reunion=$4";
        await client.query("insert into reunion (heure,nom_reunion, creator_username, date_reunion,heure_fin, red, blue, green, descr) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)", tab);
        let id = await client.query(requete, [tab_heure, reunion_nom, username, date]);//Pas 2 reunion qui peuvent commencer au meme horraire
        await client.query("insert into participe values ($1,$2,$3)", [id.rows[0].id_reunion, username, 2]);
        if (req.body.participe) {
            await client.query("insert into participe values ($1,$2,$3)", [id.rows[0].id_reunion, req.body.mail, 2]);
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
async function getReunion(mail) {
    const client = await pool.connect();
    let requete = "select reunion.* from reunion join participe on participe.id_reunion = reunion.id_reunion"
        + " where participe.mail=$1";
    let res = await client.query(requete, [mail]);
    let res_invit = await client.query("select reunion.* from reunion join invite on invite.id_reunion=reunion.id_reunion where invite.mail=$1", [mail]);
    let res_personnal = await client.query("select * from personnal_event where user_mail=$1 ",[mail]);
    client.release();
    console.log(res_personnal);
    return [res, res_invit,res_personnal];
}

/**
 * Envoie a tout les utilisateur qui ont passe un certain delai un mail de relance
 */
function remind_participant(){
    console.log("Affichage reunion");
    requete("select * from invite",[])
    .then(res=>{
        let d = new Date();
        for (let row of res){
            console.log("Coucou ces moi");
            let date_row = new Date(row.date_relance);
            if(date_row-d <=0){
                requete("select * from reunion where id_reunion=$1",[row.id_reunion])
                .then(rer=>
                    send_mail(process.env.MAIL,row.mail,"Relance reunion",
                        "Bonjour vous aviez été invité a la reunion "+rer[0].nom_reunion
                        +"le createur de la reunion "+rer[0].creator_username+" attend encore votre réponse "
                    +"http://localhost:8080/invit/" + row.id_reunion + "/" + row.mail
                ));
                let date_tmp = new Date(d);
                date_tmp.setDate(d.getDate()+7);
                requete("update invite set date_relance=$1 where id_reunion=$2 and mail=$3",
                    [date_tmp.toISOString().slice(0,10),row.id_reunion,row.mail])
                    .catch(err=>console.log(err));
            }
        }
    });
    setTimeout(remind_participant,864000000);
}

async function supParticipation(mail, id_reunion, createur) {
    const client = await pool.connect();
    let res = await client.query("select role_reunion from participe where mail=$1", [mail]);
    if (res.rows[0] !== undefined && res.rows[0].role_reunion === 2) {//IL faut supprimer la reunion directement
        client.query("delete from reunion where id_reunion=$1", [id_reunion]);
    } else {
        client.query("delete from participe where id_reunion=$1 and mail =$2", [id_reunion, mail]);
    }
    client.release();
}
/**
 * Renvoie toutes les info de l'utilisateur 
 * @param {*} id L'id de l'utilisateur a recupere
 * @returns Toutes les info
 */
async function getInfoUser(id) {
    const client = await pool.connect();
    let res = await client.query("select * from utilisateur where id=$1", [id]);
    client.release();
    return res.rows[0];
}

async function getInfoReunion(id_reunion) {
    const client = await pool.connect();
    let res = await client.query("select role_reunion,mail from participe where id_reunion=$1", [id_reunion]);
    client.release();
    return res;
}

async function invitReunion(username, id, nom_reunion, remove) {
    const client = await pool.connect();
    let adresse_mail = "";
    if (!username.includes("@")) {
        let res = await client.query("select mail from utilisateur where username=$1", username);
        if (res.rows !== undefined) {
            adresse_mail = res.rows[0].mail;
        } else {
            return false;
        }
    } else {
        adresse_mail = username;
    }
    if (remove) { await client.query("delete from invite where mail=$1", [adresse_mail]); }
    else { let date = new Date();
        date.setDate(date.getDate() +7);
        await client.query("insert into invite values($1,$2,$3)", [id, adresse_mail,date]); }
    client.release();

    return await send_mail(process.env.MAIL, adresse_mail,
        "Invitation pour une reunion",
        "Bonjours vous etes invitez , voulez vous joindre a la reunion "
        + nom_reunion + " ? http://localhost:8080/invit/" + id + "/" + username) !== undefined;
}
//"Bonjours vous etes invitez , voulez vous joindre a la reunion "+nom_reunion+" ? http://localhost/8080/invit/"+id+"/"+username 
async function send_mail(from,to,subject,text){
    try {
        return info = transporter.sendMail({
            from : from , 
            to : to ,
            subject : subject , 
            text : text,
        });
    } catch (error){
        console.error(error);
        return;
    }
}


async function getUser(username) {
    const client = await pool.connect();
    let res = await client.query("select * from utilisateur where username=$1", [username]);
    client.release();
    return res.rows[0];
}
/**
 * Ajoute tout les utilisateur de la reunion
 * @param {*} req 
 */
async function importPersonnal_event(req) {
    requete("insert into personnal_event(nom_event,descr,heure,creator_username,date_event,heure_fin,user_mail) values ($1,$2,$3,$4,$5,$6,$7)",
        [req.body.nom_reunion,req.body.descr,req.body.heure_debut,req.body.organisateur,req.body.date_debut,req.body.heure_fin,req.body.mail])
    .catch(err=>console.log(err));
    return 0; 
}
/**
 * Supprime l'utilisateur de la table invit et l'ajoute a la table participe si il la souhaite
 * @param {*} reponse 
 * @param {*} mail 
 * @param {*} id_reunion 
 */
async function resInvit(reponse, mail, id_reunion, horraire) {
    const client = await pool.connect();
    client.query("delete from invite where id_reunion=$1 and mail=$2", [id_reunion, mail]);
    if (reponse) {
        client.query("insert into participe values($1,$2,0)", [id_reunion, mail, horraire]);
    }
}
/**
 * Verifie que l'utilisateur a bien été invité a la reunion id_reunion
 * @param {*} id_reunion 
 * @param {*} mail 
 * @returns 
 */
async function checkInvit(id_reunion, mail) {
    const client = await pool.connect();
    console.log("L'id reunion" + id_reunion + "Le mail : " + mail);
    let res = await client.query("select * from invite where id_reunion=$1 and mail=$2", [id_reunion, mail]);
    client.release();
    return res.rows[0] !== undefined;
}
/**
 * Execute la requete requete sur la base de données et renvoie le resultats de la requete
 * @param {*} requete la requete a executé
 * @param {*} list_values la liste de valeur 
 * @returns le resultats de la requete
 */
async function requete(requete,list_values){
    const client = await pool.connect();
    let res = await client.query(requete,list_values);
    client.release();
    return res.rows;
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post("/inscription", (req, res) => {
    operations(req.body.username, req.body.password, req.body.mail, 1)
        .then(resultats => {
            if (resultats > 0) {
                res.json({ result: true, id: resultats });
            } else if (resultats == -1) {
                res.json({ result: false, message: "Erreur nom d'utilisateur deja utilisé", id: -1 });
            } else {
                res.json({ result: false, message: "erreur ", id: -1 });
            }
        })
        .catch(erreur => console.log(erreur.stack));
});

app.post("/login", (req, res) => {
    operations(req.body.username, req.body.password, req.body.mail, 0)
        .then(resultats => {
            if (resultats > 0) {
                requete("select * from utilisateur where id=$1",[resultats]).then(result => {
                    res.json({ connecte: true, message: "connecté!", id: resultats, mail: result.mail });
                }
                );
            } else if (resultats == -1) {
                res.json({ connecte: false, message: "nom d'utilisateur inconnu!", id: -1 });
            } else if (resultats == -2) {
                res.json({ connecte: false, message: "mot de passe incorrect", id: -1 });
            } else {
                res.json({ connecte: false, message: "erreur inconnue", id: -1 });
            }
        })
        .catch(erreur => console.log(erreur.stack));
});

app.post("/mdpOublie", (req, res) => {
    getUser(req.body.username)
        .then(resultats => {
            if (resultats === undefined) {
                res.json({ result: false, message: "Erreur: utilisateur introuvable!" });
            } else {
                console.log(resultats);
                requete("insert into fpass values($1)",[req.body.username]).catch(res=>console.log("Il avait déja demandée un nouveau mot de passe"));
                send_mail(process.env.MAIL, resultats.mail, "Reinitialisation Mot de passe",
                    "Cliquez sur ce lien pour reinitialisez votre mot de passe : http://localhost:8080/mdp/" + req.body.username)
                    .then(res => console.log("Et le message est ..." + res))
                    .catch(err => console.log(err));
                res.json({ result: true });
            }
        })
        .catch(erreur => console.log(erreur.stack));
});

app.post('/creation', async (req, res) => {
    console.log("Les reunion restantes : " + req.body.creneau);
    addReunion(req).then(result => res.json({ result: true })).catch(err => { console.log(err); res.json({ result: false }); });
});

app.post('/getReunion', (req, res) => {
    getReunion(req.body.mail)
        .then(result => res.json({ result: result[0], result_invit: result[1] , res_personnal : result[2] }))
        .catch(error => { console.log("Erreur ..." + error); res.json({ result: "Erreur de mail" }); });
});
app.post('/getInfo', (req, res) => { //En gros envoyez via res.json toutes les reunion auquels l'utilisateur peut accepter de participer
    requete("select role_reunion,mail from participe where id_reunion=$1",[req.body.id_reunion])
        .then(result => res.json({ result: result }))
        .catch(err => { res.json({ result: err }); console.log(err.stack); });
    
});

app.post('/quittez-reunion',(req,res)=>{
    supParticipation(req.body.mail,req.body.id_reunion,req.body.createur);
    res.json({result: true});//On envoie pour confirmer ca a bien été enregistré
});

app.post('/invit', (req, res) => {
    invitReunion(req.body.username, req.body.id_reunion, req.body.nom_reunion)
        .then(result => { console.log("L'envoie du mail c'est ...." + result); res.json({ result: result }); })
        .catch(err => { console.log("Erreur mail :" + err); res.json({ result: false }); })
});
/**
 * Renvoie les différents horraires d'une reunion
 */
app.post('/horraireReunion', (req, res) => {
    requete("select * from reunion where id_reunion=$1",[req.body.id_reunion]).then(result =>
        res.json({
            heure: result.rows[0].heure,
            heure_fin: result.rows[0].heure_fin,
            date: result.rows[0].date
        }))
        .catch(err => { console.log(err); res.json({ err: err }); });
});

app.post('/resultInvit', (req, res) => {
    resInvit(req.body.reponse, req.body.mail, req.body.id_reunion, req.body.horraire)
        .then(result => res.json({ ok: true }))
        .catch(err => { console.log(err); res.json({ ok: false }) });
});
/**
 * Renvoie les info de l'utilisateur
 */
app.post('/infoUser', (req, res) => {
    getInfoUser(req.body.id)
        .then(result => { console.log(result); res.json({ result: result }); })
        .catch(err => { console.log(err); res.json({ result: undefined }) });
})

app.post('/importReunion', (req, res) => {
    importPersonnal_event(req)
        .then(_result => res.json({ result: true }))
        .catch(error => { console.log(error.stack); res.json({ result: false }); });
});

app.get('/invit/:index/:mail', (req, res) => {//L'id de la reunion 
    requete("select * from invite where id_reunion=$1 and mail=$2",[req.params.index, req.params.mail]).then(result => {
        if (result[0]!=undefined) {
            requete("select * from reunion where id_reunion=$1",[req.params.index]).then(result => {
                res.render("invit", { cons: result.rows[0] });
            });
        } else {
            res.render("erreur", { nom: req.params.mail });
        }
    });
}
);
//recuperez toutes les info des reunion et supprimez les invit quand ils ont clique sur le bouton du fichier invit
app.get('/mdp/:username', (req, res) => {
    console.log("Coucou c'est moi");
    if (requete("select * from fpass where username=$1",[req.params.username])!=undefined) {
        res.render('mdp', { send: req.params.username });
    } else {
        //Gerer le cas d'erreur 
    }
    console.log("Bonjour " + req.params.username + "Le site est pas encore finis...");
});

app.post('/newmdp', (req, res) => {
    console.log("Coucou je suis bien la");
    requete("select * from fpass where username=$1",[req.body.username]).then(res=>{ if(res[0]==undefined){
        requete("delete from fpass where username=$1",[req.body.username]);
        requete("update utilisateur set mot_de_passe=$1 where username=$2",[req.body.pass,req.body.username])
            .then(res.json({ ok: true }))
            .catch(err=>res.json({ ok: false, message: "Erreur lors de la mise a jour" }));
        } else {
            res.json({ ok: false, message: "L'adresse mail/n'est pas presente ou n'a pas demande de nouveau mots de passe" });
        }
    });
});

app.post('/updateProposition',(req,res)=>{
    requete("select * from tmp_res where id=$1 and id_reunion=$2",[req.body.id_reunion,req.body.id])
    .then(res=>{
        if(res.rows[0]==undefined){
            requete("insert into tmp_res values($1,$2,$3,$4)",[req.body.id,req.body.horraire,req.body.accepted,req.body.id_reunion])
            .then(result=>res.json({ok:true}));
        }else{//Il n'avais pas encore de reponse temporaire
            requete("update tmp_res horraire=$1 , accepted=$2 where id=$3 and id_reunion=$4",//Si on a pas dis oui on dis non mais on pourrait gagner a une meilleur modelisation a voir si on a pas la flemme
                [req.body.horraire,req.body.accepted,req.body.id,req.body.id_reunion])
            .then(result=>res.json({ok:true}));
        }
    })
    .catch(err=>{
        console.log(err);
        res.json({ok:false});
    });
});

console.log("COudahudabda");
remind_participant();
console.log("oe ces bien appelée");
app.listen(port);