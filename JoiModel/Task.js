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
    .allow(null),
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
    .allow("").required(),

  assignedTo: Joi.string()
    .required(),

  numberOfCharacters: Joi.number()
    .integer()
    .min(1)
    .required(),

  // Array of Characters
  characters: Joi.array()
    .items(CharacterSchema)
    .min(1)
    .required()
    .messages({
      "array.min": "At least one character is required",
    }),

  // Array of Revision Requests (same structure)
  revisionRequests: Joi.array()
    .items(CharacterSchema)
    .messages({
      "array.min": "At least one character is required",
    }).allow(null),

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

  dueDate: Joi.date(),

  username: Joi.string()
    .trim()
    .required(),
});

export default TaskSchema;