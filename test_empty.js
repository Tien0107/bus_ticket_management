const axios = require('axios');
async function test() {
  try {
    const ts = Date.now();
    const reg = await axios.post("https://my-server.serveminecraft.net/customer/sign-up", {
      username: `testuser${ts}`,
      password: "Password123#",
      fullName: "Test User",
      contactInfo: { email: `test${ts}@gmail.com`, phone: "0999888777" }
    });
    const token = reg.data.token;
    
    const sched = await axios.get("https://my-server.serveminecraft.net/customer/trip-schedule?from=&to=&date=&limit=10&orderBy=asc", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(JSON.stringify(sched.data, null, 2));
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}
test();
