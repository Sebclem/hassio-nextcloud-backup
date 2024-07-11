import Joi from "joi";
import { WebdavEndpointType } from "./webdavConfig.js";

const WebdavConfigValidation = {
  url: Joi.string().not().empty().uri().required().label("Url"),
  username: Joi.string().not().empty().label("Username"),
  password: Joi.string().not().empty().label("Password"),
  backupDir: Joi.string().required().label("Backup directory"),
  allowSelfSignedCerts: Joi.boolean().label("Allow self signed certificate"),
  chunckedUpload: Joi.boolean().required().label("Chuncked upload"),
  webdavEndpoint: Joi.object({
    type: Joi.string()
      .valid(WebdavEndpointType.CUSTOM, WebdavEndpointType.NEXTCLOUD)
      .required(),
    customEndpoint: Joi.alternatives().conditional("type", {
      is: WebdavEndpointType.CUSTOM,
      then: Joi.string().not().empty().required(),
      otherwise: Joi.disallow(),
    }),
    customChunkEndpoint: Joi.alternatives().conditional("type", {
      is: WebdavEndpointType.CUSTOM,
      then: Joi.string().not().empty().required(),
      otherwise: Joi.disallow(),
    }),
  })
    .required()
    .label("Webdav endpoint"),
};

export default WebdavConfigValidation;
