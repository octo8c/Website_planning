drop table if exists utilisateur cascade;
drop table if exists reunion cascade;
drop table if exists participe cascade;
drop table if exists invite cascade ;
drop table if exists fpass cascade;
drop table if exists tmp_res cascade;
create table utilisateur (
    username varchar(30) unique,
    mail varchar(100) not null unique ,
    mot_de_passe varchar(255), 
    id SERIAL primary key
);

create table reunion (
    nom_reunion varchar(100) not null,/*Summary*/
    descr text ,
    red smallint,
    blue smallint, 
    green smallint,
    heure time[] not null,
    creator_username varchar(30) not null,
    date_reunion date[] not null,
    heure_fin time[] not null,
    id_reunion serial primary key,
    foreign key (creator_username) references utilisateur(username) on update cascade on delete cascade 

);

create table personnal_event(
    nom_event varchar(100) not null , 
    descr text ,
    red smallint,
    blue smallint, 
    green smallint,
    heure time[] not null,
    creator_username varchar(30) not null,
    date_reunion date[] not null,
    heure_fin time[] not null,
    id_event serial primary key,
    foreign key (creator_username) references utilisateur(username) on update cascade on delete cascade
);

create table participe (
    id_reunion integer not null, 
    mail varchar(100) not null , 
    role_reunion integer not null , /*0 aucun droit 1 peut inviter des gens 2 proprietaires */
    choix_horraires integer , /*Correspond a l'indice d'un des horraires choisi */
    primary key (id_reunion , mail)
);

create table invite(
    id_reunion integer not null , 
    mail varchar(100) not null ,
    date_relance date not null , 
    primary key (id_reunion,mail),
    foreign key (id_reunion) references reunion(id_reunion) on update cascade on delete cascade
);

create table tmp_res(/*Contient les reponses temporaires*/
    id integer not null , 
    horraire integer , /*L'horraire qu'il peut ou peut ne pas avoir choisi*/
    accepted boolean not null , /*Si il a clique sur oui ou non*/
    id_reunion integer not null , 
    foreign key (id) references utilisateur (id) on delete cascade,
    foreign key (id_reunion) references reunion(id_reunion) on delete cascade , 
    primary key (id,id_reunion)
);
create table fpass(
    username varchar (30) not null primary key
);/*Forgotten passw*/

insert into utilisateur values ('undefined', 'undefined', 'dzakjdazdlazdjkaklzaljd');
insert into utilisateur values ('titouan','Titouan23@gmail.com','pw1');
insert into utilisateur values ('edourad','edouard@tail.fr','jsp');
insert into utilisateur values  ('test','test@mail.com','1234');
insert into reunion values ('réunion initiale', 'ceci est la description de la réunion initiale', '255', '0', '0', '{04:05}', 'undefined', '{1/1/2025}', '{07:07}');