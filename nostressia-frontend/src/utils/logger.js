const LOG_LEVEL_ORDER = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const resolveDefaultLevel = () => {
  const envLevel = import.meta.env?.VITE_LOG_LEVEL;
  if (envLevel && LOG_LEVEL_ORDER[envLevel]) {
    return envLevel;
  }
  return import.meta.env?.DEV ? "debug" : "info";
};

const shouldLog = (level, minimumLevel) =>
  LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[minimumLevel];

/**
 * Create a scoped logger that respects build-time log levels.
 * Default level is debug in development, info in production.
 */
export const createLogger = (scope, options = {}) => {
  const minimumLevel = options.level || resolveDefaultLevel();
  const prefix = scope ? `[${scope}]` : "[NOSTRESSIA]";

  const write = (level, message, ...meta) => {
    if (!shouldLog(level, minimumLevel)) return;
    const output = `${prefix} ${message}`;
    const consoleMethod = console[level] || console.log;
    if (meta.length > 0) {
      consoleMethod(output, ...meta);
    } else {
      consoleMethod(output);
    }
  };

  return {
    debug: (message, ...meta) => write("debug", message, ...meta),
    info: (message, ...meta) => write("info", message, ...meta),
    warn: (message, ...meta) => write("warn", message, ...meta),
    error: (message, ...meta) => write("error", message, ...meta),
  };
};

export const logger = createLogger("APP");
