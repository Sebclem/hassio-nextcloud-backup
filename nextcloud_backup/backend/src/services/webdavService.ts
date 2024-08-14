/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { randomUUID } from "crypto";
import { XMLParser } from "fast-xml-parser";
import fs from "fs";
import got, {
  HTTPError,
  RequestError,
  type Method,
  type PlainResponse,
} from "got";
import { DateTime } from "luxon";
import logger from "../config/winston.js";
import messageManager from "../tools/messageManager.js";
import * as pathTools from "../tools/pathTools.js";
import * as statusTools from "../tools/status.js";
import type { WebdavBackup } from "../types/services/webdav.js";
import type { WebdavConfig } from "../types/services/webdavConfig.js";
import { States } from "../types/status.js";
import { templateToRegexp } from "./backupConfigService.js";
import { getChunkEndpoint, getEndpoint } from "./webdavConfigService.js";
import { pipeline } from "stream/promises";
import { humanFileSize } from "../tools/toolbox.js";
import type { BackupConfig } from "../types/services/backupConfig.js";
import path from "path";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MiB Same as desktop client
const CHUNK_NUMBER_SIZE = 5; // To add landing "0"
const PROPFIND_BODY =
  '<?xml version="1.0" encoding="utf-8" ?>\
<d:propfind xmlns:d="DAV:">\
  <d:prop>\
        <d:getlastmodified />\
        <d:getetag />\
        <d:getcontenttype />\
        <d:resourcetype />\
        <d:getcontentlength />\
  </d:prop>\
</d:propfind>';

export function checkWebdavLogin(
  config: WebdavConfig,
  silent: boolean = false
) {
  const endpoint = getEndpoint(config);
  return got(config.url + endpoint, {
    method: "OPTIONS",
    headers: {
      authorization:
        "Basic " +
        Buffer.from(config.username + ":" + config.password).toString("base64"),
    },
    https: { rejectUnauthorized: !config.allowSelfSignedCerts },
  }).then(
    (response) => {
      const status = statusTools.getStatus();
      status.webdav.logged_in = true;
      status.webdav.last_check = DateTime.now();
      return response;
    },
    (reason: RequestError) => {
      if (!silent) {
        messageManager.error("Fail to connect to Webdav", reason.message);
      }
      const status = statusTools.getStatus();
      status.webdav = {
        logged_in: false,
        folder_created: status.webdav.folder_created,
        last_check: DateTime.now(),
      };
      statusTools.setStatus(status);
      logger.error(`Fail to connect to Webdav`);
      logger.error(reason);
      return Promise.reject(reason);
    }
  );
}

export async function createBackupFolder(conf: WebdavConfig) {
  const root_splited = conf.backupDir.split("/").splice(1);
  let thiPath = "/";
  for (const elem of root_splited) {
    if (elem != "") {
      thiPath = path.join(thiPath, elem);
      try {
        await createDirectory(thiPath, conf);
        logger.debug(`Path ${thiPath} created.`);
      } catch (error) {
        if (error instanceof HTTPError && error.response.statusCode == 405)
          logger.debug(`Path ${thiPath} already exist.`);
        else {
          messageManager.error("Fail to create webdav root folder");
          logger.error("Fail to create webdav root folder");
          logger.error(error);
          const status = statusTools.getStatus();
          status.webdav.folder_created = false;
          status.webdav.last_check = DateTime.now();
          statusTools.setStatus(status);
          return Promise.reject(error as Error);
        }
      }
    }
  }
  for (const elem of [pathTools.auto, pathTools.manual]) {
    try {
      await createDirectory(path.join(conf.backupDir, elem), conf);
      logger.debug(`Path ${path.join(conf.backupDir, elem)} created.`);
    } catch (error) {
      if (error instanceof HTTPError && error.response.statusCode == 405) {
        logger.debug(`Path ${path.join(conf.backupDir, elem)} already exist.`);
      } else {
        messageManager.error("Fail to create webdav root folder");
        logger.error("Fail to create webdav root folder");
        logger.error(error);
        const status = statusTools.getStatus();
        status.webdav.folder_created = false;
        status.webdav.last_check = DateTime.now();
        statusTools.setStatus(status);
        return Promise.reject(error as Error);
      }
    }
  }
  const status = statusTools.getStatus();
  status.webdav.folder_created = true;
  status.webdav.last_check = DateTime.now();
  statusTools.setStatus(status);
}

