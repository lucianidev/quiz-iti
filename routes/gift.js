const express = require('express');
const session = require('express-session');
const qrcode = require('qrcode');
const router = express.Router();
const appwrite = require('node-appwrite');
require('dotenv').config();
let client = new appwrite.Client();

const database = new appwrite.Databases(client);
const correctQuestions = Number(process.env.NUM_OF_QUESTION); 


client
    .setEndpoint(process.env.ENDPOINT) // Your API Endpoint
    .setProject(process.env.PROJECT) // Your project ID
    .setKey(process.env.API_KEY_APPWRITE) // Your secret API key
    .setSelfSigned() // Use only on dev mode with a self-signed SSL cert
    ;


router.get('/', async function(req,res,next) {
    if(!(req.session.finishiedQuiz)) return next(new Error("quiz non terminato perfavore completare il quiz"));
    if(!(req.session.corrects === correctQuestions)) return res.render("gift", {qrDataGift : '',hasWon : false,});

    if(req.session.gift) {
        const alreadyGeneratedCode = await qrcode.toDataURL(req.session.gift);
        return res.render("gift", {
            qrDataGift : alreadyGeneratedCode,
            hasWon : true,
        })
    }
    try {
        const giftCode = await database.createDocument(
            '674df1c4000a29030dcd', // databaseId
            '674f7375000c9a6e99fa', // gift codes id
            appwrite.ID.unique(), // documentId
            {
                approved : false,
            }, // data
        );
        
        
        const qrCodeData =  `${req.protocol}://${req.get('host')}/gift/sign?code=${giftCode.$id}`; 
        
        const qrCodeOfGiftCodeSign = await qrcode.toDataURL(qrCodeData);
        
        req.session.gift = qrCodeData;
        res.render("gift", {
            qrDataGift : qrCodeOfGiftCodeSign,
            qrCodeDebug : qrCodeData,
            hasWon : true,
        })
    } catch (error) {
        
        return next(new Error("non siamo riusciti a generare il tuo codice"));
    }

})

router.get('/sign', async function(req,res,next) {
    if(!(req.query.code)) return next(new Error("specificare un giftcode"));
    if(!(req.query.operatorcode)) return res.render("giftSign", {
        success : false,
        message : '',
        giftCode : req.query.code,
    });
    if(isNaN(req.query.operatorcode)) return next(new Error("specificare un codice operatore numerico"));
    
    try {
        const giftCode = await database.getDocument(
            '674df1c4000a29030dcd', // 
            '674f7375000c9a6e99fa', // gift codes
            req.query.code, // documentId
        );
        
        if(!giftCode) return res.render('giftsign' ,{
            message : 'codice non valido',
            success : false,
            giftCode : req.query.code,
        });
        if(giftCode.approved) return res.render('giftsign' ,{
            message : 'codice già approvato',
            success : false,
            giftCode : req.query.code,
        });
        
        const operatorCode = await database.listDocuments(
            '674df1c4000a29030dcd', // 
            '674f7640003e68cdb664', // operator codes
            [appwrite.Query.equal("approval_code", [Number(req.query.operatorcode)])], // documentId
        );
        
        if(!operatorCode.total) return res.render('giftsign' ,{
            message : 'codice operatore non valido',
            success : false,
            giftCode : req.query.code,
        });
        await database.updateDocument(
            '674df1c4000a29030dcd', // databaseId
            '674f7375000c9a6e99fa', // collectionId
            req.query.code, // documentId
            {
                approved : true,
            },
        );
        
        return res.render('giftSign' ,{
            giftCode : req.query.code,
            message : 'codice valido',
            success : true,
        });
    } catch (error) {
        
        return next(new Error("non siamo riusciti a generare il tuo codice"));
    }

})

module.exports = router;