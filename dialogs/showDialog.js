const builder = require('botbuilder');

module.exports.SHOW_DIALOG    = 'SHOW_DIALOG';

module.exports.showDialog = [

   (session) => {
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
    }
]