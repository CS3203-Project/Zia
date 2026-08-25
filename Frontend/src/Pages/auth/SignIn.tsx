import { useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { Mail, Lock, Loader, Eye, EyeOff, ArrowRight, Compass, Zap, Award, ShieldCheck } from 'lucide-react';

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

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-center">

          {/* Left Side - Feature panel */}
          <div className="hidden lg:flex lg:col-span-2 flex-col justify-center bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-10 text-white shadow-xl shadow-orange-500/20">
            <h1 className="text-3xl font-bold leading-tight mb-4">
              Connect with trusted
              <br />
              service providers.
            </h1>
            <p className="text-orange-50 mb-10 leading-relaxed">
              Browse verified professionals, book with confidence, and manage every job in one place.
            </p>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Compass className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm text-white">Browse every service, no account needed to look around</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm text-white">Instant booking confirmations sent straight to your inbox</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm text-white">Earn trust and reviews with every completed booking</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm text-white">Secure checkout on every transaction</p>
              </div>
            </div>
          </div>

          {/* Right Side - Sign In Form */}
          <div className="lg:col-span-3 flex flex-col justify-center max-w-md mx-auto w-full">
            {/* Logo */}
            <div className="flex items-center justify-between gap-2.5 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-500/30">
                  <img src="/logo_svg_only_light.svg" alt="Logo" className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold text-gray-900">Zia</span>
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors"
              >
                Continue without logging in
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-500">Sign in to access your account</p>
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
  );
}
