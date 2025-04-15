drop table if exists user

create table user (
    username varchar(25) primary key,
    mot_de_passe password 
);

insert into user values (octooo,pw1);