import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel, addDoctor, allDoctors, adminDashboard, getAllUsers, createUser, updateUser, deleteUser, confirmAppointmentAdmin, changeAppointmentStatusAdmin, deleteAppointmentAdmin, editTurf, deleteTurf } from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.get("/dashboard", authAdmin, adminDashboard)

adminRouter.post("/confirm-appointment", authAdmin, confirmAppointmentAdmin);
adminRouter.post("/change-appointment-status", authAdmin, changeAppointmentStatusAdmin);

adminRouter.get("/users", authAdmin, getAllUsers);
adminRouter.post("/users", authAdmin, createUser);
adminRouter.put("/users/:id", authAdmin, updateUser);
adminRouter.delete("/users/:id", authAdmin, deleteUser);

adminRouter.delete("/delete-appointment", authAdmin, deleteAppointmentAdmin);

// Turf (Doctor) CRUD
adminRouter.put("/edit-turf/:id", authAdmin, editTurf);
adminRouter.delete("/delete-turf/:id", authAdmin, deleteTurf);

export default adminRouter;