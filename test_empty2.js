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
    
    const sched = await axios.get("https://my-server.serveminecraft.net/customer/trip-schedule?from=&to=&date=&limit=10&orderBy=asc", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Empty Strings Test:");
    console.log(JSON.stringify(sched.data, null, 2));
  } catch (err) {
    if(err.response) {
      console.log(err.response?.data);
    } else {
      console.error(err.message);
    }
  }
}
test();