function createDirectory(pathToCreate: string, config: WebdavConfig) {
  const endpoint = getEndpoint(config);
  return got(path.join(config.url, endpoint, pathToCreate), {
    method: "MKCOL" as Method,
    headers: {
      authorization:
        "Basic " +
        Buffer.from(config.username + ":" + config.password).toString("base64"),
    },
  });
}

export function getBackups(
  folder: string,
  config: WebdavConfig,
  nameTemplate: string
) {
  const status = statusTools.getStatus();
  if (!status.webdav.logged_in && !status.webdav.folder_created) {
    return Promise.reject(new Error("Not logged in"));
  }
  const endpoint = getEndpoint(config);
  return got(path.join(config.url, endpoint, config.backupDir, folder), {
    method: "PROPFIND" as Method,
    headers: {
      authorization:
        "Basic " +
        Buffer.from(config.username + ":" + config.password).toString("base64"),
      Depth: "1",
    },
    https: { rejectUnauthorized: !config.allowSelfSignedCerts },
    body: PROPFIND_BODY,
  }).then(
    (value) => {
      const data = parseXmlBackupData(value.body, config).sort(
        (a, b) => b.lastEdit.toMillis() - a.lastEdit.toMillis()
      );
      return extractBackupInfo(data, nameTemplate);
    },
    (reason: RequestError) => {
      messageManager.error(
        `Fail to retrive webdav backups in ${folder} folder`
      );
      logger.error(`Fail to retrive webdav backups in ${folder} folder`);
      logger.error(reason);
      return Promise.reject(reason);
    }
  );
}

function extractBackupInfo(backups: WebdavBackup[], template: string) {
  const regex = new RegExp(templateToRegexp(template));
  for (const elem of backups) {
    const match = elem.name.match(regex);
    if (match?.groups?.date) {
      let format = "yyyy-LL-dd";
      let date = match.groups.date;
      if (match.groups.hour) {
        format += "+HHmm";
        date += `+${match.groups.hour}`;
      } else if (match.groups.hour_12) {
        format += "+hhmma";
        date += `+${match.groups.hour_12}`;
      }

      elem.creationDate = DateTime.fromFormat(date, format);
    }
    if (match?.groups?.version) {
      elem.haVersion = match.groups.version;
    }
  }
  return backups;
}

export function deleteBackup(pathToDelete: string, config: WebdavConfig) {
  logger.debug(`Deleting Cloud backup ${pathToDelete}`);
  const endpoint = getEndpoint(config);
  return got
    .delete(path.join(config.url, endpoint, pathToDelete), {
      headers: {
        authorization:
          "Basic " +
          Buffer.from(config.username + ":" + config.password).toString(
            "base64"
          ),
      },
      https: { rejectUnauthorized: !config.allowSelfSignedCerts },
    })
    .then(
      (response) => {
        return response;
      },
      (reason: RequestError) => {
        messageManager.error("Fail to delete backup in webdav", reason.message);
        logger.error(`Fail to delete backup in Cloud`);
        logger.error(reason);
        return Promise.reject(reason);
      }
    );
}

function parseXmlBackupData(body: string, config: WebdavConfig) {
  const parser = new XMLParser();
  const data = parser.parse(body);
  const multistatus = data["d:multistatus"];
  const backups: WebdavBackup[] = [];
  if (Array.isArray(multistatus["d:response"])) {
    for (const elem of multistatus["d:response"]) {
      // If array -> base folder, ignoring it
      if (!Array.isArray(elem["d:propstat"])) {
        const propstat = elem["d:propstat"];
        const id = propstat["d:prop"]["d:getetag"].replaceAll('"', "");
        const href = decodeURI(elem["d:href"]);
        const name = href.split("/").slice(-1)[0];
        const lastEdit = DateTime.fromHTTP(
          propstat["d:prop"]["d:getlastmodified"]
        );
        backups.push({
          id: id,
          lastEdit: lastEdit,
          size: propstat["d:prop"]["d:getcontentlength"],
          name: name,
          path: href.replace(getEndpoint(config), ""),
        });
      }
    }
  }
  return backups;
}

