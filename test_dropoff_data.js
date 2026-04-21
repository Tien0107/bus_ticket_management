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
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log("Fetching dropoffs for scheduleId: 1");
    const dropoffs = await axios.get("https://my-server.serveminecraft.net/customer/trip-schedule/1/dropoff", { headers });
    console.log("Dropoffs:", JSON.stringify(dropoffs.data));

  } catch (err) {
    if(err.response) {
      console.log("ERROR:", err.response?.data);
    } else {
      console.error(err.message);
    }
  }
}
test();
