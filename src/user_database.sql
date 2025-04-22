drop table if exists utilisateur ;

create table utilisateur (
    username varchar(25) primary key,
    mot_de_passe varchar(255)
);

insert into utilisateur values ('octooo','pw1');