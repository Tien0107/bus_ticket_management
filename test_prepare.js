const axios = require('axios');
async function test() {
  try {
    const ts = Date.now();
    const reg = await axios.post("https://my-server.serveminecraft.net/customer/sign-up", {
      username: `testuser${ts}`,
      password: "Password123#",
      fullName: "Test User",
      contactInfo: { email: `test${ts}@gmail.com`, phone: `09${Math.floor(Math.random()*100000000).toString().padStart(8, '0')}` }
    });
    const token = reg.data.token;
    
    const prep = await axios.post("https://my-server.serveminecraft.net/customer/trip-schedule/prepare", {
       scheduleId: 1, 
       companyId: 1,
       departureDate: new Date().toISOString().split('T')[0]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(JSON.stringify(prep.data, null, 2));
  } catch (err) {
    if(err.response) {
      console.log(err.response?.data);
    } else {
      console.error(err.message);
    }
  }
}
test();
