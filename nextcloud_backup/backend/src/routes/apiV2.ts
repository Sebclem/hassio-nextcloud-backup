import express from "express"
import configRouter from "./config.js";
import homeAssistant from "./homeAssistant.js"
import webdavRouter from "./webdav.js";


const router = express.Router();

router.use("/homeAssistant", homeAssistant)
router.use("/config", configRouter);
router.use("/webdav", webdavRouter);

export default router;