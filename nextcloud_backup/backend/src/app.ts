import cookieParser from "cookie-parser";
import cors from "cors";
import errorHandler from "errorhandler";
import express from "express";
import createError from "http-errors";
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

app.use(
  morgan("dev", { stream: { write: (message) => logger.debug(message) } })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/v2/api/", apiV2Router);
/*
-----------------------------------------------------------
        Error handler
----------------------------------------------------------
*/
// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
if (process.env.NODE_ENV === "development") {
  // only use in development
  app.use(errorHandler());
}

export default app;
