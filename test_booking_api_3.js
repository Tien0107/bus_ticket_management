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
    
    console.log("Mocking booking 3:");
    const res = await axios.post("https://my-server.serveminecraft.net/customer/booking", {
        type: "one_way",
        outBound: {
           tripId: 10,
           seatIds: [1, 2],
           seatId: [1, 2],
           fromStationId: 4,
           toStationId: 3,
           companyId: 1
        },
        userFullName: "Demo Name",
        phoneNumber: "0999999999",
        email: "demo@gmail.com"
    }, { headers });
    console.log(JSON.stringify(res.data));
  } catch (err) {
    if(err.response) {
      console.log("ERROR OUTPUT:", JSON.stringify(err.response?.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}
test();
