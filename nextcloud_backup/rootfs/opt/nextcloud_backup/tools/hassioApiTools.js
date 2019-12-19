const superagent = require('superagent');
const statusTools = require('./status');

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