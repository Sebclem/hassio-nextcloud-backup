import express from "express";
import * as haOsService from "../services/homeAssistantService.js"

const router = express.Router();

router.get("/backups/", (req, res, next) => {
  haOsService.getBackups()
    .then((value)=>{
      res.json(value.body.data.backups);
    }).catch((reason)=>{
      res.status(500);
      res.json(reason);
    })
});


router.get("")

export default router;