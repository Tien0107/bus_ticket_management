const axios = require('axios');

async function test() {
   try {
      const ts = Date.now().toString().slice(-4);
      const username = `hotro_nhaxe_${ts}`;
      console.log('Sending request to register:', username);
      
      const payload = {
         username: username,
         fullName: "Hỗ Trợ Viên",
         password: "Password@123",
         companyId: 1,
         contactInfo: {
            email: `support${ts}@gmail.com`,
            phone: `0988000${ts}`
         }
      };
      
      const res = await axios.post('https://my-server.serveminecraft.net/company-admin-support/sign-up', payload);
      
      console.log('=============================');
      console.log('✅ ĐÃ ĐĂNG KÝ THÀNH CÔNG');
      console.log('Tài khoản:', username);
      console.log('Mật khẩu: Password@123');
      console.log('Email:', payload.contactInfo.email);
      console.log('Response msg:', res.data?.message || 'Success');
      console.log('=============================');
   } catch (err) {
      console.error('❌ LỖI:', err.response?.data || err.message);
   }
}
test();
