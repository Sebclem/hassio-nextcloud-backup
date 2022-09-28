import { config } from "dotenv";
import express from "express";
import { saveBackupConfig, validateBackupConfig } from "../services/configService.js";

const configRouter = express.Router();

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

export default configRouter;
