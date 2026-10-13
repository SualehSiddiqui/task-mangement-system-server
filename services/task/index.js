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
        console.log('Validation error:', error.details[0].message);
        return res.status(400).send({ success: false, message: error.details[0].message });
    };

    try {

        const code = await getCodeToUpdate('code');

        const newTask = new Task({
            ...userObj,
            saleCode: `PU-${String(code).padStart(4, '0')}`,
        });
        await newTask.save();

        return res.status(201).send({ success: true, message: 'Task added successfully', task: newTask });
    } catch (error) {
        console.error('Error adding task:', error);

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

        // const result = await Task.updateMany(
        //     {},
        //     {
        //         $set: {
        //             reviewed: false
        //         }
        //     }
        // );

        // console.log("Matched:", result.matchedCount);
        // console.log("Modified:", result.modifiedCount);

        const baseFilter = {};

        if (designer) {
            baseFilter['designer._id'] = designer;
        }

        const query = { ...baseFilter };

        if (status && status !== 'all') {
            query.status = status;
        }

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

        const [
            created,
            assigned,
            sketching,
            sketchingRejection,
            sketchApproval,
            coloring,
            coloringRejection,
            coloringApproval,
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
                status: 'sketching'
            }),

            Task.countDocuments({
                ...baseFilter,
                status: 'sketchingRejection'
            }),

            Task.countDocuments({
                ...baseFilter,
                status: 'sketchApproval'
            }),

            Task.countDocuments({
                ...baseFilter,
                status: 'coloring'
            }),

            Task.countDocuments({
                ...baseFilter,
                status: 'coloringRejection'
            }),

            Task.countDocuments({
                ...baseFilter,
                status: 'coloringApproval'
            }),

            Task.countDocuments({
                ...baseFilter,
                status: 'completed'
            })
        ]);

        const miscellaneous = {
            totalTasks: await Task.countDocuments(baseFilter),
            created,
            assigned,
            sketching,
            sketchingRejection,
            sketchApproval,
            coloring,
            coloringRejection,
            coloringApproval,
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

        const updatedTask = await Task.findByIdAndUpdate(
            id,
            updatedData,
            { new: true, runValidators: true }
        );

        return res.status(200).send({ success: true, message: 'Task updated successfully', task: updatedTask });
    } catch (error) {
        console.error('Error updating task:', error);
        return res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
};

const deleteSpecificTask = async (id, res) => {
    try {
        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).send({ success: false, message: 'Task not found' });
        }

        const publicIds = [];
        if (Array.isArray(task.referenceImage)) {
            publicIds.push(...task.referenceImage.map(f => f.publicId || f.public_id).filter(Boolean));
        }
        if (Array.isArray(task.approvalWork)) {
            publicIds.push(...task.approvalWork.map(f => f.publicId || f.public_id).filter(Boolean));
        }

        if (publicIds.length > 0) {
            try {
                await cloudinary.api.delete_resources(publicIds, { resource_type: 'image', invalidate: true });
            } catch (cloudErr) {
                console.error('Error deleting images from Cloudinary:', cloudErr);
            }
        }

        await Task.findByIdAndDelete(id);

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
    workType,
    res,
) => {
    try {
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).send({
                success: false,
                message: "Task not found"
            });
        }

        let updatedTask;

        if (type === "reference") {

            const result = await new Promise(
                (resolve, reject) => {

                    const uploadStream =
                        cloudinary.uploader.upload_stream(
                            {
                                folder:
                                    "task-management/reference-images",

                                resource_type: "auto",

                                public_id:
                                    `character-${taskId}-${characterIndex}-${imageIndex}-${Date.now()}`
                            },

                            (error, result) => {

                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result);
                                }

                            }
                        );

                    uploadStream.end(fileBuffer);
                }
            );

            updatedTask =
                await Task.findByIdAndUpdate(
                    taskId,
                    {
                        $set: {
                            [`characters.${characterIndex}.${imageIndex}.image.url`]:
                                result.secure_url,

                            [`characters.${characterIndex}.${imageIndex}.image.publicId`]:
                                result.public_id
                        }
                    },
                    {
                        new: true
                    }
                );
        }

        else if (type === "revision") {

            if (
                workType !== "sketching" &&
                workType !== "coloring" &&
                workType !== "sketchingRejection" &&
                workType !== "coloringRejection"
            ) {
                return res.status(400).send({
                    success: false,
                    message:
                        "Invalid revision work type"
                });
            }

            const result = await new Promise(
                (resolve, reject) => {
                    const uploadStream =
                        cloudinary.uploader.upload_stream(
                            {
                                folder: `task-management/revision-images/${workType}`,
                                resource_type: "auto",
                                public_id: `${workType}-revision-${taskId}-${characterIndex}-${imageIndex}-${Date.now()}`
                            },

                            (error, result) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result);
                                }
                            }
                        );

                    uploadStream.end(fileBuffer);
                }
            );

            updatedTask =
                await Task.findByIdAndUpdate(
                    taskId,
                    {
                        $set: {
                            [`revisionRequests.${workType}.${characterIndex}.${imageIndex}.image.url`]:
                                result.secure_url,

                            [`revisionRequests.${workType}.${characterIndex}.${imageIndex}.image.publicId`]:
                                result.public_id
                        }
                    },
                    {
                        new: true
                    }
                );
        }

        else {
            return res.status(400).send({
                success: false,
                message: "Invalid upload type"
            });
        }

        return res.status(200).send({
            success: true,
            task: updatedTask
        });

    } catch (error) {

        console.error(
            "Error uploading task image:",
            error
        );

        return res.status(500).send({
            success: false,
            message: error.message
        });
    }
};

