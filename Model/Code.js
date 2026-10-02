import mongoose from "mongoose";


const { Schema, model } = mongoose
const CodeSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    sequence_value: {
        type: Number,
        required: true
    }
}, {
    timestamps: true,
});

const Code = new model("Code", CodeSchema);

export default Code;