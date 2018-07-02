const express    = require('express');
const app        = express();
const bodyParser = require('body-parser');

const fetch = require('node-fetch')

const builder = require('botbuilder');



const { defaultDialog } = require('./dialogs/defaultDialog');
const { WELCOME_DIALOG, HELP_DIALOG, welcomeDialog } = require('./dialogs/welcomeDialog');
const { ADD_FOODS_DIALOG, addFoodsDialog } = require('./dialogs/addFoodsDialog');
const { SHOW_DIALOG, showDialog } = require('./dialogs/showDialog');

const portHTTP = process.env.port || 3854;


const allowCrossDomain = function (req, res, next) {

  res.header('Access-Control-Allow-Origin',  '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma',        'no-cache');
  res.header('Expires',       '0');

  next();
};

const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

const inMemoryStorage = new builder.MemoryBotStorage();

const bot = new builder.UniversalBot(connector,defaultDialog).set('storage', inMemoryStorage); 

bot.dialog(ADD_FOODS_DIALOG, addFoodsDialog)
.triggerAction({ 
    matches: /^(show|list)/i 
});

bot.dialog(SHOW_DIALOG, showDialog)
.triggerAction({ 
    matches: /^(show|list)/i 
})

bot.dialog(WELCOME_DIALOG, welcomeDialog)
.triggerAction({
    onFindAction: function (context, callback) {
        if (!context.userData.firstRun) {
            callback(null, 1.1);
        } else {
            callback(null, 0.0);
        }
    }
});

bot.dialog(HELP_DIALOG, welcomeDialog)
.triggerAction({ 
    matches: /^HELP/i 
});

// bot.on('conversationUpdate', function (message) {
//     if (message.membersAdded && message.membersAdded.length > 0) {
//         var reply = new builder.Message()
//                 .address(message.address)
//                 .text(WELCOME_MESSAGE);
//         bot.send(reply);
//     }  
// });

app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.text());

app.get('/test', function (req, res) {
  res.send('{"serverTime": "' + (new Date()).toISOString().slice(0, 19) + '"}');
});

app.post('/api/messages', connector.listen());

app.listen(portHTTP, function () {
  console.log('HTTP http://localhost:' + portHTTP); //eslint-disable-line no-console
});

 


