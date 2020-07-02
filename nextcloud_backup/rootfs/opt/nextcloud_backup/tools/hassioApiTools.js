const request = require('request');
const progress = require('request-progress');
const statusTools = require('./status');
const fs = require('fs');
const settingsTools = require('./settingsTools');
const moment = require('moment');
const logger = require('../config/winston');

// !!! FOR DEV PURPOSE ONLY !!!
//put token here for dev (ssh port tunelling 'sudo ssh -L 80:hassio:80 root@`hassoi_ip`' + put 127.0.0.1 hassio into host)
const fallbackToken = "337c70d10b65879325f87d3082dff5a126692f3047d5a0b93d729c156e48f33052fe888779a7a9ba0ec175cddaae601f26682965ebbfb43e"


function getSnapshots() {
    return new Promise((resolve, reject) => {
        let token = process.env.HASSIO_TOKEN;
        if (token == null) {
            token = fallbackToken
        }
        let status = statusTools.getStatus();
        let option = {
            url: "http://hassio/snapshots",
            headers: { 'X-HASSIO-KEY': token },
            json: true
        };
        request(option, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                if (status.error_code === 1) {
                    status.status = "idle";
                    status.message = null;
                    status.error_code = null;
                    statusTools.setStatus(status);
                }
                let snaps = body.data.snapshots;
                // console.log(snaps);
                resolve(snaps);
            }
            else {
                status.status = "error";
                status.message = "Fail to fetch Hassio snapshot (" + error + ")";
                status.error_code = 1;
                statusTools.setStatus(status);
                logger.error(status.message);
                reject(error);
            }
        })
    });

}

function downloadSnapshot(id) {
    return new Promise((resolve, reject) => {
        logger.info('Downloading snapshot ' + id + '...');
        if (!fs.existsSync('./temp/'))
            fs.mkdirSync('./temp/');
        let stream = fs.createWriteStream('./temp/' + id + '.tar');
        let token = process.env.HASSIO_TOKEN;
        if (token == null) {
            token = fallbackToken
        }
        let status = statusTools.getStatus();
        checkSnap(id).then(() => {
            status.status = "download";
            status.progress = 0;
            statusTools.setStatus(status);
            let option = {
                url: 'http://hassio/snapshots/' + id + '/download',
                headers: { 'X-HASSIO-KEY': token },
            };
            progress(request(option))
                .on('progress', (state) => {
                    // TODO Don't write progress to disk, preseve disk IO time
                    status.progress = state.percent;
                    statusTools.setStatus(status);
                })
                .on('error', (error) => {
                    status.status = "error";
                    status.message = "Fail to download Hassio snapshot (" + error + ")";
                    status.error_code = 1;
                    statusTools.setStatus(status);
                    logger.error(status.message);
                    reject(error);
                })
                .on('end', () => {
                    logger.info('Download success !')
                    status.progress = 1;
                    statusTools.setStatus(status);
                    logger.debug("Snapshot dl size : " +  (fs.statSync('./temp/' + id + '.tar').size / 1024 / 1024))
                    resolve();
                })
                .pipe(stream);
        }).catch(() => {
            status.status = "error";
            status.message = "Fail to download Hassio snapshot. Not found ?";
            status.error_code = 1;
            statusTools.setStatus(status);
            logger.error(status.message);
            reject();
        });

    });
}

function dellSnap(id) {
    return new Promise((resolve, reject) => {
        checkSnap(id).then(() => {
            let token = process.env.HASSIO_TOKEN;
            if (token == null) {
                token = fallbackToken
            }
            let option = {
                url: 'http://hassio/snapshots/' + id + '/remove',
                headers: { 'X-HASSIO-KEY': token },
                json: true
            }
            request.post(option, (error, response, body) => {
                if (error || (response.statusCode !== 200 && response.statusCode !== 204))
                    reject();
                else
                    resolve();
            })
        }).catch(() => {
            reject();
        })
    })

}

function checkSnap(id) {
    return new Promise((resolve, reject) => {
        let token = process.env.HASSIO_TOKEN;
        if (token == null) {
            token = fallbackToken
        }
        let option = {
            url: 'http://hassio/snapshots/' + id + '/info',
            headers: { 'X-HASSIO-KEY': token },
            json: true
        }
        request(option, (error, response, body) => {
            if (error || response.statusCode != 200)
                reject();
            else{
                logger.debug("Snapshot size: " + body.data.size)
                resolve();
            }
                
        })
    });

}


function createNewBackup(name) {
    return new Promise((resolve, reject) => {
        let status = statusTools.getStatus();
        status.status = "creating";
        status.progress = -1;
        statusTools.setStatus(status);
        logger.info("Creating new snapshot...")
        let token = process.env.HASSIO_TOKEN;
        if (token == null) {
            token = fallbackToken
        }
        let option = {
            url: 'http://hassio/snapshots/new/full',
            headers: { 'X-HASSIO-KEY': token },
            json: true,
            body: { name: name },
            timeout: 2400000
        }
        request.post(option, (error, response, body) => {
            if (response.statusCode !== 200) {
                status.status = "error";
                status.message = "Can't create new snapshot (" + error + ")";
                status.error_code = 5;
                statusTools.setStatus(status);
                logger.error(status.message);
                reject(status.message);
            }
            else {
                body.data.slug;
                logger.info('Snapshot created with id ' + body.data.slug);
                resolve(body.data.slug);
            }
        });
    });
}

function clean() {
    let limit = settingsTools.getSettings().auto_clean_backup_keep;
    if (limit == null)
        limit = 5;
    return new Promise((resolve, reject) => {
        getSnapshots().then(async (snaps) => {
            if (snaps.length < limit) {
                resolve();
                return;
            }
            snaps.sort((a, b) => {
                if (moment(a.date).isBefore(moment(b.date)))
                    return 1;
                else
                    return -1;
            });
            let toDel = snaps.slice(limit);
            for (let i in toDel) {
                await dellSnap(toDel[i].slug)
            }
            logger.info('Local clean done.')
            resolve();
        }).catch(() => {
            reject();
        });
    })
}

exports.getSnapshots = getSnapshots;
exports.downloadSnapshot = downloadSnapshot;
exports.createNewBackup = createNewBackup;
exports.clean = clean;