/**
 * Created by rafael.maia on 05/02/2018.
 */
const TeleBot = require('telebot');
const bot = new TeleBot({
    token: '490483221:AAFYyZuncImTP07cq2qPVw4cKXN2qHus_sM',
    polling: {
        interval: 5000,
        retryTimeout: 10000
    }
});
const request = require('request');
const fs = require('fs');
const img = './img/';
var sqlite3 = require('sqlite3').verbose()//o que raios verbose faz?;
var db = new sqlite3.Database('papadb', (err)=> {
    if (err) {
        return console.error(err.message);
    }
    console.log('connected');
});
var map = {
    "â": "a",
    "Â": "A",
    "à": "a",
    "À": "A",
    "á": "a",
    "Á": "A",
    "ã": "a",
    "Ã": "A",
    "ê": "e",
    "Ê": "E",
    "è": "e",
    "È": "E",
    "é": "e",
    "É": "E",
    "î": "i",
    "Î": "I",
    "ì": "i",
    "Ì": "I",
    "í": "i",
    "Í": "I",
    "õ": "o",
    "Õ": "O",
    "ô": "o",
    "Ô": "O",
    "ò": "o",
    "Ò": "O",
    "ó": "o",
    "Ó": "O",
    "ü": "u",
    "Ü": "U",
    "û": "u",
    "Û": "U",
    "ú": "u",
    "Ú": "U",
    "ù": "u",
    "Ù": "U",
    "ç": "c",
    "Ç": "C"
};
var locais = [];
var arr = [];
var vcomp = [];
var mpapa = 0;

fs.readdir(img, (err, files) => {
    files.forEach(file => {
        arr.push(String(file));
    });
});

/*
 fetch('https://api.darksky.net/forecast/1305022027482e61f1f260ea2e245d86/42.3601,-71.0589')
 .then(res => res.json())
 .then(json => console.log(json))
 .catch((err)=>{
 console.log(err);
 });
 */

function imgs(){
    fs.readdir(img, (err, files) => {
        files.forEach(file => {
            arr.push(String(file));
        });
    });
}


bot.on('/convocar', (msg)=> {
    convocar();
});
bot.on('text', (msg) => {

    if (msg.from.is_bot == false) {

        let sql = 'SELECT * FROM USERS WHERE ID =' + msg.from.id;
        db.all(sql, [], (err, row) => {
            if (err) {
                throw err;
            }
            if (row[0] == undefined) {
                cadastraUser(msg);
            }
        });

        var txt = removerAcentos(msg.text.toLowerCase());
        let d = new Date();
        let h = d.getHours();
        c(h);
        if (txt.includes('almoco') && h < 15) {//
            var t = criarAlmoco(msg);
            c(t);
        }
        if(txt.includes('almoco') && h >= 15){
            c('nao é hora do almoço');
            bot.sendMessage(msg.chat.id, 'Acho melhor fazer um lanche. Tem o Bobs, o rei do mate ou o Starbuks mesmo.',{}).then().catch((err)=>{
                c(err);
            })
        }
        if (txt.includes('a boa')) {
            let n = Math.floor(Math.random() * arr.length);
            bot.sendMessage(msg.chat.id, 'A boa sou sempre eu...', {}).then(function () {
                bot.sendPhoto(msg.chat.id, './img/'+arr[n],{}).then().catch((err)=>{
                        console.error(err)
                }
                );
            }).catch(console.error);
            imgs();//atualiza

        }
        if (txt.includes('marca um 10') || txt.includes('segura ai') || txt.includes('da um 10') || txt.includes('aquenta ai') || txt.includes('espera um pouco') ) {
            c(msg);
            bot.sendMessage(msg.chat.id, 'Beleza, vou marcar 10 minutos aqui.', {}).then(function () {
                setTimeout(function(){
                    bot.sendMessage(msg.chat.id, 'Acabou o tempo '+msg.from.id+'!',{}).then().catch((err)=>{
                            console.error(err)
                        }
                    );
                },600000)

            }).catch(console.error);
        }


        for (let i = 0; i < locais.length; i++) {

            if (txt.includes('&'+String(locais[i].nome))) {

                votar(msg, locais[i]);

            }
        }
    }

});
bot.on('/sugere',(msg)=>{
   sugestoes(msg);
});
bot.on('/locais', (msg)=> {
    let lo = [];
    let sql = 'Select nome from LOCAL';
    db.all(sql,[],(err,linhas)=>{
        linhas.forEach((linha)=>{
            lo.push(linha.NOME);
        });
        let txt  = 'Estes são os locais que eu conheço: ';
        for(let i=0;i<lo.length;i++){
            if(i===0){
                txt+='O '+lo[i];
            }else{
                if(i===lo.length-1){
                    txt+=' e o '+lo[i];
                }else{
                    txt+=', '+lo[i];
                }
            }


        }
        msg.reply.text(txt);

    })
});

