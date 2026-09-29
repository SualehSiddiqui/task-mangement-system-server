import mongoose from "mongoose";

const { Schema, model } = mongoose;

const DesignerSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    joiningDate: {
        type: Date,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: false,
        default: "designer"
    },
}, { timestamps: true });

const Designer = model('Designer', DesignerSchema);

export default Designer;