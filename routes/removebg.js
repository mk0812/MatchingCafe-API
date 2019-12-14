var express = require('express');
var router = express.Router();

//const upDir ='/Users/kosuke_matsuoka/Pictures/testfolder/'
const upDir = '/Users/ban/Pictures/testfolder/studyData/no-bg-back'
const custumViewUrl ='https://japaneast.api.cognitive.microsoft.com/customvision/v3.0/Prediction/8cff8e09-1e6b-44c9-943a-47b99567af39/classify/iterations/Iteration1/image'

var request = require('request');
var fs = require('fs');
const { PredictionAPIClient } = require("@azure/cognitiveservices-customvision-prediction");

// File  Upload
var multer = require('multer');
var upload = multer({ dest: upDir });

// endpoint1: save the no-bg-image localy
router.post('/', upload.single('data'), (req, res)=> {
    console.log('in test');
    const file = req.file
    const meta = req.body
    // デッバグのため、アップしたファイルの名前を表示する
    console.log(req.file.path);
    console.log('start removebg');
    request.post({
        url: 'https://api.remove.bg/v1.0/removebg',
        formData: {
            //image_file: fs.createReadStream(req.files.path),
            image_file: fs.createReadStream(upDir + '/'+ req.file.filename),
            size: 'auto',
        },
        headers: {
            'X-Api-Key': ''
        },
        encoding: null
    }, function(error, response, body) {
    if(error) return console.error('Request failed:', error);
    if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
    fs.writeFileSync(upDir + '/' + "no-bg-test3.png", body);
    });
    // アップ完了したら200ステータスを送る
    res.status(200).json({msg: 'no-bg-test3.png'});
});

router.get('/selectbg/:filename', async function (req, res) {
    const predictionKey = "6f04ba8636eb4db9b0e5d5422c5ebc00";
    const predictor = new PredictionAPIClient(predictionKey, custumViewUrl);
    const testFile = fs.readFileSync(upDir + '/'+ req.params.filename);
    const publishIterationName = "Iteration1";
    const projectId = "8cff8e09-1e6b-44c9-943a-47b99567af39";
    const results = await predictor.classifyImage(projectId, publishIterationName, testFile);

    console.log("Results:");
    if (results.predictions[0].probability < results.predictions[1].probability) {
        res.json(`\t ${results.predictions[1].tagName}: ${(results.predictions[1].probability * 100.0).toFixed(2)}%`)
    } else {
        res.json(`\t ${results.predictions[0].tagName}: ${(results.predictions[0].probability * 100.0).toFixed(2)}%`)
    }
});

module.exports = router;