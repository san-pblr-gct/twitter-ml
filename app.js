const Twitter = require('twitter');
const config = require('./config.js');
var admin = require('firebase-admin');
const serviceAccount=require('./serviceAccount.json');
const T = new Twitter(config);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: ""
  });
var db = admin.firestore();

// Set up your search parameters
const params = {
  q: 'mannargudi',
  count: 20,
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
    db.collection('tweets').doc(tweet.id_str).set(tweet);
  });   
});
