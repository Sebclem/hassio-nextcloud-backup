import errorHandler from "errorhandler";
import "./env.js";
import app from "./app.js";
import logger from "./config/winston.js";
import postInit from "./postInit.js";
import figlet from "figlet";
import kleur from "kleur";

/**
 * Error Handler. Provides full stack
 */
if (process.env.NODE_ENV === "development") {
  app.use(errorHandler());
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
      kleur.green().bold(app.get("env") as string) +
      " mode"
  );
  logger.info(kleur.red().bold("Press CTRL-C to stop"));
  postInit();
});

export default server;
