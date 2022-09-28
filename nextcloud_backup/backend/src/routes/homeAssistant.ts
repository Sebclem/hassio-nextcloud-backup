import express from "express";
import * as haOsService from "../services/homeAssistantService.js"

const homeAssistantRouter = express.Router();

homeAssistantRouter.get("/backups/", (req, res, next) => {
  haOsService.getBackups()
    .then((value)=>{
      res.json(value.body.data.backups);
    }).catch((reason)=>{
      res.status(500);
      res.json(reason);
    })
});



export default homeAssistantRouter;