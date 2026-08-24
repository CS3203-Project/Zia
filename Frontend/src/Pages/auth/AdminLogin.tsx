import React, { useState } from 'react';
import { Shield, Lock, User, Loader, ArrowRight } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { useNavigate } from 'react-router-dom';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await adminApi.login({
        username,
        password
      });

      if (response.success) {
        // Login successful - redirect to admin dashboard
        console.log('Login successful:', response.data);

        // Navigate to admin dashboard
        navigate('/admin');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white relative">
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-500/30">
              <img src="/logo_svg_only_light.svg" alt="Logo" className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-gray-900">Zia</span>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                <Shield className="h-7 w-7 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Portal</h2>
              <p className="text-gray-500">Secure access to administrative functions</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    className={`w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 disabled:opacity-60 ${
                      error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className={`w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 disabled:opacity-60 ${
                      error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center px-6 py-4 bg-orange-500 text-white rounded-xl font-semibold transition-all duration-300 hover:bg-orange-600 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-5 w-5 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Access Admin Panel
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
