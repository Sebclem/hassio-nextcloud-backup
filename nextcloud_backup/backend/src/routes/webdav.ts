import express from "express";
import {
  getWebdavConfig,
  validateWebdavConfig,
} from "../services/webdavConfigService.js";
import * as webdavService from "../services/webdavService.js";
import * as pathTools from "../tools/pathTools.js";

const webdavRouter = express.Router();

webdavRouter.get("/backup/auto", (req, res, next) => {
  const config = getWebdavConfig();
  validateWebdavConfig(config)
    .then(() => {
      webdavService
        .getBackups(pathTools.auto, config)
        .then((value) => {
          res.json(value);
        })
        .catch((reason) => {
          res.status(500);
          res.json(reason);
        });
    })
    .catch((reason) => {
      res.status(500);
      res.json(reason);
    });
});

webdavRouter.get("/backup/manual", (req, res, next) => {
  const config = getWebdavConfig();
  validateWebdavConfig(config)
    .then(() => {
      webdavService
        .getBackups(pathTools.manual, config)
        .then((value) => {
          res.json(value);
        })
        .catch((reason) => {
          res.status(500);
          res.json(reason);
        });
    })
    .catch((reason) => {
      res.status(500);
      res.json(reason);
    });
});

export default webdavRouter;
