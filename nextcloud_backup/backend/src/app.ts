import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import logger from "./config/winston.js";
import apiV2Router from "./routes/apiV2.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: true,
  })
);

app.set("port", process.env.PORT || 3000);
if (process.env.ACCESS_LOG == "true") {
  app.use(
    morgan("dev", { stream: { write: (message) => logger.debug(message) } })
  );
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/v2/api/", apiV2Router);
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});
/*
-----------------------------------------------------------
        Error handler
----------------------------------------------------------
*/

export default app;
