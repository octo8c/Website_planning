BD_INIT = $(shell grep INITIALISED src/.env | cut -d "=" -f 2)
PG_MDP = $(shell grep PASSWORD src/.env | cut -d "=" -f 2)
PG_USER = $(shell grep USER src/.env | cut -d "=" -f 2)
PG_nameBD = $(shell grep DATABASE src/.env | cut -d "=" -f 2)


run : compile
	clear && cd src && node app.js

compile :
	@if [ "$(BD_INIT)" = "false" ]; then \
		$(MAKE) set_env; \
		$(MAKE) reset_database; \
		sed -i "s/^INITIALISED=.*/INITIALISED=true/" src/.env; \
	fi


# reset le fichier .env et les paramètre de la base de données
reset_all : reset_database
	@sed -i "1s/=.*/=false/" src/.env \
	&& echo reset bien effectué \
	|| echo erreur durant execution de sed


# remet la base de donnée à l'état initial
reset_database : 
	@PGPASSWORD="$(PG_MDP)" psql \
	-U "$(PG_USER)" \
	-d "$(PG_nameBD)" \
	-f src/user_database.sql

# création du fichier .env nécessaire pour relier le programme à la base de 
# donnée
set_env : 
	@read -p "Quel est le nom de la base de données PSQL à utiliser \
	(⚠️ données perdues) ? " database_name; \
	read -p "Quel est votre identifiant PSQL ? " psql_id; \
	read -p "Quel est votre mot de passe PSQL ? " psql_mdp; \
	clear; \
	sed -i "s/^INITIALISED=.*/INITIALISED=true/" src/.env; \
	sed -i "s/^DATABASE=.*/DATABASE=$$database_name/" src/.env; \
	sed -i "s/^USER=.*/USER=$$psql_id/" src/.env; \
	sed -i "s/^PASSWORD=.*/PASSWORD=$$psql_mdp/" src/.env



# installation des dépendances
install : 
	npm install express path nodemailer pg dotenv
