const request = require('request');
const progress = require('request-progress');
const statusTools = require('./status');
const fs = require('fs');


// !!! FOR DEV PURPOSE ONLY !!!
//put token here for dev (ssh port tunelling 'sudo ssh -L 80:hassio:80 root@`hassoi_ip`' + put 127.0.0.1 hassio into host)
const fallbackToken = "3afd4f8440830816e32fd490bd4f98b2423c4d9dff1432a0d57f581c43ec2bf1d1fa9468fc162732f8e95ae524c59ceed0f8e2b8a948d170"


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
        }
        request(option, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                if (status.error_code == 1) {
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
                console.error(status.message);
                reject(error);
            }
        })
    });

}

function downloadSnapshot(id) {
    return new Promise((resolve, reject) => {
        console.log('Downloading snapshot ' + id + '...')
        if(!fs.existsSync('./temp/'))
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
            }
            progress(request(option))
                .on('progress', (state) => {
                    // TODO Don't write progress to disk, preseve disk IO time
                    status.progress = state.percent;
                    statusTools.setStatus(status);
                })
                .on('error', (error) => {
                    status.status = "error";
                    status.message = "Fail to download Hassio snapshot (" + error + ")";
                    status.error_code = 4;
                    statusTools.setStatus(status);
                    console.error(status.message);
                    reject(error);
                })
                .on('end', () => {
                    console.log('Download success !')
                    status.progress = 1;
                    statusTools.setStatus(status);
                    resolve();
                })
                .pipe(stream);
        }).catch(() => {
            status.status = "error";
            status.message = "Fail to download Hassio snapshot. Not found ?";
            status.error_code = 4;
            statusTools.setStatus(status);
            console.error(status.message);
            reject();
        });

    });
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
            if (error  || response.statusCode != 200)
                reject();
            else
                resolve();
        })
    });

}

exports.getSnapshots = getSnapshots;
exports.downloadSnapshot = downloadSnapshot;