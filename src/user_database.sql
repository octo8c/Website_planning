drop table if exists utilisateur cascade;
drop table if exists reunion cascade;
drop table if exists participe cascade;
drop table if exists invite cascade ;
create table utilisateur (
    username varchar(25) unique,
    mail varchar(100) not null unique ,
    mot_de_passe varchar(255), 
    id SERIAL primary key
);

create table reunion (
    id_reunion serial primary key,
    nom_reunion varchar(100) not null,/*Summary*/
    descr text ,
    heure time[] not null,
    creator_username varchar(25) not null,
    date_reunion date[] not null,
    heure_fin time[] not null,
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
    primary key (id_reunion,mail),
    foreign key (id_reunion) references reunion(id_reunion) on update cascade on delete cascade
);

insert into utilisateur values ('titouan','Titouan23@gmail.com','pw1');
insert into utilisateur values ('edourad','edouard@tail.fr','jsp');
insert into utilisateur values  ('test','test@mail.com','1234');