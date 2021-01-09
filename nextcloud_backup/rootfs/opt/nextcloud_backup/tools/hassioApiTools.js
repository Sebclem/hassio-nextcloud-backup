const fs = require("fs");

const moment = require("moment");
const stream = require("stream");
const { promisify } = require("util");

const pipeline = promisify(stream.pipeline);
const got = require("got");
const FormData = require("form-data");
const statusTools = require("./status");
const settingsTools = require("./settingsTools");
const logger = require("../config/winston");

const create_snap_timeout = 90 * 60 * 1000;


function getVersion() {
    return new Promise((resolve, reject) => {
        let token = process.env.HASSIO_TOKEN;
        let status = statusTools.getStatus();
        let option = {
            headers: { "X-HASSIO-KEY": token },
            responseType: "json",
        };

        got("http://hassio/core/info", option)
            .then((result) => {
                if (status.error_code === 1) {
                    status.status = "idle";
                    status.message = null;
                    status.error_code = null;
                    statusTools.setStatus(status);
                }
                let version = result.body.data.version;
                resolve(version);
            })
            .catch((error) => {
                status.status = "error";
                status.message = "Fail to fetch HA Version (" + error.message + ")";
                status.error_code = 1;
                statusTools.setStatus(status);
                logger.error(status.message);
                reject(error.message);
            });
    });
}

function getAddonList() {
    return new Promise((resolve, reject) => {
        let token = process.env.HASSIO_TOKEN;
        let status = statusTools.getStatus();
        let option = {
            headers: { "X-HASSIO-KEY": token },
            responseType: "json",
        };

        got("http://hassio/addons", option)
            .then((result) => {
                if (status.error_code === 1) {
                    status.status = "idle";
                    status.message = null;
                    status.error_code = null;
                    statusTools.setStatus(status);
                }
                let addons = result.body.data.addons;
                let installed = [];
                for (let current of addons) {
                    if (current.installed === true) {
                        installed.push({ slug: current.slug, name: current.name })
                    }
                }
                installed.sort((a, b) => {
                    let textA = a.name.toUpperCase();
                    let textB = b.name.toUpperCase();
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                });
                resolve(installed);
            })
            .catch((error) => {
                status.status = "error";
                status.message = "Fail to fetch addons list (" + error.message + ")";
                status.error_code = 1;
                statusTools.setStatus(status);
                logger.error(status.message);
                reject(error.message);
            });
    });
}

function getAddonToBackup() {
    return new Promise((resolve, reject) => {
        let excluded_addon = settingsTools.getSettings().exclude_addon;
        getAddonList()
            .then((all_addon) => {
                let slugs = [];
                for (let addon of all_addon) {
                    if (!excluded_addon.includes(addon.slug))
                        slugs.push(addon.slug)
                }
                resolve(slugs)
            })
            .catch(() => reject());
    });
}

function getFolderList() {
    return [
        {
            name: "Home Assistant configuration",
            slug: "homeassistant"
        },
        {
            name: "SSL",
            slug: "ssl"
        },
        {
            name: "Share",
            slug: "share"
        },
        {
            name: "Media",
            slug: "media"
        },
        {
            name: "Local add-ons",
            slug: "addons/local"
        }
    ]
}

function getFolderToBackup() {
    let excluded_folder = settingsTools.getSettings().exclude_folder;
    let all_folder = getFolderList()
    let slugs = [];
    for (let folder of all_folder) {
        if (!excluded_folder.includes(folder.slug))
            slugs.push(folder.slug)
    }
    return slugs;
}

