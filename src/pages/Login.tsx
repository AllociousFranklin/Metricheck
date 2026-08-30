import React, { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Scale, UserCheck, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';

export const LoginPage: React.FC = () => {
  const { login, loginAsDemo, isAuthenticated, isLoading, error } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = async () => {
    try {
      await login();
    } catch (err) {
      addToast({
        title: 'Google OAuth Notice',
        message: 'Could not connect to Google OAuth provider. You can use Quick Demo Access below.',
        type: 'warning',
      });
    }
  };

  const handleDemoLogin = async (role: 'INSPECTOR' | 'ADMIN') => {
    try {
      await loginAsDemo(role);
      addToast({
        title: 'Welcome to METRICHECK',
        message: `Signed in as ${role === 'ADMIN' ? 'Compliance Director (Admin)' : 'Legal Metrology Officer (Inspector)'}`,
        type: 'success',
      });
      navigate('/dashboard');
    } catch (err) {
      addToast({ title: 'Error', message: 'Failed to initialize session', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column: Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-4 sm:p-8 relative z-10 bg-neutral-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-primary/20">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2 tracking-tight">METRICHECK</h1>
            <p className="text-sm text-neutral-600 mb-2">AI-Powered Legal Metrology Inspection & Compliance Platform</p>
            <p className="text-xs font-bold tracking-widest text-primary/80 uppercase">SCAN. VERIFY. COMPLY.</p>
          </div>

          <Card className="w-full shadow-xl border-neutral-100 bg-white relative z-20 rounded-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold text-neutral-900">Sign In</CardTitle>
              <CardDescription className="text-sm text-neutral-500">
                Access the statutory inspection workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Google Workspace OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium shadow-sm active:scale-[0.99]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>{isLoading ? 'Redirecting...' : 'Continue with Google'}</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-neutral-400 font-semibold tracking-wider">or fast demo access</span>
                </div>
              </div>

              {/* Fast Demo Access Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('INSPECTOR')}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary font-medium rounded-xl text-xs sm:text-sm transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Field Inspector</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('ADMIN')}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 font-medium rounded-xl text-xs sm:text-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin / Director</span>
                </button>
              </div>
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
