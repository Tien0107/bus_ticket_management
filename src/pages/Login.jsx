import { useState } from "react";
import { signIn } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await signIn({
        email: loginValue,
        password: password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col md:flex-row items-center gap-12">
        
        {/* LEFT */}
        <div className="max-w-md">
          <h1 className="text-blue-600 text-5xl font-bold mb-4">FC4</h1>
          <p className="text-2xl text-gray-800">
            Specializing in buying, selling, and booking bus tickets.
          </p>
        </div>

        {/* RIGHT */}
        <div className="bg-white w-[380px] rounded-lg shadow-lg p-6">
          {error && (
            <div className="bg-red-100 text-red-600 text-sm p-2 rounded mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className="w-full px-4 py-3 border rounded-md focus:outline-none focus:border-blue-500"
              placeholder="Email or phone number"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
            />

            <input
              type="password"
              className="w-full px-4 py-3 border rounded-md focus:outline-none focus:border-blue-500"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-blue-700"
            >
              Log In
            </button>
          </form>

          <div className="text-center mt-4">
            <a href="#" className="text-blue-600 text-sm hover:underline">
              Forgot password?
            </a>
          </div>

          <hr className="my-4" />

          <div className="flex justify-center">
            <Link
              to="/register"
              className="bg-green-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-600"
            >
              Create new account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
