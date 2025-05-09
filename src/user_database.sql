drop table if exists utilisateur cascade;
drop table if exists reunion cascade;
drop table if exists participe cascade;
create table utilisateur (
    username varchar(25) unique,
    adresse_mail varchar(100) not null ,
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
    creator_username varchar(25) not null,
    date_reunion date[] not null,
    heure_fin time[] not null,
    id_reunion serial primary key,
    foreign key (creator_username) references utilisateur(username) on update cascade on delete cascade 

);

create table participe (
    id_reunion integer not null, 
    username varchar(25) not null , 
    role_reunion integer not null , /*0 aucun droit 1 peut inviter des gens 2 proprietaires */ 
    primary key (id_reunion , username) ,
    foreign key (username) references utilisateur(username) on update cascade on delete cascade, 
    foreign key (id_reunion) references reunion(id_reunion) on update cascade on delete cascade
);

insert into utilisateur values ('undefined', 'undefined', 'dzakjdazdlazdjkaklzaljd');
insert into utilisateur values ('titouan','Titouan23@gmail.com','pw1');
insert into utilisateur values ('edourad','edouard@tail.fr','jsp');
insert into utilisateur values  ('test','test@mail.com','1234');
insert into reunion values ('réunion initiale', 'ceci est la description de la réunion initiale', '255', '0', '0', '{04:05}', 'undefined', '{1/1/2025}', '{07:07}');