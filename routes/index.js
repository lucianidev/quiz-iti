const express = require('express');
const router = express.Router();
const appwrite = require('node-appwrite');
let client = new appwrite.Client();

const database = new appwrite.Databases(client);
require('dotenv').config();

client
    .setEndpoint(process.env.ENDPOINT) // Your API Endpoint
    .setProject(process.env.PROJECT) // Your project ID
    .setKey(process.env.API_KEY_APPWRITE) // Your secret API key
    .setSelfSigned() // Use only on dev mode with a self-signed SSL cert
    ;
/* GET home page. */
router.get('/start', async function(req, res, next) {
  try {
    const questions = await database.listDocuments(
      '674df1c4000a29030dcd', // databaseId
      '674df20e0014fa862aee', // collectionId
      [appwrite.Query.limit(1)]
  );
  if(questions.total === 0) return next(new Error("impossibile trovare domanda"));
  res.redirect('/question?questId=' + questions.documents[0].$id + '&curr=1')
  
  } catch (error) {
    console.log(error);
    
    return next(new Error("impossibile trovare domanda"));
  }

});

module.exports = router;
