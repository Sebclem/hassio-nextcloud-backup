import express from "express";
import {
  getBackupConfig,
  saveBackupConfig,
  validateBackupConfig,
} from "../services/backupConfigService.js";
import { getWebdavConfig, saveWebdavConfig, validateWebdavConfig } from "../services/webdavConfigService.js";

const configRouter = express.Router();

configRouter.get("/backup", (req, res, next) => {
  res.json(getBackupConfig());
});

configRouter.put("/backup", (req, res, next) => {
  validateBackupConfig(req.body)
    .then(() => {
      saveBackupConfig(req.body);
      res.status(204);
      res.send();
    })
    .catch((error) => {
      res.status(400);
      res.json(error.details);
    });
});

configRouter.get("/webdav", (req, res, next) => {
  res.json(getWebdavConfig());
});

configRouter.put("/webdav", (req, res, next) => {
  validateWebdavConfig(req.body)
    .then(() => {
      saveWebdavConfig(req.body);
      res.status(204);
      res.send();
    })
    .catch((error) => {
      res.status(400);
      res.json(error.details);
    });
});

export default configRouter;
