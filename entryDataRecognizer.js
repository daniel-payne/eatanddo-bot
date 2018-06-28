const TODAY          = "TODAY";
const YESTERDAY      = "YESTERDAY";
const BREAKFAST      = "BREAKFAST";
const LUNCH          = "LUNCH";
const DINNER         = "DINNER";
const SNACKS         = "SNACKS";
const BREAKFAST_TIME = "Breakfast";
const LUNCH_TIME     = "Lunch";
const DINNER_TIME    = "Dinner";
const SNACKS_TIME    = "Snacks";


module.exports.TODAY          = TODAY         
module.exports.YESTERDAY      = YESTERDAY     
module.exports.BREAKFAST      = BREAKFAST     
module.exports.LUNCH          = LUNCH         
module.exports.DINNER         = DINNER        
module.exports.SNACKS         = SNACKS        
module.exports.BREAKFAST_TIME = BREAKFAST_TIME
module.exports.LUNCH_TIME     = LUNCH_TIME    
module.exports.DINNER_TIME    = DINNER_TIME   
module.exports.SNACKS_TIME    = SNACKS_TIME   

const REPLACMENTS = [
  { word: "today's", replace: "", token: TODAY },
  { word: "todays", replace: "", token: TODAY },
  { word: "today", replace: "", token: TODAY },

  { word: "yesterday's", replace: "", token: YESTERDAY },
  { word: "yesterdays", replace: "", token: YESTERDAY },
  { word: "yesterday", replace: "", token: YESTERDAY },

  { word: "breakfast", replace: "", token: BREAKFAST },
  { word: "lunch", replace: "", token: LUNCH },
  { word: "dinner", replace: "", token: DINNER },
  { word: "snacks", replace: "", token: SNACKS },
  { word: "snack", replace: "", token: SNACKS },

  { word: "one hundred ", replace: "100 " },

  { word: "half ", replace: "0.5 " },
  { word: "quater  ", replace: "0.25 " },
  { word: "three quaters  ", replace: "0.75 " },

  { word: "one ", replace: "1 " },
  { word: "two ", replace: "2 " },
  { word: "three ", replace: "3 " },
  { word: "four ", replace: "4 " },
  { word: "five ", replace: "5 " },
  { word: "six ", replace: "6 " },
  { word: "seven ", replace: "7 " },
  { word: "eight ", replace: "8 " },
  { word: "nine ", replace: "9 " },

  { word: "ten ", replace: "10 " },
  { word: "twenty ", replace: "20 " },
  { word: "thirity ", replace: "30 " },
  { word: "fourty ", replace: "40 " },
  { word: "fifity ", replace: "50 " },
  { word: "sixity ", replace: "60 " },
  { word: "seventy ", replace: "70 " },
  { word: "eighty ", replace: "80 " },
  { word: "ninity ", replace: "90 " }
];

const UNIT_MATCHES = [
  { word: "g", replace: "grams" },
  { word: "gram", replace: "grams" },
  { word: "grams", replace: "grams" }
];

const DAYS = 86400000;

function entryDataRecognizer(input) {
  let output = input;
  let tokens = [];

  const now = new Date();

  let dayDate;
  let mealtime;
  let lines = [];

  REPLACMENTS.forEach(item => {
    if (output.indexOf(item.word) > -1) {
      output = output.replace(item.word, item.replace);

      if (item.token) {
        tokens = [...tokens, item.token];
      }
    }
  });

  output = output.trim();

  if (tokens.indexOf(TODAY) > -1) {
    dayDate = now.toISOString();
  } else if (tokens.indexOf(YESTERDAY) > -1) {
    dayDate = new Date(now - 1 * DAYS).toISOString();
  }

  if (tokens.indexOf(BREAKFAST) > -1) {
    mealtime = BREAKFAST_TIME;
  } else if (tokens.indexOf(LUNCH) > -1) {
    mealtime = LUNCH_TIME;
  } else if (tokens.indexOf(DINNER) > -1) {
    mealtime = DINNER_TIME;
  } else if (tokens.indexOf(SNACKS) > -1) {
    mealtime = SNACKS_TIME;
  }

  lines = extractLinesFromData(output);

  return { dayDate, mealtime, lines };
}

function extractLinesFromData(input) {
  let output = [];
  let lastChar;
  let stringArray = input.split("");
  let text = "";
  let quantity = "";
  let isQuantity;
  let unit = "";
  let foodText = "";
  let saveNewItem = false;
  let firstWord;

  stringArray.forEach((item, i) => {
    saveNewItem = false;
    isQuantity = false;

    if (
      lastChar &&
      lastChar === " " &&
      item !== " " &&
      item !== "." &&
      Number.isInteger(+item) === true
    ) {
      saveNewItem = true;
    } else if (i === stringArray.length - 1) {
      text = text + item;
      saveNewItem = true;
    }

    if (item !== " " && (item === "." || Number.isInteger(+item) === true)) {
      isQuantity = true;
    }

    if (saveNewItem === true) {
      foodText = text.replace(quantity, "");

      const matches = foodText.trim().match(/^([\w-]+)/gm);

      if (matches && matches.length > -1) {
        firstWord = matches[0];
      }

      UNIT_MATCHES.some(item => {
        if (item.word === firstWord) {
          unit = item.replace;

          foodText = foodText.replace(firstWord, "").trim();

          return true;
        }
        return false;
      });

      foodText = foodText.trim();
      foodText = foodText.replace(/^of\s+/gm, "");
      foodText = foodText.replace(/^a\s+/gm, "");
      foodText = foodText.replace(/\s+and$/gm, "");

      text = text.trim();
      text = text.replace(/\s+and$/gm, "");

      text = text.replace("0.25 ", "quater ");
      text = text.replace("0.5 ", "half ");
      text = text.replace("0.75 ", "three quaters ");

      const newItem = {
        text,

        quantity: +quantity,
        unit,

        amountText: quantity + unit + " " + foodText,
        foodText
      };

      output.push(newItem);

      text = item;
      quantity = "";
      unit = "";
      foodText = "";
      saveNewItem = false;

      quantity = isQuantity === true ? item : "";
    } else {
      text = text + item;

      quantity = isQuantity === true ? quantity + item : quantity;
    }

    lastChar = item;
  });

  return output;
}

module.exports.entryDataRecognizer = entryDataRecognizer;
