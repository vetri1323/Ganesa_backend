// This is a temporary file with the updated server code
// The changes will be copied to the original server.js file

// ... (previous imports remain the same)

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
    
    // Rest of the route handler remains the same...
    const requiredFields = ['name', 'phone', 'address', 'serviceCategory', 'serviceCategoryName'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields: missingFields.map(field => `${field} is required`)
      });
    }

    // Rest of the existing code...
    
  } catch (error) {
    console.error('Error in /api/customers:', error);
    res.status(500).json({ error: 'Failed to create customer', details: error.message });
  }
});
