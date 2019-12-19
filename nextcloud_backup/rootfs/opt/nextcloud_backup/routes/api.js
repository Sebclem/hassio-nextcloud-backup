const express = require('express');
const router = express.Router();
const moment = require('moment');
const statusTools = require('../tools/status');
const WebdavTools = require('../tools/webdavTools')
const webdav = new WebdavTools().getInstance();
const hassioApiTools = require('../tools/hassioApiTools');
const settingsTools = require('../tools/settingsTools');




router.get('/status', (req, res, next) => {
    let status = statusTools.getStatus();
    res.json(status);
});





router.get('/formated-local-snap', function(req, res, next) {
    hassioApiTools.getSnapshots().then(
        (snaps) => {
            res.render('localSnaps', { snaps: snaps, moment: moment });
        },
        (err) => {
            console.log(err);
            res.status(500);
            res.send('');
        })

});

router.get('/formated-remote-manual', function(req, res, next) {
    webdav.init(true, 'cloud.seb6596.ovh', 'admin', 'WPHRG-4jwCw-i8eqg-mtiao-Kmwrw').then(() => {
        console.log('success');
    }, (err) => {
        console.log('failure');
        console.log(err);
    })

});


router.post('/nextcloud-settings', function(req, res, next){
    console.log("ok");
    let settings = req.body;
    if(settings.host !== null && settings.host !== "" && settings.username !== null && settings.password !== null){
        settingsTools.setSettings(settings);
        res.status(201);
        res.send();
    }
    else{
        res.status(400);
        res.send();
    }
});


module.exports = router;