let TRACE: Function;
let DEBUG: Function;
let log: Function;
let INFO: Function;
let WARN: Function;
let ERROR: Function;
let FATAL: Function;

let counter = 0;

let LogLevel = {
    TRACE: 0,
    DEBUG: 1,
    LOG: 2,
    INFO: 3,
    WARN: 4,
    ERROR: 5,
    FATAL: 6,
};

const _LogDateTime = function () {};
_LogDateTime.toString = function () {
    counter++;

    const d = new Date();
    // return d.toLocaleString() + `.${d.getMilliseconds()}`;
    return `${counter} ${d.toLocaleTimeString('it-IT')}.${d.getMilliseconds()}`;
};

function initLogFunc() {
    // 绑定console的函数，只是参数改写，而功能一样。从而可以输出正确的当前行号
    TRACE = console.trace.bind(console, '%c[%s][TRACE]', 'color:green', _LogDateTime);
    DEBUG = console.debug.bind(console, '%c[%s][DEBUG]', 'color:green', _LogDateTime);

    // log = console.log.bind(console, '%c[%s][LOG]', "color:blue", _LogDateTime);
    // INFO = console.info.bind(console, '%c[%s][INFO]', "color:purple", _LogDateTime);
    // WARN = console.warn.bind(console, '%c[%s][WARN]', "color:yellow", _LogDateTime);
    // ERROR = console.error.bind(console, '[%s][ERROR]', _LogDateTime);
    // FATAL = console.error.bind(console, '%c[%s][FATAL]', 'font-weight:bold;', _LogDateTime);

    // 使用下面的，才会输出行号
    log = console.debug.bind(console, '%c[%s][LOG]', 'color:blue', _LogDateTime);
    INFO = console.debug.bind(console, '%c[%s][INFO]', 'color:purple', _LogDateTime);
    WARN = console.debug.bind(console, '%c[%s][WARN]', 'color:yellow', _LogDateTime);
    ERROR = console.debug.bind(console, '[%s][ERROR]', _LogDateTime);
    FATAL = console.debug.bind(console, '%c[%s][FATAL]', 'font-weight:bold;', _LogDateTime);
}

initLogFunc();

function noLog(...data: any) {}
function setLogLevel(level: number) {
    initLogFunc();

    if (LogLevel.TRACE < level) {
        TRACE = noLog;
    }
    if (LogLevel.DEBUG < level) {
        DEBUG = noLog;
    }
    if (LogLevel.LOG < level) {
        log = noLog;
    }
    if (LogLevel.INFO < level) {
        INFO = noLog;
    }
    if (LogLevel.WARN < level) {
        WARN = noLog;
    }
    if (LogLevel.ERROR < level) {
        ERROR = noLog;
    }
    if (LogLevel.FATAL < level) {
        FATAL = noLog;
    }
}

// setLogLevel(LogLevel.DEBUG);

export { DEBUG, ERROR, FATAL, INFO, LogLevel, TRACE, WARN, log, setLogLevel };
