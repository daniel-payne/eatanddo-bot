var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');

const fetch = require('node-fetch')

var builder = require('botbuilder');

var {entryDataRecognizer} = require('./entryDataRecognizer');

var portHTTP = process.env.port || 3854;


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


app.get('/test', function (req, res) {
  res.send('{"serverTime": "' + (new Date()).toISOString().slice(0, 19) + '"}');
});

var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

var inMemoryStorage = new builder.MemoryBotStorage();

var GREETING_DIALOG = 'GREETING_DIALOG'

var bot = new builder.UniversalBot(connector, [
    (session) => {
      builder.Prompts.text(session, 
`### Welcom to nutrition calculator 
I can calculate the calories for your meal. 
For example say 
> Today's breakfast was 50g of rye bread 15 grams of peanut butter and 5grams of butter?`
     );
    },
    (session, results) => {
      session.beginDialog(GREETING_DIALOG)
    },
    (session, results) => {
      session.sendTyping()

      setTimeout(() =>{ 
        session.send("The Government doesn't want you to be fat!");
        session.endConversation();          
      }, 3000);
    },
]).set('storage', inMemoryStorage); 

bot.dialog(GREETING_DIALOG, [
    (session, args) => { 
        const newText = session.message.text;        
        const oldData = session.privateConversationData.scratchPad;      
        const newData = entryDataRecognizer(newText);

        if (newText !== 'no' && newText !== 'yes' ){
            if (oldData && oldData.lines) {
                newData.lines = [...oldData.lines, ...newData.lines];
              }
      
              session.privateConversationData.scratchPad = Object.assign({}, oldData, newData);
        }

        if(args && args.reprompt){
            session.send("What else would you like to add ?");
        }else {
            builder.Prompts.text(session, "Is that everything ?");
        }        
        
    },
    (session, results, next) => {
        const response = results ? results.response.toUpperCase() : null;

        if (response === 'YES'){

            const x =JSON.stringify(session.privateConversationData.scratchPad) ;

            session.send("Checking each of your items to see if we have nutritional information"); 
            session.sendTyping()

            let promises = [];

            let choices = []
            
            session.privateConversationData.scratchPad.lines.forEach(line => {
                promises.push(
                    fetch(
                        `https://eatanddo-rest.azurewebsites.net/search/foodnames?match=${line.foodText}&count=${10} `
                      )
                        .then(response => {
                          if (response.status !== 200) {
                            console.log("ERROR /search/foodnames: " + response.status);
                            return;
                          }
                    
                          return response.json();
                        }).catch(err => {
                            session.send(err)
                        }) 
                )
            })

            Promise.all(promises).then(results => {
                results.forEach(result => {
                    choices.push(result[0].foodName)
                }) 

                choices.push('All items are ok')

                builder.Prompts.choice(session, 'If any of our choices are wrong please click on one to change the food choice', choices, {
                    listStyle: builder.ListStyle.button
                })

                next()
            });


        } else {
            session.replaceDialog('GREETING_DIALOG', { reprompt: true })
        }


    },
    (session, results) => {
        session.dialogData.partySize = results ? results.response : null;
        session.endDialog()
    }
]);

// Add dialog to return list of shirts available
bot.dialog('showShirts', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title("30 g Chicken")
            .subtitle("Chicken meat, average roasted")
            .text("204 calories 14g protine 6g Carbs (2 Sug) 8g Fat (6g Sat) ")
            .buttons([
                builder.CardAction.imBack(session, "change weight of 30g chicken", "Change Weight"),
                builder.CardAction.imBack(session, "change nutritiona information for 30g chicken", "Choose a different food")
            ]),

    ]);
    session.send(msg).endDialog();
}).triggerAction({ matches: /^(show|list)/i })

app.post('/api/messages', connector.listen());

app.listen(portHTTP, function () {
  console.log('HTTP http://localhost:' + portHTTP); //eslint-disable-line no-console
});

 


