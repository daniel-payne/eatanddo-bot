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

var ADD_DIALOG = 'ADD_DIALOG'

const WELCOME_MESSAGE =
`### Welcom to nutrition calculator 
I can calculate the calories for your meal. 
For example say 
> ADD 50g of rye bread 15 grams of peanut butter and 5 grams of butter

or to see the nutration breakdown of the items you have added

> SHOW or BREAKDOWN

or to save the meal to your food diary

> SAVE

or to see these options again

> HELP`

const STARTUP_MESSAGE = 
` ### I dont have any items for Today's Breakfast say somthing like: 
> ADD 50g of rye bread 15 grams of peanut butter and 5grams of butter`

const DONT_UNDERSTAND_MESSAGE = 
`Sorry, I am not sure what you mean. Say: HELP to get a list of the things i can do`

var bot = new builder.UniversalBot(connector, [
    (session) => {
      session.send(session.message.text)
      builder.Prompts.text(session, STARTUP_MESSAGE);
    },
    (session) => {
      const { text } = session.message  

      if (text.substr(0,3).toUpperCase === 'ADD'){
        session.beginDialog(ADD_DIALOG, text)
      }
      else if (Number.isInteger(+text.charAt(0))){
        session.beginDialog(ADD_DIALOG, text)  
      } else {
        session.send(DONT_UNDERSTAND_MESSAGE)
      }

      
    },
    (session, results) => {
      session.sendTyping()

      setTimeout(() =>{ 
        session.send("The Government doesn't want you to be fat!");
        session.endConversation();          
      }, 3000);
    },
]).set('storage', inMemoryStorage); 

bot.dialog(ADD_DIALOG, [
    (session, args) => { 
        const newText = args || session.message.text;        
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
bot.dialog('showFoods', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        // new builder.HeroCard(session)
        //     .title("30 g Chicken")
        //     .subtitle("Chicken meat, average roasted")
        //     .text("204 calories 14g protine 6g Carbs (2 Sug) 8g Fat (6g Sat) ")
        //     .buttons([
        //         builder.CardAction.imBack(session, "change weight of 30g chicken", "Change Weight"),
        //         builder.CardAction.imBack(session, "change nutritiona information for 30g chicken", "Choose a different food")
        //     ]),
        //     new builder.HeroCard(session)
        //     .title("30 g Chicken")
        //     .subtitle("Chicken meat, average roasted")
        //     .text("204 calories 14g protine 6g Carbs (2 Sug) 8g Fat (6g Sat) ")
        //     .buttons([
        //         builder.CardAction.imBack(session, "change weight of 30g chicken", "Change Weight"),
        //         builder.CardAction.imBack(session, "change nutritional information for 30g chicken, today's breakfast", "Choose a different food")
        //     ]),
        //     new builder.HeroCard(session)
        //     .title("30 g Chicken")
        //     .subtitle("Chicken meat, average roasted")
        //     .text("204 calories 14g protine 6g Carbs (2 Sug) 8g Fat (6g Sat) ")
        //     .buttons([
        //         builder.CardAction.imBack(session, "change weight of 30g chicken", "Change Weight"),
        //         builder.CardAction.imBack(session, "change nutritiona information for 30g chicken", "Choose a different food")
        //     ]),
            new builder.ReceiptCard(session)
            .title("Breakfast")
            .facts([
                builder.Fact.create(session, 'Calories',           '1342'),
                builder.Fact.create(session, 'Carbs',              '12.6')
            ])
            .buttons([
                builder.CardAction.postBack(session, 'BREAKDOWN', 'Show BREAKDOWN'),
            ])


    ]);
    session.send('Todays Breakfast').send(msg).endDialog();
}).triggerAction({ matches: /^(show|list)/i })



bot.dialog('HELP', function (session) {    
    session.userData.firstRun = true;
    session.send(WELCOME_MESSAGE).endDialog();
}).triggerAction({ matches: /^HELP/i });

bot.dialog('firstRun', function (session) {    
    session.userData.firstRun = true;
    session.send(WELCOME_MESSAGE).endDialog();
}).triggerAction({
    onFindAction: function (context, callback) {
        if (!context.userData.firstRun) {
            callback(null, 1.1);
        } else {
            callback(null, 0.0);
        }
    }
});

// bot.on('conversationUpdate', function (message) {
//     if (message.membersAdded && message.membersAdded.length > 0) {
//         var reply = new builder.Message()
//                 .address(message.address)
//                 .text(WELCOME_MESSAGE);
//         bot.send(reply);
//     }  
// });

app.post('/api/messages', connector.listen());

app.listen(portHTTP, function () {
  console.log('HTTP http://localhost:' + portHTTP); //eslint-disable-line no-console
});

 


