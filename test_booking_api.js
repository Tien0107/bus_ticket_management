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
    
    console.log("Mocking a booking request:");
    const res = await axios.post("https://my-server.serveminecraft.net/customer/booking", {
        totalPrice: 250000,
        pickupStationId: 4,
        dropoffStationId: 3,
        tripId: 10,
        userFullName: "Demo",
        phoneNumber: "0999999999",
        email: "demo@gmail.com",
        seatQuantity: 1,
        userNote: "",
        couponId: null,
        couponDetailId: null,
        selectedSeats: [{ id: 1, seatNumber: "A1" }]
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
