drop table if exists utilisateur cascade;
drop table if exists reunion cascade;
drop table if exists participe cascade;
create table utilisateur (
    username varchar(25) primary key,
    adresse_mail varchar(50) not null ,
    mot_de_passe varchar(255)
);

create table reunion (
    id_reunion serial primary key,
    heure time not null,
    nom_reunion varchar(100) not null,
    creator_username varchar(25) not null,
    date_reunion date not null,
    heure_fin time not null,
    foreign key (creator_username) references utilisateur(username)
);

create table participe (
    id_reunion integer not null, 
    username varchar(25) not null , 
    role_reunion integer not null , /*0 aucun droit 1 peut inviter des gens 2 proprietaires */ 
    primary key (id_reunion , username) ,
    foreign key (username) references utilisateur(username) on delete cascade, 
    foreign key (id_reunion) references reunion(id_reunion) on delete cascade
);

insert into utilisateur values ('titouan','pw1');
insert into utilisateur values ('edourad','jsp');
insert into utilisateur values  ('test','1234');