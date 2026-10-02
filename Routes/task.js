import express from "express";
import {
    getTasks,
    addNewTask,
    getCodeNumber,
    updateTask,
    deleteTask,
    searchTasks,
    uploadImage,
    deleteImage,
    uploadApprovalImage,
    deleteApprovalImage,
} from "../controllers/task/index.js"
import upload from "../middleware/fileUpload.js";

const Route = express.Router();

Route.get("/all", getTasks);
Route.post("/search", searchTasks);
Route.post('/add', addNewTask);
Route.get('/code', getCodeNumber);
Route.put('/update/:id', updateTask);
Route.delete('/delete/:id', deleteTask);
Route.post('/upload', upload.single('file'), uploadImage);
Route.post('/upload-approval-work', upload.array('files'), uploadApprovalImage);
Route.delete('/delete-image', deleteImage);
Route.delete('/delete-approval-image', deleteApprovalImage);

export default Route;