import express from "express"
import configRouter from "./config.js";
import homeAssistant from "./homeAssistant.js"


const router = express.Router();

router.use("/homeAssistant", homeAssistant)
router.use("/config", configRouter);

export default router;