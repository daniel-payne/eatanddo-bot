const builder = require('botbuilder');

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

module.exports.WELCOME_DIALOG = 'WELCOME_DIALOG'
module.exports.HELP_DIALOG    = 'HELP_DIALOG'

module.exports.welcomeDialog = [
    (session) => {    
        session.userData.firstRun = true;
        session.send(WELCOME_MESSAGE).endDialog();
    }   
]