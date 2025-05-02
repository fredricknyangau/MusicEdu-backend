const winston = require("winston");
const { format } = winston;
const path = require("path");

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    }),
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
    }),
    // Write all logs with level 'info' and below to 'combined.log'
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/combined.log"),
    }),
  ],
});

// Create a stream object with a 'write' function that will be used by Morgan
logger.stream = {
  write: function (message) {
    logger.info(message.trim());
  },
};

module.exports = logger;
