import "./env.js";

import errorHandler from "errorhandler";
import figlet from "figlet";
import createError from "http-errors";
import kleur from "kleur";
import app from "./app.js";
import logger from "./config/winston.js";
import postInit from "./postInit.js";

/**
 * Error Handler. Provides full stack
 */
if (process.env.NODE_ENV === "development") {
  app.use(errorHandler());
  app.use((req, res, next) => {
    next(createError(404));
  });
}

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
  console.log(kleur.yellow().bold(figlet.textSync("NC Backup")));
  logger.info(
    `App is running at ` +
      kleur.green().bold(`http://localhost:${app.get("port")}`) +
      " in " +
      kleur.green().bold(process.env.NODE_ENV || "production") +
      " mode"
  );
  logger.info(kleur.red().bold("Press CTRL-C to stop"));
  postInit();
});

export default server;
