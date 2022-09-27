import express from "express"
import homeAssistant from "./homeAssistant.js"


const router = express.Router();

router.use("/homeAssistant", homeAssistant)

export default router;