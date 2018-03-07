/**
 * Created by rafael.maia on 06/02/2018.
 */

var sqlite3 = require('sqlite3').verbose()//o que raios verbose faz?;
var db = new sqlite3.Database('papadb', (err)=>{
    if(err){
        return console.error(err.message);
    }
    console.log('connected');
});

var createt = "CREATE TABLE ALMOCO(DIA TEXT, ID INT)";
db.run(createt);
createt = "CREATE TABLE USERS(ID INT, CALL TEXT, APELIDO TEXT, MENSAGEM TEXT)";
db.run(createt);
createt = "CREATE TABLE VOTOS(IDA INT, IDL INT, IDU INT)";
db.run(createt);


db.close();

