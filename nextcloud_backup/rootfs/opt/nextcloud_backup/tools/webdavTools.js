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
            let status = statusTools.getStatus();
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
                    console.debug("Nextcloud connection:  \x1b[32mSuccess !\x1b[0m");
                    this.initFolder().then(() => {
                        resolve();
                    });
                    
                }).catch((error) => {
                    status.status = "error";
                    status.error_code = 3;
                    status.message = "Can't connect to Nextcloud (" + error + ") !"
                    statusTools.setStatus(status);
                    this.client = null;
                    console.error("Can't connect to Nextcloud (" + error + ") !");
                    reject("Can't connect to Nextcloud (" + error + ") !");
                });
            } catch (err) {
                status.status = "error";
                status.error_code = 3;
                status.message = "Can't connect to Nextcloud (" + err + ") !"
                statusTools.setStatus(status);
                this.client = null;
                console.error("Can't connect to Nextcloud (" + err + ") !");
                reject("Can't connect to Nextcloud (" + err + ") !");
            }

        });
    }

    initFolder(){
        return new Promise((resolve, reject) =>{
            this.client.createDirectory("/Hassio Backup").catch(()=>{}).then(()=>{
                this.client.createDirectory("/Hassio Backup/Auto").catch(()=>{}).then(()=>{
                    this.client.createDirectory("/Hassio Backup/Manual").catch(()=>{}).then(()=>{
                        resolve();
                    })
                })
            });
        });
        
    }

    confIsValid() {
        return new Promise((resolve, reject) => {
            let status = statusTools.getStatus();
            let conf = this.getConf();
            if (conf !== null) {
                if (conf.ssl !== null && conf.host !== null && conf.username !== null && conf.password !== null) {
                    if (status.error_code == 2) {
                        status.status = "idle";
                        status.message = null;
                        status.error_code = null;
                        statusTools.setStatus(status);
                    }
                    this.init(conf.ssl, conf.host, conf.username, conf.password).then(() => {
                        resolve();
                    }).catch((err) => {
                        reject(err);
                    });

                }
                else {
                    status.status = "error";
                    status.error_code = 2;
                    status.message = "Nextcloud config invalid !"
                    statusTools.setStatus(status);
                    reject("Nextcloud config invalid !");
                }
            }
            else {
                status.status = "error";
                status.error_code = 2;
                status.message = "Nextcloud config not found !"
                statusTools.setStatus(status);
                reject("Nextcloud config not found !");
            }

        });
    }

    getConf() {
        if (fs.existsSync(configPath)) {
            let content = JSON.parse(fs.readFileSync(configPath));
            return content;
        }
        else
            return null;
    }

    setConf(conf){
        fs.writeFileSync(configPath, JSON.stringify(conf));
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

