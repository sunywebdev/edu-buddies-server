const { json } = require("express/lib/response");
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, prettyPrint } = format;

const logger = createLogger({
  level: "info",
  format: combine(format.json(), timestamp({ format: "HH:mm:ss" })),

  transports: [new transports.Console({ handleExceptions: true })],
  exitOnError: false,
});

module.exports = logger;
