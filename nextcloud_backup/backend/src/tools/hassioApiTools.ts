import fs from "fs";

import stream from "stream";
import { promisify } from "util";
import got, { OptionsOfJSONResponseBody } from "got";
import FormData from "form-data";
import * as statusTools from "./status.js";
import * as settingsTools from "./settingsTools.js";

import logger from "../config/winston.js";
import { Status } from "../types/status.js";
import { AddonModel, BackupDetailModel, BackupModel, CoreInfoBody } from "../types/services/ha_os_response.js";

const pipeline = promisify(stream.pipeline);

const token = process.env.SUPERVISOR_TOKEN;

// Default timeout to 90min
const create_snap_timeout = process.env.CREATE_BACKUP_TIMEOUT
  ? parseInt(process.env.CREATE_BACKUP_TIMEOUT)
  : 90 * 60 * 1000;

function getVersion() {
  return new Promise<string>((resolve, reject) => {
    const status = statusTools.getStatus();
    got<CoreInfoBody>("http://hassio/core/info", {
      headers: { authorization: `Bearer ${token}` },
      responseType: "json",
    })
      .then((result) => {
        if (status.error_code == 1) {
          status.status = "idle";
          status.message = undefined;
          status.error_code = undefined;
          statusTools.setStatus(status);
        }
        const version = result.body.version;
        resolve(version);
      })
      .catch((error) => {
        statusTools.setError(`Fail to fetch HA Version (${error.message})`, 1);
        reject(`Fail to fetch HA Version (${error.message})`);
      });
  });
}

