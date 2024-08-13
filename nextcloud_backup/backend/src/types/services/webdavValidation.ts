import Joi from "joi";

export const WebdavDeleteValidation = {
  path: Joi.string().not().empty().required()
}