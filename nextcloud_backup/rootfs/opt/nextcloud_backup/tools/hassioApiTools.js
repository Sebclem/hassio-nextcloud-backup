import fs from "fs"

import stream from "stream"
import { promisify } from "util";
import got from "got";
import FormData from "form-data";
import * as statusTools from "../tools/status.js"
import * as settingsTools from "../tools/settingsTools.js"

import logger from "../config/winston.js"
import {DateTime} from "luxon";

const pipeline = promisify(stream.pipeline);

const token = process.env.SUPERVISOR_TOKEN;

// Default timeout to 90min
const create_snap_timeout = parseInt(process.env.CREATE_BACKUP_TIMEOUT) || (90 * 60 * 1000);


function getVersion() {
    return new Promise((resolve, reject) => {
        let status = statusTools.getStatus();
        let option = {
            headers: { "authorization": `Bearer ${token}` },
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
                statusTools.setError(`Fail to fetch HA Version (${error.message})`, 1);
                reject(`Fail to fetch HA Version (${error.message})`);
            });
    });
}

function getAddonList() {
    return new Promise((resolve, reject) => {
        let status = statusTools.getStatus();
        let option = {
            headers: { "authorization": `Bearer ${token}` },
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
                addons.sort((a, b) => {
                    let textA = a.name.toUpperCase();
                    let textB = b.name.toUpperCase();
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                });
                resolve(addons);
            })
            .catch((error) => {
                statusTools.setError(`Fail to fetch addons list (${error.message})`, 1);
                reject(`Fail to fetch addons list (${error.message})`);
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
                logger.debug("Addon to backup:")
                logger.debug(slugs)
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
    logger.debug("Folders to backup:");
    logger.debug(slugs)
    return slugs;
}

function getSnapshots() {
    return new Promise((resolve, reject) => {
        let status = statusTools.getStatus();
        let option = {
            headers: { "authorization": `Bearer ${token}` },
            responseType: "json",
        };

        got("http://hassio/backups", option)
            .then((result) => {
                if (status.error_code === 1) {
                    status.status = "idle";
                    status.message = null;
                    status.error_code = null;
                    statusTools.setStatus(status);
                }
                let snaps = result.body.data.backups;
                resolve(snaps);
            })
            .catch((error) => {
                statusTools.setError(`Fail to fetch Hassio backups (${error.message})`, 1);
                reject(`Fail to fetch Hassio backups (${error.message})`);
            });
    });
}

function downloadSnapshot(id) {
    return new Promise((resolve, reject) => {
        logger.info(`Downloading snapshot ${id}...`);
        if (!fs.existsSync("./temp/")) fs.mkdirSync("./temp/");
        let tmp_file = `./temp/${id}.tar`;
        let stream = fs.createWriteStream(tmp_file);
        let status = statusTools.getStatus();
        checkSnap(id)
            .then(() => {
                status.status = "download";
                status.progress = 0;
                statusTools.setStatus(status);
                let option = {
                    headers: { "Authorization": `Bearer ${token}` },
                };

                pipeline(
                    got.stream.get(`http://hassio/backups/${id}/download`, option)
                        .on("downloadProgress", (e) => {
                            let percent = Math.round(e.percent * 100) / 100;
                            if (status.progress !== percent) {
                                status.progress = percent;
                                statusTools.setStatus(status);
                            }
                        }),
                    stream
                )
                    .then(() => {
                        logger.info("Download success !");
                        status.progress = 1;
                        statusTools.setStatus(status);
                        logger.debug("Snapshot dl size : " + fs.statSync(tmp_file).size / 1024 / 1024);
                        resolve();
                    })
                    .catch((error) => {
                        fs.unlinkSync(tmp_file);
                        statusTools.setError(`Fail to download Hassio backup (${error.message})`, 7);
                        reject(`Fail to download Hassio backup (${error.message})`);
                    });
            })
            .catch(() => {
                statusTools.setError("Fail to download Hassio backup. Not found ?", 7);
                reject();
            });
    });
}

function dellSnap(id) {
    return new Promise((resolve, reject) => {
        checkSnap(id)
            .then(() => {
                let option = {
                    headers: { "authorization": `Bearer ${token}` },
                    responseType: "json",
                };

                got.delete(`http://hassio/backups/${id}`, option)
                    .then(() => resolve())
                    .catch((e) => {
                        logger.error(e)
                        reject();
                    });
            })
            .catch(() => {
                reject();
            });
    });
}

function checkSnap(id) {
    return new Promise((resolve, reject) => {
        let option = {
            headers: { "authorization": `Bearer ${token}` },
            responseType: "json",
        };

        got(`http://hassio/backups/${id}/info`, option)
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
        getAddonToBackup().then((addons) => {
            let folders = getFolderToBackup();
            let option = {
                headers: { "authorization": `Bearer ${token}` },
                responseType: "json",
                timeout: {
                    response: create_snap_timeout
                },
                json: {
                    name: name,
                    addons: addons,
                    folders: folders
                },
            };
            let password_protected = settingsTools.getSettings().password_protected;
            logger.debug(`Is password protected ? ${password_protected}`)
            if ( password_protected === "true") {
                option.json.password = settingsTools.getSettings().password_protect_value
            }

            got.post(`http://hassio/backups/new/partial`, option)
                .then((result) => {
                    logger.info(`Snapshot created with id ${result.body.data.slug}`);
                    resolve(result.body.data.slug);
                })
                .catch((error) => {
                    statusTools.setError(`Can't create new snapshot (${error.message})`, 5);
                    reject(`Can't create new snapshot (${error.message})`);
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
                    return a.date < b.date ? 1 : -1
                });
                let toDel = snaps.slice(limit);
                for (let i of toDel) {
                    await dellSnap(i.slug);
                }
                logger.info("Local clean done.");
                resolve();
            })
            .catch((e) => {
                statusTools.setError(`Fail to clean backups (${e}) !`, 6);
                reject(`Fail to clean backups (${e}) !`);
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
        let form = new FormData();
        form.append("file", stream);

        let options = {
            body: form,
            headers: { "authorization": `Bearer ${token}` },
        };

        got.stream
            .post(`http://hassio/backups/new/upload`, options)
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
                statusTools.setError(`Fail to upload backup to home assistant (${err}) !`, 4);
                reject(`Fail to upload backup to home assistant (${err}) !`);
            });
    });
}

function stopAddons() {
    return new Promise(((resolve, reject) => {
        logger.info('Stopping addons...');
        let status = statusTools.getStatus();
        status.status = "stopping";
        status.progress = -1;
        status.message = null;
        status.error_code = null;
        statusTools.setStatus(status);
        let promises = [];
        let option = {
            headers: { "authorization": `Bearer ${token}` },
            responseType: "json",
        };
        let addons_slug = settingsTools.getSettings().auto_stop_addon
        for (let addon of addons_slug) {
            if (addon !== "") {
                logger.debug(`... Stopping addon ${addon}`);
                promises.push(got.post(`http://hassio/addons/${addon}/stop`, option));
            }

        }
        Promise.allSettled(promises).then(values => {
            let error = null;
            for (let val of values)
                if (val.status === "rejected")
                    error = val.reason;

            if (error) {
                statusTools.setError(`Fail to stop addons(${error}) !`, 8);
                logger.error(status.message);
                reject(status.message);
            } else {
                logger.info('... Ok');
                resolve();
            }
        });
    }));
}

function startAddons() {
    return new Promise(((resolve, reject) => {
        logger.info('Starting addons...');
        let status = statusTools.getStatus();
        status.status = "starting";
        status.progress = -1;
        status.message = null;
        status.error_code = null;
        statusTools.setStatus(status);
        let promises = [];
        let option = {
            headers: { "authorization": `Bearer ${token}` },
            responseType: "json",
        };
        let addons_slug = settingsTools.getSettings().auto_stop_addon
        for (let addon of addons_slug) {
            if (addon !== "") {
                logger.debug(`... Starting addon ${addon}`)
                promises.push(got.post(`http://hassio/addons/${addon}/start`, option));
            }
        }
        Promise.allSettled(promises).then(values => {
            let error = null;
            for (let val of values)
                if (val.status === "rejected")
                    error = val.reason;

            if (error) {
                statusTools.setError(`Fail to start addons (${error}) !`, 9)
                reject(status.message);
            } else {
                logger.info('... Ok')
                status.status = "idle";
                status.progress = -1;
                status.message = null;
                status.error_code = null;
                statusTools.setStatus(status);
                resolve();
            }
        });
    }));
}

function publish_state(state) {

    // let data_error_sensor = {
    //     state: state.status == "error" ? "on" : "off",
    //     attributes: {
    //         friendly_name: "Nexcloud Backup Error",
    //         device_class: "problem",
    //         error_code: state.error_code,
    //         message: state.message,
    //         icon: state.status == "error" ? "mdi:cloud-alert" : "mdi:cloud-check"
    //     },
    // }


    // let option = {
    //     headers: { "authorization": `Bearer ${token}` },
    //     responseType: "json",
    //     json: data_error_sensor
    // };
    // got.post(`http://hassio/core/api/states/binary_sensor.nextcloud_backup_error`, option)
    // .then((result) => {
    //     logger.debug('Home assistant sensor updated (error status)');
    // })
    // .catch((error) => {
    //     logger.error(error);
    // });

    // let icon = ""
    // switch(state.status){
    //     case "error":
    //         icon = "mdi:cloud-alert";
    //         break;
    //     case "download":
    //     case "download-b":
    //         icon = "mdi:cloud-download";
    //         break;
    //     case "upload":
    //     case "upload-b":
    //         icon = "mdi:cloud-upload";
    //         break;
    //     case "idle":
    //         icon = "mdi:cloud-check";
    //         break;
    //     default:
    //         icon = "mdi:cloud-sync";
    //         break;
    // }

    // let data_state_sensor = {
    //     state: state.status,
    //     attributes: {
    //         friendly_name: "Nexcloud Backup Status",
    //         error_code: state.error_code,
    //         message: state.message,
    //         icon: icon,
    //         last_backup: state.last_backup == null || state.last_backup == "" ? "" : new Date(state.last_backup).toISOString(),
    //         next_backup: state.next_backup == null || state.next_backup == "" ? "" : new Date(state.next_backup).toISOString()
    //     },
    // }
    // option.json = data_state_sensor
    // got.post(`http://hassio/core/api/states/sensor.nextcloud_backup_status`, option)
    // .then((result) => {
    //     logger.debug('Home assistant sensor updated (status)');
    // })
    // .catch((error) => {
    //     logger.error(error);
    // });
}

export {
    getVersion,
    getAddonList,
    getFolderList,
    getSnapshots,
    downloadSnapshot,
    createNewBackup,
    uploadSnapshot,
    stopAddons,
    startAddons,
    clean,
    publish_state
}
