const express = require('express');
const session = require('express-session');
const router = express.Router();
const appwrite = require('node-appwrite');
require('dotenv').config();

let client = new appwrite.Client();
const database = new appwrite.Databases(client);


client
    .setEndpoint(process.env.ENDPOINT) // Your API Endpoint
    .setProject(process.env.PROJECT) // Your project ID
    .setKey(process.env.API_KEY_APPWRITE) // Your secret API key
    .setSelfSigned() // Use only on dev mode with a self-signed SSL cert
    ;
/* GET users listing. */


router.get('/', async function (req, res, next) {
    if (!(req.query.questId) || !(req.query.curr)) return next(new Error("inserire id domanda"));
    if (isNaN(req.query.curr)) return next(new Error("inserire un numero per indicare la domanda corrente"));
    // session not initialized
    if (!(req.session.currentQuest)) {
        req.session.currentQuest = 1;
        req.session.corrects = 0;
    }
    if (req.session.finishiedQuiz) return next(new Error("quiz terminato domanda non accessibile"));

    if (req.query.curr != req.session.currentQuest) return next(new Error("domanda non accessibile"));


    // qui si fanno altri controlli

    try {
        const question = await database.getDocument(
            '674df1c4000a29030dcd', // databaseId
            '674df20e0014fa862aee', // collectionId
            req.query.questId, // documentId
        );

        if (question.nth != req.query.curr) return next(new Error("ordine delle domande non corrispondente"));



        const answers = await database.listDocuments(
            '674df1c4000a29030dcd', // databaseId
            '674df2250021164fb13d', // collectionId
            [appwrite.Query.equal("question_id", [question.$id])] // queries (optional)
        );


        res.render('question', {
            title: question.title,
            current_question: question.$id,
            question_answ: answers.documents,
            next_quest_nth: req.session.currentQuest,
        });
    } catch (error) {

        return next(new Error("non siamo riusciti a trovare la domanda"));
    }

});

router.get('/answer', async function (req, res, next) {
    if (!(req.query.questId) || !(req.query.curr)) return next(new Error("inserire id domanda"));
    if (isNaN(req.query.curr)) return next(new Error("inserire un numero per indicare la domanda corrente"));

    // qui si fanno altri controlli

    // controlli
    // check di id domanda
    // check sessione
    try {
        const question = await database.getDocument(
            '674df1c4000a29030dcd', // databaseId
            '674df20e0014fa862aee', // collectionId
            req.query.questId, // documentId
        );

        if (question.correct.$id === req.query.answerId) {
            req.session.corrects++;
        }

        if (!question.next_question_id) {
            req.session.finishiedQuiz = true;
            
            return res.redirect('/gift'); // metti il render
        }
        req.session.currentQuest++;
        res.redirect("/question?questId=" + question.next_question_id + "&curr=" + req.session.currentQuest);

    } catch (error) {

        return next(new Error("non siamo riusciti a trovare la domanda"));
    }



});



module.exports = router;
