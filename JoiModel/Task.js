import Joi from "joi";

const DescriptionSchema = Joi.object({
  description: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Description is required",
    }),

  image: Joi.object({
    url: Joi.string().allow("", null),
    publicId: Joi.string().allow("", null),
  })
    .optional()
    .allow("", null),
});

const CharacterSchema = Joi.array()
  .items(DescriptionSchema)
  .min(1)
  .required()
  .messages({
    "array.min": "At least one description is required",
  });

const TaskSchema = Joi.object({
  title: Joi.string()
    .trim()
    .required(),

  saleCode: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Sale code is required"
    }),

  designer: Joi.object({
    _id: Joi.string().allow("", null),

    name: Joi.string()
      .trim().allow("", null),

  }).allow({}, null),

  numberOfCharacters: Joi.number()
    .integer()
    .min(1)
    .required(),

  characters: Joi.array()
    .items(CharacterSchema)
    .min(1)
    .required()
    .messages({
      "array.min": "At least one character is required",
    }),

  revisionRequests: Joi.array()
    .items(CharacterSchema)
    .allow("", null)
    .default([]),

  urgent: Joi.boolean()
    .default(false),

  status: Joi.string()
    .valid(
      "created",
      "assigned",
      "inProgress",
      "pendingApproval",
      "rejected",
      "completed"
    )
    .default("created"),

  fifoOrder: Joi.number()
    .required(),

  submissionUrl: Joi.string()
    .allow("", null),

  dueDate: Joi.date()
    .allow("", null),

  username: Joi.string()
    .trim().allow("", null)
});

export default TaskSchema;