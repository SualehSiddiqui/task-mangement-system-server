import {
    getAllDesigners,
    addDesigner,
    updateSpecificDesigner,
    deleteSpecificDesigner,
} from "../../services/index.js";

const addNewDesigner = (req, res) => {
    const userObj = req.body;
    return addDesigner(userObj, res);
}

const getDesigners = (req, res) => {
    return getAllDesigners(res);
}

const updateDesigner = (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    return updateSpecificDesigner(updatedData, id, res);
}

const deleteDesigner = (req, res) => {
    const { id } = req.params;
    return deleteSpecificDesigner(id, res);
}

export {
    getDesigners,
    addNewDesigner,
    updateDesigner,
    deleteDesigner
}