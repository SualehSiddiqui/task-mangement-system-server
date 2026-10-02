import {
    getAllTasks,
    addTask,
    getCode,
    updateSpecificTask,
    deleteSpecificTask,
    searchAllTasks,
    uploadTaskImage,
    deleteFromCloudinary,
    uploadTaskApprovalImage,
    deleteApprovalFromCloudinary,
} from "../../services/index.js";

const addNewTask = (req, res) => {
    const userObj = req.body;
    return addTask(userObj, res);
}

const getCodeNumber = (req, res) => {
    return getCode(res);
}

const getTasks = async (req, res) => {
    const { page, size, status, designer } = req.query;
    return getAllTasks(page, size, status, designer, res)
}

const searchTasks = async (req, res) => {
    const taskObj = req.body;
    return searchAllTasks(taskObj, res)
}

const updateTask = (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    return updateSpecificTask(updatedData, id, res);
}

const deleteTask = (req, res) => {
    const { id } = req.params;
    return deleteSpecificTask(id, res);
}

const uploadImage = (req, res) => {
    const file = req.file;
    const { taskId, characterIndex, imageIndex, type } = req.query;

    if (!file) {
        return res.status(400).send({
            success: false,
            message: 'No file uploaded'
        });
    }

    if (!taskId) {
        return res.status(400).send({
            success: false,
            message: 'taskId is required'
        });
    }

    if (characterIndex === undefined) {
        return res.status(400).send({
            success: false,
            message: 'characterIndex is required'
        });
    }

    if (imageIndex === undefined) {
        return res.status(400).send({
            success: false,
            message: 'imageIndex is required'
        });
    }

    return uploadTaskImage(
        taskId,
        characterIndex,
        imageIndex,
        file.buffer,
        type,
        res
    );
};

const deleteImage = (req, res) => {
    const { taskId, characterIndex } = req.query;

    if (!characterIndex) {
        return res.status(400).send({ success: false, message: 'characterIndex query parameter is required' });
    }

    if (!taskId) {
        return res.status(400).send({ success: false, message: 'taskId query parameter is required' });
    }

    return deleteFromCloudinary(taskId, characterIndex, res);
}

const uploadApprovalImage = (req, res) => {
    const { taskId } = req.query;
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).send({ success: false, message: 'No files uploaded' });
    }

    if (!taskId) {
        return res.status(400).send({ success: false, message: 'taskId query parameter is required' });
    }

    const fileBuffers = files.map(file => file.buffer);
    return uploadTaskApprovalImage(taskId, fileBuffers, res);
}

const deleteApprovalImage = (req, res) => {
    const { taskId, publicId } = req.query;

    if (!publicId) {
        return res.status(400).send({ success: false, message: 'publicId query parameter is required' });
    }

    if (!taskId) {
        return res.status(400).send({ success: false, message: 'taskId query parameter is required' });
    }

    return deleteApprovalFromCloudinary(taskId, publicId, res);
}


export {
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
}