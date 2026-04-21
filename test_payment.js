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
    
    console.log("Creating booking...");
    const bookRes = await axios.post("https://my-server.serveminecraft.net/customer/booking", {
        type: "one_way",
        outBound: {
           tripId: 10,
           seatId: 3,
           fromStationId: 4,
           toStationId: 3,
           companyId: 1
        },
        userFullName: "Demo Name",
        phoneNumber: "0999999999",
        email: "demo@gmail.com"
    }, { headers });
    
    console.log("Booking created:", bookRes.data);
    const bookingId = bookRes.data.id;
    
    console.log("Calling payment method...");
    try {
        const payRes = await axios.post("https://my-server.serveminecraft.net/payment/method", {
            orderId: bookingId,
            method: "vnpay"
        }, { headers });
        console.log("Pay res:", payRes.data);
    } catch(err) {
        console.log("Failed pay:", err.response?.data);
    }
  } catch (err) {
      console.error(err.message);
  }
}
test();
