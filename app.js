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
  q: 'virat kohli',
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

      var requestObject = {"document":{
        content: tweet.text,
        type: 'PLAIN_TEXT',
      },
      "encodingType": "UTF-8",
      "features": {
        "extractSyntax": false,
        "extractEntities": true,
        "extractDocumentSentiment": true,
        "extractEntitySentiment": true,
        "classifyText": true,
      }};
    
      client
      .annotateText(requestObject)
      .then(results => {
        tweet.NLP = results[0];
        db.collection('tweets').doc(tweet.id_str).set(tweet);
      })
      .catch(err => {
        console.log(err);
      });
    }
  })
});
