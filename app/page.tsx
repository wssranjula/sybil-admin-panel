'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Mail, Lock, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Call backend login API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: usernameOrEmail, // Backend accepts username or email
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Use auth context to login
        login(data.access_token, data.user);
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.detail || 'Login failed. Please check your credentials.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Network error. Please check if the backend server is running.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 relative overflow-hidden">
      {/* Animated Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-300/20 dark:bg-green-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 dark:bg-teal-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-300/10 dark:bg-emerald-600/5 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md border-2 border-green-200/50 dark:border-green-800/50 shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl relative z-10 hover:shadow-green-200/50 dark:hover:shadow-green-900/50 transition-all duration-300">
        <CardHeader className="space-y-6 pb-8 pt-8">
          {/* Logo Section with Enhanced Visibility */}
          <div className="flex flex-col items-center gap-6">
            {/* Large Logo with Glow Effect */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 animate-pulse transition-opacity"></div>
              <div className="relative w-32 h-32 bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-2xl border-4 border-green-100 dark:border-green-900 transform group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/logo.png"
                  alt="Climate Hub Logo"
                  fill
                  className="object-contain p-2"
                  priority
                  unoptimized
                />
              </div>
              {/* Sparkle Icon */}
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500 animate-pulse" />
            </div>

            {/* Title Section */}
            <div className="text-center space-y-3">
              <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-700 via-emerald-600 to-teal-700 bg-clip-text text-transparent drop-shadow-sm">
                Sybil Admin Portal
              </CardTitle>
              <CardDescription className="text-base md:text-lg flex items-center justify-center gap-2 font-medium">
                <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                Climate Hub Intelligence System
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          {/* Credential Login Form */}
          <form onSubmit={handleCredentialLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="usernameOrEmail" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                Username or Email
              </label>
              <Input
                id="usernameOrEmail"
                type="text"
                placeholder="username or admin@climatehub.org"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                className="h-12 border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900 transition-all rounded-lg text-base"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900 transition-all rounded-lg text-base"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold text-base shadow-lg hover:shadow-xl hover:shadow-green-500/30 dark:hover:shadow-green-900/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Footer Text */}
          <div className="text-center pt-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 py-2 px-4 rounded-lg border border-green-200 dark:border-green-800">
              <Leaf className="h-4 w-4" />
              Secure access to climate intelligence
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
