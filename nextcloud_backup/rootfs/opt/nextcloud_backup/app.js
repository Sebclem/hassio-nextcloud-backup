import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from "fs"
import newlog from "./config/winston.js"
import * as statusTools from "./tools/status.js"
import * as hassioApiTools from "./tools/hassioApiTools.js"
import webdav from "./tools/webdavTools.js"
import * as settingsTools from "./tools/settingsTools.js"
import cronTools from "./tools/cronTools.js"

import indexRouter from "./routes/index.js"
import apiRouter from "./routes/api.js"




const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
    logger("dev", {
        skip: function (req, res) {
            return (res.statusCode = 304);
        },
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/api", apiRouter);

/*
-----------------------------------------------------------
        Library statics
----------------------------------------------------------
*/

// Boootstrap JS Files
app.use('/js/bootstrap.min.js', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/js/bootstrap.min.js')))

// Fontawesome Files
app.use('/css/fa-all.min.css', express.static(path.join(__dirname, '/node_modules/@fortawesome/fontawesome-free/css/all.min.css')))
app.use('/webfonts/', express.static(path.join(__dirname, '/node_modules/@fortawesome/fontawesome-free/webfonts')))

// Jquery JS Files
app.use('/js/jquery.min.js', express.static(path.join(__dirname, '/node_modules/jquery/dist/jquery.min.js')))

/*
-----------------------------------------------------------
        Error handler
----------------------------------------------------------
*/
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
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
newlog.info(`Backup timeout: ${ parseInt(process.env.CREATE_BACKUP_TIMEOUT) || ( 90 * 60 * 1000 ) }`)

if (!fs.existsSync("/data")) fs.mkdirSync("/data");
statusTools.init();
newlog.info("Satus : \x1b[32mGo !\x1b[0m");

hassioApiTools.getSnapshots().then(
    () => {
        newlog.info("Hassio API : \x1b[32mGo !\x1b[0m");
    },
    (err) => {
        newlog.error("Hassio API : \x1b[31;1mFAIL !\x1b[0m");
        newlog.error("... " + err);
    }
);

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
