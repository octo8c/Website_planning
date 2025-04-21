const express = require("express");
const path = require("path");
const app = express();
const port = 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('image'));   

const pg = require('pg');
const pool = new pg.Pool({
    user : 'moi' , 
    host : 'localhost' ,
    database : 'user_database' ,
    password : '1234' ,
    port : 5432
});

async function operations(requete,username,motdepasse) {
    const client = await pool.connect();
    let res = await client.query (requete);
    
    client.release();
    return 0;
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post("/inscription",(req,res)=>{
    operations("select * from user where username="+req.body.username,req.body.username,req.body.password)
    .then(resultats =>{})
    .catch(erreur =>console.log(erreur.stack));
});

app.listen(port);