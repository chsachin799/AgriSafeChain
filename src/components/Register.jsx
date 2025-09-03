import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'trainer',
  });
  const navigate = useNavigate();

  const { email, password, role } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/auth/register', formData);
      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      alert('Registration failed. Please try again.');
      console.error(err.response.data);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left side: branding/welcome section */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-teal-500 to-emerald-600 dark:from-gray-900 dark:to-gray-800 text-white transition-colors duration-500">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold mb-4">Join AgriSafeChain</h1>
          <p className="text-lg">Register your account to begin managing agricultural funds and contribute to a more secure system.</p>
        </div>
      </div>

      {/* Right side: registration form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-800 transition-colors duration-500">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-bold mb-6 text-center text-teal-800 dark:text-emerald-300">Register New Account</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                name="email"
                value={email}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                type="password"
                placeholder="********"
                name="password"
                value={password}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                name="role"
                value={role}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:border-gray-600"
              >
                <option value="trainer">Trainer</option>
                <option value="government">Government</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 transition-colors duration-300 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              Register
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account? <Link to="/login" className="text-teal-600 dark:text-emerald-400 hover:underline font-medium">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
