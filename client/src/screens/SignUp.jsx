import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Brain, Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import Nav from "../components/Nav";
import { axiosInstance } from "../utils/axiosInstance.js";
import { removeToken, setToken, getToken } from "../utils/sessionStorage.js";
import { notify } from "../utils/notify.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

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

    // Password strength calculation
    if (name === "password") {
      let strength = 0;
      if (value.length >= 8) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[a-z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^A-Za-z0-9]/.test(value)) strength++;
      setPasswordStrength(strength);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    //handling form submission
    axiosInstance
      .post("/auth/signup", {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
      })
      .then(({ data }) => {
        if (data.success) {
          setEmailSent(true);
          notify(data.message || "Verification email sent!", "success");
        } else {
          notify(data.message || "Signup failed!", "error");
          removeToken();
        }
      })
      .catch((error) => {
        console.error("Signup error:", error);

        // Agar backend ka error message ho to dikha do
        const errorMsg =
          error.response?.data?.error || " Something went wrong!";
        notify(errorMsg, "error");
      });
  };

  const getStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-gray-300";
    if (passwordStrength <= 3) return "bg-gray-600";
    return "bg-black";
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
            <div>
              <h2 className="text-3xl font-bold">
                {emailSent ? "Check your email" : "Create your account"}
              </h2>
              {emailSent ? (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    Verification email sent!
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    We've sent a verification link to{" "}
                    <span className="font-semibold">{formData.email}</span>.
                    Please check your inbox and click the link to verify your
                    email.
                  </p>
                  <button
                    onClick={() => navigate("/login")}
                    className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Go to Login
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-gray-600">
                  Already have an account?{" "}
                  <a href="#login" className="font-semibold hover:underline">
                    Sign in here
                  </a>
                </p>
              )}
            </div>

            {/* Form */}
            {!emailSent && (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-semibold mb-2"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-semibold mb-2"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 pr-10 border-2 border-black focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex space-x-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 ${
                            i < passwordStrength
                              ? getStrengthColor()
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      Password strength: {getStrengthText()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 pr-10 border-2 border-black focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">
                      Passwords do not match
                    </p>
                  )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 border-2 border-black focus:ring-2 focus:ring-gray-400"
                    required
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeToTerms" className="text-gray-700">
                    I agree to the{" "}
                    <a href="#" className="font-semibold hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="font-semibold hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={
                    !formData.agreeToTerms ||
                    formData.password !== formData.confirmPassword
                  }
                  className="w-full bg-black text-white py-3 px-4 font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
            )}

            {/* Social Login Options */}
            {/* <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="w-full border-2 border-black py-2 px-4 font-semibold hover:bg-black hover:text-white transition-colors">
                  Google
                </button>
                <button className="w-full border-2 border-black py-2 px-4 font-semibold hover:bg-black hover:text-white transition-colors">
                  GitHub
                </button>
              </div>
            </div> */}
          </div>
        </div>

        {/* Right Side - Benefits */}
        <div className="hidden lg:flex flex-1 bg-black text-white items-center justify-center px-12">
          <div className="max-w-md">
            <h3 className="text-2xl font-bold mb-8">
              Join NotebookAI and unlock:
            </h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">AI-Powered Analysis</h4>
                  <p className="text-gray-600 text-sm">
                    Get instant insights from your documents with advanced AI
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">Unlimited Documents</h4>
                  <p className="text-gray-600 text-sm">
                    Upload and analyze as many documents as you need
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">Team Collaboration</h4>
                  <p className="text-gray-600 text-sm">
                    Share notebooks and insights with your team
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">24/7 Support</h4>
                  <p className="text-gray-600 text-sm">
                    Get help whenever you need it from our support team
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 border-2 border-black bg-white">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">100% Free</span> • No credit card
                required • Open source
              </p>
              <p className="text-xs text-gray-500 mt-2">
                <a
                  href="https://github.com/raghavdwd/notebook-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-black"
                >
                  github.com/raghavdwd/notebook-ai
                </a>
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
