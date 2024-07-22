import express from "express";
import Joi from "joi";
import { getBackupConfig } from "../services/backupConfigService.js";
import {
  getWebdavConfig,
  validateWebdavConfig,
} from "../services/webdavConfigService.js";
import * as webdavService from "../services/webdavService.js";
import * as pathTools from "../tools/pathTools.js";
import type { WebdavGenericPath } from "../types/services/webdav.js";
import { WebdavDeleteValidation } from "../types/services/webdavValidation.js";
import { restoreToHA } from "../services/orchestrator.js";
import path from "path";
import logger from "../config/winston.js";

const webdavRouter = express.Router();

webdavRouter.get("/backup/auto", (req, res) => {
  const config = getWebdavConfig();
  const backupConf = getBackupConfig();
  validateWebdavConfig(config)
    .then(() => {
      return webdavService.checkWebdavLogin(config);
    })
    .then(async () => {
      const value = await webdavService.getBackups(
        pathTools.auto,
        config,
        backupConf.nameTemplate
      );
      res.json(value);
    })
    .catch((reason) => {
      res.status(500);
      res.json(reason);
    });
});

webdavRouter.get("/backup/manual", (req, res) => {
  const config = getWebdavConfig();
  const backupConf = getBackupConfig();
  validateWebdavConfig(config)
    .then(() => {
      return webdavService.checkWebdavLogin(config);
    })
    .then(async () => {
      const value = await webdavService.getBackups(
        pathTools.manual,
        config,
        backupConf.nameTemplate
      );
      res.json(value);
    })
    .catch((reason) => {
      res.status(500);
      res.json(reason);
    });
});

webdavRouter.delete("/", (req, res) => {
  const body = req.body as WebdavGenericPath;
  const validator = Joi.object(WebdavDeleteValidation);
  const config = getWebdavConfig();
  validateWebdavConfig(config)
    .then(() => {
      return validator.validateAsync(body);
    })
    .then(() => {
      return webdavService.checkWebdavLogin(config);
    })
    .then(() => {
      webdavService
        .deleteBackup(body.path, config)
        .then(() => {
          res.status(201).send();
        })
        .catch((reason) => {
          res.status(500).json(reason);
        });
    })
    .catch((reason) => {
      res.status(400).json(reason);
    });
});

webdavRouter.post("/restore", (req, res) => {
  const body = req.body as WebdavGenericPath;
  const validator = Joi.object(WebdavDeleteValidation);
  validator
    .validateAsync(body)
    .then(() => {
      return restoreToHA(body.path, path.basename(body.path));
    })
    .then(() => {
      logger.info("All good !");
    })
    .catch(() => {
      logger.error("Something wrong !");
    });
  res.sendStatus(202);
});

export default webdavRouter;
