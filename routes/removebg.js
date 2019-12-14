var express = require('express');
var router = express.Router();

//const upDir ='/Users/kosuke_matsuoka/Pictures/testfolder/'
const tmpDir = '/Users/ban/Pictures/testfolder/studyData/tmp/'
const upDir = '/Users/ban/Pictures/testfolder/studyData/no-bg/'
const bgDir = '/Users/ban/Pictures/testfolder/studyData/bg/'
const custumViewUrl ='https://japaneast.api.cognitive.microsoft.com/customvision/v3.0/Prediction/8cff8e09-1e6b-44c9-943a-47b99567af39/classify/iterations/Iteration1/image'

var request = require('request');
var fs = require('fs');
const { PredictionAPIClient } = require("@azure/cognitiveservices-customvision-prediction");

// File  Upload
var multer = require('multer');
var upload = multer({ dest: tmpDir });

const sharp = require('sharp');
const sizeOf = require('image-size')

// endpoint1: save the no-bg-image localy
router.post('/', upload.single('data'), (req, res)=> {
    console.log('in test');
    const filename = req.file.filename + '.png'
    // デッバグのため、アップしたファイルの名前を表示する
    console.log(req.file.path);
    console.log('start removebg');
    request.post({
        url: 'https://api.remove.bg/v1.0/removebg',
        formData: {
            //image_file: fs.createReadStream(req.files.path),
            image_file: fs.createReadStream(tmpDir + req.file.filename),
            size: 'auto',
        },
        headers: {
            'X-Api-Key': 'zUDXQupBUaa5MZjiPfdKQRem'
        },
        encoding: null
    }, function(error, response, body) {
    if(error) return console.error('Request failed:', error);
    if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
    fs.writeFileSync(upDir + filename, body);
    });
    // sharp(upDir + "no-bg-tmp.png").resize(null,417).toFile(upDir+'save/'+'no-bg-tmp-resize.png', (err, info)=>{
    //     if(err){
    //       throw err
    //     }
    //     console.log(info)
    // });
    // アップ完了したら200ステータスを送る
    res.status(200).json({name: filename});
});

// 背景特徴 endpoint
router.get('/selectbg/:filename', async function (req, res) {
    const predictionKey = "6f04ba8636eb4db9b0e5d5422c5ebc00";
    const predictor = new PredictionAPIClient(predictionKey, custumViewUrl);
    //const testFile = fs.readFileSync(upDir+'save/'+req.params.filename);
    const testFile = fs.readFileSync(upDir + req.params.filename);
    const publishIterationName = "Iteration1";
    const projectId = "8cff8e09-1e6b-44c9-943a-47b99567af39";
    const results = await predictor.classifyImage(projectId, publishIterationName, testFile);

    console.log("Results:");
    if (results.predictions[0].probability < results.predictions[1].probability) {
        res.json({ "tag" : results.predictions[1].tagName });
    } else {
        res.json({ "tag" : results.predictions[0].tagName });
    }
});

// 画像編集 endpoint
router.post('/editimage/:filename', async function (req, res) {
    console.log(JSON.stringify(req.body))
    const idx =req.params.filename.indexOf('.png');
    const filename = req.params.filename.slice(0, idx)
    console.log(filename);
    const dimensions = sizeOf(bgDir + 'bg1.jpg');
    const resize_height = Math.ceil(4*(dimensions.height/5))


    // 人物画サイズ変更
    if(req.body.grayscale === "true"){
        await sharp(upDir + req.params.filename).resize(null,resize_height).grayscale().toFile(upDir+'save/'+req.params.filename)
        .then(data => {
            //console.log(data);
        })
        .catch(err => {
            console.error(err);
        });
    } else {
        await sharp(upDir + req.params.filename).resize(null,resize_height).toFile(upDir+'save/'+req.params.filename)
        .then(data => {
            //console.log(data);
        })
        .catch(err => {
            console.error(err);
        });
    }

    // 背景画像の合成
    if(req.body.grayscale === "true"){
        await sharp(bgDir + 'bg1.jpg').composite([{
            input: upDir+'save/'+req.params.filename,
            top: parseInt(req.body.top),
            left: parseInt(req.body.left)
        }]).grayscale().toFile(upDir+'save/'+filename +'-compositite-gray.png')
        .then(data =>{
            //console.log(data);
            console.log('save: '+upDir+'save/'+filename + '-compositite.png')
        })
        .catch(err => {
            console.error(err);
        });
        res.json({name: filename+'-compositite-gray.png'});
    } else {
        await sharp(bgDir + 'bg1.jpg').composite([{
            input: upDir+'save/'+req.params.filename,
            top: parseInt(req.body.top),
            left: parseInt(req.body.left)
        }]).toFile(upDir+'save/'+filename + '-compositite.png')
        .then(data =>{
            //console.log(data);
            console.log('save: '+upDir+'save/'+filename + '-compositite.png')
        })
        .catch(err => {
            console.error(err);
        });
        res.json({name: filename+'-compositite.png'});
    }
    // // グレースケールに変更
    // if(req.body.grayscale === "true"){
    //     console.log('grayscale start');
    //     //filename = req.params.filename+'-compositite-gray.png'
    //     await sharp(upDir+'save/'+filename + '.png').grayscale().toFile(upDir+'save/'+filename+'-gray.png')
    //     .then(data =>{
    //         console.log(data);
    //     })
    //     .catch(err => {
    //         console.error(err);
    //     });
    //     return res.json({name: filename+'-gray.png'});
    // }
    //res.json({name: filename});
});

module.exports = router;