function getAddonList() {
  return new Promise<AddonModel[]>((resolve, reject) => {
    const status = statusTools.getStatus();
    const option: OptionsOfJSONResponseBody = {
      headers: { authorization: `Bearer ${token}` },
      responseType: "json",
    };

    got<{ addons: AddonModel[] }>("http://hassio/addons", option)
      .then((result) => {
        if (status.error_code === 1) {
          status.status = "idle";
          status.message = undefined;
          status.error_code = undefined;
          statusTools.setStatus(status);
        }
        const addons = result.body.addons;
        addons.sort((a, b) => {
          const textA = a.name.toUpperCase();
          const textB = b.name.toUpperCase();
          return textA < textB ? -1 : textA > textB ? 1 : 0;
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
  return new Promise<string[]>((resolve, reject) => {
    const excluded_addon = settingsTools.getSettings().exclude_addon;
    getAddonList()
      .then((all_addon) => {
        const slugs = [];
        for (const addon of all_addon) {
          if (!excluded_addon.includes(addon.slug)) slugs.push(addon.slug);
        }
        logger.debug("Addon to backup:");
        logger.debug(slugs);
        resolve(slugs);
      })
      .catch(() => reject());
  });
}

function getFolderList() {
  return [
    {
      name: "Home Assistant configuration",
      slug: "homeassistant",
    },
    {
      name: "SSL",
      slug: "ssl",
    },
    {
      name: "Share",
      slug: "share",
    },
    {
      name: "Media",
      slug: "media",
    },
    {
      name: "Local add-ons",
      slug: "addons/local",
    },
  ];
}

function getFolderToBackup() {
  const excluded_folder = settingsTools.getSettings().exclude_folder;
  const all_folder = getFolderList();
  const slugs = [];
  for (const folder of all_folder) {
    if (!excluded_folder.includes(folder.slug)) slugs.push(folder.slug);
  }
  logger.debug("Folders to backup:");
  logger.debug(slugs);
  return slugs;
}

function getSnapshots() {
  return new Promise<BackupModel[]>((resolve, reject) => {
    const status = statusTools.getStatus();
    const option: OptionsOfJSONResponseBody = {
      headers: { authorization: `Bearer ${token}` },
      responseType: "json",
    };

    got<{ backups: BackupModel[] }>("http://hassio/backups", option)
      .then((result) => {
        if (status.error_code === 1) {
          status.status = "idle";
          status.message = undefined;
          status.error_code = undefined;
          statusTools.setStatus(status);
        }
        const snaps = result.body.backups;
        resolve(snaps);
      })
      .catch((error) => {
        statusTools.setError(
          `Fail to fetch Hassio backups (${error.message})`,
          1
        );
        reject(`Fail to fetch Hassio backups (${error.message})`);
      });
  });
}

function downloadSnapshot(id: string) {
  return new Promise((resolve, reject) => {
    logger.info(`Downloading snapshot ${id}...`);
    if (!fs.existsSync("./temp/")) fs.mkdirSync("./temp/");
    const tmp_file = `./temp/${id}.tar`;
    const stream = fs.createWriteStream(tmp_file);
    const status = statusTools.getStatus();
    checkSnap(id)
      .then(() => {
        status.status = "download";
        status.progress = 0;
        statusTools.setStatus(status);
        const option = {
          headers: { Authorization: `Bearer ${token}` },
        };

        pipeline(
          got.stream
            .get(`http://hassio/backups/${id}/download`, option)
            .on("downloadProgress", (e) => {
              const percent = Math.round(e.percent * 100) / 100;
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
            logger.debug(
              "Snapshot dl size : " + fs.statSync(tmp_file).size / 1024 / 1024
            );
            resolve(undefined);
          })
          .catch((error) => {
            fs.unlinkSync(tmp_file);
            statusTools.setError(
              `Fail to download Hassio backup (${error.message})`,
              7
            );
            reject(`Fail to download Hassio backup (${error.message})`);
          });
      })
      .catch(() => {
        statusTools.setError("Fail to download Hassio backup. Not found ?", 7);
        reject();
      });
  });
}

function dellSnap(id: string) {
  return new Promise((resolve, reject) => {
    checkSnap(id)
      .then(() => {
        const option = {
          headers: { authorization: `Bearer ${token}` },
        };

        got
          .delete(`http://hassio/backups/${id}`, option)
          .then(() => resolve(undefined))
          .catch((e) => {
            logger.error(e);
            reject();
          });
      })
      .catch(() => {
        reject();
      });
  });
}

function checkSnap(id: string) {
  return new Promise((resolve, reject) => {
    const option: OptionsOfJSONResponseBody = {
      headers: { authorization: `Bearer ${token}` },
      responseType: "json",
    };

    got<BackupDetailModel>(`http://hassio/backups/${id}/info`, option)
      .then((result) => {
        logger.debug(`Snapshot size: ${result.body.size}`);
        resolve(undefined);
      })
      .catch(() => reject());
  });
}

function createNewBackup(name: string) {
  return new Promise<string>((resolve, reject) => {
    const status = statusTools.getStatus();
    status.status = "creating";
    status.progress = -1;
    statusTools.setStatus(status);
    logger.info("Creating new snapshot...");
    getAddonToBackup()
      .then((addons) => {
        const folders = getFolderToBackup();

        const body: NewPartialBackupPayload = {
          name: name,
          addons: addons,
          folders: folders,
        }

        const password_protected = settingsTools.getSettings().password_protected;
        logger.debug(`Is password protected ? ${password_protected}`);
        if (password_protected === "true") {
          body.password =
            settingsTools.getSettings().password_protect_value;
        }

        const option: OptionsOfJSONResponseBody = {
          headers: { authorization: `Bearer ${token}` },
          responseType: "json",
          timeout: {
            response: create_snap_timeout,
          },
          json: body
        };

        got
          .post<{ slug: string }>(`http://hassio/backups/new/partial`, option)
          .then((result) => {
            logger.info(`Snapshot created with id ${result.body.slug}`);
            resolve(result.body.slug);
          })
          .catch((error) => {
            statusTools.setError(
              `Can't create new snapshot (${error.message})`,
              5
            );
            reject(`Can't create new snapshot (${error.message})`);
          });
      })
      .catch(reject);
  });
}

function clean() {
  let limit = settingsTools.getSettings().auto_clean_local_keep;
  if (limit == null) limit = 5;
  return new Promise((resolve, reject) => {
    getSnapshots()
      .then(async (snaps) => {
        if (snaps.length < limit) {
          resolve(undefined);
          return;
        }
        snaps.sort((a, b) => {
          return a.date < b.date ? 1 : -1;
        });
        const toDel = snaps.slice(limit);
        for (const i of toDel) {
          await dellSnap(i.slug);
        }
        logger.info("Local clean done.");
        resolve(undefined);
      })
      .catch((e) => {
        statusTools.setError(`Fail to clean backups (${e}) !`, 6);
        reject(`Fail to clean backups (${e}) !`);
      });
  });
}

function uploadSnapshot(path: string) {
  return new Promise((resolve, reject) => {
    const status = statusTools.getStatus();
    status.status = "upload-b";
    status.progress = 0;
    status.message = undefined;
    status.error_code = undefined;
    statusTools.setStatus(status);
    logger.info("Uploading backup...");
    const stream = fs.createReadStream(path);
    const form = new FormData();
    form.append("file", stream);

    const options = {
      body: form,
      headers: { authorization: `Bearer ${token}` },
    };

    got.stream
      .post(`http://hassio/backups/new/upload`, options)
      .on("uploadProgress", (e) => {
        const percent = e.percent;
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
          status.message = undefined;
          status.error_code = undefined;
          statusTools.setStatus(status);
          fs.unlinkSync(path);
          resolve(undefined);
        }
      })
      .on("error", (err) => {
        fs.unlinkSync(path);
        statusTools.setError(
          `Fail to upload backup to home assistant (${err}) !`,
          4
        );
        reject(`Fail to upload backup to home assistant (${err}) !`);
      });
  });
}

function stopAddons() {
  return new Promise((resolve, reject) => {
    logger.info("Stopping addons...");
    const status = statusTools.getStatus();
    status.status = "stopping";
    status.progress = -1;
    status.message = undefined;
    status.error_code = undefined;
    statusTools.setStatus(status);
    const promises = [];
    const option: OptionsOfJSONResponseBody = {
      headers: { authorization: `Bearer ${token}` },
      responseType: "json",
    };
    const addons_slug = settingsTools.getSettings().auto_stop_addon;
    for (const addon of addons_slug) {
      if (addon !== "") {
        logger.debug(`... Stopping addon ${addon}`);
        promises.push(got.post(`http://hassio/addons/${addon}/stop`, option));
      }
    }
    Promise.allSettled(promises).then((values) => {
      let error = null;
      for (const val of values) if (val.status === "rejected") error = val.reason;

      if (error) {
        statusTools.setError(`Fail to stop addons(${error}) !`, 8);
        logger.error(status.message);
        reject(status.message);
      } else {
        logger.info("... Ok");
        resolve(undefined);
      }
    });
  });
}

function startAddons() {
  return new Promise((resolve, reject) => {
    logger.info("Starting addons...");
    const status = statusTools.getStatus();
    status.status = "starting";
    status.progress = -1;
    status.message = undefined;
    status.error_code = undefined;
    statusTools.setStatus(status);
    const promises = [];
    const option: OptionsOfJSONResponseBody = {
      headers: { authorization: `Bearer ${token}` },
      responseType: "json",
    };
    const addons_slug = settingsTools.getSettings().auto_stop_addon;
    for (const addon of addons_slug) {
      if (addon !== "") {
        logger.debug(`... Starting addon ${addon}`);
        promises.push(got.post(`http://hassio/addons/${addon}/start`, option));
      }
    }
    Promise.allSettled(promises).then((values) => {
      let error = null;
      for (const val of values) if (val.status === "rejected") error = val.reason;

      if (error) {
        statusTools.setError(`Fail to start addons (${error}) !`, 9);
        reject(status.message);
      } else {
        logger.info("... Ok");
        status.status = "idle";
        status.progress = -1;
        status.message = undefined;
        status.error_code = undefined;
        statusTools.setStatus(status);
        resolve(undefined);
      }
    });
  });
}

function publish_state(state: Status) {
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
  publish_state,
};