bot.on('/novolocal', (msg)=> {
    let rpl = "Não está implementado ainda.";
    msg.reply.text(rpl);
});

bot.on('/votos', (msg)=> {
    let temvotos = "select LOCAL.nome, count(idl) v from VOTOS join LOCAL on VOTOS.idl = LOCAL.ID where VOTOS.IDA="+numDia()+" group by local.NOME ";
    vcomp = [];
    db.all(temvotos, [], (err, rows) => {
        if (err) {
            console.log('temvotos: ' + err)
        }
        rows.forEach((row) => {
            let v = [];
            v.nome = row.NOME;
            v.votos = row.v;
            vcomp.push(v);
        });

        let votos = 'Votos para o Almoço: ';
        for(let i=0; i<vcomp.length;i++){
            votos+='\n'+fl(vcomp[i].nome)+': <b>'+vcomp[i].votos +' </b>-- ';
        }
        bot.sendMessage(msg.chat.id,votos,{parseMode: 'html'})
            .catch((err)=>{
                console.log('/votos',err)
            });
    });

});

bot.on('/trocar',(msg)=> {
    mudarVoto(msg);
});

bot.on('callbackQuery', (msg) => {
    switch (msg.data) {
        case "convocar":
            convocar(msg);
            break;
        case "votar":
            votar(msg);
            break;
        case "sugestoes":
            sugestoes(msg);
            break;
        case "mudarVoto":
            mudarVoto(msg);
            break;
    }

});//coloquei os parenteses aqui.(msg) <--> msg .pode ser que de ruim

bot.on('/papa', (msg)=>{
    let tx = '</br>' +
        'Local mais votado:' +
        '';
    let replyMarkup = bot.inlineKeyboard([
        [
            bot.inlineButton(tx, {callback: 'convocar'})
        ]
    ]);
    bot.sendMessage(msg.chat.id, 'Situação do almoço', {replyToMessage: msg.message_id, replyMarkup}).then(function () {
        console.log('Menu Aberto');
    }).catch(console.error);
});

bot.on('/reset',(msg)=>{
    let sql = 'delete from ALMOCO where dia ='+numDia();
    db.run(sql,[],(err)=>{
        console.log('reset');
    })
});

bot.on(/^\/fomos (.+)$/,function(msg,props){
    const rem = ['no ', 'na ', 'em ', ' '];
    let valores = removerAcentos(props.match[1].toLowerCase());
    for(let i=0; i<=rem.length; i++){
        try{
            valores = valores.replace(rem[i],'');
        }catch(e){
            c(e);
        }

    }
    msg.reply.text('Ok, hoje foram no '+valores);
    let sql = 'update ALMOCO SET (IDL, HORAFOMOS) = ((SELECT ID FROM LOCAL WHERE NOME = "'+valores+'"), DATETIME("now","localtime")) where DIA = '+numDia();
    c(sql);
    db.run(sql,[],(err)=>{
        //console.log('Feito', err);

    })
});

bot.on(/^\/nomegusta (.+)$/,function(msg,props){
    let valores = removerAcentos(props.match[1].toLowerCase());
    let sql = 'insert into NOGUSTA(idu,idl) values('+msg.from.id+',(select id from local where nome ="'+valores+'"));';
    msg.reply.text('Não gosta do '+valores+'...ok...');
    db.run(sql,[],(err)=>{
        console.log('Feito', err);
    })
});

bot.on(/^\/megusta (.+)$/,function(msg,props){
    let valores = removerAcentos(props.match[1].toLowerCase());
    let sql = 'delete from nogusta where idu='+msg.from.id+' and idl = (select id from local where nome ="'+valores+'")';
    msg.reply.text('Gosta do '+valores+'...ok...');
    db.run(sql,[],(err)=>{
        console.log('Feito', err);
    })
});


function pin(){
    //colocar mensagem no pin
}

function vai() {

    let sql = 'SELECT * FROM local ORDER BY nome';
//cadastra almoço
    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            let l = [];
            l.nome = row.NOME;
            l.id = row.ID;
            l.distancia = row.DISTANCIA;
            l.valor = row.VALOR;
            l.max = row.PESSOASMAX;
            l.temp = row.TEMPERATURA;
            l.non = row.NONGRATA;
            l.nota = row.NOTA;
            l.chuva = row.CHUVA;
            l.lat = row.LAT;
            l.long = row.LONG;
            l.cmt = row.COMENT;
            l.alias = row.ALIAS;
            locais.push(l);
        });
    });
}

