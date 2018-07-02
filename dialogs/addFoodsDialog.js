const builder = require('botbuilder')
const fetch = require('node-fetch')
const Promise = require('node-promise').Promise

const {entryDataRecognizer} = require('../recognizers/entryDataRecognizer')

module.exports.ADD_FOODS_DIALOG    = 'ADD_FOODS_DIALOG'

module.exports.addFoodsDialog = [
  (session, args) => { 
    const newText = args || session.message.text        
    const oldData = session.privateConversationData.scratchPad      
    const newData = entryDataRecognizer(newText)

    if (newText !== 'no' && newText !== 'yes' ){
      if (oldData && oldData.lines) {
        newData.lines = [...oldData.lines, ...newData.lines]
      }
      
      session.privateConversationData.scratchPad = Object.assign({}, oldData, newData)
    }

    if(args && args.reprompt){
      session.send('What else would you like to add ?')
    }else {
      builder.Prompts.text(session, 'Is that everything ?')
    }        
        
  },
  (session, results, next) => {
    const response = results ? results.response.toUpperCase() : null

    if (response === 'YES'){

      session.send('Checking each of your items to see if we have nutritional information') 
      session.sendTyping()

      let promises = []

      let choices = []
            
      session.privateConversationData.scratchPad.lines.forEach(line => {
        promises.push(
          fetch(
            `https://eatanddo-rest.azurewebsites.net/search/foodnames?match=${line.foodText}&count=${10} `
          )
            .then(response => {
              if (response.status !== 200) {
                // console.log('ERROR /search/foodnames: ' + response.status)
                return
              }
                    
              return response.json()
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
      })


    } else {
      session.replaceDialog('GREETING_DIALOG', { reprompt: true })
    }
  },
  (session, results) => {
    session.dialogData.partySize = results ? results.response : null
    session.endDialog()
  }
]