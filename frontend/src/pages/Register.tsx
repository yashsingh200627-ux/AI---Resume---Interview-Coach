import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '../store';
import { setCredentials } from '../store/authSlice';
import { addToast } from '../store/uiSlice';
import { authApi } from '../services/api';
import { Bot, Mail, Lock, User, Phone, Briefcase, GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { ToastContainer } from '../components/ToastContainer';
import { ThemeToggle } from '../components/ThemeToggle';
import { PhoneInputField } from '../components/PhoneInputField';

interface RegisterFormInputs {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  experience_level: string;
  target_job_role: string;
}

export const Register: React.FC = () => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterFormInputs>({
    defaultValues: {
      experience_level: 'Mid-Level',
      target_job_role: 'Full Stack Developer',
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.register(data);
      dispatch(
        setCredentials({
          token: res.data.access_token,
          user: res.data.user,
        })
      );
      dispatch(
        addToast({
          type: 'success',
          message: 'Account created successfully! Welcome to AI Career Coach.',
        })
      );
      navigate('/dashboard');
    } catch (err: any) {
      let msg = 'Failed to create account. Please check inputs.';
      if (!err.response) {
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          msg = 'Connection timed out. The cloud server may be waking up from standby (takes ~30-60s on free tier). Please retry shortly.';
        } else {
          msg = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'Cannot connect to backend server. Please ensure the backend is running on http://localhost:8000.'
            : 'Unable to reach backend service. The cloud server may be spinning up from standby. Please retry in 30 seconds.';
        }
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#181117] text-slate-900 dark:text-[#FFF5F7] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative selection:bg-pink-500 selection:text-white transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3">
        <ThemeToggle showLabel={true} />
      </div>

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-pink-500/10 dark:bg-pink-600/15 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/25">
            <Bot className="w-6 h-6" />
          </div>
        </Link>
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#FFF5F7] tracking-tight">
          Create Your Career Profile
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-[#E5CCD6]">
          Build tailored resumes and practice real-time AI interviews
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white dark:bg-[#251823] border border-slate-200/90 dark:border-[#3b2536] p-6 sm:p-8 rounded-2xl shadow-xl backdrop-blur-xl transition-colors">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#FFF5F7] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-pink-300/50 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  {...register('full_name', { required: 'Full name is required' })}
                  placeholder="Yash"
                  className="w-full bg-white dark:bg-[#1e131b] border border-slate-300 dark:border-[#3b2536] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-[#FFF5F7] placeholder-slate-400 dark:placeholder-pink-300/40 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>
              {errors.full_name && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.full_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#FFF5F7] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-pink-300/50 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    placeholder="alex@example.com"
                    className="w-full bg-white dark:bg-[#1e131b] border border-slate-300 dark:border-[#3b2536] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-[#FFF5F7] placeholder-slate-400 dark:placeholder-pink-300/40 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
                {errors.email && (
                  <p className="text-rose-400 text-[11px] mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <PhoneInputField
                  label="Phone Number"
                  value={watch('phone') || ''}
                  onChange={(val) => setValue('phone', val, { shouldDirty: true })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#FFF5F7] mb-1.5">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-pink-300/50 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  placeholder="••••••••"
                  className="w-full bg-white dark:bg-[#1e131b] border border-slate-300 dark:border-[#3b2536] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-[#FFF5F7] placeholder-slate-400 dark:placeholder-pink-300/40 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>
              {errors.password && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#FFF5F7] mb-1.5">
                  Experience Level
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 dark:text-pink-300/50 absolute left-3.5 top-3.5" />
                  <select
                    {...register('experience_level')}
                    className="w-full bg-white dark:bg-[#1e131b] border border-slate-300 dark:border-[#3b2536] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-[#FFF5F7] focus:outline-none focus:border-pink-500 cursor-pointer"
                  >
                    <option value="Entry Level">Entry Level (0-1 yrs)</option>
                    <option value="Junior">Junior (1-3 yrs)</option>
                    <option value="Mid-Level">Mid-Level (3-5 yrs)</option>
                    <option value="Senior">Senior (5-8 yrs)</option>
                    <option value="Lead / Principal">Lead / Principal (8+ yrs)</option>
                    <option value="Executive">Executive / Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#FFF5F7] mb-1.5">
                  Target Job Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 dark:text-pink-300/50 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    {...register('target_job_role', { required: 'Target role is required' })}
                    placeholder="e.g. Software Engineer"
                    className="w-full bg-white dark:bg-[#1e131b] border border-slate-300 dark:border-[#3b2536] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-[#FFF5F7] placeholder-slate-400 dark:placeholder-pink-300/40 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                </div>
                {errors.target_job_role && (
                  <p className="text-rose-400 text-[11px] mt-1">{errors.target_job_role.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-pink-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-[#E5CCD6] border-t border-slate-200/80 dark:border-[#3b2536] pt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-pink-600 dark:text-[#F472B6] hover:text-pink-500 font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};
