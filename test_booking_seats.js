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

    console.log("Fetching trip 10 seats with stopOrders");
    const seats = await axios.get("https://my-server.serveminecraft.net/customer/trip/10/seat?stopOrderPickup=1&stopOrderDropoff=3", { headers });
    console.log("Seats:", JSON.stringify(seats.data).substring(0, 500));

  } catch (err) {
    if(err.response) {
      console.log("ERROR:", err.response?.data);
    } else {
      console.error(err.message);
    }
  }
}
test();
