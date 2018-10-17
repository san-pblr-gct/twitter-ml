const Twitter = require('twitter');
const config = require('./config.js');
var admin = require('firebase-admin');
const serviceAccount=require('./serviceAccount.json');
const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient({
  projectId: serviceAccount.projectId,
  keyFilename: './serviceAccount.json'
})


const text = 'Hello, world!';

var document = {
  content: text,
  type: 'PLAIN_TEXT',
};

// Detects the sentiment of the text
function analyzeSentiment(textToBeAnalyzed) {
  document.content = textToBeAnalyzed;
  client
  .analyzeSentiment({document: {
    content: textToBeAnalyzed,
    type: 'PLAIN_TEXT'
  }})
  .then(results => {
    const sentiment = results[0].documentSentiment;

    console.log(`Text: ${textToBeAnalyzed}`);
    console.log(`Sentiment score: ${sentiment.score}`);
    console.log(`Sentiment magnitude: ${sentiment.magnitude}`);
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
}


const T = new Twitter(config);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: ""
  });
var db = admin.firestore();

// Set up your search parameters
const params = {
  q: '#MeToo',
  count: 1000,
  result_type: 'recent',
  lang: 'en'
}
// Initiate your search using the above paramaters
T.get('search/tweets', params, (err, data, response) => {
  // If there is no error, proceed
  if(err){
    return console.log(err);
  }
  // Loop through the returned tweets
  const tweetsId = data.statuses.map(tweet => {
    if ((tweet.text != undefined) && (tweet.text.substring(0,2) != 'RT')) {
      db.collection('tweets').doc(tweet.id_str).set(tweet);
      analyzeSentiment(tweet.text);
    }
  })
  
});
