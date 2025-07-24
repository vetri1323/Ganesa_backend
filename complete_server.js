import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Customer from './src/models/Customer.js';
import statusRoutes from './src/routes/statuses.js';
import authRoutes from './src/routes/auth.js';
import categoryRoutes from './src/routes/categories.js';
import subCategoryRoutes from './src/routes/subcategories.js';

dotenv.config();

const app = express();

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Middleware
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.options('*', cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/statuses', statusRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subCategoryRoutes);

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const { search, status, service, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { serviceNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (service) {
      query.serviceCategory = service;
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const customers = await Customer.find(query)
      .sort(sort)
      .populate('serviceCategory', 'name')
      .populate('serviceSubCategory', 'name');
      
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer by ID
app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('serviceCategory', 'name')
      .populate('serviceSubCategory', 'name');
      
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create a new customer
app.post('/api/customers', async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    
    // Ensure serviceSubCategory is properly formatted
    if (!req.body.serviceSubCategory || req.body.serviceSubCategory === '') {
      req.body.serviceSubCategory = null;
      req.body.serviceSubCategoryName = null;
    } else if (req.body.serviceSubCategory) {
      // Make sure we have a valid ObjectId for serviceSubCategory
      if (!mongoose.Types.ObjectId.isValid(req.body.serviceSubCategory)) {
        console.error('Invalid serviceSubCategory ID format:', req.body.serviceSubCategory);
        return res.status(400).json({ 
          error: 'Invalid service subcategory ID format',
          field: 'serviceSubCategory'
        });
      }
    }
    
    // Validate required fields
    const requiredFields = ['name', 'phone', 'address', 'serviceCategory', 'serviceCategoryName'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields: missingFields.map(field => `${field} is required`)
      });
    }

    // Validate phone number format (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(req.body.phone)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        errors: { phone: 'Please enter a valid 10-digit phone number' }
      });
    }

    // Convert string IDs to ObjectId
    const serviceCategory = req.body.serviceCategory ? new mongoose.Types.ObjectId(req.body.serviceCategory) : null;
    const serviceSubCategory = req.body.serviceSubCategory ? new mongoose.Types.ObjectId(req.body.serviceSubCategory) : null;

    // Prepare customer data with all fields
    const customerData = {
      // Basic Information
      name: req.body.name.trim(),
      email: req.body.email ? req.body.email.trim() : null,
      phone: req.body.phone.trim(),
      address: req.body.address.trim(),
      city: req.body.city ? req.body.city.trim() : null,
      state: req.body.state ? req.body.state.trim() : null,
      zipCode: req.body.zipCode ? req.body.zipCode.trim() : null,
      
      // Service Information
      serviceCategory: serviceCategory,
      serviceCategoryName: req.body.serviceCategoryName ? req.body.serviceCategoryName.trim() : null,
      serviceSubCategory: serviceSubCategory,
      serviceSubCategoryName: req.body.serviceSubCategoryName ? req.body.serviceSubCategoryName.trim() : null,
      serviceNumber: req.body.serviceNumber ? req.body.serviceNumber.trim() : null,
      status: req.body.status || 'Active',
      
      // Financial Information
      fees: Number(req.body.fees) || 0,
      gstStatus: req.body.gstStatus || 'Not Paid',
      gstNumber: req.body.gstNumber ? req.body.gstNumber.trim() : null,
      
      // Dates
      deliveryDate: req.body.deliveryDate ? new Date(req.body.deliveryDate) : null,
      nextRenewalDate: req.body.nextRenewalDate ? new Date(req.body.nextRenewalDate) : null,
      deliveryStatus: req.body.deliveryStatus || 'Pending',
      
      // Additional Information
      notes: req.body.notes ? req.body.notes.trim() : null
    };

    const newCustomer = new Customer(customerData);
    const savedCustomer = await newCustomer.save();
    
    console.log('New customer created:', savedCustomer);
    return res.status(201).json(savedCustomer);
  } catch (error) {
    console.error('Error adding customer:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = [];
      Object.keys(error.errors).forEach(key => {
        validationErrors.push({
          param: key,
          msg: error.errors[key].message,
          value: error.errors[key].value
        });
      });
      return res.status(400).json({ 
        error: 'Validation failed',
        errors: validationErrors,
        message: 'Validation error occurred',
        status: 400
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update a customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid customer ID format' });
    }

    // Ensure serviceSubCategory is properly formatted
    if (!req.body.serviceSubCategory || req.body.serviceSubCategory === '') {
      req.body.serviceSubCategory = null;
      req.body.serviceSubCategoryName = null;
    } else if (req.body.serviceSubCategory) {
      // Make sure we have a valid ObjectId for serviceSubCategory
      if (!mongoose.Types.ObjectId.isValid(req.body.serviceSubCategory)) {
        console.error('Invalid serviceSubCategory ID format:', req.body.serviceSubCategory);
        return res.status(400).json({ 
          error: 'Invalid service subcategory ID format',
          field: 'serviceSubCategory'
        });
      }
    }

    // Prepare update data with all fields
    const updateData = {
      // Basic Information
      name: req.body.name ? req.body.name.trim() : undefined,
      email: req.body.email !== undefined ? (req.body.email ? req.body.email.trim() : null) : undefined,
      phone: req.body.phone ? req.body.phone.trim() : undefined,
      address: req.body.address ? req.body.address.trim() : undefined,
      city: req.body.city !== undefined ? (req.body.city ? req.body.city.trim() : null) : undefined,
      state: req.body.state !== undefined ? (req.body.state ? req.body.state.trim() : null) : undefined,
      zipCode: req.body.zipCode !== undefined ? (req.body.zipCode ? req.body.zipCode.trim() : null) : undefined,
      
      // Service Information
      serviceCategory: req.body.serviceCategory ? new mongoose.Types.ObjectId(req.body.serviceCategory) : undefined,
      serviceCategoryName: req.body.serviceCategoryName ? req.body.serviceCategoryName.trim() : undefined,
      serviceSubCategory: req.body.serviceSubCategory ? new mongoose.Types.ObjectId(req.body.serviceSubCategory) : null,
      serviceSubCategoryName: req.body.serviceSubCategoryName !== undefined ? 
        (req.body.serviceSubCategoryName ? req.body.serviceSubCategoryName.trim() : null) : undefined,
      serviceNumber: req.body.serviceNumber !== undefined ? 
        (req.body.serviceNumber ? req.body.serviceNumber.trim() : null) : undefined,
      status: req.body.status || 'Active',
      
      // Financial Information
      fees: req.body.fees !== undefined ? Number(req.body.fees) || 0 : undefined,
      gstStatus: req.body.gstStatus || 'Not Paid',
      gstNumber: req.body.gstNumber !== undefined ? 
        (req.body.gstNumber ? req.body.gstNumber.trim() : null) : undefined,
      
      // Dates
      deliveryDate: req.body.deliveryDate !== undefined ? 
        (req.body.deliveryDate ? new Date(req.body.deliveryDate) : null) : undefined,
      nextRenewalDate: req.body.nextRenewalDate !== undefined ? 
        (req.body.nextRenewalDate ? new Date(req.body.nextRenewalDate) : null) : undefined,
      deliveryStatus: req.body.deliveryStatus || 'Pending',
      
      // Additional Information
      notes: req.body.notes !== undefined ? (req.body.notes ? req.body.notes.trim() : null) : undefined,
      
      // Update timestamps
      updatedAt: new Date()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = [];
      Object.keys(error.errors).forEach(key => {
        validationErrors.push({
          param: key,
          msg: error.errors[key].message,
          value: error.errors[key].value
        });
      });
      return res.status(400).json({ 
        error: 'Validation failed',
        errors: validationErrors,
        message: 'Validation error occurred',
        status: 400
      });
    }
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete a customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid customer ID format' });
    }

    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    
    if (!deletedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong on the server.'
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
