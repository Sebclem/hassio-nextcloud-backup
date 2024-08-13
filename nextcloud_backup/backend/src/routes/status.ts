import express from "express";
import { getStatus } from "../tools/status.js";

const statusRouter = express.Router();


statusRouter.get('/', (req, res) => {
    res.json(getStatus());
})


export default statusRouter
