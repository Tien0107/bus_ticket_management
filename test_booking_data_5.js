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
    
    console.log("Fetching pickups for scheduleId: 2");
    const pickups2 = await axios.get("https://my-server.serveminecraft.net/customer/trip-schedule/2/pickup", { headers });
    console.log("Pickups 2:", JSON.stringify(pickups2.data));

    console.log("Fetching pickups for scheduleId: 5");
    const pickups5 = await axios.get("https://my-server.serveminecraft.net/customer/trip-schedule/5/pickup", { headers });
    console.log("Pickups 5:", JSON.stringify(pickups5.data));

  } catch (err) {
    if(err.response) {
      console.log("ERROR:", err.response?.data);
    } else {
      console.error(err.message);
    }
  }
}
test();
