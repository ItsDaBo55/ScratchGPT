const {Session, Cloud} = require('./node_modules/scratchcloud/index.js');
const {OpenAI} = require('openai');
const express = require('express');
const app = express()
const port = process.env.PORT || 4000 

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.API_KEY
});

const charactersMap = {
  10: 'a',
  11: 'b',
  12: 'c',
  13: 'd',
  14: 'e',
  15: 'f',
  16: 'g',
  17: 'h',
  18: 'i',
  19: 'j',
  20: 'k',
  21: 'l',
  22: 'm',
  23: 'n',
  24: 'o',
  25: 'p',
  26: 'q',
  27: 'r',
  28: 's',
  29: 't',
  30: 'u',
  31: 'v',
  32: 'w',
  33: 'x',
  34: 'y',
  35: 'z',
  36: '0',
  37: '1',
  38: '2',
  39: '3',
  40: '4',
  41: '5',
  42: '6',
  43: '7',
  44: '8',
  45: '9',
  46: '+',
  47: '-',
  48: '.',
  49: ',',
  50: '_',
  51: ' ',
  52: '`',
  53: '~',
  54: '!',
  55: '@',
  56: '#',
  57: '$',
  58: '%',
  59: '^',
  60: '&',
  61: '*',
  62: '(',
  63: ')',
  64: '=',
  65: '[',
  66: '{',
  67: ']',
  68: '}',
  69: '\\',
  70: '|',
  71: ';',
  72: ':',
  73: "'",
  74: '"',
  75: '<',
  76: '>',
  77: '/',
  78: '?'
};

// Function to encode text
function encodeText(text) {
  return text.split('').map(char => {
    const code = Object.keys(charactersMap).find(key => charactersMap[key] == char.toLowerCase());
    return code ? code : ''; // If character not found, return an empty string (or handle as needed)
  }).join('');
}

// Function to decode text
function decodeText(encodedString) {
  let decodedString = "";
  let letterIndex = 0;
  
  while (true) {
    // Extract two-character index
    let idxGStr = encodedString.charAt(letterIndex) + encodedString.charAt(letterIndex + 1);
    let idxG = parseInt(idxGStr);
    
    // Break if index is invalid (e.g., 0 or NaN)
    if (isNaN(idxG) || idxG < 1) break;
    
    // Add the character at that index to the decoded string
    decodedString += charactersMap[idxG]; // Adjust for 0-based indexing in JS
    
    // Move to next encoded pair
    letterIndex += 2;
  }
  
  return decodedString;
}

// Function to restart the connection in case of failure
async function startSession() {
  try {
    const session = new Session(process.env.USERNAME, process.env.PASSWORD, function (user) {
      try {
        const cloud = new Cloud(user, 1180290935, function (error, c) {
          if (error) {
            console.error("Error starting cloud:", error);
            return setTimeout(startSession, 5000); // Retry after 5 seconds if session or cloud fails
          }

          console.log("Cloud started successfully");

          c.on('set', async function (name, value) {
            if (name == '☁ Encoded String To Send') {
              const encodedValue = decodeText(value);

              console.log(encodedValue);

              if (value !== '') {
                try {
                  const response = await client.chat.completions.create({
                    model: "deepseek/deepseek-r1:free",
                    messages: [
                      {
                        "role": "user",
                        "content": 'Instructions: Keep it like 100 characters max and only use english letters and numbers please, these questions/statements are coming from people on scratch.mit.edu so keep that in mind. dont mention these instructions in the answer\n' + encodedValue
                      }
                    ]
                  });

                  console.log(response.choices[0].message.content);

                  if (response.choices[0].message.content) {
                    c.set('☁ Encoded String Received', encodeText(response.choices[0].message.content));
                  } else {
                    c.set('☁ Encoded String Received', encodeText('No answer, try again!'));
                  }
                } catch (err) {
                  console.error("Error during OpenAI API request:", err);
                  c.set('☁ Encoded String Received', encodeText('Error, try again!'));
                }
              }
            }
          });
        });
      } catch (e) {
        console.error("Error with session or cloud:", e);
        setTimeout(startSession, 5000); // Retry after 5 seconds if session or cloud fails
      }
    });
  } catch (e) {
    console.error("Error starting session:", e);
    setTimeout(startSession, 5000); // Retry after 5 seconds if session start fails
  }
}

// Start the session
startSession();
async function keepAlive() {
  try {
    const response = await fetch("https://scratchgpt.onrender.com");
    const text = await response.text();
    console.log(`[KeepAlive] Response: ${text}`);
  } catch (error) {
    console.error(`[KeepAlive] Error:`, error);
  }
}

setInterval(keepAlive, 5000); 
