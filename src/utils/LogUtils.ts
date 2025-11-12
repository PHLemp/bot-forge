import { IoManager } from "../database/IoManager";

export enum LOG_LEVEL {
    DEBUG,
    DATABASE,
    SCHEDULED,
    INFO,
    WARN,
    ERROR,
}

enum COLOR {
    Reset = "\x1b[0m",
    Bright = "\x1b[1m",
    Dim = "\x1b[2m",
    Underscore = "\x1b[4m",
    Blink = "\x1b[5m",
    Reverse = "\x1b[7m",
    Hidden = "\x1b[8m",

    FgBlack = "\x1b[30m",
    FgRed = "\x1b[31m",
    FgGreen = "\x1b[32m",
    FgYellow = "\x1b[33m",
    FgBlue = "\x1b[34m",
    FgMagenta = "\x1b[35m",
    FgCyan = "\x1b[36m",
    FgWhite = "\x1b[37m",
    FgGray = "\x1b[90m",

    BgBlack = "\x1b[40m",
    BgRed = "\x1b[41m",
    BgGreen = "\x1b[42m",
    BgYellow = "\x1b[43m",
    BgBlue = "\x1b[44m",
    BgMagenta = "\x1b[45m",
    BgCyan = "\x1b[46m",
    BgWhite = "\x1b[47m",
    BgGray = "\x1b[100m"
}

/**
 * Logs a message with specified log level and corresponding color to console and saves it to file.
 * Each log entry includes timestamp, log level and the message.
 * Different log levels are represented with different colors in console output:
 * - INFO: White
 * - ERROR: Red
 * - DEBUG: Green
 * - WARN: Yellow
 * - SCHEDULED: Magenta
 * - DATABASE: Cyan
 * - Default: Gray
 * 
 * @param message - The message to be logged
 * @param level - The severity level of the log. Defaults to LOG_LEVEL.INFO
 * 
 * @example
 * ```typescript
 * log("Database connection successful", LOG_LEVEL.DATABASE);
 * // Output: (2023-01-01 12:00:00) -- [DATABASE] -- Database connection successful
 * ```
 */
export function log(message: string, level: LOG_LEVEL = LOG_LEVEL.INFO) {
    const now = new Date().toLocaleString();
    const logMessage = `(${now}) -- [${LOG_LEVEL[level]}] -- ${message}`;
    IoManager.saveLog(logMessage);

    let color: string;
    switch (level) {
        case LOG_LEVEL.INFO:
            color = COLOR.FgWhite;
            console.log(color, logMessage);
            break;
        case LOG_LEVEL.ERROR:
            color = COLOR.FgRed;
            console.error(color, logMessage);
            break;
        case LOG_LEVEL.DEBUG:
            color = COLOR.FgGreen;
            console.debug(color, logMessage);
            break;
        case LOG_LEVEL.WARN:
            color = COLOR.FgYellow;
            console.warn(color, logMessage);
            break;
        case LOG_LEVEL.SCHEDULED:
            color = COLOR.FgMagenta;
            console.warn(color, logMessage);
            break;
        case LOG_LEVEL.DATABASE:
            color = COLOR.FgCyan;
            console.log(color, logMessage);
            break;
        default:
            color = COLOR.FgGray;
            console.log(color, logMessage);
            break;
    }
}