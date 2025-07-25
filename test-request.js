import axios from 'axios';

async function testAPI() {
    try {
        console.log('Making request to http://localhost:5000/api/customers');
        const response = await axios.get('http://localhost:5000/api/customers');
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testAPI();
