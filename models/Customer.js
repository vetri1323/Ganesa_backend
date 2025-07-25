import mongoose from 'mongoose';

// Schema options
const schemaOptions = {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
};

const customerSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  dateOfBirth: {
    type: Date,
    required: false,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        return value <= new Date(); // Date of birth can't be in the future
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot be more than 500 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [100, 'City cannot be more than 100 characters']
  },
  state: {
    type: String,
    trim: true,
    maxlength: [100, 'State cannot be more than 100 characters']
  },
  zipCode: {
    type: String,
    trim: true,
    maxlength: [20, 'ZIP code cannot be more than 20 characters']
  },
  
  // Service Information
  serviceCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Service category is required']
  },
  serviceCategoryName: {
    type: String,
    required: [true, 'Service category name is required'],
    trim: true
  },
  serviceSubCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    default: null
  },
  serviceSubCategoryName: {
    type: String,
    default: null,
    trim: true
  },
  serviceNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Service number cannot be more than 50 characters']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending', 'Suspended'],
    default: 'Active'
  },
  
  // Financial Information
  fees: {
    type: Number,
    min: [0, 'Fees cannot be negative']
  },
  gstStatus: {
    type: String,
    enum: ['Paid', 'Not Paid', 'Pay Later'],
    default: 'Not Paid'
  },
  gstNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'GST number cannot be more than 50 characters']
  },
  
  // Dates
  deliveryDate: {
    type: Date
  },
  nextRenewalDate: {
    type: Date
  },
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  
  // Additional Information
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot be more than 2000 characters']
  },
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, schemaOptions);

// Add text index for search
customerSchema.index({
  name: 'text',
  email: 'text',
  phone: 'text',
  address: 'text',
  service: 'text',
  serviceNumber: 'text',
  city: 'text',
  state: 'text',
  zipCode: 'text',
  gstNumber: 'text',
  notes: 'text'
});

// Add a pre-save hook to update the updatedAt field
customerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
