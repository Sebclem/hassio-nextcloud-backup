import express from "express";
import messageManager from "../tools/messageManager.js";

const messageRouter = express.Router();

messageRouter.get('/', (req, res, next)=>{
  res.json(messageManager.get())
})

export default messageRouter;
