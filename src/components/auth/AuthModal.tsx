import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { BrandLogo } from '../common/BrandLogo.tsx';
import { Avatar } from '../common/Avatar.tsx';
import { CountryCodeSelector } from '../common/CountryCodeSelector.tsx';
import {
  DEFAULT_COUNTRY,
  Country,
  validatePhoneNumber,
  cleanPhoneNumberDigits,
  formatPhoneNumberDisplay,
} from '../../data/countries.ts';
import {
  ShieldCheck,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  X,
  UserPlus,
  LogIn,
  Check,
  AlertCircle,
  User as UserIcon,
  AtSign,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { allUsers, currentUser, switchUser, sendOtp, loginWithPhone, loginWithEmail } = useAuth();
  const [tab, setTab] = useState<'personas' | 'phone' | 'email'>('personas');

  // Phone Authentication: Mode (Login vs Register)
  const [phoneMode, setPhoneMode] = useState<'login' | 'register'>('login');
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  // Email flow
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisteringEmail, setIsRegisteringEmail] = useState(false);

  // Status
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Live real-time phone validation and auto-combination
  const phoneValidation = useMemo(() => {
    return validatePhoneNumber(phoneNumber, selectedCountry);
  }, [phoneNumber, selectedCountry]);

  if (!isOpen) return null;

  // Handle phone input changes with auto-formatting
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigits = cleanPhoneNumberDigits(rawVal, selectedCountry);
    const formatted = formatPhoneNumberDisplay(cleanDigits, selectedCountry);
    setPhoneNumber(formatted);
    if (error) setError('');
  };

  const handleCountryChange = (newCountry: Country) => {
    setSelectedCountry(newCountry);
    // Re-format current digits for the newly selected country
    if (phoneNumber) {
      const cleanDigits = cleanPhoneNumberDigits(phoneNumber, newCountry);
      setPhoneNumber(formatPhoneNumberDisplay(cleanDigits, newCountry));
    }
    if (error) setError('');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // If registering, validate required full name
    if (phoneMode === 'register' && !fullName.trim()) {
      setError('Please enter your full name to register.');
      return;
    }

    // Validate phone number format against selected country rules
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = phoneValidation.fullE164;
      const res = await sendOtp(fullPhone);
      setOtpStep(true);
      setOtpValue(res?.code || '849201');
    } catch {
      setError('Could not dispatch SMS OTP. Using test code 849201.');
      setOtpStep(true);
      setOtpValue('849201');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpValue || otpValue.length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = phoneValidation.fullE164;
      await loginWithPhone(
        fullPhone,
        otpValue,
        fullName.trim() || undefined,
        username.trim() || undefined
      );
      setLoading(false);
      if (onClose) onClose();
    } catch {
      setError('Failed to verify OTP. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please provide email and password');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email, password, fullName || undefined);
      setLoading(false);
      if (onClose) onClose();
    } catch {
      setError('Authentication failed. Check credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors z-10"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Header */}
        <div className="border-b border-slate-800/80 bg-slate-950/70 p-6 text-center">
          <div className="flex justify-center mb-2">
            <BrandLogo size="lg" showText={false} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Connectra</h2>
          <p className="mt-1 text-xs text-slate-400">
            Secure Real-Time Messaging & Crystal-Clear Calling
          </p>

          {/* Navigation Tabs */}
          <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-slate-800/80 p-1 text-xs font-medium">
            <button
              onClick={() => {
                setTab('personas');
                setError('');
              }}
              className={`rounded-lg py-1.5 transition-colors ${
                tab === 'personas'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Demo Switcher
            </button>
            <button
              onClick={() => {
                setTab('phone');
                setError('');
              }}
              className={`rounded-lg py-1.5 transition-colors ${
                tab === 'phone'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Phone & OTP
            </button>
            <button
              onClick={() => {
                setTab('email');
                setError('');
              }}
              className={`rounded-lg py-1.5 transition-colors ${
                tab === 'email'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Email Login
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: Instant Persona Switcher */}
          {tab === 'personas' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 mb-1">
                Select an active persona to test real-time chat, calls, and group sync across devices:
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {allUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        if (onClose) onClose();
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        isCurrent
                          ? 'border-cyan-500/40 bg-cyan-950/20 ring-1 ring-cyan-500/20'
                          : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar} name={u.name} status={u.status} showStatus size="md" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm text-slate-100">{u.name}</span>
                            {u.role === 'admin' && (
                              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 border border-cyan-800/50 rounded px-1">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            @{u.username} · {u.phoneNumber}
                          </span>
                        </div>
                      </div>
                      {isCurrent ? (
                        <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-slate-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Phone Authentication (Sign In & Registration with International Selector) */}
          {tab === 'phone' && (
            <div>
              {!otpStep ? (
                <div>
                  {/* Sub-mode Switcher: Sign In vs Register */}
                  <div className="flex items-center justify-center p-1 mb-5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneMode('login');
                        setError('');
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        phoneMode === 'login'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Sign In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneMode('register');
                        setError('');
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        phoneMode === 'register'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Register</span>
                    </button>
                  </div>

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    {/* Registration Fields (Full Name & Optional Username) */}
                    {phoneMode === 'register' && (
                      <div className="space-y-3 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Full Name <span className="text-cyan-400">*</span>
                          </label>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                              type="text"
                              placeholder="e.g. Tariq Mahmood"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Unique Username <span className="text-slate-500">(Optional)</span>
                          </label>
                          <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                              type="text"
                              placeholder="username"
                              value={username}
                              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Country Selector & Phone Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">
                          Phone Number <span className="text-cyan-400">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {selectedCountry.flag} {selectedCountry.name} ({selectedCountry.dialCode})
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {/* Searchable International Country Code Selector */}
                        <CountryCodeSelector
                          selectedCountry={selectedCountry}
                          onSelectCountry={handleCountryChange}
                          disabled={loading}
                        />

                        {/* Phone Number Input with Country Specific Formatting */}
                        <div className="relative flex-1">
                          <input
                            type="tel"
                            placeholder={selectedCountry.placeholder}
                            value={phoneNumber}
                            onChange={handlePhoneInputChange}
                            className={`w-full rounded-xl border bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none font-mono tracking-wide ${
                              phoneNumber && phoneValidation.isValid
                                ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                                : phoneNumber && !phoneValidation.isValid
                                ? 'border-amber-500/70 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                                : 'border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                            }`}
                            required
                          />
                          {phoneNumber && phoneValidation.isValid && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live Formatting & Validation Status Chip */}
                      <div className="mt-1.5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          Format: <span className="text-slate-300 font-mono">{selectedCountry.placeholder}</span>
                        </span>

                        {phoneNumber ? (
                          phoneValidation.isValid ? (
                            <span className="font-medium text-emerald-400 flex items-center gap-1 font-mono">
                              <Check className="h-3 w-3" /> Valid ({phoneValidation.cleanDigits.length} digits)
                            </span>
                          ) : (
                            <span className="font-medium text-amber-400 font-mono">
                              {phoneValidation.cleanDigits.length}/{selectedCountry.minLength} digits
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500 font-mono">
                            {selectedCountry.minLength} digits expected
                          </span>
                        )}
                      </div>

                      {/* Combined E.164 Preview */}
                      {phoneNumber && (
                        <div className="mt-2 rounded-lg bg-slate-950 border border-slate-800 p-2 text-[11px] text-slate-300 flex items-center justify-between">
                          <span className="text-slate-500">Combined Number:</span>
                          <span className="font-mono font-semibold text-cyan-300">
                            {selectedCountry.flag} {phoneValidation.fullE164}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Connectra dispatches a secure one-time verification code (OTP). Standard SMS rates may apply.
                    </p>

                    <button
                      type="submit"
                      disabled={loading || (phoneNumber.length > 0 && !phoneValidation.isValid)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
                    </button>

                    {/* Mode Quick Toggle Link */}
                    <div className="text-center pt-1">
                      {phoneMode === 'login' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneMode('register');
                            setError('');
                          }}
                          className="text-xs text-cyan-400 hover:underline"
                        >
                          New to Connectra? Create an account
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneMode('login');
                            setError('');
                          }}
                          className="text-xs text-cyan-400 hover:underline"
                        >
                          Already have an account? Sign in
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              ) : (
                /* Step 2: OTP Verification Screen */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 text-center">
                    <p className="text-xs text-slate-300">
                      {phoneMode === 'register' ? 'Registering with:' : 'Signing in to:'}
                    </p>
                    <p className="text-sm font-semibold text-cyan-300 font-mono mt-1 flex items-center justify-center gap-2">
                      <span className="text-base">{selectedCountry.flag}</span>
                      <span>{phoneValidation.fullE164}</span>
                    </p>
                    {phoneMode === 'register' && fullName && (
                      <p className="text-xs text-slate-400 mt-0.5">Account Name: {fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1 text-center">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold rounded-xl border border-slate-700 bg-slate-950 py-3 text-cyan-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                    <div className="mt-1 text-center">
                      <button
                        type="button"
                        onClick={() => setOtpValue('849201')}
                        className="text-[11px] text-cyan-400/80 hover:text-cyan-300 hover:underline"
                      >
                        (Click to auto-fill test code: 849201)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => setOtpStep(false)}
                      className="hover:text-cyan-400 transition-colors"
                    >
                      ← Change number
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpValue('849201')}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Resend Code
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpValue.length < 6}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>
                      {loading
                        ? 'Verifying...'
                        : phoneMode === 'register'
                        ? 'Complete Registration'
                        : 'Verify & Sign In'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: Email Login / Register */}
          {tab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {isRegisteringEmail && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Liam Parker"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@connectra.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setIsRegisteringEmail(!isRegisteringEmail)}
                  className="text-cyan-400 hover:underline"
                >
                  {isRegisteringEmail ? 'Already have an account? Sign In' : 'Create new account'}
                </button>
                <button
                  type="button"
                  onClick={() => setError('Password reset instructions dispatched to your email address.')}
                  className="hover:text-slate-300"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-colors disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                <span>{loading ? 'Please wait...' : isRegisteringEmail ? 'Create Account' : 'Sign In'}</span>
              </button>
            </form>
          )}

          {/* Privacy Note */}
          <div className="mt-5 border-t border-slate-800/80 pt-4 text-center">
            <span className="text-[11px] text-slate-500">
              By using Connectra, you agree to the{' '}
              <span className="text-cyan-400 underline cursor-pointer">Terms of Service</span> and{' '}
              <span className="text-cyan-400 underline cursor-pointer">Privacy Policy</span>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
