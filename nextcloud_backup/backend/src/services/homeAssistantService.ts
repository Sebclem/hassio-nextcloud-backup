import fs from "fs";

import FormData from "form-data";
import got, {
  RequestError,
  type OptionsOfJSONResponseBody,
  type Progress,
  type Response,
} from "got";
import { DateTime } from "luxon";
import stream from "stream";
import { promisify } from "util";
import logger from "../config/winston.js";
import messageManager from "../tools/messageManager.js";
import * as statusTools from "../tools/status.js";
import {
  BackupType,
  type BackupConfig,
} from "../types/services/backupConfig.js";
import type { NewBackupPayload } from "../types/services/ha_os_payload.js";
import type {
  AddonData,
  BackupData,
  BackupDetailModel,
  CoreInfoBody,
  SupervisorResponse,
} from "../types/services/ha_os_response.js";
import { States } from "../types/status.js";

const pipeline = promisify(stream.pipeline);

const token = process.env.SUPERVISOR_TOKEN;

// Default timeout to 90min
const create_snap_timeout = process.env.CREATE_BACKUP_TIMEOUT
  ? parseInt(process.env.CREATE_BACKUP_TIMEOUT)
  : 90 * 60 * 1000;

function getVersion(): Promise<Response<SupervisorResponse<CoreInfoBody>>> {
  return got<SupervisorResponse<CoreInfoBody>>("http://hassio/core/info", {
    headers: { authorization: `Bearer ${token}` },
    responseType: "json",
  }).then(
    (result) => {
      return result;
    },
    (error: Error) => {
      messageManager.error(
        "Fail to fetch Home Assistant version",
        error?.message
      );
      logger.error(`Fail to fetch Home Assistant version`);
      logger.error(error);
      return Promise.reject(error);
    }
  );
}

function getAddonList(): Promise<Response<SupervisorResponse<AddonData>>> {
  const option: OptionsOfJSONResponseBody = {
    headers: { authorization: `Bearer ${token}` },
    responseType: "json",
  };
  return got<SupervisorResponse<AddonData>>(
    "http://hassio/addons",
    option
  ).then(
    (result) => {
      result.body.data.addons.sort((a, b) => {
        const textA = a.name.toUpperCase();
        const textB = b.name.toUpperCase();
        return textA < textB ? -1 : textA > textB ? 1 : 0;
      });
      return result;
    },
    (error: RequestError) => {
      messageManager.error("Fail to fetch addons list", error?.message);
      logger.error(`Fail to fetch addons list (${error?.message})`);
      logger.error(error);
      return Promise.reject(error);
    }
  );
}

function getBackups(): Promise<Response<SupervisorResponse<BackupData>>> {
  const option: OptionsOfJSONResponseBody = {
    headers: { authorization: `Bearer ${token}` },
    responseType: "json",
  };
  return got<SupervisorResponse<BackupData>>(
    "http://hassio/backups",
    option
  ).then(
    (result) => {
      const status = statusTools.getStatus();
      status.hass.ok = true;
      status.hass.last_check = DateTime.now();
      statusTools.setStatus(status);
      return result;
    },
    (error: RequestError) => {
      const status = statusTools.getStatus();
      status.hass.ok = false;
      status.hass.last_check = DateTime.now();
      statusTools.setStatus(status);
      messageManager.error("Fail to fetch Hassio backups", error?.message);
      return Promise.reject(error);
    }
  );
}

function downloadSnapshot(id: string): Promise<string> {
  logger.info(`Downloading snapshot ${id}...`);
  if (!fs.existsSync("./temp/")) {
    fs.mkdirSync("./temp/");
  }
  const tmp_file = `./temp/${id}.tar`;
  const stream = fs.createWriteStream(tmp_file);
  const status = statusTools.getStatus();
  status.status = States.BKUP_DOWNLOAD_HA;
  status.progress = 0;
  statusTools.setStatus(status);
  const option = {
    headers: { Authorization: `Bearer ${token}` },
  };

  return pipeline(
    got.stream
      .get(`http://hassio/backups/${id}/download`, option)
      .on("downloadProgress", (e: Progress) => {
        const percent = Math.round(e.percent * 100) / 100;
        if (status.progress !== percent) {
          status.progress = percent;
          statusTools.setStatus(status);
        }
      }),
    stream
  ).then(
    () => {
      logger.info("Download success !");
      const status = statusTools.getStatus();
      status.status = States.IDLE;
      status.progress = undefined;
      statusTools.setStatus(status);
      logger.debug(
        "Snapshot dl size : " + fs.statSync(tmp_file).size / 1024 / 1024
      );
      return tmp_file;
    },
    (reason: RequestError) => {
      fs.unlinkSync(tmp_file);
      messageManager.error(
        "Fail to download Home Assistant backup",
        reason.message
      );
      const status = statusTools.getStatus();
      status.status = States.IDLE;
      status.progress = undefined;
      statusTools.setStatus(status);
      return Promise.reject(reason);
    }
  );
}

