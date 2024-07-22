import express from "express";
import { doBackupWorkflow } from "../services/orchestrator.js";
import { WorkflowType } from "../types/services/orchecstrator.js";
import logger from "../config/winston.js";

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

export default actionRouter;
