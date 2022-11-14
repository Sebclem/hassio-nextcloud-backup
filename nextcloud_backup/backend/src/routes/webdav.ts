import express from "express";
import Joi from "joi";
import {
  getWebdavConfig,
  validateWebdavConfig,
} from "../services/webdavConfigService.js";
import * as webdavService from "../services/webdavService.js";
import * as pathTools from "../tools/pathTools.js";
import type { WebdavDelete } from "../types/services/webdav.js";
import { WebdavDeleteValidation } from "../types/services/webdavValidation.js";

const webdavRouter = express.Router();

webdavRouter.get("/backup/auto", (req, res, next) => {
  const config = getWebdavConfig();
  validateWebdavConfig(config)
    .then(async () => {
      const value = await webdavService
        .getBackups(pathTools.auto, config);
      res.json(value);
    })
    .catch((reason) => {
      res.status(500);
      res.json(reason);
    });
});

webdavRouter.get("/backup/manual", (req, res, next) => {
  const config = getWebdavConfig();
  validateWebdavConfig(config)
    .then(async () => {
      const value = await webdavService
        .getBackups(pathTools.manual, config);
      res.json(value);
    })
    .catch((reason) => {
      res.status(500);
      res.json(reason);
    });
});

webdavRouter.delete("/", (req, res, next) => {
  const body: WebdavDelete = req.body;
  const validator = Joi.object(WebdavDeleteValidation);
  const config = getWebdavConfig();
  validateWebdavConfig(config).then(() => {
   validator
      .validateAsync(body)
      .then(() => {
        webdavService.deleteBackup(body.path, config)
          .then(()=>{
            res.status(201).send();
          }).catch((reason)=>{
            res.status(500).json(reason);
          });
      })
      .catch((reason) => {
        res.status(400).json(reason);
      });
  });
});

export default webdavRouter;
