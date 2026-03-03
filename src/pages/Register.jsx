import { useState } from "react";
import { customerSignUp } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      username: form.username,
      fullName: form.fullName,
      contactInfo: {
        email: form.email,
        phone: form.phone
      },
      password: form.password
    };

    try {
      const res = await customerSignUp(payload);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white w-[430px] rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold mb-1">Sign Up</h2>
        <p className="text-gray-500 mb-4">It’s quick and easy.</p>

        <hr className="mb-4" />

        {error && (
          <div className="bg-red-100 text-red-600 text-sm p-2 rounded mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="fullName"
            placeholder="Full name"
            className="w-full px-4 py-3 border rounded-md"
            onChange={handleChange}
          />

          <input
            name="username"
            placeholder="Username"
            className="w-full px-4 py-3 border rounded-md"
            onChange={handleChange}
          />

          <input
            name="email"
            placeholder="Email"
            className="w-full px-4 py-3 border rounded-md"
            onChange={handleChange}
          />

          <input
            name="phone"
            placeholder="Phone number"
            className="w-full px-4 py-3 border rounded-md"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="New password"
            className="w-full px-4 py-3 border rounded-md"
            onChange={handleChange}
          />

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded-md font-semibold hover:bg-green-600"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