function getSnapshots() {
    return new Promise((resolve, reject) => {
        let token = process.env.HASSIO_TOKEN;
        let status = statusTools.getStatus();
        let option = {
            headers: { "X-HASSIO-KEY": token },
            responseType: "json",
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
        if (!fs.existsSync("./temp/")) fs.mkdirSync("./temp/");
        let tmp_file = `./temp/${id}.tar`;
        let stream = fs.createWriteStream(tmp_file);
        let token = process.env.HASSIO_TOKEN;
        let status = statusTools.getStatus();
        checkSnap(id)
            .then(() => {
                status.status = "download";
                status.progress = 0;
                statusTools.setStatus(status);
                let option = {
                    headers: { "X-HASSIO-KEY": token },
                };

                pipeline(
                    got.stream.get(`http://hassio/snapshots/${id}/download`, option)
                        .on("downloadProgress", (e) => {
                            let percent = Math.round(e.percent * 100) / 100;
                            if (status.progress !== percent) {
                                status.progress = percent;
                                statusTools.setStatus(status);
                            }
                        }),
                    stream
                )
                    .then((res) => {
                        logger.info("Download success !");
                        status.progress = 1;
                        statusTools.setStatus(status);
                        logger.debug("Snapshot dl size : " + fs.statSync(tmp_file).size / 1024 / 1024);
                        resolve();
                    })
                    .catch((err) => {
                        fs.unlinkSync(tmp_file);
                        status.status = "error";
                        status.message = "Fail to download Hassio snapshot (" + err.message + ")";
                        status.error_code = 7;
                        statusTools.setStatus(status);
                        logger.error(status.message);
                        reject(err.message);
                    });
            })
            .catch((err) => {
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
        checkSnap(id)
            .then(() => {
                let token = process.env.HASSIO_TOKEN;

                let option = {
                    headers: { "X-HASSIO-KEY": token },
                    responseType: "json",
                };

                got.post(`http://hassio/snapshots/${id}/remove`, option)
                    .then(() => resolve())
                    .catch(() => reject());
            })
            .catch(() => {
                reject();
            });
    });
}

function checkSnap(id) {
    return new Promise((resolve, reject) => {
        let token = process.env.HASSIO_TOKEN;
        let option = {
            headers: { "X-HASSIO-KEY": token },
            responseType: "json",
        };

        got(`http://hassio/snapshots/${id}/info`, option)
            .then((result) => {
                logger.debug(`Snapshot size: ${result.body.data.size}`);
                resolve();
            })
            .catch(() => reject());
    });
}

function createNewBackup(name) {
    return new Promise((resolve, reject) => {
        let status = statusTools.getStatus();
        status.status = "creating";
        status.progress = -1;
        statusTools.setStatus(status);
        logger.info("Creating new snapshot...");
        let token = process.env.HASSIO_TOKEN;
        getAddonToBackup().then((addons) => {
            let folders = getFolderToBackup();
            let option = {
                headers: { "X-HASSIO-KEY": token },
                responseType: "json",
                timeout: create_snap_timeout,
                json: {
                    name: name,
                    addons: addons,
                    folders: folders
                },
            };

            got.post(`http://hassio/snapshots/new/partial`, option)
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

        }).catch(reject);

    });
}

function clean() {
    let limit = settingsTools.getSettings().auto_clean_local_keep;
    if (limit == null) limit = 5;
    return new Promise((resolve, reject) => {
        getSnapshots()
            .then(async (snaps) => {
                if (snaps.length < limit) {
                    resolve();
                    return;
                }
                snaps.sort((a, b) => {
                    if (moment(a.date).isBefore(moment(b.date))) return 1;
                    else
                        return -1;
                });
                let toDel = snaps.slice(limit);
                for (let i of toDel) {
                    await dellSnap(i.slug);
                }
                logger.info("Local clean done.");
                resolve();
            })
            .catch(() => {
                reject();
            });
    });
}

function uploadSnapshot(path) {
    return new Promise((resolve, reject) => {
        let status = statusTools.getStatus();
        status.status = "upload-b";
        status.progress = 0;
        status.message = null;
        status.error_code = null;
        statusTools.setStatus(status);
        logger.info("Uploading backup...");
        let stream = fs.createReadStream(path);
        let token = process.env.HASSIO_TOKEN;

        let form = new FormData();
        form.append("file", stream);

        let options = {
            body: form,
            username: this.username,
            password: this.password,
            headers: { "X-HASSIO-KEY": token },
        };

        got.stream
            .post(`http://hassio/snapshots/new/upload`, options)
            .on("uploadProgress", (e) => {
                let percent = e.percent;
                if (status.progress !== percent) {
                    status.progress = percent;
                    statusTools.setStatus(status);
                }
                if (percent >= 1) {
                    logger.info("Upload done...");
                }
            })
            .on("response", (res) => {
                if (res.statusCode !== 200) {
                    status.status = "error";
                    status.error_code = 4;
                    status.message = `Fail to upload backup to home assistant (Status code: ${res.statusCode})!`;
                    statusTools.setStatus(status);
                    logger.error(status.message);
                    fs.unlinkSync(path);
                    reject(status.message);
                } else {
                    logger.info(`...Upload finish ! (status: ${res.statusCode})`);
                    status.status = "idle";
                    status.progress = -1;
                    status.message = null;
                    status.error_code = null;
                    statusTools.setStatus(status);
                    fs.unlinkSync(path);
                    resolve();
                }
            })
            .on("error", (err) => {
                fs.unlinkSync(path);
                status.status = "error";
                status.error_code = 4;
                status.message = `Fail to upload backup to home assitant (${err}) !`;
                statusTools.setStatus(status);
                logger.error(status.message);
                reject(status.message);
            });
    });
}

exports.getVersion = getVersion;
exports.getAddonList = getAddonList;
exports.getFolderList = getFolderList;
exports.getSnapshots = getSnapshots;
exports.downloadSnapshot = downloadSnapshot;
exports.createNewBackup = createNewBackup;
exports.uploadSnapshot = uploadSnapshot;
exports.clean = clean;
