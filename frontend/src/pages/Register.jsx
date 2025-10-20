import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 6;
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return {
      isValid: hasMinLength && (hasSpecialChar || hasUpperCase || hasNumber),
      hasMinLength,
      hasSpecialChar,
      hasUpperCase,
      hasLowerCase,
      hasNumber
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError('Password must be at least 6 characters and contain at least one special character, uppercase letter, or number');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/auth/register', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password
      });

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">SnapCheck</h1>
          <p className="text-xs text-gray-500">Create a new account</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-5 space-y-3">
          {error && (
            <div className="flex items-center gap-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-600" size={18} />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="text-green-600" size={18} />
              <p className="text-green-700 text-xs">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-1.5 pr-9 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                <p className="font-semibold text-blue-900 mb-1">Password Requirements:</p>
                <ul className="space-y-0.5">
                  <li className={`flex items-center gap-1 ${validatePassword(formData.password).hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{validatePassword(formData.password).hasMinLength ? '✓' : '○'}</span> At least 6 characters
                  </li>
                  <li className={`flex items-center gap-1 ${validatePassword(formData.password).hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{validatePassword(formData.password).hasUpperCase ? '✓' : '○'}</span> Uppercase letter (A-Z)
                  </li>
                  <li className={`flex items-center gap-1 ${validatePassword(formData.password).hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{validatePassword(formData.password).hasLowerCase ? '✓' : '○'}</span> Lowercase letter (a-z)
                  </li>
                  <li className={`flex items-center gap-1 ${validatePassword(formData.password).hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{validatePassword(formData.password).hasNumber ? '✓' : '○'}</span> Number (0-9)
                  </li>
                  <li className={`flex items-center gap-1 ${validatePassword(formData.password).hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{validatePassword(formData.password).hasSpecialChar ? '✓' : '○'}</span> Special character (!@#$%^&*...)
                  </li>
                </ul>
                <p className="text-blue-700 font-semibold mt-1">
                  {validatePassword(formData.password).isValid ? '✓ Password is valid' : 'Password needs improvement'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-1.5 pr-9 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold text-sm py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Sign Up'}
          </button>

          <p className="text-center text-gray-600 text-xs">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
