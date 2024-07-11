/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { templateToRegexp } from "./backupConfigService.js";
import { getChunkEndpoint, getEndpoint } from "./webdavConfigService.js";
import { States } from "../types/status.js";
import { randomUUID } from "crypto";

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
    (reason) => {
      if (!silent) {
        messageManager.error(
          "Fail to connect to Webdav",
          (reason as Error).message
        );
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
      return Promise.reject(reason as Error);
    }
  );
}

export async function createBackupFolder(conf: WebdavConfig) {
  const root_splited = conf.backupDir.split("/").splice(1);
  let path = "/";
  for (const elem of root_splited) {
    if (elem != "") {
      path = path + elem + "/";
      try {
        await createDirectory(path, conf);
        logger.debug(`Path ${path} created.`);
      } catch (error) {
        if (error instanceof HTTPError && error.response.statusCode == 405)
          logger.debug(`Path ${path} already exist.`);
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
      await createDirectory(conf.backupDir + elem, conf);
      logger.debug(`Path ${conf.backupDir + elem} created.`);
    } catch (error) {
      if (error instanceof HTTPError && error.response.statusCode == 405) {
        logger.debug(`Path ${conf.backupDir + elem} already exist.`);
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

function createDirectory(path: string, config: WebdavConfig) {
  const endpoint = getEndpoint(config);
  return got(config.url + endpoint + path, {
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
  return got(config.url + endpoint + config.backupDir + folder, {
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
    (reason) => {
      messageManager.error(
        `Fail to retrive webdav backups in ${folder} folder`
      );
      logger.error(`Fail to retrive webdav backups in ${folder} folder`);
      logger.error(reason);
      return Promise.reject(reason as Error);
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

export function deleteBackup(path: string, config: WebdavConfig) {
  const endpoint = getEndpoint(config);
  return got
    .delete(config.url + endpoint + path, {
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
      (reason) => {
        messageManager.error(
          "Fail to delete backup in webdav",
          (reason as Error)?.message
        );
        logger.error(`Fail to delete backup in Cloud`);
        logger.error(reason);
        return Promise.reject(reason as Error);
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
    const url = config.url + getEndpoint(config) + webdavPath;

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
  const chunkedUrl = config.url + chunkEndpoint + uuid;
  const finalDestination = config.url + getEndpoint(config) + webdavPath;
  const status = statusTools.getStatus();
  status.status = States.BKUP_UPLOAD_CLOUD;
  status.progress = 0;
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
    throw err;
  }

  let start = 0;
  let end = fileSize > CHUNK_SIZE ? CHUNK_SIZE : fileSize;
  let current_size = end;
  // const uploadedBytes = 0;

  let i = 0;
  while (start < fileSize) {
    const chunk = fs.createReadStream(localPath, { start, end });
    try {
      const chunckNumber = i.toString().padStart(CHUNK_NUMBER_SIZE, "0");
      await uploadChunk(
        chunkedUrl + `/${chunckNumber}`,
        finalDestination,
        chunk,
        current_size,
        fileSize,
        config
      );
      start = end;
      end = Math.min(start + CHUNK_SIZE, fileSize - 1);
      current_size = end - start;
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
      throw error;
    }
  }
  logger.debug("Chunked upload funished, assembling chunks.");
  try {
    await assembleChunkedUpload(chunkedUrl, finalDestination, fileSize, config);
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
    throw err;
  }
}

export function uploadChunk(
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

export function initChunkedUpload(
  url: string,
  finalDestination: string,
  config: WebdavConfig
) {
  logger.debug(`Init chuncked upload.`);
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

export function assembleChunkedUpload(
  url: string,
  finalDestination: string,
  totalLength: number,
  config: WebdavConfig
) {
  const chunckFile = `${url}/.file`;
  logger.debug(`Assemble chuncked upload.`);
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
// import fs from "fs";
// import got from "got";
// import https from "https";
// import path from "path";
// import stream from "stream";
// import { promisify } from "util";
// import { createClient, WebDAVClient } from "webdav";

// import { DateTime } from "luxon";
// import logger from "../config/winston.js";
// import { WebdavSettings } from "../types/settings.js";
// import * as pathTools from "../tools/pathTools.js";
// import * as settingsTools from "../tools/settingsTools.js";
// import * as statusTools from "../tools/status.js";

// const endpoint = "/remote.php/webdav";
// const configPath = "/data/webdav_conf.json";

// const pipeline = promisify(stream.pipeline);

// class WebdavTools {
//   host: string | undefined;
//   client: WebDAVClient | undefined;
//   baseUrl: string | undefined;
//   username: string | undefined;
//   password: string | undefined;

//   init(
//     ssl: boolean,
//     host: string,
//     username: string,
//     password: string,
//     accept_selfsigned_cert: boolean
//   ) {
//     return new Promise((resolve, reject) => {
//       this.host = host;
//       const status = statusTools.getStatus();
//       logger.info("Initializing and checking webdav client...");
//       this.baseUrl = (ssl ? "https" : "http") + "://" + host + endpoint;
//       this.username = username;
//       this.password = password;
//       const agent_option = ssl
//         ? { rejectUnauthorized: !accept_selfsigned_cert }
//         : {};
//       try {
//         this.client = createClient(this.baseUrl, {
//           username: username,
//           password: password,
//           httpsAgent: new https.Agent(agent_option),
//         });

//         this.client
//           .getDirectoryContents("/")
//           .then(() => {
//             if (status.error_code === 3) {
//               status.status = "idle";
//               status.message = undefined;
//               status.error_code = undefined;
//               statusTools.setStatus(status);
//             }
//             logger.debug("Nextcloud connection:  \x1b[32mSuccess !\x1b[0m");
//             this.initFolder().then(() => {
//               resolve(undefined);
//             });
//           })
//           .catch((error) => {
//             this.__cant_connect_status(error);
//             this.client = undefined;
//             reject("Can't connect to Nextcloud (" + error + ") !");
//           });
//       } catch (err) {
//         this.__cant_connect_status(err);
//         this.client = undefined;
//         reject("Can't connect to Nextcloud (" + err + ") !");
//       }
//     });
//   }
//   __cant_connect_status(err: any) {
//     statusTools.setError(`Can't connect to Nextcloud (${err})`, 3);
//   }

//   async __createRoot() {
//     const conf = this.getConf();
//     if (this.client && conf) {
//       const root_splited = conf.back_dir.split("/").splice(1);
//       let path = "/";
//       for (const elem of root_splited) {
//         if (elem !== "") {
//           path = path + elem + "/";
//           try {
//             await this.client.createDirectory(path);
//             logger.debug(`Path ${path} created.`);
//           } catch (error) {
//             if ((error as any).status === 405)
//               logger.debug(`Path ${path} already exist.`);
//             else logger.error(error);
//           }
//         }
//       }
//     }
//   }

//   initFolder() {
//     return new Promise((resolve, reject) => {
//       this.__createRoot()
//         .catch((err) => {
//           logger.error(err);
//         })
//         .then(() => {
//           if (!this.client) {
//             return;
//           }
//           this.client
//             .createDirectory(this.getConf()?.back_dir + pathTools.auto)
//             .catch(() => {
//               // Ignore
//             })
//             .then(() => {
//               if (!this.client) {
//                 return;
//               }
//               this.client
//                 .createDirectory(this.getConf()?.back_dir + pathTools.manual)
//                 .catch(() => {
//                   // Ignore
//                 })
//                 .then(() => {
//                   resolve(undefined);
//                 });
//             });
//         });
//     });
//   }

//   /**
//    * Check if theh webdav config is valid, if yes, start init of webdav client
//    */
//   confIsValid() {
//     return new Promise((resolve, reject) => {
//       const status = statusTools.getStatus();
//       const conf = this.getConf();
//       if (conf != undefined) {
//         if (
//           conf.ssl != undefined &&
//           conf.host != undefined &&
//           conf.username != undefined &&
//           conf.password != undefined
//         ) {
//           if (status.error_code === 2) {
//             status.status = "idle";
//             status.message = undefined;
//             status.error_code = undefined;
//             statusTools.setStatus(status);
//           }
//           // Check if self_signed option exist
//           if (conf.self_signed == undefined) {
//             conf.self_signed = false;
//             this.setConf(conf);
//           }
//           this.init(
//             conf.ssl,
//             conf.host,
//             conf.username,
//             conf.password,
//             conf.self_signed
//           )
//             .then(() => {
//               resolve(undefined);
//             })
//             .catch((err) => {
//               reject(err);
//             });
//         } else {
//           status.status = "error";
//           status.error_code = 2;
//           status.message = "Nextcloud config invalid !";
//           statusTools.setStatus(status);
//           logger.error(status.message);
//           reject("Nextcloud config invalid !");
//         }

//         if (conf.back_dir == null || conf.back_dir === "") {
//           logger.info("Backup dir is null, initializing it.");
//           conf.back_dir = pathTools.default_root;
//           this.setConf(conf);
//         } else {
//           if (!conf.back_dir.startsWith("/")) {
//             logger.warn("Backup dir not starting with '/', fixing this...");
//             conf.back_dir = `/${conf.back_dir}`;
//             this.setConf(conf);
//           }
//           if (!conf.back_dir.endsWith("/")) {
//             logger.warn("Backup dir not ending with '/', fixing this...");
//             conf.back_dir = `${conf.back_dir}/`;
//             this.setConf(conf);
//           }
//         }
//       } else {
//         status.status = "error";
//         status.error_code = 2;
//         status.message = "Nextcloud config not found !";
//         statusTools.setStatus(status);
//         logger.error(status.message);
//         reject("Nextcloud config not found !");
//       }
//     });
//   }

//   getConf(): WebdavSettings | undefined {
//     if (fs.existsSync(configPath)) {
//       return JSON.parse(fs.readFileSync(configPath).toString());
//     } else return undefined;
//   }

//   setConf(conf: WebdavSettings) {
//     fs.writeFileSync(configPath, JSON.stringify(conf));
//   }

//   uploadFile(id: string, path: string) {
//     return new Promise((resolve, reject) => {
//       if (this.client == null) {
//         this.confIsValid()
//           .then(() => {
//             this._startUpload(id, path)
//               .then(() => resolve(undefined))
//               .catch((err) => reject(err));
//           })
//           .catch((err) => {
//             reject(err);
//           });
//       } else
//         this._startUpload(id, path)
//           .then(() => resolve(undefined))
//           .catch((err) => reject(err));
//     });
//   }

//   _startUpload(id: string, path: string) {
//     return new Promise((resolve, reject) => {
//       const status = statusTools.getStatus();
//       status.status = "upload";
//       status.progress = 0;
//       status.message = undefined;
//       status.error_code = undefined;
//       statusTools.setStatus(status);
//       logger.info("Uploading snap...");
//       const tmpFile = `./temp/${id}.tar`;
//       const stats = fs.statSync(tmpFile);
//       const stream = fs.createReadStream(tmpFile);
//       const conf = this.getConf();
//       const options = {
//         body: stream,
//         headers: {
//           authorization:
//             "Basic " +
//             Buffer.from(this.username + ":" + this.password).toString("base64"),
//           "content-length": String(stats.size),
//         },
//         https: undefined as any | undefined,
//       };
//       if (conf?.ssl) {
//         options["https"] = { rejectUnauthorized: !conf.self_signed };
//       }
//       logger.debug(
//         `...URI: ${encodeURI(
//           this.baseUrl?.replace(this.host as string, "host.hiden") + path
//         )}`
//       );
//       if (conf?.ssl)
//         logger.debug(
//           `...rejectUnauthorized: ${options.https?.rejectUnauthorized}`
//         );

//       got.stream
//         .put(encodeURI(this.baseUrl + path), options)
//         .on("uploadProgress", (e) => {
//           const percent = e.percent;
//           if (status.progress !== percent) {
//             status.progress = percent;
//             statusTools.setStatus(status);
//           }
//           if (percent >= 1) {
//             logger.info("Upload done...");
//           }
//         })
//         .on("response", (res) => {
//           if (res.statusCode !== 201 && res.statusCode !== 204) {
//             status.status = "error";
//             status.error_code = 4;
//             status.message = `Fail to upload snapshot to nextcloud (Status code: ${res.statusCode})!`;
//             statusTools.setStatus(status);
//             logger.error(status.message);
//             fs.unlinkSync(tmpFile);
//             reject(status.message);
//           } else {
//             logger.info(`...Upload finish ! (status: ${res.statusCode})`);
//             status.status = "idle";
//             status.progress = -1;
//             status.message = undefined;
//             status.error_code = undefined;
//             status.last_backup = DateTime.now().toFormat("dd MMM yyyy, HH:mm");
//             statusTools.setStatus(status);
//             cleanTempFolder();
//             const autoCleanCloud =
//               settingsTools.getSettings().auto_clean_backup;
//             if (autoCleanCloud != null && autoCleanCloud === "true") {
//               this.clean().catch();
//             }
//             const autoCleanlocal = settingsTools.getSettings().auto_clean_local;
//             if (autoCleanlocal != null && autoCleanlocal === "true") {
//               hassioApiTools.clean().catch();
//             }
//             resolve(undefined);
//           }
//         })
//         .on("error", (err) => {
//           fs.unlinkSync(tmpFile);
//           status.status = "error";
//           status.error_code = 4;
//           status.message = `Fail to upload snapshot to nextcloud (${err}) !`;
//           statusTools.setStatus(status);
//           logger.error(status.message);
//           logger.error(err.stack);
//           reject(status.message);
//         });
//     });
//   }

//   downloadFile(path: string) {
//     return new Promise<string>((resolve, reject) => {
//       if (this.client == null) {
//         this.confIsValid()
//           .then(() => {
//             this._startDownload(path)
//               .then((path) => resolve(path))
//               .catch(() => reject());
//           })
//           .catch((err) => {
//             reject(err);
//           });
//       } else
//         this._startDownload(path)
//           .then((path) => resolve(path))
//           .catch(() => reject());
//     });
//   }

//   _startDownload(path: string) {
//     return new Promise<string>((resolve, reject) => {
//       const status = statusTools.getStatus();
//       status.status = "download-b";
//       status.progress = 0;
//       status.message = undefined;
//       status.error_code = undefined;
//       statusTools.setStatus(status);

//       logger.info("Downloading backup...");
//       if (!fs.existsSync("./temp/")) fs.mkdirSync("./temp/");
//       const tmpFile = `./temp/restore_${DateTime.now().toFormat(
//         "MMM-dd-yyyy_HH_mm"
//       )}.tar`;
//       const stream = fs.createWriteStream(tmpFile);
//       const conf = this.getConf();
//       const options = {
//         headers: {
//           authorization:
//             "Basic " +
//             Buffer.from(this.username + ":" + this.password).toString("base64"),
//         },
//         https: undefined as any | undefined,
//       };
//       if (conf?.ssl) {
//         options["https"] = { rejectUnauthorized: !conf?.self_signed };
//       }
//       logger.debug(
//         `...URI: ${encodeURI(
//           this.baseUrl?.replace(this.host as string, "host.hiden") + path
//         )}`
//       );
//       if (conf?.ssl)
//         logger.debug(
//           `...rejectUnauthorized: ${options.https?.rejectUnauthorized}`
//         );
//       pipeline(
//         got.stream
//           .get(encodeURI(this.baseUrl + path), options)
//           .on("downloadProgress", (e) => {
//             const percent = Math.round(e.percent * 100) / 100;
//             if (status.progress !== percent) {
//               status.progress = percent;
//               statusTools.setStatus(status);
//             }
//           }),
//         stream
//       )
//         .then((res) => {
//           logger.info("Download success !");
//           status.progress = 1;
//           statusTools.setStatus(status);
//           logger.debug(
//             "Backup dl size : " + fs.statSync(tmpFile).size / 1024 / 1024
//           );
//           resolve(tmpFile);
//         })
//         .catch((err) => {
//           if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
//           status.status = "error";
//           status.message =
//             "Fail to download Hassio snapshot (" + err.message + ")";
//           status.error_code = 7;
//           statusTools.setStatus(status);
//           logger.error(status.message);
//           logger.error(err.stack);
//           reject(err.message);
//         });
//     });
//   }

//   getFolderContent(path: string) {
//     return new Promise((resolve, reject) => {
//       if (this.client == null) {
//         reject();
//         return;
//       }
//       this.client
//         .getDirectoryContents(path)
//         .then((contents) => resolve(contents))
//         .catch((error) => reject(error));
//     });
//   }

//   clean() {
//     let limit = settingsTools.getSettings().auto_clean_backup_keep;
//     if (limit == null) limit = 5;
//     return new Promise((resolve, reject) => {
//       this.getFolderContent(this.getConf()?.back_dir + pathTools.auto)
//         .then(async (contents: any) => {
//           if (contents.length < limit) {
//             resolve(undefined);
//             return;
//           }
//           contents.sort((a: any, b: any) => {
//             return a.date < b.date ? 1 : -1;
//           });

//           const toDel = contents.slice(limit);
//           for (const i in toDel) {
//             await this.client?.deleteFile(toDel[i].filename);
//           }
//           logger.info("Cloud clean done.");
//           resolve(undefined);
//         })
//         .catch((error) => {
//           const status = statusTools.getStatus();
//           status.status = "error";
//           status.error_code = 6;
//           status.message = "Fail to clean Nexcloud (" + error + ") !";
//           statusTools.setStatus(status);
//           logger.error(status.message);
//           reject(status.message);
//         });
//     });
//   }
// }

// const INSTANCE = new WebdavTools();
// export default INSTANCE;
