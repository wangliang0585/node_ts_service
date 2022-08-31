import log4js, { Level, levels } from "log4js";

const logger = log4js.getLogger();

export const initLogger = () => {
  log4js.configure({
    appenders: {
      files: {
        type: "dateFile",
        filename: "logs/service.log",
        pattern: "yyyy-MM-dd",
        keepFileExt: true,
        layout: { type: "basic" },
      },
      out: { type: "stdout", layout: { type: "colored" } },
    },
    categories: {
      default: { appenders: ["out", "files"], level: getLogLevel().levelStr },
    },
  });
  logger.level = getLogLevel();
  logger.info("Logger initialized");
  console.log("Logger initialized consloe");
};

const getLogLevel = (): Level => {
  if (process.env.NODE_ENV === "production") {
    return levels.INFO;
  } else {
    return levels.DEBUG;
  }
};

export default logger;
