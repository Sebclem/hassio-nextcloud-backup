import express from "express";
import messageManager from "../tools/messageManager.js";

const messageRouter = express.Router();

messageRouter.get("/", (req, res) => {
  res.json(messageManager.get());
});

messageRouter.patch("/:messageId/readed", (req, res) => {
  if (messageManager.markReaded(req.params.messageId)) {
    res.json(messageManager.get());
  } else {
    res.sendStatus(404);
  }
});

messageRouter.post("/allReaded", (req, res) => {
  messageManager.markAllReaded();
  res.json(messageManager.get());
});

export default messageRouter;
