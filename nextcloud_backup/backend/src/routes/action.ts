import express from "express";
import { doBackupWorkflow } from "../services/orchestrator.js";
import { WorkflowType } from "../types/services/orchecstrator.js";
import logger from "../config/winston.js";
import { clean as webdavClean } from "../services/webdavService.js";
import { getBackupConfig } from "../services/backupConfigService.js";
import { getWebdavConfig } from "../services/webdavConfigService.js";
import { clean } from "../services/homeAssistantService.js";

const actionRouter = express.Router();

actionRouter.post("/backup", (req, res) => {
  doBackupWorkflow(WorkflowType.MANUAL)
    .then(() => {
      logger.info("All good !");
    })
    .catch(() => {
      logger.error("Something wrong !");
    });
  res.sendStatus(202);
});

actionRouter.post("/clean", (req, res) => {
  const backupConfig = getBackupConfig();
  const webdavConfig = getWebdavConfig();
  webdavClean(backupConfig, webdavConfig)
    .then(() => {
      return clean(backupConfig);
    })
    .then(() => {
      logger.info("All good !");
    })
    .catch(() => {
      logger.error("Something wrong !");
    });
  res.sendStatus(202);
});

export default actionRouter;
