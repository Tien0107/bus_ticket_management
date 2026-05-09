/**
 * Company Admin API Test Script
 * Dán vào Browser Console (F12) để test
 */

const API_BASE = "https://my-server.serveminecraft.net";
const token = localStorage.getItem("token");

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
};

console.log("🧪 API Test Script Loaded");
console.log("Token:", token ? "✅ Found" : "❌ Missing");

// ============ HELPER FUNCTIONS ============

const test = async (name, method, endpoint, body = null) => {
  const url = `${API_BASE}${endpoint}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    console.log(`\n📝 Testing: ${name}`);
    console.log(`   ${method} ${endpoint}`);
    if (body) console.log(`   Body:`, body);

    const res = await fetch(url, options);
    const data = await res.json();

    if (res.ok) {
      console.log(`   ✅ ${res.status} OK`);
      console.log(`   Response:`, data);
    } else {
      console.error(`   ❌ ${res.status} Error`);
      console.error(`   Error:`, data);
    }
    return data;
  } catch (err) {
    console.error(`   ❌ Exception:`, err.message);
    return null;
  }
};

// ============ TESTS ============

const runTests = async () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Starting Company Admin API Tests");
  console.log("=".repeat(60));

  // 1. GET /company-admin/company
  await test("Get Company Info", "GET", "/company-admin/company");

  // 2. GET /company-admin/vehicle
  await test("Get Vehicles", "GET", "/company-admin/vehicle?limit=10");

  // 3. POST /company-admin/vehicle
  await test("Create Vehicle", "POST", "/company-admin/vehicle", {
    plateNumber: "29A-12345",
    type: "seat",
    companyId: 1,
    totalSeats: 24,
    status: "active"
  });

  // 4. GET /company-admin/driver
  await test("Get Drivers", "GET", "/company-admin/driver?limit=10");

  // 5. GET /company-admin/staff
  await test("Get Staff", "GET", "/company-admin/staff?limit=10");

  // 6. GET /company-admin/profile
  await test("Get User Profile", "GET", "/company-admin/profile");

  // 7. PUT /company-admin/profile
  await test("Update User Profile", "PUT", "/company-admin/profile", {
    fullName: "Cập nhật tên",
    status: "active",
    position: "Director",
    department: "Management"
  });

  // 8. PUT /company-admin/company
  await test("Update Company Info", "PUT", "/company-admin/company", {
    name: "ABC Bus Company",
    hotline: "0388985684"
  });

  // 9. POST /company-admin/seat
  await test("Create Seats for Vehicle", "POST", "/company-admin/seat", {
    vehicleId: 1,
    seatCount: "24"
  });

  // 10. DELETE /company-admin/vehicle/{id}/seat
  await test("Delete Vehicle Seats", "DELETE", "/company-admin/vehicle/1/seat");

  console.log("\n" + "=".repeat(60));
  console.log("✅ Test Suite Complete");
  console.log("=".repeat(60));
};

// ============ RUN ============
// runTests();

// Or run individual tests:
console.log("\n💡 Usage:");
console.log("  runTests()                    - Run all tests");
console.log("  test('Name', 'GET', '/endpoint')  - Run single test");