const deleteFromCloudinary = async (taskId, publicId, res) => {
    try {
        const decodedPublicId = decodeURIComponent(publicId);
        await cloudinary.api.delete_resources([decodedPublicId], { resource_type: 'image' }, async (deleteError, deleteResult) => {
            if (deleteError && deleteError.http_code !== 404) {
                console.error("Cloudinary delete error:", deleteError);
                return res.status(500).send({ success: false, error: deleteError });
            }
        });

        const task = await Task.findOneAndUpdate(
            { _id: taskId },
            { $pull: { "characters": { publicId: decodedPublicId } } },
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

            console.log("ERROR: Task not found");

            return res.status(404).send({
                success: false,
                message: "Task not found"
            });
        }

        if (!fileBuffers || fileBuffers.length === 0) {

            console.log(
                "ERROR: No files received"
            );

            return res.status(400).send({
                success: false,
                message: "No image files provided"
            });
        }

        let workType;

        if (taskExist.status === "sketching" || taskExist.status === "sketchingRejection") {

            workType = "sketching";

        } else if (taskExist.status === "coloring" || taskExist.status === "coloringRejection") {

            workType = "coloring";

        } else {

            console.log(
                "ERROR: Invalid task status:",
                taskExist.status
            );

            return res.status(400).send({
                success: false,
                message: "Task is not currently accepting work"
            });
        }

        const existingFiles =
            taskExist.work?.[workType]?.files || [];


        const folder =
            `task-management/${workType}`;

        const uploadedFiles =
            await Promise.all(

                fileBuffers.map(
                    (fileBuffer, index) => {

                        return new Promise(
                            (resolve, reject) => {

                                const publicId =
                                    `${workType}-${taskId}-${Date.now()}-${index}`;


                                const uploadStream =
                                    cloudinary.uploader.upload_stream(

                                        {
                                            folder,
                                            resource_type: "auto",
                                            public_id: publicId
                                        },

                                        (
                                            error,
                                            result
                                        ) => {

                                            if (error) {

                                                console.error(
                                                    `CLOUDINARY ERROR:`,
                                                    error
                                                );

                                                return reject(
                                                    error
                                                );
                                            }

                                            resolve({

                                                url:
                                                    result.secure_url,

                                                publicId:
                                                    result.public_id,

                                                resourceType:
                                                    result.resource_type

                                            });

                                        }
                                    );


                                uploadStream.on(
                                    "error",
                                    (streamError) => {

                                        console.error(
                                            `UPLOAD STREAM ERROR:`,
                                            streamError
                                        );

                                        reject(
                                            streamError
                                        );

                                    }
                                );

                                uploadStream.end(
                                    fileBuffer
                                );

                            }
                        );

                    }
                )
            );


        const allFiles = [
            ...existingFiles,
            ...uploadedFiles
        ];

        const nextStatus =
            (workType === "sketching")
                ? "sketchApproval"
                : "coloringApproval";

        const updateData = {
            $set: {
                [`work.${workType}.files`]: allFiles,

                [`work.${workType}.feedback`]: "",

                status: nextStatus,

                reviewed: false,
            }
        };

        const updatedTask =
            await Task.findByIdAndUpdate(
                taskId,
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!updatedTask) {
            return res.status(404).send({
                success: false,
                message: "Task could not be updated"
            });
        }

        return res.status(200).send({

            success: true,

            message:
                `${workType} uploaded successfully and sent for approval`,

            task: updatedTask,

            uploadedFiles

        });

    } catch (error) {
        console.log(
            "Error:",
            error
        );


        return res.status(500).send({

            success: false,

            message:
                "Internal Server Error",

            error:
                error?.message

        });
    }
};

const deleteApprovalFromCloudinary = async (
    taskId,
    publicId,
    workType,
    res
) => {
    try {
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).send({
                success: false,
                message: "Task not found"
            });
        }

        const files =
            task.work?.[workType]?.files || [];

        const fileIndex = files.findIndex(
            (file) => file.publicId === publicId
        );

        if (fileIndex === -1) {
            return res.status(404).send({
                success: false,
                message: "Approval file not found"
            });
        }

        const file = files[fileIndex];

        await cloudinary.uploader.destroy(
            publicId,
            {
                resource_type:
                    file.resourceType || "image"
            }
        );

        task.work[workType].files.splice(
            fileIndex,
            1
        );

        await task.save();

        return res.status(200).send({
            success: true,
            message: "Approval file deleted successfully",
            task
        });

    } catch (error) {
        console.error(
            "Delete approval image error:",
            error
        );

        return res.status(500).send({
            success: false,
            message: error.message
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