export function webdavUploadFile(
  localPath: string,
  webdavPath: string,
  config: WebdavConfig
) {
  return new Promise((resolve, reject) => {
    logger.info(`Uploading ${localPath} to webdav...`);

    const stats = fs.statSync(localPath);
    const stream = fs.createReadStream(localPath);
    const options = {
      body: stream,
      headers: {
        authorization:
          "Basic " +
          Buffer.from(config.username + ":" + config.password).toString(
            "base64"
          ),
        "content-length": String(stats.size),
      },
      https: { rejectUnauthorized: !config.allowSelfSignedCerts },
    };
    const url = path.join(config.url, getEndpoint(config), webdavPath);

    logger.debug(`...URI: ${encodeURI(url)}`);
    logger.debug(`...rejectUnauthorized: ${options.https?.rejectUnauthorized}`);
    const status = statusTools.getStatus();
    status.status = States.BKUP_UPLOAD_CLOUD;
    status.progress = 0;
    statusTools.setStatus(status);
    got.stream
      .put(encodeURI(url), options)
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
      .on("response", (res: PlainResponse) => {
        const status = statusTools.getStatus();
        status.status = States.IDLE;
        status.progress = undefined;
        statusTools.setStatus(status);
        if (res.statusCode != 201 && res.statusCode != 204) {
          messageManager.error(
            "Fail to upload file to Cloud.",
            `Code: ${res.statusCode} Body: ${res.body as string}`
          );
          logger.error(`Fail to upload file to Cloud`);
          logger.error(`Code: ${res.statusCode}`);
          logger.error(`Body: ${res.body as string}`);
          fs.unlinkSync(localPath);
          reject(new Error(res.statusCode.toString()));
        } else {
          logger.info(`...Upload finish ! (status: ${res.statusCode})`);
          fs.unlinkSync(localPath);
          resolve(undefined);
        }
      })
      .on("error", (err: RequestError) => {
        const status = statusTools.getStatus();
        status.status = States.IDLE;
        status.progress = undefined;
        statusTools.setStatus(status);
        messageManager.error("Fail to upload backup to Cloud", err.message);
        logger.error("Fail to upload backup to Cloud");
        logger.error(err);
        fs.unlinkSync(localPath);
        reject(err);
      });
  });
}

