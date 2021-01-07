const winston = require("winston");

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        // winston.format.errors({ stack: true }),
        // winston.format.splat(),

        winston.format.colorize(),
        winston.format.align(),
        winston.format.printf(({ level, message, timestamp }) => {
            return `[${timestamp}] [${level}]: ${message}`;
        })
    ),
    transports: [
        //
        // - Write to all logs with level `info` and below to `quick-start-combined.log`.
        // - Write all logs error (and below) to `quick-start-error.log`.
        //
        new winston.transports.Console({ handleExceptions: true }),
        // new winston.transports.File({filename: '/data/NCB.log', handleExceptions: true})
    ],
});

module.exports = logger;
