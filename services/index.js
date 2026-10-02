import {
    createUser,
    authenticateExistingUser,
    changeUserPassword,
} from "./auth/index.js";

import {
    getAllDesigners,
    addDesigner,
    updateSpecificDesigner,
    deleteSpecificDesigner,
} from "./designer/index.js";

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
} from "./task/index.js";

export {
    //auth
    createUser,
    authenticateExistingUser,
    changeUserPassword,
    //Designer
    getAllDesigners,
    addDesigner,
    updateSpecificDesigner,
    deleteSpecificDesigner,
    //Task
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
}