function removerAcentos(s) {
    return s.replace(/[\W\[\] ]/g, function (a) {
        return map[a] || a
    })
};

function cadastraUser(msg) {
    let us = 'INSERT INTO USERS(id,nome,apelido,mensagem) VALUES("' + msg.from.id + '","' + msg.from.first_name + '","' + msg.from.username + '",' + '"Ta na hora de papar")';
    db.run(us, [], function (err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Novo usuário cadastrado");
    });
}

function c(m) {
    console.log(m);
}//console alias

function almocoRolando(msg) {
    let text = ("O Almoço do dia já está rolando.");
    let replyMarkup = bot.inlineKeyboard([
        [
            bot.inlineButton('Convocar', {callback: 'convocar'}),
            bot.inlineButton('Sugestões', {callback: 'sugestoes'}),
            bot.inlineButton('Votar', {callback: 'votar'})
        ]
    ]);
    bot.sendMessage(msg.chat.id, text, {replyMarkup}).then(function () {
        console.log('Menu Aberto');
    }).catch(console.error);
}

function iniciarAlmoco(msg) {
    var text = 'O ' + msg.from.first_name + ' já esta com fome. Querem uma votação de local? Ou uma sugestão?';
    let replyMarkup = bot.inlineKeyboard([
        [
            bot.inlineButton('Convocar', {callback: 'convocar'}),
            bot.inlineButton('Sugestões', {callback: 'sugestoes'})
        ]
    ]);
    bot.sendMessage(msg.chat.id, text, {replyToMessage: msg.message_id, replyMarkup}).then(response=>{
        let mpapa = response.result.message_id;
        let sql = 'update ALMOCO set MID="'+mpapa+'" where dia = '+numDia();
        db.run(sql,[],(err)=>{
            if(err){
                console.log('inicia Almoço:',err)
            }
        });
        bot.pinChatMessage(msg.chat.id, mpapa).catch((err)=>{
            c(err);
        });
    }).catch(console.error);

}

function numDia() {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    var newdate = day + "" + month + "" + year;
    return newdate;
}

function votosComputados(msg){
    let temvotos = "select LOCAL.nome, count(idl) v from VOTOS join LOCAL on VOTOS.idl = LOCAL.ID where VOTOS.IDA="+numDia()+" group by local.NOME ";
    vcomp = [];
    db.all(temvotos, [], (err, rows) => {
        if (err) {
            console.log('temvotos: ' + err)
        }
        rows.forEach((row) => {
            let v = [];
            v.nome = row.NOME;
            v.votos = row.v;
            vcomp.push(v);
        });
        let chatId = msg.chat.id;
        db.all('select MID from ALMOCO where dia ='+numDia(),[],(err,rows)=>{
            rows.forEach((row)=>{
                mpapa= row.MID;
            });
            let messageId = mpapa;
            let votos = 'Votos para o Almoço: ';
            for(let i=0; i<vcomp.length;i++){
                votos+=fl(vcomp[i].nome)+': <b>'+vcomp[i].votos +' </b>\n-- ';
            }
            console.log('mensagem é :'+mpapa);
            bot.editMessageText(
                {chatId, messageId}, votos ,
                {parseMode: 'html'}
            ).catch(error => console.log('Error:', error));
        });
   });
}

function criarAlmoco(msg) {
    var newdate = numDia();
    let us = 'INSERT INTO ALMOCO(DIA,IDU,HORAINI) VALUES("' + Number(newdate) + '","' + msg.from.id + '", DATETIME("now","localtime"))';
    db.run(us, [], function (err) {
        if (err) {
            c('criarAlmoço: '+err);
            almocoRolando(msg);
        }
        else {
            console.log("Novo Almoço");
            iniciarAlmoco(msg);
        }

    });
}

function votar(msg, local) {
    var IDA = numDia();
    var IDL = local.id;
    var IDU = msg.from.id;
    let us = 'INSERT INTO VOTOS(IDA,IDL,IDU) VALUES("' + Number(IDA) + '","' + IDL + '","' + IDU + '")';
    try{
        db.run(us, [], function (err) {
            if (err) {
                c('votar: '+err);

                var ms = "Você já votou hoje " + msg.from.first_name + ". Quer mudar o voto?";
                let replyMarkup = bot.inlineKeyboard([
                    [
                        bot.inlineButton('Sim', {callback: 'mudarVoto'})
                    ]
                ]);
                return bot.sendMessage(msg.chat.id, ms, {replyToMessage: msg.message_id, replyMarkup}).then(function () {
                    c('Menu Aberto');
                }).catch(console.error);

            }
            else {
                msg.reply.text(local.cmt);
                msg.reply.text(msg.from.first_name + " votou " + local.nome);
                votosComputados(msg)
            }
        });
    }catch(er){
        c('votar2: '+err);


    }



}

