import React, { useState } from 'react';
import { useUser } from '../hooks/useUser';
import { authService } from '../services/authService';
import { GameControllerIcon } from './icons/GameControllerIcon';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const authFunction = isLogin ? authService.login : authService.signup;
      const user = await authFunction(email, password);
      setUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-darker p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-darker via-neutral-darker to-brand-secondary/20 z-0"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-glow-start/10 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-glow-end/10 rounded-full filter blur-3xl opacity-50 animate-pulse [animation-delay:2s]"></div>

      <div className="w-full max-w-md bg-neutral-dark/50 backdrop-blur-lg border border-neutral-light/10 p-8 rounded-2xl shadow-2xl z-10 animate-fade-in">
        <div className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-br from-glow-start to-glow-end rounded-xl mb-4">
                <GameControllerIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-light tracking-tight">
                Welcome Back
            </h1>
            <p className="text-neutral-400 mt-2">{isLogin ? 'Sign in to access your collection' : 'Create an account to get started'}</p>
        </div>
        
        <form onSubmit={handleSubmit} noValidate>
          {error && <p className="bg-red-900/50 text-red-400 text-sm p-3 rounded-md mb-4 text-center">{error}</p>}
          
          <div className="relative mb-4">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email address"
              className="peer w-full bg-transparent border-b-2 border-neutral-light/20 text-neutral-light placeholder-transparent focus:outline-none focus:border-brand-primary pt-4 pb-2"
            />
            <label htmlFor="email" className="absolute left-0 -top-3.5 text-neutral-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-placeholder-shown:top-5 peer-focus:-top-3.5 peer-focus:text-brand-primary peer-focus:text-sm">
              Email Address
            </label>
          </div>

          <div className="relative mb-6">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="peer w-full bg-transparent border-b-2 border-neutral-light/20 text-neutral-light placeholder-transparent focus:outline-none focus:border-brand-primary pt-4 pb-2"
            />
             <label htmlFor="password" className="absolute left-0 -top-3.5 text-neutral-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-placeholder-shown:top-5 peer-focus:-top-3.5 peer-focus:text-brand-primary peer-focus:text-sm">
              Password
            </label>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[48px]"
            >
              {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : isLogin ? 'Sign In' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="inline-block align-baseline font-bold text-sm text-neutral-400 hover:text-white"
            >
              {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;