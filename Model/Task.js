import mongoose from "mongoose";

const { Schema, model } = mongoose;

const DescriptionSchema = new Schema({
    description: {
        type: String,
        required: true,
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

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Designer",
        required: true
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
            },
        ],
        required: true,
        validate: {
            validator(value) {
                return value.length > 0;
            },
            message: "At least one character is required"
        }
    },

    revisionRequests: {
        type: [
            {
                type: [DescriptionSchema],
                required: false,
            },
        ],
        required: false,
    },

    urgent: {
        type: Boolean,
        default: false
    },

    status: {
        type: String,
        enum: [
            "created",
            "assigned",
            "inProgress",
            "pendingApproval",
            "rejected",
            "completed"
        ],
        default: "created"
    },

    fifoOrder: {
        type: Number,
        required: true,
        index: true
    },

    submissionUrl: {
        type: String
    },

    dueDate: {
        type: Date
    },

    approvalWork: [
        {
            url: {
                type: String,
                required: true
            },

            publicId: {
                type: String,
                required: true
            },

            feedback: {
                type: String,
                default: ""
            },

            feedbackAt: {
                type: Date
            },

            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    username: {
        type: String,
        required: true,
        trim: true,
    },

}, { timestamps: true });

export default model("Task", TaskSchema);