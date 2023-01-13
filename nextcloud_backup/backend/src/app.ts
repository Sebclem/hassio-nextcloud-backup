import cookieParser from "cookie-parser";
import express, { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import logger from "./config/winston.js";
import apiV2Router from "./routes/apiV2.js";
import cors from "cors"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: true
}))

app.set("port", process.env.PORT || 3000);

// app.use(
//     logger("dev", {
//         skip: function (req, res) {
//             return (res.statusCode = 304);
//         },
//     })
// );

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
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});


export default app;
