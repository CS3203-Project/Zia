import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Home, Check, Eye, EyeOff, Loader, ArrowRight, Compass, Zap, Award, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { userApi, type RegisterUserData } from '../../api/userApi';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  address: string;
}

const initialFormData: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phone: '',
  location: '',
  address: '',
};

const sriLankanCities = [
  'Colombo, Western',
  'Kandy, Central',
  'Galle, Southern',
  'Jaffna, Northern',
  'Negombo, Western',
  'Anuradhapura, North Central',
  'Batticaloa, Eastern',
  'Matara, Southern',
  'Kurunegala, North Western',
  'Ratnapura, Sabaragamuwa',
  'Badulla, Uva',
  'Trincomalee, Eastern',
  'Nuwara Eliya, Central',
  'Kalutara, Western',
  'Polonnaruwa, North Central',
];

export default function SignupForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Debounced email existence check
  useEffect(() => {
    const checkEmail = async () => {
      if (formData.email && /\S+@\S+\.\S+/.test(formData.email)) {
        setEmailCheckLoading(true);
        setEmailExists(null);
        try {
          const result = await userApi.checkEmailExists(formData.email);
          setEmailExists(result.exists);
          if (result.exists) {
            setErrors((prev) => ({
              ...prev,
              email: 'This email is already registered. Please use a different email or try logging in.',
            }));
          } else {
            setErrors((prev) => {
              const ne = { ...prev };
              if (ne.email) delete ne.email;
              return ne;
            });
          }
        } catch {
          // silent for probe errors
        } finally {
          setEmailCheckLoading(false);
        }
      } else {
        setEmailExists(null);
      }
    };
    const t = setTimeout(checkEmail, 800);
    return () => clearTimeout(t);
  }, [formData.email]);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const ne: Record<string, string> = {};

    if (!formData.email) ne.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) ne.email = 'Email is invalid';
    if (emailExists === true) ne.email = 'Email is already registered';

    if (!formData.password) ne.password = 'Password is required';
    else if (formData.password.length < 8) ne.password = 'Password must be at least 8 characters';

    if (!formData.confirmPassword) ne.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) ne.confirmPassword = 'Passwords do not match';

    if (!formData.firstName) ne.firstName = 'First name is required';
    if (!formData.lastName) ne.lastName = 'Last name is required';

    if (!formData.phone) ne.phone = 'Phone number is required';
    else {
      const clean = formData.phone.replace(/\D/g, '');
      if (!/^94\d{9}$/.test(clean)) {
        ne.phone = 'Phone must start with 94 and be exactly 11 digits (e.g., 94712345678)';
      }
    }

    if (!formData.location) ne.location = 'Location is required';

    setErrors(ne);
    return Object.keys(ne).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const payload: RegisterUserData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        location: formData.location,
        phone: formData.phone.replace(/\D/g, ''),
        address: formData.address || undefined,
      };
      await userApi.register(payload);
      toast.success('Account created successfully!');
      setTimeout(() => {
        window.location.href = '/signin';
      }, 1000);
    } catch (e: any) {
      toast.error(e?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (hasError?: boolean) =>
    `w-full pl-12 pr-4 py-3.5 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
      hasError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
    }`;

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

      <div className="relative z-10 h-screen flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-center">

          {/* Left Side - Feature panel */}
          <div className="hidden lg:flex lg:col-span-2 flex-col justify-center overflow-hidden bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-8 text-white shadow-xl shadow-orange-500/20 h-full max-h-[640px]">
            <div className="relative z-10">
              <h1 className="text-2xl xl:text-3xl font-bold leading-tight mb-3">
                Join Zia and get
                <br />
                started today.
              </h1>
              <p className="text-orange-50 mb-8 leading-relaxed text-sm">
                Create your account to book trusted professionals or start offering your own services.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Compass className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm text-white">Browse every service, no account needed to look around</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm text-white">Instant booking confirmations sent straight to your inbox</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm text-white">Earn trust and reviews with every completed booking</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm text-white">Secure checkout on every transaction</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="lg:col-span-3 flex flex-col justify-center h-full max-h-[640px]">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col h-full overflow-y-auto">
              {/* Logo + heading */}
              <div className="flex items-center justify-between gap-2.5 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-500/30 flex-shrink-0">
                    <img src="/logo_svg_only_light.svg" alt="Logo" className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Create Account</h2>
                    <p className="text-xs text-gray-500">Join our community today</p>
                  </div>
                </div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-orange-600 transition-colors flex-shrink-0"
                >
                  Continue without logging in
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => updateFormData('firstName', e.target.value)}
                        className={inputClass(!!errors.firstName)}
                        placeholder="John"
                      />
                    </div>
                    {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                        errors.lastName ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Doe"
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className={inputClass(!!errors.email)}
                      placeholder="name@email.com"
                    />
                    <div className="absolute right-3.5 top-3 h-4 w-4 flex items-center justify-center">
                      {emailCheckLoading ? (
                        <Loader className="h-3.5 w-3.5 animate-spin text-gray-400" />
                      ) : emailExists === false ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : null}
                    </div>
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        className={`w-full pl-10 pr-9 py-2.5 bg-gray-50 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                          errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="8+ characters"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                        className={`w-full pl-10 pr-9 py-2.5 bg-gray-50 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                          errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3.5 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Phone + Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length > 0 && !value.startsWith('94')) value = '94' + value;
                          if (value.length > 11) value = value.slice(0, 11);
                          if (value.length > 2) value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
                          updateFormData('phone', value);
                        }}
                        className={inputClass(!!errors.phone)}
                        placeholder="94 712 345 678"
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 z-10" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => {
                          updateFormData('location', e.target.value);
                          setShowLocationSuggestions(e.target.value.length > 0);
                        }}
                        onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 180)}
                        onFocus={() => setShowLocationSuggestions(!!formData.location)}
                        className={inputClass(!!errors.location)}
                        placeholder="Colombo, Western"
                      />
                      {showLocationSuggestions && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                          {sriLankanCities
                            .filter((c) => c.toLowerCase().includes(formData.location.toLowerCase()))
                            .slice(0, 5)
                            .map((city, i) => (
                              <button
                                key={i}
                                type="button"
                                className="w-full text-left px-3.5 py-2 hover:bg-orange-50 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl text-gray-900 text-xs"
                                onClick={() => {
                                  updateFormData('location', city);
                                  setShowLocationSuggestions(false);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span>{city}</span>
                                </div>
                              </button>
                            ))}
                          {sriLankanCities.filter((c) => c.toLowerCase().includes(formData.location.toLowerCase())).length === 0 &&
                            formData.location.length > 0 && (
                              <div className="px-3.5 py-2 text-gray-400 text-xs">No matching locations found</div>
                            )}
                        </div>
                      )}
                    </div>
                    {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <Home className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      placeholder="Street address"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-orange-600 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Already have an account?{' '}
                    <a href="/signin" className="text-orange-600 font-semibold hover:underline transition-colors">
                      Sign in
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
