import express from "express"
import configRouter from "./config.js";
import homeAssistant from "./homeAssistant.js"
import messageRouter from "./messages.js";
import webdavRouter from "./webdav.js";


const router = express.Router();

router.use("/homeAssistant", homeAssistant)
router.use("/config", configRouter);
router.use("/webdav", webdavRouter);
router.use("/messages", messageRouter)

export default router;