import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { fetchCurrentAdmin } from '../store/adminAuthSlice';
import { Loader2 } from 'lucide-react';

export const AdminProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, token } = useAppSelector((state) => state.adminAuth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(fetchCurrentAdmin());
    }
  }, [token, isAuthenticated, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};
