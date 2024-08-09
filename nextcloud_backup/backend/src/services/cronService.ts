import { CronJob } from "cron";
import {
  CronMode,
  type BackupConfig,
  type CronConfig,
} from "../types/services/backupConfig.js";
import { WorkflowType } from "../types/services/orchecstrator.js";
import { doBackupWorkflow } from "./orchestrator.js";
import { DateTime } from "luxon";
import { getStatus, setStatus } from "../tools/status.js";
import logger from "../config/winston.js";

let cronList: Map<string, CronJob>;

export function initCron(backupConfig: BackupConfig) {
  return new Promise((res, rej) => {
    const fn = doBackupWorkflow;
    if (cronList) {
      stopAllCron(cronList);
    }
    cronList = new Map();
    for (const cronItem of backupConfig.cron) {
      try {
        if (cronItem.mode == CronMode.DAILY) {
          cronList.set(cronItem.id, getDailyCron(cronItem, fn));
        } else if (cronItem.mode == CronMode.WEEKLY) {
          cronList.set(cronItem.id, getWeeklyCron(cronItem, fn));
        } else if (cronItem.mode == CronMode.MONTHLY) {
          cronList.set(cronItem.id, getMonthlyCron(cronItem, fn));
        } else if (cronItem.mode == CronMode.CUSTOM) {
          cronList.set(cronItem.id, getCustomCron(cronItem, fn));
        }
      } catch {
        logger.error(`Fail to init CRON ${cronItem.id} (${cronItem.mode})`);
        stopAllCron(cronList);
        rej(Error(cronItem.id));
      }
    }
    const nextDate = getNextDate(cronList);
    const status = getStatus();
    status.next_backup = nextDate;
    setStatus(status);
    res(null);
  });
}

function getNextDate(cronList: Map<string, CronJob>) {
  let nextDate: DateTime | undefined = undefined;
  for (const item of cronList) {
    const thisDate = item[1].nextDate();
    if (!nextDate) {
      nextDate = thisDate;
    }
    if (nextDate > thisDate) {
      nextDate = thisDate;
    }
  }
  return nextDate;
}

function stopAllCron(cronList: Map<string, CronJob>) {
  for (const item of cronList) {
    item[1].stop();
  }
}
function getDailyCron(
  config: CronConfig,
  fn: (type: WorkflowType) => Promise<void>
) {
  const splited = (config.hour as string).split(":");
  return new CronJob(
    `${splited[1]} ${splited[0]} * * *`,
    () => fn(WorkflowType.AUTO),
    null,
    true,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
}

function getWeeklyCron(
  config: CronConfig,
  fn: (type: WorkflowType) => Promise<void>
) {
  const splited = (config.hour as string).split(":");
  return new CronJob(
    `${splited[1]} ${splited[0]} * * ${config.weekday}`,
    () => fn(WorkflowType.AUTO),
    null,
    true,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
}

function getMonthlyCron(
  config: CronConfig,
  fn: (type: WorkflowType) => Promise<void>
) {
  const splited = (config.hour as string).split(":");
  return new CronJob(
    `${splited[1]} ${splited[0]} ${config.monthDay} * *`,
    () => fn(WorkflowType.AUTO),
    null,
    true,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
}

function getCustomCron(
  config: CronConfig,
  fn: (type: WorkflowType) => Promise<void>
) {
  return new CronJob(
    config.custom as string,
    () => fn(WorkflowType.AUTO),
    null,
    true,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
}
