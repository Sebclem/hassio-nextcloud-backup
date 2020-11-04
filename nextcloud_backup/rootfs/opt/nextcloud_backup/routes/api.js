const express = require('express');
const router = express.Router();
const moment = require('moment');
const statusTools = require('../tools/status');
const WebdavTools = require('../tools/webdavTools')
const webdav = new WebdavTools().getInstance();
const settingsTools = require('../tools/settingsTools');
const pathTools = require('../tools/pathTools');
const hassioApiTools = require('../tools/hassioApiTools');
const humanFileSize = require('../tools/toolbox').humanFileSize;

const cronTools = require('../tools/cronTools');

const logger = require('../config/winston');





router.get('/status', (req, res, next) => {
    cronTools.updatetNextDate();
    let status = statusTools.getStatus();
    res.json(status);
});





router.get('/formated-local-snap', function(req, res, next) {
    hassioApiTools.getSnapshots().then(
        (snaps) => {
            snaps.sort((a, b) => {
                if (moment(a.date).isBefore(moment(b.date))){
                    return 1;
                }
                else
                {
                    return -1;
                }
                    
            })
            res.render('localSnaps', { snaps: snaps, moment: moment });
        },
        (err) => {
            logger.error(err);
            res.status(500);
            res.send('');
        })

});

router.get('/formated-backup-manual', function(req, res, next) {
    webdav.getFolderContent( webdav.getConf().back_dir + pathTools.manual)
        .then((contents) => {
            contents.sort((a, b) => {
                if (moment(a.lastmod).isBefore(moment(b.lastmod)))
                    return 1;
                else
                    return -1;
            })
            res.render('backupSnaps',{backups: contents, moment: moment, humanFileSize: humanFileSize});
        }).catch(()=>{
            res.send();
        });

});

router.get('/formated-backup-auto', function(req, res, next) {
    let url = webdav.getConf().back_dir + pathTools.auto
    webdav.getFolderContent( url )
        .then((contents) => {
            contents.sort((a, b) => {
                if (moment(a.lastmod).isBefore(moment(b.lastmod)))
                    return 1;
                else
                    return -1;
            })
            res.render('backupSnaps',{backups: contents, moment: moment, humanFileSize: humanFileSize});
        }).catch(()=>{
            res.send();
        });
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
    let status = statusTools.getStatus();
    if (status.status == "creating" && status.status == "upload" && status.status == "download") {
        res.status(503);
        res.send();
        return;
    }

    hassioApiTools.downloadSnapshot(id)
        .then(() => {
            webdav.uploadFile(id,  webdav.getConf().back_dir + pathTools.manual + name + '.tar');
            res.status(201);
            res.send();
        })
        .catch(() => {
            res.status(500)
            res.send();
        })

});

router.post('/new-backup', function(req, res, next) {

    let status = statusTools.getStatus();
    if (status.status === "creating" && status.status === "upload" && status.status === "download") {
        res.status(503);
        res.send();
        return;
    }
    let name = 'Manual-' + moment().format('YYYY-MM-DD_HH-mm');
    hassioApiTools.createNewBackup(name).then((id) => {
        hassioApiTools.downloadSnapshot(id)
            .then(() => {
                webdav.uploadFile(id, webdav.getConf().back_dir + pathTools.manual + name + '.tar');
            }).catch(() => {

            })
    }).catch(() => {

    })
    res.status(201);
    res.send();
});


router.get('/backup-settings', function(req, res, next) {
    res.send(settingsTools.getSettings());
});

router.post('/backup-settings', function(req, res, next) {
    if (cronTools.checkConfig(req.body)) {
        settingsTools.setSettings(req.body);
        cronTools.startCron();
        res.send();
    }
    else {
        res.status(400);
        res.send();
    }
});

router.post('/clean-now', function(req, res, next){
    webdav.clean().then(()=>{
        hassioApiTools.clean().catch();
    }).catch(()=>{
        hassioApiTools.clean().catch();
    });
    res.status(201);
    res.send()
});


router.post('/restore', function(req, res, next){
    if(req.body['path'] != null){
        webdav.downloadFile(req.body['path'] ).then((path)=>{
            hassioApiTools.uploadSnapshot(path);
        });
        res.status(200);
        res.send()
    }
    else{
        res.status(400);
        res.send()
    }
});



module.exports = router;
