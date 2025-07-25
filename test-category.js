import axios from 'axios';

async function testCategoryCRUD() {
  const baseUrl = 'http://localhost:5000/api/categories';
  
  try {
    // Test creating a category with URL
    console.log('Testing category creation...');
    const createResponse = await axios.post(baseUrl, {
      name: 'Test Category',
      url: 'https://example.com/test-category'
    });
    
    const categoryId = createResponse.data._id;
    console.log('Created category:', createResponse.data);
    
    // Test updating the category
    console.log('\nTesting category update...');
    const updateResponse = await axios.put(`${baseUrl}/${categoryId}`, {
      name: 'Updated Test Category',
      url: 'https://example.com/updated-test-category'
    });
    
    console.log('Updated category:', updateResponse.data);
    
    // Test getting the category
    console.log('\nFetching category...');
    const getResponse = await axios.get(`${baseUrl}/${categoryId}`);
    console.log('Fetched category:', getResponse.data);
    
    // Clean up: delete the test category
    console.log('\nCleaning up: deleting test category...');
    await axios.delete(`${baseUrl}/${categoryId}`);
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Error during test:', error.response?.data || error.message);
  }
}

testCategoryCRUD();
