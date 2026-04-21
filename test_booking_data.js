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
    
    // scheduleId=1
    console.log("Fetching pickups for scheduleId: 1");
    const pickups = await axios.get("https://my-server.serveminecraft.net/customer/trip-schedule/1/pickup", { headers });
    console.log("Pickups:", JSON.stringify(pickups.data));

    console.log("Fetching trip 10 seats");
    const seats = await axios.get("https://my-server.serveminecraft.net/customer/trip/10/seat", { headers });
    console.log("Seats:", JSON.stringify(seats.data));

  } catch (err) {
    if(err.response) {
      console.log("ERROR:", err.response?.data);
    } else {
      console.error(err.message);
    }
  }
}
test();