function delSnap(id: string) {
  logger.debug(`Deleting Home Assistant backup ${id}`);
  const option = {
    headers: { authorization: `Bearer ${token}` },
  };
  return got.delete(`http://hassio/backups/${id}`, option).then(
    (result) => {
      return result;
    },
    (reason: RequestError) => {
      messageManager.error(
        "Fail to delete Homme assistant backup detail.",
        reason.message
      );
      logger.error("Fail to retrive Homme assistant backup detail.");
      logger.error(reason);
      return Promise.reject(reason);
    }
  );
}

function getBackupInfo(id: string) {
  const option: OptionsOfJSONResponseBody = {
    headers: { authorization: `Bearer ${token}` },
    responseType: "json",
  };
  return got<SupervisorResponse<BackupDetailModel>>(
    `http://hassio/backups/${id}/info`,
    option
  ).then(
    (result) => {
      logger.info("Backup found !");
      logger.debug(`Backup size: ${result.body.data.size}`);
      return result;
    },
    (reason: RequestError) => {
      messageManager.error(
        "Fail to retrive Homme assistant backup detail.",
        reason.message
      );
      logger.error("Fail to retrive Homme assistant backup detail");
      logger.error(reason);
      return Promise.reject(reason);
    }
  );
}

function createNewBackup(
  name: string,
  type: BackupType,
  passwordEnable: boolean,
  password?: string,
  addonSlugs?: string[],
  folders?: string[]
) {
  const status = statusTools.getStatus();
  status.status = States.BKUP_CREATION;
  status.progress = -1;
  statusTools.setStatus(status);
  logger.info("Creating new snapshot...");
  const body: NewBackupPayload = {
    name: name,
    password: passwordEnable ? password : undefined,
    addons: type == BackupType.PARTIAL ? addonSlugs : undefined,
    folders: type == BackupType.PARTIAL ? folders : undefined,
  };

  const option: OptionsOfJSONResponseBody = {
    headers: { authorization: `Bearer ${token}` },
    responseType: "json",
    timeout: {
      response: create_snap_timeout,
    },
    json: body,
  };

  const url =
    type == BackupType.PARTIAL
      ? "http://hassio/backups/new/partial"
      : "http://hassio/backups/new/full";
  return got.post<SupervisorResponse<{ slug: string }>>(url, option).then(
    (result) => {
      logger.info(`Snapshot created with id ${result.body.data.slug}`);
      const status = statusTools.getStatus();
      status.status = States.IDLE;
      status.progress = undefined;
      statusTools.setStatus(status);
      return result;
    },
    (reason: RequestError) => {
      messageManager.error("Fail to create new backup.", reason.message);
      logger.error("Fail to create new backup");
      logger.error(reason);
      const status = statusTools.getStatus();
      status.status = States.IDLE;
      status.progress = undefined;
      statusTools.setStatus(status);
      return Promise.reject(reason);
    }
  );
}

function clean(backupConfig: BackupConfig) {
  if (!backupConfig.autoClean.homeAssistant.enabled) {
    logger.debug("Clean disabled for Home Assistant");
    return Promise.resolve();
  }
  logger.info("Clean for Home Assistant");
  const status = statusTools.getStatus();
  status.status = States.CLEAN_HA;
  status.progress = -1;
  statusTools.setStatus(status);

  const numberToKeep = backupConfig.autoClean.homeAssistant.nbrToKeep || 5;
  return getBackups()
    .then((response) => {
      const backups = response.body.data.backups;
      if (backups.length > numberToKeep) {
        backups.sort((a, b) => {
          return Date.parse(b.date) - Date.parse(a.date);
        });
        const toDel = backups.slice(numberToKeep);
        logger.debug(`Number of backup to clean: ${toDel.length}`);
        const promises = toDel.map((value) => delSnap(value.slug));
        logger.info("Home Assistant clean done.");
        return Promise.allSettled(promises);
      } else {
        logger.debug("Nothing to clean");
      }
    })
    .then(
      (values) => {
        const status = statusTools.getStatus();
        status.status = States.IDLE;
        status.progress = undefined;
        statusTools.setStatus(status);

        let errors = false;
        for (const val of values || []) {
          if (val.status == "rejected") {
            messageManager.error("Fail to delete backup", val.reason as string);
            logger.error("Fail to delete backup");
            logger.error(val.reason);
            errors = true;
          }
        }
        if (errors) {
          messageManager.error("Fail to clean backups in Home Assistant");
          logger.error("Fail to clean backups in Home Assistant");
          return Promise.reject(new Error());
        }
        return Promise.resolve();
      },
      (reason: RequestError) => {
        logger.error("Fail to clean Home Assistant backup", reason.message);
        messageManager.error(
          "Fail to clean Home Assistant backup",
          reason.message
        );
        return Promise.reject(reason);
      }
    );
}

