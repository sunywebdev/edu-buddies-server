const { json } = require("express/lib/response");
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, prettyPrint } = format;
require("winston-mongodb");

const user = process.env.DB_USER;
const password = process.env.DB_PASS;
const logger = createLogger({
  level: "info",
  format: combine(format.json(), timestamp()),

  transports: [
    new transports.Console({ handleExceptions: true }),
    new transports.MongoDB({
      level: "error",
      db: `mongodb+srv://${user}:${password}@cluster0.tgh4y.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      collection: "log",
      format: combine(format.json(), timestamp()),
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
