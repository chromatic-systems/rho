import chalk from "chalk";

const colorMap = {
  "alert": chalk.bgRedBright,
  "ok": chalk.green,
  "info": chalk.yellow,
  "header": chalk.bgBlueBright,
}

const logLevels = { ok:"ok", alert: "alert", info: "info", header: "header" }

function log(type, header, ...args) {
  const prefix = colorMap[type](header);
  if(type == colorMap.alert) {
    console.error(prefix, ...args);
    return
  }
  console.log(prefix,...args);
}

export { log, logLevels };