const statusTools = require('./status');
const fs = require('fs');
const settingsTools = require('./settingsTools');
const moment = require('moment');
const logger = require('../config/winston');
const stream = require('stream');
const {promisify} = require('util');
const pipeline = promisify(stream.pipeline);
const got = require ('got');

// !!! FOR DEV PURPOSE ONLY !!!
//put token here for dev (ssh port tunelling 'sudo ssh -L 80:hassio:80 root@`hassoi_ip`' + put 127.0.0.1 hassio into host)
const fallbackToken = "cf199dd47c09839e8310955246e664c767a05c27f5f03078f3a15b04509c8869321a79eecbe5e8101635a7420c2ba06787823f7d5be4b502"


function getSnapshots() {
    return new Promise((resolve, reject) => {
        let token = process.env.HASSIO_TOKEN;
        if (token == null) {
            token = fallbackToken
        }
        let status = statusTools.getStatus();
        let option = {
            headers: { 'X-HASSIO-KEY': token },
            responseType: 'json'
        };
        
        got("http://hassio/snapshots", option)
        .then((result) => {
            if (status.error_code === 1) {
                status.status = "idle";
                status.message = null;
                status.error_code = null;
                statusTools.setStatus(status);
            }
            let snaps = result.body.data.snapshots;
            resolve(snaps);
        })
        .catch((error) => {
            status.status = "error";
            status.message = "Fail to fetch Hassio snapshots (" + error.message + ")";
            status.error_code = 1;
            statusTools.setStatus(status);
            logger.error(status.message);
            reject(error.message);
        });
    });
    
}

function downloadSnapshot(id) {
    return new Promise((resolve, reject) => {
        logger.info(`Downloading snapshot ${id}...`);
        if (!fs.existsSync('./temp/'))
        fs.mkdirSync('./temp/');
        let tmp_file = `./temp/${id}.tar`
        let stream = fs.createWriteStream(tmp_file);
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
                headers: { 'X-HASSIO-KEY': token },
            };
            
            pipeline(
                got.stream.get(`http://hassio/snapshots/${id}/download`, option)
                .on('downloadProgress', e => {
                    let percent = Math.round(e.percent * 100) / 100;
                    if (status.progress != percent) {
                        status.progress = percent;
                        statusTools.setStatus(status);
                    }
                })
                ,
                stream
                )
                .then((res)=>{
                    logger.info('Download success !')
                    status.progress = 1;
                    statusTools.setStatus(status);
                    logger.debug("Snapshot dl size : " +  (fs.statSync(tmp_file).size / 1024 / 1024));
                    resolve();
                }).catch((err)=>{
                    fs.unlinkSync(tmp_file);
                    status.status = "error";
                    status.message = "Fail to download Hassio snapshot (" + err.message + ")";
                    status.error_code = 7;
                    statusTools.setStatus(status);
                    logger.error(status.message);
                    reject(err.message);
                })
            }).catch((err) => {
                status.status = "error";
                status.message = "Fail to download Hassio snapshot. Not found ?";
                status.error_code = 7;
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
                    headers: { 'X-HASSIO-KEY': token },
                    responseType: 'json'
                };
                
                got.post(`http://hassio/snapshots/${id}/remove`, option)
                .then((result) => {
                    resolve();
                })
                .catch((error) => {
                    reject();
                });
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
                headers: { 'X-HASSIO-KEY': token },
                responseType: 'json'
            };
            
            got(`http://hassio/snapshots/${id}/info`, option)
            .then((result) => {
                logger.debug(`Snapshot size: ${result.body.data.size}`)
                resolve();
            })
            .catch((error) => {
                reject();
            });
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
                headers: { 'X-HASSIO-KEY': token },
                responseType: 'json',
                timeout: 2400000,
                json: { name: name }
                
            };
            
            got.post(`http://hassio/snapshots/new/full`, option)
            .then((result) => {
                logger.info(`Snapshot created with id ${result.body.data.slug}`);
                resolve(result.body.data.slug);
            })
            .catch((error) => {
                status.status = "error";
                status.message = "Can't create new snapshot (" + error.message + ")";
                status.error_code = 5;
                statusTools.setStatus(status);
                logger.error(status.message);
                reject(status.message);
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