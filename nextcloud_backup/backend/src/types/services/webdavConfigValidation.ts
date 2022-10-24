import Joi, { not } from "joi";
import { WebdavEndpointType } from "./webdavConfig.js";


const WebdavConfigValidation = {
  url: Joi.string().not().empty().uri().required(),
  username: Joi.string().not().empty().required(),
  password: Joi.string().not().empty().required(),
  backupDir: Joi.string().required(),
  allowSelfSignedCerts: Joi.boolean().required(),
  webdavEndpoint: Joi.object({
    type: Joi.string().valid(WebdavEndpointType.CUSTOM, WebdavEndpointType.NEXTCLOUD).required(),
    customEndpoint: Joi.alternatives().conditional("type", {
      is: WebdavEndpointType.CUSTOM,
      then: Joi.string().not().empty().required,
      otherwise: Joi.disallow()
    })
  }).required()
}

export default WebdavConfigValidation;