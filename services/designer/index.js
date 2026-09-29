import Designer from "../../Model/Designer.js";
import DesignerSchema from "../../JoiModel/Designer.js";

const addDesigner = async (userObj, res) => {
    const { error } = DesignerSchema.validate(userObj);
    if (error) {
        return res.status(400).send({ success: false, message: error.details[0].message });
    };

    try {
        const { name } = userObj;

        const existingDesigner = await Designer.findOne({ name });
        if (existingDesigner) {
            return res.status(409).send({ success: false, message: 'Designer already exists with this name' });
        }

        const newDesigner = new Designer({
            ...userObj,
            role: 'designer',
        });
        await newDesigner.save();

        return res.status(201).send({ success: true, message: 'Designer added successfully', designer: newDesigner });
    } catch (error) {
        console.error('Error adding designer:', error);
        return res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
}

const getAllDesigners = async (res) => {
    try {
        const designers =
            await Designer.find({}).sort({ name: 1 });

        return res.status(200).send({ success: true, designers });
    } catch (error) {
        console.error('Error fetching designers:', error);
        return res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
}

const updateSpecificDesigner = async (updatedData, id, res) => {
    const { error } = DesignerSchema.validate(updatedData);
    if (error) {
        return res.status(400).send({ success: false, message: error.details[0].message });
    }

    try {
        const { name, joiningDate, password } = updatedData;

        const designerExist = await Designer.findById(id);

        if (!designerExist) {
            return res.status(404).send({ success: false, message: 'Designer not found' });
        }

        const updatedDesigner = await Designer.findByIdAndUpdate(
            id,
            { name, joiningDate, password },
            { new: true, runValidators: true }
        );

        return res.status(200).send({ success: true, message: 'Designer updated successfully', designer: updatedDesigner });
    } catch (error) {
        console.error('Error updating designer:', error);
        return res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
}

const deleteSpecificDesigner = async (id, res) => {
    try {
        const deletedDesigner = await Designer.findByIdAndDelete(id);

        if (!deletedDesigner) {
            return res.status(404).send({ success: false, message: 'Designer not found' });
        }

        return res.status(200).send({ success: true, message: 'Designer deleted successfully' });
    } catch (error) {
        console.error('Error deleting designer:', error);
        return res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
}

export {
    getAllDesigners,
    addDesigner,
    updateSpecificDesigner,
    deleteSpecificDesigner,
}