import express from "express";
import {
    getDesigners,
    addNewDesigner,
    updateDesigner,
    deleteDesigner
} from "../controllers/designer/index.js"

const Route = express.Router();

Route.get('/get/', getDesigners);
Route.post('/add', addNewDesigner);
Route.put('/update/:id', updateDesigner);
Route.delete('/delete/:id', deleteDesigner);

export default Route;