function sugestoes(msg) {
    let tempo = [];
    request(
        {
            method: 'GET',
            uri: 'http://apiadvisor.climatempo.com.br/api/v1/forecast/locale/5959/days/15?token=d1a53d8bd839ef8fe1b710ae942ba1d0',
            gzip: true
        }
        , function (error, response, body) {
            if(error){
                c('Sugestoes:', error); // Print the error if one occurred
                //c('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                //c('body:', body); // Print the HTML for the Google homepage.
                //c('server encoded the data as: ' + (response.headers['content-encoding'] || 'identity'))
            }

            let t = JSON.parse(body);
            tempo.chove = seraChuva(t.data[0].rain.probability);
            tempo.max = t.data[0].temperature.afternoon.max;
            tempo.min = t.data[0].temperature.afternoon.min;
            tempo.frase = t.data[0].text_icon.text.phrase.reduced;
            //c(msg);
            try {
                var chatId = msg.message.chat.id;
                c('t')
            }catch(e){
                c('c');
                var chatId = msg.chat.id;
            }


            //let txt = "Eu analiso o tempo e as viadagem particulares para dar estas sugestões, lembre-se de votar";
            bot.sendMessage(chatId, 'hoje o tempo é ' + tempo.frase + '. Deixa eu pensar aqui um pouco.')
                .then((msg)=>{sugere(tempo, msg)})
                .catch(
                    function (err) {
                        c('Sugestoes2:'+err);
                    });
        });
}

