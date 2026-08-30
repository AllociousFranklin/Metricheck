import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Scale, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';

export const LoginPage: React.FC = () => {
  const { login, loginWithEmail, isAuthenticated, isLoading, error } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      addToast({
        title: 'Missing Fields',
        message: 'Please enter both your email address and password.',
        type: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
      addToast({
        title: 'Welcome to METRICHECK',
        message: 'Signed in successfully.',
        type: 'success',
      });
      navigate('/dashboard');
    } catch (err: any) {
      addToast({
        title: 'Sign In Failed',
        message: err?.message || 'Invalid credentials. Please verify your email and password.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await login();
    } catch (err: any) {
      addToast({
        title: 'Google OAuth Notice',
        message: err?.message || 'Could not connect to Google OAuth provider. Please check your Supabase URL configuration.',
        type: 'warning',
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column: Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-4 sm:p-8 relative z-10 bg-neutral-50 min-h-screen overflow-y-auto">
        <div className="w-full max-w-md my-auto py-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-3 shadow-md shadow-primary/20">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1.5 tracking-tight">METRICHECK</h1>
            <p className="text-xs sm:text-sm text-neutral-600 mb-1.5">AI-Powered Legal Metrology Inspection Platform</p>
            <p className="text-[10px] sm:text-xs font-bold tracking-widest text-primary/80 uppercase">SCAN. VERIFY. COMPLY.</p>
          </div>

          <Card className="w-full shadow-xl border-neutral-100 bg-white relative z-20 rounded-2xl">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-xl font-bold text-neutral-900">Sign In</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-neutral-500">
                Access the statutory inspection workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm">
                  {error}
                </div>
              )}

              {/* Standard Email & Password Form */}
              <form onSubmit={handleEmailLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type="email"
                      required
                      placeholder="inspector@legalmetrology.gov.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 text-sm bg-neutral-50/60 border-neutral-200 focus:bg-white rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 text-sm bg-neutral-50/60 border-neutral-200 focus:bg-white rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="w-full py-2.5 rounded-xl font-medium shadow-sm bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 mt-2"
                >
                  <span>{submitting ? 'Signing In...' : 'Sign In with Email'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                  <span className="bg-white px-3 text-neutral-400 font-semibold tracking-wider">or continue with</span>
                </div>
              </div>

              {/* Google Workspace OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading || submitting}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-neutral-200 rounded-xl bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-xs sm:text-sm shadow-sm active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google Workspace</span>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column: Visual Background Element */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-primary/20 z-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-neutral-50 via-neutral-50/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-neutral-50/60 to-transparent z-20 pointer-events-none" />

        <img
          src="/images/industrial-inspection-bg-light.png"
          alt="AI Industrial Quality Inspection"
          className="absolute inset-0 w-full h-full object-cover object-right scale-[1.02] opacity-90"
        />
      </div>
    </div>
  );
};
