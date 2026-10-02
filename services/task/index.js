import Task from "../../Model/Task.js";
import TaskSchema from "../../JoiModel/Task.js";
import Code from "../../Model/Code.js";
import cloudinary from "../../config/cloudinary.js";
import mongoose from "mongoose";

const addTask = async (userObj, res) => {
    const lastTask = await Task.findOne().sort({ fifoOrder: -1 });
    userObj.fifoOrder = lastTask ? lastTask.fifoOrder + 1 : 1;

    if (userObj?.designer?._id == "")
        delete userObj?.designer;

    const { error } = TaskSchema.validate(userObj);
    if (error) {
        console.log("asdsad")
        console.log('Validation error:', error.details[0].message);
        return res.status(400).send({ success: false, message: error.details[0].message });
    };

    try {
        const code = await getCodeToUpdate('code');

        // Create a new task
        const newTask = new Task({
            ...userObj,
            saleCode: `PU-${String(code).padStart(4, '0')}`,
        });
        await newTask.save();

        return res.status(201).send({ success: true, message: 'Task added successfully', task: newTask });
    } catch (error) {
        console.error('Error adding task:', error);

        // MongoDB duplicate key error
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0];
            const duplicateValue = error.keyValue[duplicateField];

            return res.status(409).send({
                success: false,
                message: `${duplicateField} "${duplicateValue}" already exists. Please use a different value.`
            });
        }

        return res.status(500).send({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

const getCodeToUpdate = async () => {
    try {
        const sequenceDocExist = await Code.findOne({ _id: "code" });
        let sequenceDoc;
        if (sequenceDocExist) {
            sequenceDoc = await Code.findOneAndUpdate(
                { _id: "code" },
                { $inc: { sequence_value: 1 } },
                { returnDocument: 'after', upsert: true }
            );
        } else {
            sequenceDoc = await Code({ _id: 'code', sequence_value: 1 });
            sequenceDoc.save();
        }
        return sequenceDoc.sequence_value;
    }
    catch (error) {
        console.log(error)
    }
};

const getCode = async (res) => {
    try {
        const sequenceDocExist = await Code.findOne({ _id: 'code' });
        let sequenceDoc;
        if (!sequenceDocExist) {
            sequenceDoc = await Code({ _id: 'code', sequence_value: 0 });
            sequenceDoc.save();
        } else {
            sequenceDoc = sequenceDocExist;
        }
        return res.status(200).send({ success: true, number: sequenceDoc.sequence_value });
    } catch (error) {
        console.log('error--->', error)
        res.status(500).send({ success: false, error, message: error.message })
    }
};

const getAllTasks = async (page, size, status, designer, res) => {
    try {
        // ==========================================
        // BASE FILTER
        // ==========================================

        const baseFilter = {};

        // Designer is now stored as:
        // designer: {
        //     _id: String,
        //     name: String
        // }

        if (designer) {
            baseFilter['designer._id'] = designer;
        }


        // ==========================================
        // STATUS FILTER
        // ==========================================

        const query = { ...baseFilter };

        if (status && status !== 'all') {
            query.status = status;
        }


        // ==========================================
        // TOTAL TASKS
        // ==========================================

        const totalTask = await Task.countDocuments(query);


        // ==========================================
        // GET TASKS
        // ==========================================

        let tasks;

        const hasPagination =
            page !== undefined &&
            page !== null &&
            page !== 'undefined' &&
            size !== undefined &&
            size !== null &&
            size !== 'undefined';

        if (hasPagination) {
            const pageNumber = Number(page);
            const pageSize = Number(size);

            const skip = (pageNumber - 1) * pageSize;

            tasks = await Task.find(query)
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(pageSize);
        } else {
            tasks = await Task.find(query)
                .sort({ createdAt: 1 });
        }


        // ==========================================
        // STATUS COUNTS
        // ==========================================

        const [
            created,
            assigned,
            inProgress,
            pendingApproval,
            rejected,
            completed
        ] = await Promise.all([
            Task.countDocuments({
                ...baseFilter,
                status: 'created'
            }),

            Task.countDocuments({
                ...baseFilter,
                status: 'assigned'
            }),

            Task.countDocuments({
                ...baseFilter,
                status: 'inProgress'
            }),

            Task.countDocuments({
                ...baseFilter,
                status: 'pendingApproval'
            }),

            Task.countDocuments({
                ...baseFilter,
                status: 'rejected'
            }),

            Task.countDocuments({
                ...baseFilter,
                status: 'completed'
            })
        ]);


        // ==========================================
        // RESPONSE
        // ==========================================

        const miscellaneous = {
            totalTasks: await Task.countDocuments(baseFilter),
            created,
            assigned,
            inProgress,
            pendingApproval,
            rejected,
            completed
        };

        return res.status(200).send({
            success: true,
            tasks,
            miscellaneous
        });

    } catch (error) {
        console.error('Error getting tasks:', error);

        return res.status(500).send({
            success: false,
            message: error.message
        });
    }
};

const getReportsOfTasks = async (filter, res) => {
    try {
        let tasks;
        const totalTask = await Task.find({});
        if (page !== 'undefined' && size !== 'undefined') {
            const skip = (Number(page) - 1) * size;

            if (status === 'all') {
                tasks = await Task.find({ assignedTo: designer }).sort({ createdAt: 1 }).skip(skip).limit(size);
            } else {
                tasks = await Task.find({ status, assignedTo: designer }).sort({ createdAt: 1 }).skip(skip).limit(size);
            }
        } else {
            tasks = await Task.find({ assignedTo: designer }).sort({ createdAt: 1 });
        }

        return res.status(200).send({ success: true, tasks, totalTasks: totalTask.length })
    } catch (error) {
        console.log('error--->', error)
        res.status(500).send({ success: false, error, message: error.message })
    }
};

const searchAllTasks = async (taskObj, res) => {
    try {
        const { username, status } = taskObj;
        let data;
        if (status) {
            data = await Task.find({ username: { $regex: new RegExp(username.toLowerCase(), 'i') }, status });
        } else {
            data = await Task.find({ username: { $regex: new RegExp(username.toLowerCase(), 'i') } });
        }
        return res.status(200).send({ sucess: true, data });
    } catch (error) {
        console.log('error--->', error);
        res.send({ success: false, error, message: error.message });
    }
};

const updateSpecificTask = async (updatedData, id, res) => {

    try {
        const taskExist = await Task.findById(id);

        if (!taskExist) {
            return res.status(404).send({ success: false, message: 'Task not found' });
        }

        // Find the task by ID and update with only provided fields
        const updatedTask = await Task.findByIdAndUpdate(
            id,
            updatedData,
            { new: true, runValidators: true }
        );

        // Respond with the updated task
        return res.status(200).send({ success: true, message: 'Task updated successfully', task: updatedTask });
    } catch (error) {
        console.error('Error updating task:', error);
        return res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
};

const deleteSpecificTask = async (id, res) => {
    try {
        // Find the task by ID
        const task = await Task.findById(id);

        // If the task does not exist
        if (!task) {
            return res.status(404).send({ success: false, message: 'Task not found' });
        }

        // Collect public IDs from referenceImage and approvalWork arrays
        const publicIds = [];
        if (Array.isArray(task.referenceImage)) {
            publicIds.push(...task.referenceImage.map(f => f.publicId || f.public_id).filter(Boolean));
        }
        if (Array.isArray(task.approvalWork)) {
            publicIds.push(...task.approvalWork.map(f => f.publicId || f.public_id).filter(Boolean));
        }

        // Delete resources from Cloudinary if any
        if (publicIds.length > 0) {
            try {
                await cloudinary.api.delete_resources(publicIds, { resource_type: 'image', invalidate: true });
            } catch (cloudErr) {
                console.error('Error deleting images from Cloudinary:', cloudErr);
                // Continue to delete the task record even if Cloudinary deletion fails
            }
        }

        // Delete the task document
        await Task.findByIdAndDelete(id);

        // Return success response
        return res.status(200).send({ success: true, message: 'Task and associated images deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        return res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
};

const uploadTaskImage = async (
    taskId,
    characterIndex,
    imageIndex,
    fileBuffer,
    type,
    res
) => {
    try {
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).send({
                success: false,
                message: 'Task not found'
            });
        }

        let updatedTask;

        if (type === 'reference') {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'task-management/reference-images',
                        resource_type: 'auto',
                        public_id: `character-${taskId}-${characterIndex}-${imageIndex}-${Date.now()}`
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                uploadStream.end(fileBuffer);
            });

            updatedTask =
                await Task.findByIdAndUpdate(
                    taskId,
                    {
                        $set: {
                            [`characters.${characterIndex}.${imageIndex}.image.url`]:
                                result.secure_url,
                            [`characters.${characterIndex}.${imageIndex}.image.publicId`]:
                                result.public_id,
                        }
                    },
                    { new: true }
                );

        } else if (type === 'revision') {
            const result = await new Promise((resolve, reject) => {
                const uploadStream =
                    cloudinary.uploader.upload_stream(
                        {
                            folder: 'task-management/revision-images',
                            resource_type: 'auto',
                            public_id: `character-${taskId}-${characterIndex}-${imageIndex}-${Date.now()}`
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );

                uploadStream.end(fileBuffer);
            });

            updatedTask =
                await Task.findByIdAndUpdate(
                    taskId,
                    {
                        $set: {
                            [`revisionRequests.${characterIndex}.${imageIndex}.image.url`]:
                                result.secure_url,
                            [`revisionRequests.${characterIndex}.${imageIndex}.image.publicId`]:
                                result.public_id
                        }
                    },
                    { new: true }
                );
        }

        return res.status(200).send({
            success: true,
            task: updatedTask
        });

    } catch (error) {
        return res.status(500).send({
            success: false,
            message: error.message
        });
    }
};

const deleteFromCloudinary = async (taskId, publicId, res) => {
    try {
        const decodedPublicId = decodeURIComponent(publicId);
        // Check for existing image and delete it if present
        await cloudinary.api.delete_resources([decodedPublicId], { resource_type: 'image' }, async (deleteError, deleteResult) => {
            if (deleteError && deleteError.http_code !== 404) { // If error is not 'not found'
                console.error("Cloudinary delete error:", deleteError);
                return res.status(500).send({ success: false, error: deleteError });
            }
        });

        // Then, remove the image reference from the Task document (if it exists)
        const task = await Task.findOneAndUpdate(
            { _id: taskId },
            { $pull: { "characters": { publicId: decodedPublicId } } }, // Remove the image with the specific decodedPublicId
            { new: true }
        );

        if (!task) {
            return res.status(404).send({ success: false, message: 'Task not found' });
        }

        return res.status(200).send({ success: true, message: 'Image deleted and Task updated' });

    } catch (error) {
        console.log("error", error);
        res.status(500).send({ success: false, error: error?.message });
    }
};

const uploadTaskApprovalImage = async (
    taskId,
    fileBuffers,
    res
) => {
    try {

        const taskExist = await Task.findById(taskId);

        if (!taskExist) {
            return res.status(404).send({
                success: false,
                message: "Task not found"
            });
        }

        if (!fileBuffers || fileBuffers.length === 0) {
            return res.status(400).send({
                success: false,
                message: "No image files provided"
            });
        }

        if (
            taskExist.status === "inProgress" &&
            taskExist.approvalWork?.length > 0
        ) {
            await deleteApprovalImages(
                taskId,
                "approvalWork"
            );
        }

        const folder = "task-management/approval-work";

        const uploadedFiles = await Promise.all(

            fileBuffers.map((fileBuffer, index) => {

                return new Promise((resolve, reject) => {

                    const uploadStream =
                        cloudinary.uploader.upload_stream(
                            {
                                folder,
                                resource_type: "auto",
                                public_id:
                                    `approval-work-${taskId}-${Date.now()}-${index}`
                            },
                            (error, result) => {

                                if (error) {
                                    return reject(error);
                                }

                                resolve({
                                    url: result.secure_url,
                                    publicId: result.public_id
                                });
                            }
                        );

                    uploadStream.end(fileBuffer);
                });
            })
        );

        const updatedTask =
            await Task.findByIdAndUpdate(
                taskId,
                {
                    $push: {
                        approvalWork: {
                            $each: uploadedFiles
                        }
                    },
                    revisionRequests: [],
                },
                {
                    new: true
                }
            );

        return res.status(200).send({
            success: true,
            message:
                `Files uploaded and saved to approvalWork successfully`,
            task: updatedTask,
            uploadedFiles
        });

    } catch (error) {

        console.error(
            "Error uploading images:",
            error
        );

        return res.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

const deleteApprovalImages = async (taskId) => {

    const task = await Task.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    const files = task["approvalWork"] || [];

    if (!files.length) {
        return;
    }

    const publicIds = files.map(file => file.publicId);

    await cloudinary.api.delete_resources(
        publicIds,
        { resource_type: "image" }
    );

    task["approvalWork"] = [];

    await task.save();

    return true;
};

const deleteApprovalFromCloudinary = async (
    taskId,
    publicId,
    res
) => {
    try {

        const decodedPublicId =
            decodeURIComponent(publicId);

        await cloudinary.uploader.destroy(
            decodedPublicId
        );

        const task = await Task.findByIdAndUpdate(
            taskId,
            {
                $pull: {
                    approvalWork: {
                        publicId: decodedPublicId
                    }
                }
            },
            { new: true }
        );

        if (!task) {
            return res.status(404).send({
                success: false,
                message: "Task not found"
            });
        }

        return res.status(200).send({
            success: true,
            message: "Image deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting approval image:", error);
        return res.status(500).send({
            success: false,
            error: error.message
        });

    }
};

export {
    getAllTasks,
    addTask,
    updateSpecificTask,
    deleteSpecificTask,
    searchAllTasks,
    uploadTaskImage,
    deleteFromCloudinary,
    uploadTaskApprovalImage,
    deleteApprovalFromCloudinary,
    getCode,
}