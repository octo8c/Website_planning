# projet-web

## Les depences nécessaires :

Tout les depences ci dessous doivent etre telecherages pour faire marcher le serveur :

* postgres
* dotenv
* express

## Faire marcher le serveur :

Creer la database :

Renseignez votre nom d'utilisateur et le mot de passe dans le .env

## Lancez la base de donnée : 

**-Se connecter sur sql en utilisant :**

```
 psql
```

- ensuite tapez dans psql :

```
DROP DATABASE IF EXISTS user_database;
CREATE DATABASE user_database;
\q -- Puis quittez
```

**une fois cette etape effectue vous devez executez :**

```
psql user_database
```

**enfin executez la commande :**

```
\i user_database.sql
```

## Derniere etape : 

Modifier le fichier .env pour  mettre votre nom d'utilisateur et le mot de passe de Postgreql
