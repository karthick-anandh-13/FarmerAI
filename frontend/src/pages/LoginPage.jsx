import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");        // main role
  const [farmerType, setFarmerType] = useState(""); // sub-role if farmer

  function handleLogin(e) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !role) {
      return alert("Please fill all fields");
    }

    const userData = { name, email, role };

    if (role === "farmer") {
      if (!farmerType) return alert("Please select farmer type");
      userData.farmerType = farmerType;
    }

    signIn(userData);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-faGrayLight to-faGreen-50 p-6">
      <div className="w-full max-w-lg glass-card p-8 center-card">
        <h1 className="text-2xl font-bold text-faGreen-700 mb-4">Sign in to FarmerAI</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-600">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-faGreen-500"
              placeholder="e.g., Ravi Kumar"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-600">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-faGreen-500"
              placeholder="you@example.com"
            />
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-sm text-gray-600">Role</label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setFarmerType(""); // reset farmer type when role changes
              }}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-faGreen-500"
            >
              <option value="">Select your role</option>
              <option value="farmer">👨‍🌾 Farmer</option>
              <option value="Student">📚 Learner</option>
              <option value="Agri enthusiast">🌱 AgriPro</option>
              <option value="Agricultural department Government staff">🏛️ GovAgri</option>
            </select>
          </div>

          {/* Farmer type (only if farmer is chosen) */}
          {role === "farmer" && (
            <div>
              <label className="block text-sm text-gray-600">Farmer Type</label>
              <select
                value={farmerType}
                onChange={(e) => setFarmerType(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-faGreen-500"
              >
                <option value="">Select type</option>
                <option value="small">Small-scale</option>
                <option value="medium">Medium-scale</option>
                <option value="large">Large-scale</option>
                <option value="marginal">Marginal</option>
              </select>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-faGreen-500 text-white rounded-lg shadow hover:bg-faGreen-700"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
