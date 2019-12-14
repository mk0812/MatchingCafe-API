var express = require('express');
var router = express.Router();

const upDir ='/Users/kosuke_matsuoka/Pictures/testfolder/'

var request = require('request');
var fs = require('fs');

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
            'X-Api-Key': 'QTeiSWTvCVARL2F2raXUqXDh'
        },
        encoding: null
    }, function(error, response, body) {
    if(error) return console.error('Request failed:', error);
    if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
    fs.writeFileSync("/Users/kosuke_matsuoka/Pictures/testfolder/no-bg-test3.png", body);
    });
    // アップ完了したら200ステータスを送る
    res.status(200).json({msg: 'no-bg-test3.png'});
});

router.get('/selectbg/:filename', function (req, res) {
    res.json({bg: 'bg3.png'});
    // 賢いAIがおすすめ BackGround 選んでくれれば完成
});

module.exports = router;