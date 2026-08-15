import { useState } from 'react';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, Lock, Loader, Eye, EyeOff, ArrowRight, Shield, Star } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await userApi.login({ email, password });
      if (result && result.token) {
        toast.success('Signed in successfully!');
        localStorage.setItem('token', result.token);

        // Get user profile and update AuthContext
        try {
          const userData = await userApi.getProfile();
          login(userData); // Update AuthContext with user data
        } catch (profileError) {
          console.error('Failed to fetch user profile after login:', profileError);
        }

        setTimeout(() => {
          window.location.href = localStorage.getItem('RedirectAfterLogin') || '/';
        }, 1200);
      } else {
        setError(result?.message || 'Sign in failed');
        toast.error(result?.message || 'Sign in failed');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white relative">
      <Toaster
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Left Side - Welcome Content */}
          <div className="hidden lg:flex flex-col justify-center items-center text-center p-8">
            <div className="relative">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-8">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                Secure Platform
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Welcome Back to
                <span className="block bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Zia
                </span>
              </h1>

              <p className="text-xl text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
                Continue your journey with trusted professionals and exceptional services
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                <div className="flex items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="p-2 bg-orange-100 rounded-lg mr-4">
                    <Shield className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-gray-900 font-medium">Secure & Trusted</p>
                    <p className="text-gray-500 text-sm">Verified professionals</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="p-2 bg-orange-100 rounded-lg mr-4">
                    <Star className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-gray-900 font-medium">Quality Services</p>
                    <p className="text-gray-500 text-sm">Rated by community</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign In Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                {/* Logo */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 mb-4 shadow-lg shadow-orange-500/30">
                    <img src="/logo_svg_only_light.svg" alt="Logo" className="h-9 w-9" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
                  <p className="text-gray-500">Welcome back! Please enter your details</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                          error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="name@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-12 pr-12 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                          error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-4 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <label className="inline-flex items-center gap-2 text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                        />
                        Remember me
                      </label>
                      <a href="/forgot" className="text-orange-600 font-medium hover:underline transition-colors">
                        Forgot Password?
                      </a>
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
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-gray-500">
                      Don't have an account?{' '}
                      <a href="/signup" className="text-orange-600 font-semibold hover:underline transition-colors">
                        Sign up
                      </a>
                    </p>
                  </div>

                  <p className="text-xs text-gray-400 text-center leading-relaxed">
                    By signing in, you agree to our{' '}
                    <a className="underline hover:text-gray-600 transition-colors" href="/terms">Terms of Service</a> and{' '}
                    <a className="underline hover:text-gray-600 transition-colors" href="/privacy">Privacy Policy</a>.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
