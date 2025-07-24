import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add a compound index to ensure subcategory names are unique within a category
subCategorySchema.index({ name: 1, category: 1 }, { unique: true });

// Virtual for populating customers
subCategorySchema.virtual('customers', {
  ref: 'Customer',
  localField: '_id',
  foreignField: 'services.subCategory'
});

// Add a pre-remove hook to check for referenced customers
subCategorySchema.pre('remove', async function(next) {
  const customerCount = await this.model('Customer').countDocuments({ 'services.subCategory': this._id });
  if (customerCount > 0) {
    throw new Error('Cannot delete subcategory as it is being used by one or more customers');
  }
  next();
});

const SubCategory = mongoose.model('SubCategory', subCategorySchema);

export default SubCategory;
