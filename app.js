const Twitter = require('twitter');
const config = require('./config.js');
var admin = require('firebase-admin');
const serviceAccount=require('./serviceAccount.json');
const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient({
  projectId: serviceAccount.projectId,
  keyFilename: './serviceAccount.json'
})

const T = new Twitter(config);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: ""
  });
var db = admin.firestore();

// Set up your search parameters
const params = {
  q: '#MeToo',
  count: 10,
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
      //db.collection('tweets').doc(tweet.id_str).set(tweet);

      var document = {
        content: tweet.text,
        type: 'PLAIN_TEXT',
      };
      
      var EntitySentimentPromise = new Promise((resolve, reject) => {
        client
        .analyzeEntitySentiment({document: document})
        .then(results => {
          resolve(results[0]);
        })
        .catch(err => {
          reject(err);
        });
      });

      var ClassifyPromise = new Promise((resolve, reject) => {
        client
          .classifyText({document: document})
          .then(results => {
            resolve(results[0]);
          })
          .catch(err => {
            reject(err);
          });
      });
      
      Promise.all([EntitySentimentPromise, ClassifyPromise]).then(function(values){
        tweet.EntitySentiment = values[0];
        tweet.Classification = values[1];
        db.collection('tweets').doc(tweet.id_str).set(tweet);
        // console.log(tweet.EntitySentiment && tweet.EntitySentiment[0]);
      })
    }
  })
});
