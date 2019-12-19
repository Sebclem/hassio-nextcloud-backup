const { createClient } = require("webdav");
const fs = require("fs");
const statusTools = require('./status');
const endpoint = "/remote.php/webdav"
const configPath = "./webdav_conf.json"

class WebdavTools {
    constructor() {
        this.client = null;
    }

    init(ssl, host, username, password) {
        return new Promise((resolve, reject) => {
            console.log("Initilizing and checking webdav client...")
            let url = (ssl ? "https" : "http") + "://" + host + endpoint;
            try {
                this.client = createClient(url, { username: username, password: password });
                this.client.getDirectoryContents("/").then(() => {
                    if (status.error_code == 3) {
                        status.status = "idle";
                        status.message = null;
                        status.error_code = null;
                        statusTools.setStatus(status);
                    }
                    resolve();
                }).catch((error) => {
                    status.status = "Error";
                    status.error_code = 3;
                    status.message = "Can't connect to Nextcloud (" + error + ") !"
                    statusTools.setStatus(status);
                    this.client = null;
                    reject("Can't connect to Nextcloud (" + error + ") !");
                });
            } catch (err) {
                status.status = "Error";
                status.error_code = 3;
                status.message = "Can't connect to Nextcloud (" + err + ") !"
                statusTools.setStatus(status);
                this.client = null;
                reject("Can't connect to Nextcloud (" + err + ") !");
            }

        });
    }

    confIsValid() {
        return new Promise((resolve, reject) => {
            let status = statusTools.getStatus();
            let conf = this.loadConf();
            if (conf !== null) {
                if (conf.ssl !== null && conf.host !== null && conf !== null && conf !== null) {
                    if (status.error_code == 2) {
                        status.status = "idle";
                        status.message = null;
                        status.error_code = null;
                        statusTools.setStatus(status);
                    }
                    //TODO init connection
                    resolve();
                }
                else {
                    status.status = "Error";
                    status.error_code = 2;
                    status.message = "Nextcloud config invalid !"
                    statusTools.setStatus(status);
                    reject("Nextcloud config invalid !");
                }
            }
            else {
                status.status = "Error";
                status.error_code = 2;
                status.message = "Nextcloud config not found !"
                statusTools.setStatus(status);
                reject("Nextcloud config not found !");
            }

        });
    }

    loadConf() {
        if (fs.existsSync(configPath)) {
            let content = JSON.parse(fs.readFileSync(configPath));
            return content;
        }
        else
            return null;
    }
}


class Singleton {
    constructor() {
        if (!Singleton.instance) {
            Singleton.instance = new WebdavTools();
        }
    }

    getInstance() {
        return Singleton.instance;
    }
}

module.exports = Singleton;

