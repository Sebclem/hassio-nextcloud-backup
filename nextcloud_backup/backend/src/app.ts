import createError from "http-errors";
import express, { NextFunction, Request, Response } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import fs from "fs"
import newlog from "./config/winston.js"
import * as statusTools from "./tools/status.js"
import * as settingsTools from "./tools/settingsTools.js"
import cronTools from "./tools/cronTools.js"
import webdav from "./services/webdavService.js";

import apiRouter from "./routes/api.js"
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

// app.use(
//     logger("dev", {
//         skip: function (req, res) {
//             return (res.statusCode = 304);
//         },
//     })
// );
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", apiRouter);

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


/*
-----------------------------------------------------------
        Init app
----------------------------------------------------------
*/



newlog.info(`Log level: ${ process.env.LOG_LEVEL }`);

newlog.info(`Backup timeout: ${ (process.env.CREATE_BACKUP_TIMEOUT ? parseInt(process.env.CREATE_BACKUP_TIMEOUT) : false) || ( 90 * 60 * 1000 ) }`)

if (!fs.existsSync("/data")) fs.mkdirSync("/data");
statusTools.init();
newlog.info("Satus : \x1b[32mGo !\x1b[0m");


// TODO Change this
// hassioApiTools.getSnapshots().then(
//     () => {
//         newlog.info("Hassio API : \x1b[32mGo !\x1b[0m");
//     },
//     (err) => {
//         newlog.error("Hassio API : \x1b[31;1mFAIL !\x1b[0m");
//         newlog.error("... " + err);
//     }
// );

webdav.confIsValid().then(
    () => {
        newlog.info("Nextcloud connection : \x1b[32mGo !\x1b[0m");
    },
    (err) => {
        newlog.error("Nextcloud connection : \x1b[31;1mFAIL !\x1b[0m");
        newlog.error("... " + err);
    }
);

settingsTools.check(settingsTools.getSettings(), true);
cronTools.init();


export default app;
