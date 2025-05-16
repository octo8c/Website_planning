# PROJET WEB

Il faut tout d'abord installer NodeJS si ce n'est pas encore fait, puis npm.

# Installation avec le Makefile
>Vous pouvez installez les dépendances via la commande
> ```bash
>make install
>```
>## Création de la base de donnée accueillant le projet
>- **Se connecter sur psql en utilisant :**
>```
>psql
>```
>- **ensuite tapez dans psql :**
>```
>DROP DATABASE IF EXISTS user_database;
>CREATE DATABASE user_database;
>\q -- Puis quittez
>```
>## Setup et lancement du projet
>**Lancez la commande make et indiquez vos identifiant PSQL pour que l'application ait accès à votre base de donnée.**
>```bash
>make
>```
>## Autre commande makefile possible 
>- **`make reset_all` : au prochain make, vos identifiants PSQL seront réinitialisés avec de nouveaux identifiants et la base de donnée sera aussi reset** 
>- **`make reset_database` : reset la base de donnée à son état initial**
>- **`make set_env` : change vos identifiants de PSQL**



# Installation manuelle  

>## Les dépendances nécessaires :
>Tout les dépendances ci dessous doivent être téléchargées pour faire marcher le serveur :
>* postgres
>* dotenv
>* express
>* path
>* nodemailer
>## Créer la base de donnée :
>**-Se connecter sur sql en utilisant :**
>```
>psql
>```
>- ensuite tapez dans psql :
>```
>DROP DATABASE IF EXISTS user_database;
>CREATE DATABASE user_database;
>\q -- Puis quittez
>```
>**une fois cette etape effectue vous devez executez :**
>```
>psql user_database
>```
>**enfin executez la commande :**
>```
>\i user_database.sql
>```
>## Liaison de la base de donnée au projet :
>**Modifier le fichier src/.env pour mettre votre nom d'utilisateur,  et le mot de passe de Postgreql**
>## Execution du projet : 
>tapez les commandes suivantes :
>```bash
>cd srs
>node app.js
>```
