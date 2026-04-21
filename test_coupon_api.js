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
    
    console.log("Checking fake coupon:");
    try {
        const res = await axios.get("https://my-server.serveminecraft.net/customer/coupon/check", { headers, params: { code: 'FAKE123', totalAmount: 250000 } });
        console.log(JSON.stringify(res.data));
    } catch(err) {
        console.log("Failed check:", err.response?.data);
    }
  } catch (err) {
    if(err.response) {
      console.log("ERROR OUTPUT:", JSON.stringify(err.response?.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}
test();
