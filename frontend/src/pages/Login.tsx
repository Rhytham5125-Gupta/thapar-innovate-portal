import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Shield, Sparkles, LogIn, Mail, User as UserIcon, Lock, UserPlus, Phone, Info } from 'lucide-react';

type TabType = 'signin' | 'signup';

export const Login: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  
  // Tab control
  const [activeTab, setActiveTab] = useState<TabType>('signin');

  // Input states - Sign In
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Input states - Sign Up
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpRole, setSignUpRole] = useState<'employee' | 'intern'>('employee');
  const [signUpDept, setSignUpDept] = useState('Computer Science');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  
  // Messaging
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Quick select roles using both Phone & Email to demonstrate dual auth
  const testAccounts = [
    { name: 'Dr. Akhil Thapar', identifier: '9876543210', password: 'Password@123', label: 'Administrator', type: 'Phone' },
    { name: 'Rohan Verma', identifier: 'rohan.employee@thapar.edu', password: 'Password@123', label: 'Employee', type: 'Email' },
    { name: 'Ananya Goel', identifier: 'ananya.intern@thapar.edu', password: 'Password@123', label: 'Intern', type: 'Email' },
  ];

  const handleQuickLogin = async (acc: typeof testAccounts[0]) => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const response = await api.post('/auth/login', { identifier: acc.identifier, password: acc.password });
      if (response.data.success) {
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInIdentifier || !signInPassword) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await api.post('/auth/login', { identifier: signInIdentifier, password: signInPassword });
      if (response.data.success) {
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email/phone or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!signUpName || !signUpEmail || !signUpPassword || !signUpPhone) {
      setError('Please fill in all fields.');
      return;
    }

    if (!signUpEmail.toLowerCase().endsWith('@thapar.edu')) {
      setError('Invalid email address. Sign up is restricted exclusively to official @thapar.edu email accounts.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(signUpPhone)) {
      setError('Invalid phone number. Please enter a valid 10-digit mobile number.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
        role: signUpRole,
        department: signUpDept,
        phoneNumber: signUpPhone,
      });

      if (response.data.success) {
        setInfo('Account registered successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    setInfo(null);
    setTimeout(async () => {
      try {
        // Mock Google Login creates user session
        await api.post('/auth/login', { identifier: 'rohan.employee@thapar.edu', password: 'Password@123' });
        window.location.href = '/';
      } catch (err: any) {
        setError(err.response?.data?.message || 'Google Auth simulation failed');
      } finally {
        setGoogleLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* Background Animated Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-gradient-to-br from-red-900/30 to-rose-950/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-gradient-to-tr from-slate-950/30 to-red-950/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

      <div className="container max-w-6xl mx-auto px-4 grid md:grid-cols-12 gap-8 z-10">
        
        {/* Left Side: Branding */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-6 text-center md:text-left pr-4">
          <div className="flex items-center justify-center md:justify-start space-x-3">
            <div className="w-12 h-12 bg-white/10 dark:bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center p-2 shadow-xl border border-white/20">
              <img src="/logo.png" alt="TIET Innovate" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-xl tracking-wider text-slate-100 uppercase">TIET Innovate</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Centralized Task Management <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">
              For Thapar Employees
            </span>
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
            A secure and high-performance workflow portal built for administrators, employees, and interns to manage, submit, review, and analyze operations.
          </p>

          <div className="hidden lg:grid grid-cols-2 gap-4 pt-4 max-w-md">
            <div className="glass-card p-4 rounded-xl flex flex-col items-start">
              <Sparkles className="w-5 h-5 text-yellow-400 mb-2" />
              <span className="font-semibold text-sm">Role Based Access</span>
              <span className="text-xs text-slate-400">Strict routes and dashboard lockouts.</span>
            </div>
            <div className="glass-card p-4 rounded-xl flex flex-col items-start">
              <Shield className="w-5 h-5 text-red-400 mb-2" />
              <span className="font-semibold text-sm">Multi-Identifier Auth</span>
              <span className="text-xs text-slate-400">Sign in with Thapar Email or Mobile Number.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Panel Form */}
        <div className="md:col-span-6 flex items-center justify-center">
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl relative border border-slate-800">
            
            {/* Tab Select Header */}
            <div className="flex space-x-1 p-1 bg-slate-800/80 rounded-xl mb-6">
              <button
                onClick={() => { setActiveTab('signin'); setError(null); setInfo(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'signin' ? 'bg-red-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setError(null); setInfo(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'signup' ? 'bg-red-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs mb-4">
                {error}
              </div>
            )}

            {info && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs mb-4">
                {info}
              </div>
            )}

            {/* TAB: Sign In Panel */}
            {activeTab === 'signin' && (
              <div className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Thapar Email or Mobile Number
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        required
                        value={signInIdentifier}
                        onChange={(e) => setSignInIdentifier(e.target.value)}
                        placeholder="rahul@thapar.edu or 9876543211"
                        className="w-full bg-slate-800/40 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-slate-250 text-sm focus:outline-none focus:border-red-800"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-400">Password</label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold focus:outline-none"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                      <input
                        type="password"
                        required
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-800/40 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-slate-250 text-sm focus:outline-none focus:border-red-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-800 to-rose-700 text-white py-2.5 rounded-xl font-semibold hover:from-red-700 hover:to-rose-600 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>Sign In</span>
                  </button>
                </form>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase tracking-wider">quick-select persona</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {testAccounts.map((acc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickLogin(acc)}
                      className="p-2 bg-slate-800/40 hover:bg-red-950/20 hover:border-red-800/45 border border-slate-800 rounded-xl text-left transition-all"
                    >
                      <div className="text-[10px] font-bold text-slate-200 truncate">{acc.label}</div>
                      <div className="text-[9px] text-slate-400 truncate mt-0.5">{acc.name}</div>
                      <div className="text-[8px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Via {acc.type}</div>
                    </button>
                  ))}
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase tracking-wider">or sign in with google</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center space-x-3 bg-white text-slate-900 py-2.5 rounded-xl font-semibold hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.7 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3.1h3.8c2.2-2 3.7-5 3.7-9z"/>
                      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-3.1c-1.1.7-2.5 1.2-4.2 1.2-3.2 0-6-2.2-7-5.2H1.1v3.2C3.1 21.3 7.3 24 12 24z"/>
                      <path fill="#FBBC05" d="M5 14.2c-.2-.7-.4-1.5-.4-2.2s.2-1.5.4-2.2V6.6H1.1C.4 8.2 0 10.1 0 12s.4 3.8 1.1 5.4L5 14.2z"/>
                      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.1 2.7 1.1 6.6L5 9.8c1-3 3.8-5 7-5z"/>
                    </svg>
                  )}
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}

            {/* TAB: Sign Up Panel */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="e.g. Rahul Dev"
                      className="w-full bg-slate-800/40 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-slate-250 text-sm focus:outline-none focus:border-red-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Thapar Email Address (@thapar.edu)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="e.g. rahul@thapar.edu"
                      className="w-full bg-slate-800/40 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-slate-250 text-sm focus:outline-none focus:border-red-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number (Authentication Key)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      placeholder="e.g. 9876543211"
                      className="w-full bg-slate-800/40 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-slate-250 text-sm focus:outline-none focus:border-red-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">You are a/an:</label>
                    <select
                      value={signUpRole}
                      onChange={(e: any) => setSignUpRole(e.target.value)}
                      className="w-full bg-slate-800/40 border border-slate-800 rounded-xl py-2 px-3 text-slate-250 text-xs focus:outline-none focus:border-red-800"
                    >
                      <option className="bg-slate-900" value="employee">Employee</option>
                      <option className="bg-slate-900" value="intern">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
                    <select
                      value={signUpDept}
                      onChange={(e) => setSignUpDept(e.target.value)}
                      className="w-full bg-slate-800/40 border border-slate-800 rounded-xl py-2 px-3 text-slate-250 text-xs focus:outline-none focus:border-red-800"
                    >
                      <option className="bg-slate-900" value="Computer Science">Computer Sci</option>
                      <option className="bg-slate-900" value="Electronics">Electronics</option>
                      <option className="bg-slate-900" value="Mechanical">Mechanical</option>
                      <option className="bg-slate-900" value="Biotechnology">Biotech</option>
                      <option className="bg-slate-900" value="Management">Management</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="password"
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/40 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-slate-250 text-sm focus:outline-none focus:border-red-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="password"
                      required
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/40 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-slate-250 text-sm focus:outline-none focus:border-red-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-800 to-rose-700 text-white py-2.5 rounded-xl font-semibold hover:from-red-700 hover:to-rose-600 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Create Account</span>
                </button>
              </form>
            )}

          </div>
        </div>

      </div>

      {/* Forgot Password Contact Modal Popup */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5 text-red-500">
              <Info className="w-6 h-6" />
              <h3 className="font-bold text-lg">Forgot Password Request</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              For security compliance, automated self-service password recovery has been disabled. To request a password reset or retrieve temporary access credentials, please contact the System Administrator directly:
            </p>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Administrator:</span>
                <span className="font-bold text-slate-200">Dr. Akhil Thapar</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Mobile Phone:</span>
                <a href="tel:9876543210" className="font-bold text-red-400 hover:underline">+91 9876543210</a>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Thapar Email:</span>
                <a href="mailto:akhil.admin@thapar.edu" className="font-bold text-red-400 hover:underline">akhil.admin@thapar.edu</a>
              </div>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition-all"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
