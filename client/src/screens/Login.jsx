import React, { useState, useEffect } from "react";
import { Brain, Eye, EyeOff, ArrowLeft, Check, Lock, Mail } from "lucide-react";
import Nav from "../components/Nav";
import { useNavigate, Link } from "react-router-dom";
import { axiosInstance } from "../utils/axiosInstance";
import { notify } from "../utils/notify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { setToken, getToken } from "../utils/sessionStorage";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("USER_SESS_TOKEN");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/auth/login", formData);
      if (response.data.success) {
        setIsLoading(false);
        const token = response.data.data?.accessToken;
        setToken(token);
        notify("✅ Login successful!", "success");
        navigate("/dashboard");
      } else {
        setIsLoading(false);
        notify(response.data.error || "Login failed!", "error");
        removeToken();
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Login error:", error);
      const errorMsg =
        error.response?.data?.error || " Something went wrong!";
      notify(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <Nav />
      {/* Main Content */}
      <div className="flex min-h-screen">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-md w-full space-y-8">
            {/* Back Link */}
            <div>
              <Link
                to="/"
                className="flex items-center text-gray-600 hover:text-black transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to home
              </Link>
            </div>

            {/* Header */}
            <div className="text-center">
              <Lock className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-3xl font-bold">Welcome back</h2>
              <p className="mt-2 text-gray-600">
                Don't have an account?{" "}
                <a href="#register" className="font-semibold hover:underline">
                  Sign up for free
                </a>
              </p>
            </div>
            {/* {Alert} */}
            <div className="mt-3 ">
              Please use the following test credentials to log in:
              <div className="mt-2 mb-1 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-sm text-yellow-700">
                <p>Email: <code>dwivediji425@gmail.com</code></p>
                <p>Password: <code>123456</code></p>
              </div>
              <div className="mt-2 mb-1 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-sm text-yellow-900">
                <p>PS: We dont have subcription of email service yet, so we are not able to send email to users. We will implement it in future, but for now you can use above credentials to login and test the app.</p>
              </div>
            </div>

            {/* Form */}
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 border-2 border-black focus:ring-2 focus:ring-gray-400"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>
                <a
                  href="#forgot-password"
                  className="text-sm font-semibold hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white py-3 px-4 font-semibold hover:bg-gray-800 disabled:bg-gray-600 transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>

            {/* Security Note */}
            <div className="mt-8 p-4 border border-gray-300 bg-gray-50">
              <p className="text-xs text-gray-600 text-center">
                🔒 Your data is encrypted and secure. We never store your
                personal information.
              </p>
              <p className="text-xs text-gray-600 text-center mt-2">
                ✨ 100% Free &amp; Open Source •{" "}
                <a
                  href="https://github.com/raghavdwd/notebook-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-black"
                >
                  raghavdwd/notebook-ai
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Welcome Back Message */}
        <div className="hidden lg:flex flex-1 bg-black text-white items-center justify-center px-12">
          <div className="max-w-md text-center">
            <h3 className="text-3xl font-bold mb-6">
              Welcome back to the future of research
            </h3>
            <p className="text-lg text-gray-300 mb-8">
              Continue where you left off and unlock new insights from your
              documents with AI-powered analysis.
            </p>

            <div className="space-y-4 text-left">
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-white" />
                <span>Access all your saved notebooks</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-white" />
                <span>Continue previous conversations</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-white" />
                <span>Sync across all your devices</span>
              </div>
            </div>

            <div className="mt-8 border border-gray-600 p-4">
              <p className="text-sm text-gray-400">
                "NotebookAI has transformed how I conduct research. It's like
                having a brilliant research assistant available 24/7."
              </p>
              <p className="text-xs text-gray-500 mt-2">
                — Dr. Sarah Chen, Research Scientist
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-black py-8 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6" />
              <span className="text-lg font-bold">NotebookAI</span>
            </div>

            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-black">
                Terms of Service
              </a>
              <a href="#" className="hover:text-black">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-black">
                Help Center
              </a>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6 text-center text-gray-600 text-sm">
            <p>&copy; 2025 NotebookAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <ToastContainer />
    </div>
  );
}
