import axios from 'axios';

const testLogin = async () => {
  try {
    console.log('🧪 Testing admin login...\n');
    
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@eriscafe.com',
      password: 'admin123'
    });

    console.log('✅ Login successful!');
    console.log('\nResponse:');
    console.log('- Token received:', response.data.appToken ? 'YES' : 'NO');
    console.log('- User data:', JSON.stringify(response.data.user, null, 2));
    
    // Decode the JWT to see what's inside
    if (response.data.appToken) {
      const tokenParts = response.data.appToken.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('\n🔐 Token payload:');
      console.log(JSON.stringify(payload, null, 2));
    }

  } catch (error) {
    console.error('❌ Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message);
    } else if (error.request) {
      console.error('No response from server. Is the backend running on port 4000?');
    } else {
      console.error('Error:', error.message);
    }
  }
};

console.log('Make sure your backend is running on http://localhost:4000');
console.log('Run: npm run dev\n');

testLogin();
