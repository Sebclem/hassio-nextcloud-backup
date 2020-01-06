const { createClient } = require("webdav");
const fs = require("fs");
const moment = require('moment');

const statusTools = require('./status');
const endpoint = "/remote.php/webdav"
const configPath = "./webdav_conf.json"

const request = require('request');

class WebdavTools {
    constructor() {
        this.client = null;
        this.baseUrl = null;
        this.username = null;
        this.password = null;
    }

    init(ssl, host, username, password) {
        return new Promise((resolve, reject) => {
            let status = statusTools.getStatus();
            console.log("Initilizing and checking webdav client...")
            this.baseUrl = (ssl ? "https" : "http") + "://" + host + endpoint;
            this.username = username;
            this.password = password;
            try {
                this.client = createClient(this.baseUrl, { username: username, password: password });

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

    initFolder() {
        return new Promise((resolve, reject) => {
            this.client.createDirectory("/Hassio Backup").catch(() => { }).then(() => {
                this.client.createDirectory("/Hassio Backup/Auto").catch(() => { }).then(() => {
                    this.client.createDirectory("/Hassio Backup/Manual").catch(() => { }).then(() => {
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
                    console.error(status.message);
                    reject("Nextcloud config invalid !");
                }
            }
            else {
                status.status = "error";
                status.error_code = 2;
                status.message = "Nextcloud config not found !"
                statusTools.setStatus(status);
                console.error(status.message);
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

    setConf(conf) {
        fs.writeFileSync(configPath, JSON.stringify(conf));
    }


    uploadFile(id, path) {
        return new Promise((resolve, reject) => {
            if (this.client == null) {
                this.confIsValid().then(() => {
                    this._startUpload(id, path);
                }).catch((err) => {
                    reject(err);
                })
            }
            else
                this._startUpload(id, path);
        });
    }

    _startUpload(id, path) {
        return new Promise((resolve, reject) => {
            let status = statusTools.getStatus();
            status.status = "upload";
            status.progress = 0;
            status.message = null;
            status.error_code = null;
            statusTools.setStatus(status);
            console.log('Uploading snap...');
            let fileSize = fs.statSync('./temp/' + id + '.tar').size;
            let option = {
                url: this.baseUrl + encodeURI(path),
                auth: {
                    user: this.username,
                    pass: this.password
                },
                body: fs.createReadStream('./temp/' + id + '.tar')

            }
            let lastPercent = 0;
            let req = request.put(option)
                .on('drain', () => {
                    let percent = Math.floor((req.req.connection.bytesWritten / fileSize)*100);
                    if(lastPercent != percent){
                        lastPercent = percent;
                        status.progress = percent/100;
                        statusTools.setStatus(status);
                    }

                }).on('error', function(err) {
                    fs.unlinkSync('./temp/' + id + '.tar');
                    status.status = "error";
                    status.error_code = 4;
                    status.message = "Fail to upload snapshot to nextcloud (" + err + ") !"
                    statusTools.setStatus(status);
                    console.error(status.message);
                    reject(status.message);

                }).on('response', (res) => {
                    if (res.statusCode != 204) {
                        status.status = "error";
                        status.error_code = 4;
                        status.message = "Fail to upload snapshot to nextcloud (Status code: " + res.statusCode + ") !"
                        statusTools.setStatus(status);
                        console.error(status.message);
                        fs.unlinkSync('./temp/' + id + '.tar')
                        reject(status.message);
                    }
                    else {
                        console.log("...Upload finish !");
                        status.status = "idle";
                        status.progress = -1;
                        status.message = null;
                        status.error_code = null;
                        status.last_backup = moment().format('MMM D, YYYY HH:mm')

                        statusTools.setStatus(status);
                        fs.unlinkSync('./temp/' + id + '.tar')
                        resolve();
                    }
                })
        });
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

