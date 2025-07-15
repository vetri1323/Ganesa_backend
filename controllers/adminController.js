import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";

// API for admin login
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}


// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true, status: 'cancelled' })

        res.json({ success: true, message: 'Booking Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for adding Doctor
const addDoctor = async (req, res) => {

    try {

        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body
        const imageFile = req.file

        // checking for all data to add doctor
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" })
        }



        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
        const imageUrl = imageUpload.secure_url

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()
        res.json({ success: true, message: 'Turf Added' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {

        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}




// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find();
    res.json({ success: true, users });
  } catch (error) {
    console.error('getAllUsers error:', error);
    console.error('Request headers:', req.headers);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

// Create a user
const createUser = async (req, res) => {
  try {
    const user = new userModel(req.body);
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a user
const updateUser = async (req, res) => {
  try {
    const user = await userModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete an appointment
const deleteAppointmentAdmin = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    await appointmentModel.findByIdAndDelete(appointmentId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    await userModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API for admin to confirm appointment (pending_admin -> confirmed)
const confirmAppointmentAdmin = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) return res.json({ success: false, message: 'Appointment not found' });
        if (appointment.status !== 'pending_admin') return res.json({ success: false, message: 'Invalid status' });
        await appointmentModel.findByIdAndUpdate(appointmentId, { status: 'confirmed' });
        res.json({ success: true, message: 'Appointment confirmed by admin' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API for admin to change appointment status to any valid value
const changeAppointmentStatusAdmin = async (req, res) => {
    try {
        const { appointmentId, status } = req.body;
        const validStatuses = ['pending_doctor', 'pending_admin', 'confirmed', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) return res.json({ success: false, message: 'Invalid status value' });
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) return res.json({ success: false, message: 'Appointment not found' });
        await appointmentModel.findByIdAndUpdate(appointmentId, { status });
        res.json({ success: true, message: `Appointment status changed to ${status}` });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Edit Turf (Doctor)
const editTurf = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const updatedTurf = await doctorModel.findByIdAndUpdate(id, update, { new: true });
    if (!updatedTurf) {
      return res.status(404).json({ success: false, message: "Turf not found" });
    }
    res.json({ success: true, message: "Turf updated successfully", turf: updatedTurf });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to update turf" });
  }
};

// Delete Turf (Doctor)
const deleteTurf = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTurf = await doctorModel.findByIdAndDelete(id);
    if (!deletedTurf) {
      return res.status(404).json({ success: false, message: "Turf not found" });
    }
    res.json({ success: true, message: "Turf deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete turf" });
  }
};

export {
    loginAdmin,
    confirmAppointmentAdmin,
    changeAppointmentStatusAdmin,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    adminDashboard,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    deleteAppointmentAdmin,
    editTurf,
    deleteTurf
}