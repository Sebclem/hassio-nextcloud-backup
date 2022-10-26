import express from "express";
import messageManager from "../tools/messageManager.js";

const messageRouter = express.Router();

messageRouter.get('/', (req, res, next)=>{
  res.json(messageManager.get())
});

messageRouter.patch('/:messageId/readed', (req, res, next)=>{
  if(messageManager.markReaded(req.params.messageId)){
    res.json(messageManager.get());
  }else{
    res.status(404).send();
  }
});

export default messageRouter;