function fl(string) {//primeira letra em maiuscula
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function sugere(tempo, msg) {

    let locaistempo = [];
    let nogusta = "select * from LOCAL lc where lc.id not in ( select ng.idl from VOTOS vt join NOGUSTA ng on ng.idu = vt.idu where vt.ida="+numDia()+") and lc.chuva >= "+tempo.chove+" and lc.temperatura >="+tempo.max+" and lc.pessoasmax >= (select count(IDA) from VOTOS where IDA ="+numDia()+")";
    db.serialize(function () {
        db.all(nogusta, [], (err, rows) => {
            if (err) {
                c('Sugere:'+err);
            }

            rows.forEach((row) => {
                let l = [];
                l.nome = row.NOME;
                l.id = row.ID;
                l.distancia = row.DISTANCIA;
                l.valor = row.VALOR;
                l.max = row.PESSOASMAX;
                l.temp = row.TEMPERATURA;
                l.non = row.NONGRATA;
                l.nota = row.NOTA;
                l.chuva = row.CHUVA;
                l.lat = row.LAT;
                l.long = row.LONG;
                l.cmt = row.COMENT;
                l.alias = row.ALIAS;
                locaistempo.push(l);
            });
            if (rows.length >= 10) {

                let n = Math.floor(Math.random() * 10);
                bot.sendMessage(msg.chat.id, 'Bem, olhando o tempo dá pra ir em qualquer lugar. Que tal ' + locaistempo[n].nome + '?')
                    .then(function(){

                    }
                    )
                    .catch(
                        function (err) {
                            c('Sugere2'+err);
                        });
            }
            else{
                let nomes = '';
                for(let i=0;i<locaistempo.length;i++){
                    if(i===0){
                        nomes+= fl(locaistempo[i].nome);
                    }else{
                        if(i===locaistempo.length-1){
                            nomes+=' ou ' +fl(locaistempo[i].nome);
                        }else{
                            nomes+=', '+fl(locaistempo[i].nome);
                        }
                    }

                    c('Sugere3:'+nomes);
                }
                c(nogusta);
                try {
                    var chatId = msg.message.chat.id;
                    c('t')
                }catch(e){
                    c('c');
                    var chatId = msg.result.chat.id;
                }
                bot.sendMessage(chatId, 'Pra hoje tenho estas sugestões: '+nomes)
                    .then(function(){

                        }
                    )
                    .catch(
                        function (err) {
                            c('Sugere4'+err);
                        });
            }
        });
    });
}

function seraChuva(prob) {
    if (prob > 70) {
        return 2//certeza que chove, chove muito
    }
    if (prob > 40 && prob < 70) {
        return 1//pode chover, chove pouco
    }
    if (prob < 40) {
        return 0//Não chove
    }

}

function convocar(msg) {
    let sql = 'SELECT * FROM USERS';
    db.all(sql, [], (err, rows) => {
        if (err) {
            c('convocar erro: ' + err)
        }
        rows.forEach((row) => {
            let l = [];
            l.nome = row.NOME;
            l.id = row.ID;
            l.cmt = row.MENSAGEM;
            chamar(l);
        });
    });

}

function mudarVoto(msg){
    let uy = 'DELETE FROM VOTOS WHERE IDU ='+ msg.from.id +' AND IDA ='+numDia();
    db.serialize(
        function(){
            try{
                db.run(uy);
            }catch(e){
                c("não consegui apagar "+e);
                return
            }
            //c(msg);
            bot.sendMessage(msg.chat.id, 'Pronto, '+msg.from.first_name+' pode votar novamente');
        }
    )
}

function chamar(l) {
    bot.sendMessage(l.id, l.cmt).then(function () {
        c('chamei');
    }).catch((err)=> {
        c(err);
    });
}

/*
 let replyMarkup = bot.inlineKeyboard([
 [
 bot.inlineButton('Convocar todos?', {callback: 'convocar'}),
 bot.inlineButton('Não', {inline: 'some query'})
 ], [
 bot.inlineButton('Quenta', {url: 'https://telegram.org'})
 ]
 ]);

 bot.sendMessage(msg.chat.id, text, {replyMarkup}).then(function() {
 c('--');
 c(keyboard);
 c('--');
 }).catch(console.error);
 var keyboardStr = [
 {text:'Sandwich',callback_data:'sandwich'},
 {text:'A juicy steak',callback_data:'steak'}
 ];

 var keyboard = bot.inlineKeyboard(keyboardStr);

 bot.on('text', (msg) =>{
 var txt = msg.text;
 if(txt.includes('almoço')){
 var text = 'Já estão com fome?';

 let replyMarkup = bot.inlineKeyboard([
 [
 bot.inlineButton('Convocar todos', {callback: 'this_is_data'}),
 bot.inlineButton('Não', {inline: 'some query'})
 ], [
 bot.inlineButton('teste', {url: 'https://telegram.org'})
 ]
 ]);

 bot.sendMessage(msg.chat.id, text, {replyMarkup}).then(function() {
 c('--');
 c(keyboard);
 c('--');
 }).catch(console.error);
 }
 });

 // On commands
 bot.on(['/start', '/back'], msg => {

 let replyMarkup = bot.keyboard([
 ['/buttons', '/inlineKeyboard'],
 ['/start', '/hide']
 ], {resize: true});

 return bot.sendMessage(msg.from.id, 'Keyboard example.', {replyMarkup});

 });

 // Buttons
 bot.on('/buttons', msg => {

 let replyMarkup = bot.keyboard([
 [bot.button('contact', 'Your contact'), bot.button('location', 'Your location')],
 ['/back', '/hide']
 ], {resize: true});

 return bot.sendMessage(msg.from.id, 'Button example.', {replyMarkup});

 });

 // Hide keyboard
 bot.on('/hide', msg => {
 return bot.sendMessage(
 msg.from.id, 'Hide keyboard example. Type /back to show.', {replyMarkup: 'hide'}
 );
 });

 // On location on contact message
 bot.on(['location', 'contact'], (msg, self) => {
 return bot.sendMessage(msg.from.id, `Thank you for ${ self.type }.`);
 });

 // Inline buttons
 bot.on('/inlineKeyboard', msg => {

 let replyMarkup = bot.inlineKeyboard([
 [
 bot.inlineButton('callback', {callback: 'this_is_data'}),
 bot.inlineButton('inline', {inline: 'some query'})
 ], [
 bot.inlineButton('url', {url: 'https://telegram.org'})
 ]
 ]);

 return bot.sendMessage(msg.from.id, 'Inline keyboard example.', {replyMarkup});

 });

 // Inline button callback
 bot.on('callbackQuery', msg => {
 // User message alert
 return bot.answerCallbackQuery(msg.id, `Inline button callback: ${ msg.data }`, true);
 });

 // Inline query
 bot.on('inlineQuery', msg => {

 const query = msg.query;
 const answers = bot.answerList(msg.id);

 answers.addArticle({
 id: 'query',
 title: 'Inline Query',
 description: `Your query: ${ query }`,
 message_text: 'Click!'
 });

 return bot.answerQuery(answers);

 });
 */
vai();
bot.start();