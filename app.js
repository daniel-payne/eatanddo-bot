var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');

var builder = require('botbuilder');

var {extractEntryData} = require('./extractEntryData');

var portHTTP = process.env.port || 1337;

var allowCrossDomain = function (req, res, next) {

  res.header('Access-Control-Allow-Origin',  '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma',        'no-cache');
  res.header('Expires',       '0');

  next();
};

app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.text());


app.get('/', function (req, res) {
  res.send('{"serverTime": "' + (new Date()).toISOString().slice(0, 19) + '"}');
});

var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

var inMemoryStorage = new builder.MemoryBotStorage();

var GREETING_DIALOG = 'GREETING_DIALOG'

// This is a dinner reservation bot that uses a waterfall technique to prompt users for input.
var bot = new builder.UniversalBot(connector, [
    (session) => {
        session.send("Welcom to nutrition calculator, I can calculate the calories for your meal.");
        session.privateConversationData.scratchPad = { }
        builder.Prompts.text(session, "For example say 'Today's breakfast was 50g of rye bread 15 grams of peanut butter and 5grams of butter?");
    },
    (session, results) => {
      session.beginDialog(GREETING_DIALOG)
    },
    (session, results) => {
        session.send("You fat bastard");
        session.sendTyping()
        //session.endConversation();
      },
]).set('storage', inMemoryStorage); // Register in-memory storage 

bot.dialog(GREETING_DIALOG, [
    (session, args) => { 
        const oldData = session.privateConversationData.scratchPad;      
        const newData = extractEntryData(session.message.text);

        if (oldData.lines) {
          newData.lines = [...oldData.lines, ...newData.lines];
        }

        session.privateConversationData.scratchPad = Object.assign({}, oldData, newData);

        if(args && args.reprompt){
            session.send("What else would you like to add ?");
        }else {
            builder.Prompts.text(session, "Is that everything ?");
        }        
        
    },
    (session, results) => {
        const response = results ? results.response.toUpperCase() : null;

        if (response === 'YES'){

            const x =JSON.stringify(session.privateConversationData.scratchPad) ;

            session.send("Checking each of your items to see if we have nutritional information"); 

            let choices = session.privateConversationData.scratchPad.lines.map(line => {
                return line.foodText
            })

            choices.push('All items are ok')

            builder.Prompts.choice(session, 'If any of our choices are wrong please click on one to change the food choice', choices, {
                listStyle: builder.ListStyle.button
            })
        } else {
            session.replaceDialog('GREETING_DIALOG', { reprompt: true })
        }


    },
    (session, results) => {
        session.dialogData.partySize = results ? results.response : null;
        session.endDialog()
    }
]);

app.post('/api/messages', connector.listen());

app.listen(portHTTP, function () {
  console.log('HTTP http://localhost:' + portHTTP); //eslint-disable-line no-console
});

 


