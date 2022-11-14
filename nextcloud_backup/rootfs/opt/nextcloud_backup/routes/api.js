import express from 'express';
import * as statusTools from "../tools/status.js"
import webdav from "../tools/webdavTools.js"
import * as settingsTools from "../tools/settingsTools.js"
import * as pathTools from "../tools/pathTools.js"
import * as hassioApiTools from "../tools/hassioApiTools.js"
import { humanFileSize } from "../tools/toolbox.js";
import cronTools from "../tools/cronTools.js"
import logger from "../config/winston.js"
import {DateTime} from "luxon";

var router = express.Router();

router.get("/status", (req, res, next) => {
    cronTools.updateNextDate();
    let status = statusTools.getStatus();
    res.json(status);
});

router.get("/formated-local-snap", function (req, res, next) {
    hassioApiTools.getSnapshots()
        .then((snaps) => {
            snaps.sort((a, b) => {
                return Date.parse(b.date) - Date.parse(a.date);
            });

            res.render("localSnaps", { snaps: snaps, DateTime: DateTime });
        })
        .catch((err) => {
                logger.error(err);
                res.status(500);
                res.send("");
            }
        );
});

router.get("/formated-backup-manual", function (req, res, next) {
    if (webdav.getConf() == null) {
        res.send("");
        return;
    }
    webdav
        .getFolderContent(webdav.getConf().back_dir + pathTools.manual)
        .then((contents) => {
            contents.sort((a, b) => {
                return Date.parse(b.lastmod) - Date.parse(a.lastmod)
            });
            //TODO Remove this when bug is fixed, etag contain '&quot;' at start and end ?
            for (let backup of contents) {
                backup.etag = backup.etag.replace(/&quot;/g, '');
            }
            res.render("backupSnaps", { backups: contents, DateTime: DateTime, humanFileSize: humanFileSize });
        })
        .catch((err) => {
            res.status(500)
            res.send(err);
        });
});

router.get("/formated-backup-auto", function (req, res, next) {
    if (webdav.getConf() == null) {
        res.send("");
        return;
    }
    let url = webdav.getConf().back_dir + pathTools.auto;
    webdav
        .getFolderContent(url)
        .then((contents) => {
            contents.sort((a, b) => {
                return Date.parse(b.lastmod) - Date.parse(a.lastmod)
            });
            //TODO Remove this when bug is fixed, etag contain '&quot;' at start and end ?
            for (let backup of contents) {
                backup.etag = backup.etag.replace(/&quot;/g, '');
            }
            res.render("backupSnaps", { backups: contents, DateTime: DateTime, humanFileSize: humanFileSize });
        })
        .catch((err) => {
            res.status(500)
            res.send(err);
        });
});

router.post("/nextcloud-settings", function (req, res, next) {
    let settings = req.body;
    if (settings.ssl != null && settings.host != null && settings.host !== "" && settings.username != null && settings.password != null) {
        webdav.setConf(settings);
        webdav
            .confIsValid()
            .then(() => {
                res.status(201);
                res.send();
            })
            .catch((err) => {
                res.status(406);
                res.json({ message: err });
            });
    } else {
        res.status(400);
        res.send();
    }
});

router.get("/nextcloud-settings", function (req, res, next) {
    let conf = webdav.getConf();
    if (conf == null) {
        res.status(404);
        res.send();
    } else {
        res.json(conf);
    }
});

router.post("/manual-backup", function (req, res, next) {
    let id = req.query.id;
    let name = req.query.name;
    let status = statusTools.getStatus();
    if (status.status === "creating" && status.status === "upload" && status.status === "download") {
        res.status(503);
        res.send();
        return;
    }

    hassioApiTools
        .downloadSnapshot(id)
        .then(() => {
            webdav.uploadFile(id, webdav.getConf().back_dir + pathTools.manual + name + ".tar").then(()=>{
                res.status(201);
                res.send();
            }).catch(()=>{
                    res.status(500);
                    res.send();
            }
            );

        })
        .catch(() => {
            res.status(500);
            res.send();
        });
});

router.post("/new-backup", function (req, res, next) {
    let status = statusTools.getStatus();
    if (status.status === "creating" || status.status === "upload" || status.status === "download" || status.status === "stopping" || status.status === "starting") {
        res.status(503);
        res.send();
        return;
    }
    hassioApiTools.stopAddons()
        .then(() => {
            hassioApiTools.getVersion()
                .then((version) => {
                    let name = settingsTools.getFormatedName(true, version);
                    hassioApiTools.createNewBackup(name)
                        .then((id) => {
                            hassioApiTools
                                .downloadSnapshot(id)
                                .then(() => {
                                    webdav.uploadFile(id, webdav.getConf().back_dir + pathTools.manual + name + ".tar")
                                        .then(() => {
                                            hassioApiTools.startAddons().catch(() => {
                                            })
                                        }).catch(()=>{});
                                }).catch(()=>{});
                        }).catch(()=>{});
                }).catch(()=>{});
        })
        .catch(() => {
            hassioApiTools.startAddons().catch(() => {
            });
        });


    res.status(201);
    res.send();
});

router.get("/backup-settings", function (req, res, next) {
    hassioApiTools.getAddonList().then((addonList) => {
        let data = {};
        data['folders'] = hassioApiTools.getFolderList();
        data['addonList'] = addonList;
        data['settings'] = settingsTools.getSettings();
        res.send(data);
    })

});

router.post("/backup-settings", function (req, res, next) {
    let [result, message] = settingsTools.check(req.body)
    if (result) {
        settingsTools.setSettings(req.body);
        cronTools.init();
        res.send();
    } else {
        res.status(400);
        res.send(message);
    }
});

router.post("/clean-now", function (req, res, next) {
    webdav
        .clean()
        .then(() => {
            hassioApiTools.clean().catch();
        })
        .catch(() => {
            hassioApiTools.clean().catch();
        });
    res.status(201);
    res.send();
});

router.post("/restore", function (req, res, next) {
    if (req.body["path"] != null) {
        webdav.downloadFile(req.body["path"]).then((path) => {
            hassioApiTools.uploadSnapshot(path).catch();
        });
        res.status(200);
        res.send();
    } else {
        res.status(400);
        res.send();
    }
});

export default router;
    