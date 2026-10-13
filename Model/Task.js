import mongoose from "mongoose";

const { Schema, model } = mongoose;

const DescriptionSchema = new Schema({
    description: {
        type: String,
        required: false,
        trim: true
    },

    image: {
        url: {
            type: String
        },
        publicId: {
            type: String
        }
    }
}, { _id: false });

const TaskSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    saleCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    designer: {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false
        },

        name: {
            type: String,
            required: false,
            trim: true
        },
    },

    numberOfCharacters: {
        type: Number,
        required: true,
        min: 1
    },

    characters: {
        type: [
            {
                type: [DescriptionSchema],
                required: true,
                validate: {
                    validator(value) {
                        return value.length > 0;
                    },
                    message: "At least one description is required"
                }
            }
        ],
        required: true,
        validate: {
            validator(value) {
                return value.length > 0;
            },
            message: "At least one character is required"
        }
    },

    urgent: {
        type: Boolean,
        default: false
    },

    fifoOrder: {
        type: Number,
        required: true,
        index: true
    },

    username: {
        type: String,
    },

    reviewed: {
        type: Boolean,
        default: false,
    },

    status: {
        type: String,
        enum: [
            "created",
            "assigned",
            "sketching",
            "sketchingRejection",
            "sketchApproval",
            "coloring",
            "coloringRejection",
            "coloringApproval",
            "completed"
        ],
        default: "created"
    },

    work: {
        sketching: {
            files: [
                {
                    url: {
                        type: String,
                        required: true
                    },

                    publicId: {
                        type: String,
                        required: true
                    },

                    resourceType: {
                        type: String
                    }
                }
            ],

            feedback: {
                type: String,
                default: ""
            }
        },

        coloring: {
            files: [
                {
                    url: {
                        type: String,
                        required: true
                    },

                    publicId: {
                        type: String,
                        required: true
                    },

                    resourceType: {
                        type: String
                    }
                }
            ],

            feedback: {
                type: String,
                default: ""
            }
        }
    },

    revisionRequests: {
        sketching: {
            type: [
                {
                    type: [DescriptionSchema],
                    required: false
                }
            ],
            default: []
        },

        coloring: {
            type: [
                {
                    type: [DescriptionSchema],
                    required: false
                }
            ],
            default: []
        }
    },

}, { timestamps: true });

export default model("Task", TaskSchema);