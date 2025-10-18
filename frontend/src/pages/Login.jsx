import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, AlertCircle, CheckCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('/auth/login', {
        email,
        password,
        first_name: '-',
        last_name: '-'
      });

      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('role', res.data.role);
      setSuccess('Успешный вход! Перенаправление...');
      
      // Редирект в зависимости от роли
      const redirectPath = res.data.role === 'admin' ? '/admin' : '/slides';
      setTimeout(() => {
        navigate(redirectPath);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при входе. Проверьте учетные данные.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full shadow-lg mb-4">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SlideConfirm</h1>
          <p className="text-gray-500">Корпоративная система подтверждения ознакомления</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email адрес
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="user@gss.aero"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Вход в систему...' : 'Войти'}
          </button>

          {/* Register Link */}
          <p className="text-center text-gray-600 text-sm">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Зарегистрироваться
            </Link>
          </p>
        </form>

        {/* Test Credentials */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-semibold text-blue-900 mb-2">Тестовые учетные данные:</p>
          <p className="text-xs text-blue-800">👤 user@gss.aero / 123456</p>
          <p className="text-xs text-blue-800">👨‍💼 admin@gss.aero / 123456</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
