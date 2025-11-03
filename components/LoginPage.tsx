import React, { useState, FormEvent } from 'react';
import { signIn, signUp } from '../services/authService';
import { GameControllerIcon } from './icons/GameControllerIcon';
import { useUser } from '../hooks/useUser';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      let user;
      if (isLogin) {
        user = await signIn({ email, password });
      } else {
        user = await signUp({ email, password });
      }
      login(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-darker flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-gradient-to-br from-glow-start to-glow-end rounded-xl mb-4">
                <GameControllerIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-light tracking-tight">
              AI Game Scanner
            </h1>
            <p className="text-neutral-400">Sign in to manage your collection</p>
        </div>

        <div className="bg-neutral-dark p-8 rounded-xl border border-neutral-light/10 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-neutral-light mb-6">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-neutral-light/20 rounded-md shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-neutral-darker text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-neutral-light/20 rounded-md shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-neutral-darker text-white"
                />
              </div>
            </div>
            
            {error && <p className="text-sm text-red-400">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:opacity-50 disabled:cursor-wait"
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                }}
                className="font-medium bg-gradient-to-r from-glow-start to-glow-end bg-clip-text text-transparent hover:opacity-80 ml-1"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;