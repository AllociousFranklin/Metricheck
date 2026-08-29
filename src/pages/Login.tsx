import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, Scale } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isAuthenticated, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column: Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-4 sm:p-8 relative z-10 bg-neutral-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-h2 font-bold text-primary mb-2">METRICHECK</h1>
            <p className="text-body text-secondary mb-2">AI-Powered Legal Metrology Inspection & Compliance Platform</p>
            <p className="text-sm font-semibold tracking-widest text-primary/80">SCAN. VERIFY. COMPLY.</p>
          </div>

          <Card className="w-full shadow-lg border-neutral-100 bg-white relative z-20">
            <CardHeader>
              <CardTitle className="text-h3 text-neutral-900 text-center">Sign In</CardTitle>
              <CardDescription className="text-center text-neutral-600">
                Enter your credentials to access the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-white border-l-4 border-l-error text-error border border-error/20 rounded-md text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-label text-neutral-900" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-neutral-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-neutral-900"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-label text-neutral-900" htmlFor="password">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-neutral-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-neutral-900"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-neutral-50 text-neutral-500 font-medium">OR</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-neutral-200 rounded-md bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium shadow-sm"
                  onClick={() => {/* Mock Google Auth */ }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 p-4 bg-white/80 backdrop-blur-sm border-l-4 border-l-info rounded-md border border-info/20 text-sm text-info relative z-20">
            <p className="font-semibold mb-2">Demo Credentials (Click to auto-fill):</p>
            <ul className="space-y-1.5">
              <li
                onClick={() => { setEmail('admin@metrology.gov'); setPassword('admin123'); }}
                className="cursor-pointer p-1.5 rounded hover:bg-neutral-100 transition-colors"
              >
                <strong>Admin:</strong> <span className="font-mono text-xs">admin@metrology.gov</span> | <span className="font-mono text-xs">admin123</span>
              </li>
              <li
                onClick={() => { setEmail('inspector@metrology.gov'); setPassword('inspect123'); }}
                className="cursor-pointer p-1.5 rounded hover:bg-neutral-100 transition-colors"
              >
                <strong>Inspector:</strong> <span className="font-mono text-xs">inspector@metrology.gov</span> | <span className="font-mono text-xs">inspect123</span>
              </li>
              <li
                onClick={() => { setEmail('reviewer@metrology.gov'); setPassword('review123'); }}
                className="cursor-pointer p-1.5 rounded hover:bg-neutral-100 transition-colors"
              >
                <strong>Reviewer:</strong> <span className="font-mono text-xs">reviewer@metrology.gov</span> | <span className="font-mono text-xs">review123</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Column: Visual Background Element */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
        {/* Soft white overlay to keep it professional and not overpowering */}
        <div className="absolute inset-0 bg-white/20 z-10 mix-blend-overlay pointer-events-none" />

        {/* Gradient fade on the left edge to blend seamlessly with the login area */}
        <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-neutral-50 via-neutral-50/80 to-transparent z-20 pointer-events-none" />

        {/* Secondary gradient on bottom for depth */}
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-neutral-50/60 to-transparent z-20 pointer-events-none" />

        <img
          src="/images/industrial-inspection-bg-light.png"
          alt="AI Industrial Quality Inspection"
          className="absolute inset-0 w-full h-full object-cover object-right scale-[1.02]"
        />
      </div>
    </div>
  );
};