function uploadSnapshot(path: string) {
  const status = statusTools.getStatus();
  status.status = States.BKUP_UPLOAD_HA;
  status.progress = 0;
  statusTools.setStatus(status);
  logger.info("Uploading backup...");
  const stream = fs.createReadStream(path);
  const form = new FormData();
  form.append("file", stream);

  const options = {
    body: form,
    headers: { authorization: `Bearer ${token}` },
  };
  return got
    .post(`http://hassio/backups/new/upload`, options)
    .on("uploadProgress", (e: Progress) => {
      const percent = e.percent;
      if (status.progress !== percent) {
        status.progress = percent;
        statusTools.setStatus(status);
      }
      if (percent >= 1) {
        logger.info("Upload done...");
      }
    })
    .then(
      (res) => {
        logger.info(`...Upload finish ! (status: ${res.statusCode})`);
        const status = statusTools.getStatus();
        status.status = States.IDLE;
        status.progress = undefined;
        statusTools.setStatus(status);
        fs.unlinkSync(path);
        return res;
      },
      (err: RequestError) => {
        const status = statusTools.getStatus();
        status.status = States.IDLE;
        status.progress = undefined;
        statusTools.setStatus(status);
        fs.unlinkSync(path);
        messageManager.error(
          "Fail to upload backup to Home Assistant",
          err.message
        );
        logger.error("Fail to upload backup to Home Assistant");
        logger.error(err);
        logger.error(`Body: ${err.response?.body as string}`);
      }
    );
}

function stopAddons(addonSlugs: string[]) {
  logger.info("Stopping addons...");
  const status = statusTools.getStatus();
  status.status = States.STOP_ADDON;
  status.progress = -1;
  statusTools.setStatus(status);
  const promises = [];
  const option: OptionsOfJSONResponseBody = {
    headers: { authorization: `Bearer ${token}` },
    responseType: "json",
  };
  for (const addon of addonSlugs) {
    if (addon !== "") {
      logger.debug(`... Stopping addon ${addon}`);
      promises.push(got.post(`http://hassio/addons/${addon}/stop`, option));
    }
  }
  return Promise.allSettled(promises).then((values) => {
    let errors = false;
    const status = statusTools.getStatus();
    status.status = States.IDLE;
    status.progress = undefined;
    statusTools.setStatus(status);
    for (const val of values) {
      if (val.status == "rejected") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        messageManager.error("Fail to stop addon", val.reason);
        logger.error("Fail to stop addon");
        logger.error(val.reason);
        errors = true;
      }
    }
    if (errors) {
      messageManager.error("Fail to stop addon");
      logger.error("Fail to stop addon");
      return Promise.reject(new Error());
    }
  });
}

function startAddons(addonSlugs: string[]) {
  logger.info("Starting addons...");
  const status = statusTools.getStatus();
  status.status = States.START_ADDON;
  status.progress = -1;
  statusTools.setStatus(status);
  const promises = [];
  const option: OptionsOfJSONResponseBody = {
    headers: { authorization: `Bearer ${token}` },
    responseType: "json",
  };
  for (const addon of addonSlugs) {
    if (addon !== "") {
      logger.debug(`... Starting addon ${addon}`);
      promises.push(got.post(`http://hassio/addons/${addon}/start`, option));
    }
  }
  return Promise.allSettled(promises).then((values) => {
    const status = statusTools.getStatus();
    status.status = States.IDLE;
    status.progress = undefined;
    statusTools.setStatus(status);
    let errors = false;
    for (const val of values) {
      if (val.status == "rejected") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        messageManager.error("Fail to start addon", val.reason);
        logger.error("Fail to start addon");
        logger.error(val.reason);
        errors = true;
      }
    }
    if (errors) {
      messageManager.error("Fail to start addon");
      logger.error("Fail to start addon");
      return Promise.reject(new Error());
    }
  });
}

export function getFolderList() {
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

function publish_state() {
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
  clean,
  createNewBackup,
  delSnap,
  downloadSnapshot,
  getAddonList,
  getBackupInfo,
  getBackups,
  getVersion,
  publish_state,
  startAddons,
  stopAddons,
  uploadSnapshot,
};
