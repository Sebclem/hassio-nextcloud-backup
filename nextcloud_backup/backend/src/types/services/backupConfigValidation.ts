import Joi from "joi";
import { CronMode } from "./backupConfig.js";

const CronConfigValidation = {
  id: Joi.string().required().not().empty(),
  mode: Joi.string()
    .required()
    .valid(CronMode.CUSTOM, CronMode.DAILY, CronMode.MONTHLY, CronMode.WEEKLY),
  hour: Joi.alternatives().conditional("mode", {
    is: CronMode.CUSTOM,
    then: Joi.forbidden(),
    otherwise: Joi.string()
      .pattern(/^\d{2}:\d{2}$/)
      .required(),
  }),
  weekday: Joi.alternatives().conditional("mode", {
    is: CronMode.WEEKLY,
    then: Joi.number().min(0).max(6).required(),
    otherwise: Joi.forbidden(),
  }),
  monthDay: Joi.alternatives().conditional("mode", {
    is: CronMode.MONTHLY,
    then: Joi.number().min(1).max(28).required(),
    otherwise: Joi.forbidden(),
  }),
  custom: Joi.alternatives().conditional("mode", {
    is: CronMode.CUSTOM,
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
};

const AutoCleanConfig = {
  enabled: Joi.boolean().required(),
  nbrToKeep: Joi.alternatives().conditional("enabled", {
    is: true,
    then: Joi.number().required().min(0),
    otherwise: Joi.forbidden(),
  }),
};

const backupConfigValidation = {
  nameTemplate: Joi.string().required().not().empty(),
  cron: Joi.array().items(CronConfigValidation).required(),
  autoClean: Joi.object({
    homeAssistant: Joi.object(AutoCleanConfig).required(),
    webdav: Joi.object(AutoCleanConfig).required(),
  }).required(),
  exclude: Joi.object({
    addon: Joi.array().items(Joi.string().not().empty()),
    folder: Joi.array().items(Joi.string().not().empty()),
  }).required(),
  autoStopAddon: Joi.array().items(Joi.string().not().empty()),
  password: Joi.object({
    enabled: Joi.boolean().required(),
    value: Joi.alternatives().conditional("enabled", {
      is: true,
      then: Joi.string().required().not().empty(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

export default backupConfigValidation;