export async function chunkedUpload(
  localPath: string,
  webdavPath: string,
  config: WebdavConfig
) {
  const uuid = randomUUID();
  const fileSize = fs.statSync(localPath).size;

  const chunkEndpoint = getChunkEndpoint(config);
  const chunkedUrl = path.join(config.url, chunkEndpoint, uuid);
  const finalDestination = path.join(
    config.url,
    getEndpoint(config),
    webdavPath
  );
  const status = statusTools.getStatus();
  status.status = States.BKUP_UPLOAD_CLOUD;
  status.progress = -1;
  statusTools.setStatus(status);
  try {
    await initChunkedUpload(chunkedUrl, finalDestination, config);
  } catch (err) {
    if (err instanceof RequestError) {
      messageManager.error(
        "Fail to init chuncked upload.",
        `Code: ${err.code} Body: ${err.response?.body}`
      );
      logger.error(`Fail to init chuncked upload`);
      logger.error(`Code: ${err.code}`);
      logger.error(`Body: ${err.response?.body}`);
    } else {
      messageManager.error(
        "Fail to init chuncked upload.",
        (err as Error).message
      );
      logger.error(`Fail to init chuncked upload`);
      logger.error((err as Error).message);
    }
    fs.unlinkSync(localPath);
    const status = statusTools.getStatus();
    status.status = States.IDLE;
    status.progress = undefined;
    statusTools.setStatus(status);
    throw err;
  }

  let start = 0;
  let end = Math.min(CHUNK_SIZE - 1, fileSize - 1);

  let current_size = end + 1;
  // const uploadedBytes = 0;

  let i = 1;
  while (start < fileSize - 1) {
    const chunk = fs.createReadStream(localPath, { start, end });
    try {
      const chunckNumber = i.toString().padStart(CHUNK_NUMBER_SIZE, "0");
      await uploadChunk(
        path.join(chunkedUrl, chunckNumber),
        finalDestination,
        chunk,
        current_size,
        fileSize,
        config
      );
      start = end + 1;
      end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
      current_size = end - start + 1;
      i++;
    } catch (error) {
      if (error instanceof Error) {
        messageManager.error(
          "Fail to upload file to Cloud.",
          `Error: ${error.message}`
        );
        logger.error(`Fail to upload file to Cloud`);
      } else {
        messageManager.error(
          "Fail to upload file to Cloud.",
          `Code: ${(error as PlainResponse).statusCode} Body: ${
            (error as PlainResponse).body as string
          }`
        );
        logger.error(`Fail to upload file to Cloud`);
        logger.error(`Code: ${(error as PlainResponse).statusCode}`);
        logger.error(`Body: ${(error as PlainResponse).body as string}`);
      }
      const status = statusTools.getStatus();
      status.status = States.IDLE;
      status.progress = undefined;
      statusTools.setStatus(status);
      throw error;
    }
  }
  logger.debug("Chunked upload funished, assembling chunks.");
  try {
    await assembleChunkedUpload(chunkedUrl, finalDestination, fileSize, config);
    const status = statusTools.getStatus();
    status.status = States.IDLE;
    status.progress = undefined;
    statusTools.setStatus(status);
    logger.info(`...Upload finish !`);
    fs.unlinkSync(localPath);
  } catch (err) {
    if (err instanceof RequestError) {
      messageManager.error(
        "Fail to assembling chunks.",
        `Code: ${err.code} Body: ${err.response?.body}`
      );
      logger.error("Fail to assemble chunks");
      logger.error(`Code: ${err.code}`);
      logger.error(`Body: ${err.response?.body}`);
    } else {
      messageManager.error("Fail to assemble chunks", (err as Error).message);
      logger.error("Fail to assemble chunks");
      logger.error((err as Error).message);
    }
    fs.unlinkSync(localPath);
    const status = statusTools.getStatus();
    status.status = States.IDLE;
    status.progress = undefined;
    statusTools.setStatus(status);
    throw err;
  }
}

function uploadChunk(
  url: string,
  finalDestination: string,
  body: fs.ReadStream,
  contentLength: number,
  totalLength: number,
  config: WebdavConfig
) {
  return new Promise<PlainResponse>((resolve, reject) => {
    logger.debug(`Uploading chunck.`);
    logger.debug(`...URI: ${encodeURI(url)}`);
    logger.debug(`...Final destination: ${encodeURI(finalDestination)}`);
    logger.debug(`...Chunk size: ${contentLength}`);
    logger.debug(`...Total size: ${totalLength}`);
    got.stream
      .put(url, {
        headers: {
          authorization:
            "Basic " +
            Buffer.from(config.username + ":" + config.password).toString(
              "base64"
            ),
          Destination: encodeURI(finalDestination),
          "OC-Total-Length": totalLength.toString(),
          "content-length": contentLength.toString(),
        },
        https: { rejectUnauthorized: !config.allowSelfSignedCerts },
        body: body,
      })
      .on("response", (res: PlainResponse) => {
        if (res.ok) {
          logger.debug("Chunk upload done.");
          resolve(res);
        } else {
          logger.error(`Fail to upload chunk: ${res.statusCode}`);
          reject(new Error(res.statusCode.toString()));
        }
      })
      .on("error", (err) => {
        logger.error(`Fail to upload chunk: ${err.message}`);
        reject(err);
      });
  });
}

function initChunkedUpload(
  url: string,
  finalDestination: string,
  config: WebdavConfig
) {
  logger.info(`Init chuncked upload.`);
  logger.debug(`...URI: ${encodeURI(url)}`);
  logger.debug(`...Final destination: ${encodeURI(finalDestination)}`);
  return got(encodeURI(url), {
    method: "MKCOL" as Method,
    headers: {
      authorization:
        "Basic " +
        Buffer.from(config.username + ":" + config.password).toString("base64"),
      Destination: encodeURI(finalDestination),
    },
    https: { rejectUnauthorized: !config.allowSelfSignedCerts },
  });
}

