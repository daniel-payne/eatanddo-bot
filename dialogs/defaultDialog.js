const builder = require('botbuilder');

const { ADD_FOODS_DIALOG } = require('./addFoodsDialog');

const STARTUP_MESSAGE = 
` ### I dont have any items for Today's meals say somthing like: 
> ADD 50g of rye bread 15 grams of peanut butter and 5grams of butter`

const DONT_UNDERSTAND_MESSAGE = 
`Sorry, I am not sure what you mean. Say: HELP to get a list of the things i can do`

 module.exports.defaultDialog = [
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
        session.beginDialog(ADD_FOODS_DIALOG, text)  
      } else {
        session.send(DONT_UNDERSTAND_MESSAGE)
      }

      
    },
    (session, results) => {
      session.sendTyping()

      setTimeout(() =>{ 
        session.send("The Government does not want you to be fat!");
        session.endConversation();          
      }, 3000);
    },
]