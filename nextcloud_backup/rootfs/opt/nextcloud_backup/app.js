const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const apiRouter = require("./routes/api");

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
app.use('/js/',express.static(path.join(__dirname, '/node_modules/bootstrap/dist/js')))
app.use('/font/',express.static(path.join(__dirname, '/node_modules/bootstrap-icons/font')))
app.use("/", indexRouter);
app.use("/api", apiRouter);

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

const fs = require("fs");
const newlog = require("./config/winston");
if (!fs.existsSync("/data")) fs.mkdirSync("/data");
const statusTools = require("./tools/status");
statusTools.init();
newlog.info("Satus : \x1b[32mGo !\x1b[0m");
const hassioApiTools = require("./tools/hassioApiTools");
hassioApiTools.getSnapshots().then(
    () => {
        newlog.info("Hassio API : \x1b[32mGo !\x1b[0m");
    },
    (err) => {
        newlog.error("Hassio API : \x1b[31;1mFAIL !\x1b[0m");
        newlog.error("... " + err);
    }
);

const WebdavTools = require("./tools/webdavTools");
const webdav = new WebdavTools().getInstance();
webdav.confIsValid().then(
    () => {
        newlog.info("Nextcloud connection : \x1b[32mGo !\x1b[0m");
    },
    (err) => {
        newlog.error("Nextcloud connection : \x1b[31;1mFAIL !\x1b[0m");
        newlog.error("... " + err);
    }
);
const settingTool = require('./tools/settingsTools')
settingTool.check(settingTool.getSettings(), true);
const cronTools = require("./tools/cronTools");
cronTools.startCron();

module.exports = app;
