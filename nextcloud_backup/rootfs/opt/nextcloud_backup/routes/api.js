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
            // TODO sort snaps by date
            snaps.sort((a, b) =>{
                if(moment(a.date).isBefore(moment(b.date)))
                    return 1;
                else
                    return -1;
            })
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


router.post('/nextcloud-settings', function(req, res, next) {
    let settings = req.body;
    if (settings.ssl != null && settings.host != null && settings.host != "" && settings.username != null && settings.password != null) {
        webdav.setConf(settings);
        webdav.confIsValid().then(() => {
            res.status(201);
            res.send();
        }).catch((err) => {
            res.status(406);
            res.json({ message: err });
        });

    }
    else {
        res.status(400);
        res.send();
    }
});

router.get('/nextcloud-settings', function(req, res, next) {
    let conf = webdav.getConf();
    if (conf == null) {
        res.status(404);
        res.send();
    }
    else {
        res.json(conf);
    }
});



router.post('/manual-backup', function(req, res, next) {
    let id = req.query.id;
    let name = req.query.name;
    hassioApiTools.downloadSnapshot(id)
        .then(() => {
            webdav.uploadFile(id, '/Hassio Backup/Manual/' + name + '.tar');
            res.status(201);
            res.send();
        })
        .catch(() => {
            res.status(500)
            res.send();
        })

});

router.post('/new-backup', function(req, res, next) {
    
    let name = 'Manual-' + moment().format('YYYY-MM-DD_HH:mm');
    hassioApiTools.createNewBackup(name).then((id) => {
        hassioApiTools.downloadSnapshot(id)
            .then(() => {
                webdav.uploadFile(id, '/Hassio Backup/Manual/' + name + '.tar');
            }).catch(() => {

            })
    }).catch(() => {

    })
    res.status(201);
    res.send();
});

module.exports = router;