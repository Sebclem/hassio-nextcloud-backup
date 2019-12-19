const superagent = require('superagent');
const statusTools = require('./status');

// !!! FOR DEV PURPOSE ONLY !!!
//put token here for dev (ssh port tunelling 'sudo ssh -L 80:hassio:80 root@`hassoi_ip`' + put 127.0.0.1 hassio into host)
const fallbackToken = "75c7a712290f47a7513ee75a24072f2a5f44745d9b9c4e1f9fe6d44e55da2715e7c4341de239ec1c79a5f7178dd4376e27a98ebb7b4b029a" 


function getSnapshots() {
    return new Promise((resolve, reject) => {
        let token = process.env.HASSIO_TOKEN;
        if (token == null) {
            token = fallbackToken
        }
        let status = statusTools.getStatus();
        superagent.get('http://hassio/snapshots')
            .set('X-HASSIO-KEY', token)
            .then(data => {
                if (status.error_code == 1) {
                    status.status = "idle";
                    status.message = null;
                    status.error_code = null;
                    statusTools.setStatus(status);
                }
                let snaps = data.body.data.snapshots;
                // console.log(snaps);
                resolve(snaps);

            })
            .catch(err => {
                status.status = "error";
                status.message = "Fail to fetch Hassio snapshot (" + err + ")";
                status.error_code = 1;
                statusTools.setStatus(status);
                reject(err);
            });
    });

}

exports.getSnapshots = getSnapshots;