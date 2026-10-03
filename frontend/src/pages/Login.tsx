import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../store';
import { setCredentials } from '../store/authSlice';
import { addToast } from '../store/uiSlice';
import { authApi } from '../services/api';
import { Bot, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { ToastContainer } from '../components/ToastContainer';
import { ThemeToggle } from '../components/ThemeToggle';

interface LoginFormInputs {
  email: string;
  password: string;
  remember_me: boolean;
}

export const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.login(data);
      dispatch(
        setCredentials({
          token: res.data.access_token,
          user: res.data.user,
        })
      );
      dispatch(
        addToast({
          type: 'success',
          message: `Welcome back, ${res.data.user.full_name}!`,
        })
      );
      navigate(from, { replace: true });
    } catch (err: any) {
      let msg = 'Invalid email or password.';
      if (!err.response) {
        msg = 'Cannot connect to backend server. Please ensure the backend is running on http://localhost:8000.';
      } else if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : JSON.stringify(err.response.data.detail);
      }
      setErrorMessage(msg);
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#181117] text-slate-900 dark:text-[#FFF5F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-pink-500 selection:text-white transition-colors duration-200">
      {/* Top bar with back to home and theme toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3">
        <ThemeToggle showLabel={true} />
      </div>

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 dark:bg-pink-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/25">
            <Bot className="w-6 h-6" />
          </div>
        </Link>
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#FFF5F7] tracking-tight">
          Sign In to Your Account
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-[#E5CCD6]">
          Prepare smarter with your real-time career coaching workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-[#251823] border border-slate-200/90 dark:border-[#3b2536] p-6 sm:p-8 rounded-2xl shadow-xl backdrop-blur-xl transition-colors">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#FFF5F7] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-pink-300/50 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  placeholder="name@example.com"
                  className="w-full bg-white dark:bg-[#1e131b] border border-slate-300 dark:border-[#3b2536] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-[#FFF5F7] placeholder-slate-400 dark:placeholder-pink-300/40 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>
              {errors.email && (
                <p className="text-rose-500 dark:text-rose-400 text-[11px] mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#FFF5F7] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-pink-300/50 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-[#1e131b] border border-slate-300 dark:border-[#3b2536] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-[#FFF5F7] placeholder-slate-400 dark:placeholder-pink-300/40 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>
              {errors.password && (
                <p className="text-rose-500 dark:text-rose-400 text-[11px] mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-[#E5CCD6] select-none">
                <input
                  type="checkbox"
                  {...register('remember_me')}
                  className="rounded bg-white dark:bg-[#1e131b] border-slate-300 dark:border-[#3b2536] text-pink-500 focus:ring-0"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-pink-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-[#E5CCD6] border-t border-slate-200/80 dark:border-[#3b2536] pt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-pink-600 dark:text-[#F472B6] hover:text-pink-500 font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};
