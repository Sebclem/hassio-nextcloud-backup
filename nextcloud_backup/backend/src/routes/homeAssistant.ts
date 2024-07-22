import express from "express";
import * as haOsService from "../services/homeAssistantService.js";

const homeAssistantRouter = express.Router();

homeAssistantRouter.get("/backups/", (req, res) => {
  haOsService
    .getBackups()
    .then((value) => {
      res.json(
        value.body.data.backups.sort(
          (a, b) => Date.parse(b.date) - Date.parse(a.date)
        )
      );
    })
    .catch((reason) => {
      res.status(500).json(reason);
    });
});

homeAssistantRouter.get("/backup/:slug", (req, res) => {
  haOsService
    .getBackupInfo(req.params.slug)
    .then((value) => {
      res.json(value.body.data);
    })
    .catch((reason) => {
      res.status(500).json(reason);
    });
});

homeAssistantRouter.get("/addons", (req, res) => {
  haOsService
    .getAddonList()
    .then((value) => {
      res.json(value.body.data);
    })
    .catch((reason) => {
      res.status(500).json(reason);
    });
});

homeAssistantRouter.get("/folders", (req, res) => {
  res.json(haOsService.getFolderList());
});

export default homeAssistantRouter;
