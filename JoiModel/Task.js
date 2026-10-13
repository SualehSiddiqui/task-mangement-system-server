import Joi from "joi";

const DescriptionSchema = Joi.object({
  description: Joi.string()
    .trim()
    .allow(null, "")
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

const WorkFileSchema = Joi.object({
  url: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "File URL is required",
      "any.required": "File URL is required",
    }),

  publicId: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "File public ID is required",
      "any.required": "File public ID is required",
    }),

  resourceType: Joi.string()
    .allow("", null),
});

const WorkStageSchema = Joi.object({
  files: Joi.array()
    .items(WorkFileSchema)
    .default([]),

  feedback: Joi.string()
    .allow("")
    .default(""),
});

const TaskSchema = Joi.object({
  title: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Title is required",
      "any.required": "Title is required",
    }),

  saleCode: Joi.string()
    .trim()
    .allow("", null),

  designer: Joi.object({
    _id: Joi.string()
      .allow("", null),

    name: Joi.string()
      .trim()
      .allow("", null),
  })
    .allow({}, null),

  numberOfCharacters: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.min": "At least one character is required",
    }),

  characters: Joi.array()
    .items(CharacterSchema)
    .min(1)
    .required()
    .messages({
      "array.min": "At least one character is required",
      "any.required": "Characters are required",
    }),

  urgent: Joi.boolean()
    .default(false),

  fifoOrder: Joi.number()
    .required(),

  username: Joi.string()
    .trim()
    .allow("", null),

  // ===============================
  // OVERALL TASK STATUS
  // ===============================

  status: Joi.string()
    .valid(
      "created",
      "assigned",
      "sketching",
      "sketchingRejection",
      "sketchApproval",
      "coloring",
      "coloringRejection",
      "coloringApproval",
      "completed"
    )
    .default("created"),

  // ===============================
  // WORK
  // ===============================

  work: Joi.object({
    sketch: WorkStageSchema.default({
      files: [],
      feedback: "",
    }),

    coloring: WorkStageSchema.default({
      files: [],
      feedback: "",
    }),
  })
    .default({
      sketch: {
        files: [],
        feedback: "",
      },

      coloring: {
        files: [],
        feedback: "",
      },
    }),

  revisionRequests: Joi.object({
    sketching: Joi.array()
      .items(CharacterSchema)
      .default([]),

    coloring: Joi.array()
      .items(CharacterSchema)
      .default([])
  })
    .default({
      sketch: [],
      coloring: []
    }),
});

export default TaskSchema;