function assembleChunkedUpload(
  url: string,
  finalDestination: string,
  totalLength: number,
  config: WebdavConfig
) {
  const chunckFile = path.join(url, ".file");
  logger.info(`Assemble chuncked upload.`);
  logger.debug(`...URI: ${encodeURI(chunckFile)}`);
  logger.debug(`...Final destination: ${encodeURI(finalDestination)}`);
  return got(encodeURI(chunckFile), {
    method: "MOVE" as Method,
    headers: {
      authorization:
        "Basic " +
        Buffer.from(config.username + ":" + config.password).toString("base64"),
      Destination: encodeURI(finalDestination),
      "OC-Total-Length": totalLength.toString(),
    },
    https: { rejectUnauthorized: !config.allowSelfSignedCerts },
  });
}

export function downloadFile(
  webdavPath: string,
  filename: string,
  config: WebdavConfig
) {
  logger.info(`Downloading ${webdavPath} from webdav...`);
  if (!fs.existsSync("./temp/")) {
    fs.mkdirSync("./temp/");
  }
  const tmp_file = `./temp/${filename}`;
  const stream = fs.createWriteStream(tmp_file);
  const options = {
    headers: {
      authorization:
        "Basic " +
        Buffer.from(config.username + ":" + config.password).toString("base64"),
    },
    https: { rejectUnauthorized: !config.allowSelfSignedCerts },
  };
  const url = path.join(config.url, getEndpoint(config), webdavPath);
  logger.debug(`...URI: ${encodeURI(url)}`);
  logger.debug(`...rejectUnauthorized: ${options.https?.rejectUnauthorized}`);
  const status = statusTools.getStatus();
  status.status = States.BKUP_DOWNLOAD_CLOUD;
  status.progress = 0;
  statusTools.setStatus(status);
  return pipeline(
    got.stream.get(encodeURI(url), options).on("downloadProgress", (e) => {
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
      status.progress = 1;
      statusTools.setStatus(status);
      logger.debug(
        `Backup dl size: ${humanFileSize(fs.statSync(tmp_file).size)}`
      );
      return tmp_file;
    },
    (reason: RequestError) => {
      if (fs.existsSync(tmp_file)) fs.unlinkSync(tmp_file);
      logger.error("Fail to download Cloud backup", reason.message);
      messageManager.error("Fail to download Cloud backup", reason.message);
      const status = statusTools.getStatus();
      status.status = States.IDLE;
      status.progress = undefined;
      statusTools.setStatus(status);
      return Promise.reject(reason);
    }
  );
}

export function clean(backupConfig: BackupConfig, webdavConfig: WebdavConfig) {
  if (!backupConfig.autoClean.webdav.enabled) {
    logger.debug("Clean disabled for Cloud");
    return Promise.resolve();
  }
  logger.info("Clean for cloud");
  const status = statusTools.getStatus();
  status.status = States.CLEAN_CLOUD;
  status.progress = -1;
  statusTools.setStatus(status);
  const limit = backupConfig.autoClean.homeAssistant.nbrToKeep || 5;
  return getBackups(pathTools.auto, webdavConfig, backupConfig.nameTemplate)
    .then((backups) => {
      if (backups.length > limit) {
        const toDel = backups.splice(limit);
        logger.debug(`Number of backup to clean: ${toDel.length}`);
        const promises = toDel.map((value) =>
          deleteBackup(value.path, webdavConfig)
        );
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
            messageManager.error("Fail to delete backup", val.reason);
            logger.error("Fail to delete backup");
            logger.error(val.reason);
            errors = true;
          }
        }

        if (errors) {
          messageManager.error("Fail to clean backups in Cloud");
          logger.error("Fail to clean backups in Cloud");
          return Promise.reject(new Error());
        }

        return Promise.resolve();
      },
      (reason: RequestError) => {
        logger.error("Fail to clean cloud backup", reason.message);
        messageManager.error("Fail to clean cloud backup", reason.message);
        return Promise.reject(reason);
      }
    );
}
