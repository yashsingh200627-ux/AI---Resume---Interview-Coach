import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { Users, FileText, Video, Activity, Sparkles, Briefcase, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashboardStats {
  total_users: number;
  active_users: number;
  new_users: number;
  total_resumes: number;
  total_interviews: number;
  completed_interviews: number;
  ai_requests: number;
  job_matches: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, growthRes] = await Promise.all([
          adminApi.get('/dashboard/summary'),
          adminApi.get('/dashboard/analytics/user-growth')
        ]);
        setStats(summaryRes.data);
        setUserGrowth(growthRes.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Total Resumes', value: stats?.total_resumes || 0, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { title: 'Total Interviews', value: stats?.total_interviews || 0, icon: Video, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { title: 'AI Requests', value: stats?.ai_requests || 0, icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { title: 'Job Matches', value: stats?.job_matches || 0, icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { title: 'Completed Interviews', value: stats?.completed_interviews || 0, icon: Activity, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
        <p className="text-slate-400 mt-1">Real-time statistics from your platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value.toLocaleString()}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              User Growth
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#f1f5f9' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">Live Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-sm text-slate-200">New user registered</p>
                <p className="text-xs text-slate-500">Just now</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 animate-pulse" />
              <div>
                <p className="text-sm text-slate-200">Interview started</p>
                <p className="text-xs text-slate-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-purple-500 animate-pulse" />
              <div>
                <p className="text-sm text-slate-200">Resume analyzed</p>
                <p className="text-xs text-slate-500">5 minutes ago</p>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 flex flex-col items-center justify-center text-center">
               <p className="text-sm text-slate-400">WebSocket connection pending for real-time updates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
