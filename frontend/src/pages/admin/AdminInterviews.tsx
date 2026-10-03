import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { Search, Loader2, Video, Eye, MessageSquare } from 'lucide-react';

interface Interview {
  id: string;
  target_role: string;
  difficulty: string;
  status: string;
  overall_score: number | null;
  created_at: string;
  user_name: string;
}

export const AdminInterviews: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async (searchQuery = '') => {
    setLoading(true);
    try {
      const res = await adminApi.get('/interviews', {
        params: { search: searchQuery }
      });
      setInterviews(res.data.items);
    } catch (error) {
      console.error('Failed to fetch interviews', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInterviews(search);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">In Progress</span>;
      case 'abandoned':
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">Abandoned</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Interviews</h1>
          <p className="text-slate-400 mt-1">Review AI interview sessions and transcripts.</p>
        </div>
        
        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
          />
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Target Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : interviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No interviews found.
                  </td>
                </tr>
              ) : (
                interviews.map((interview) => (
                  <tr key={interview.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20">
                          <Video className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-sm font-medium text-white">{interview.target_role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                      {interview.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 capitalize">
                      {interview.difficulty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(interview.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {interview.overall_score !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${interview.overall_score >= 80 ? 'bg-emerald-500' : interview.overall_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${interview.overall_score}%` }}
                            />
                          </div>
                          <span className="text-slate-300 font-medium">{Math.round(interview.overall_score)}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(interview.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button className="text-slate-400 hover:text-indigo-400 transition-colors" title="View Transcript">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button className="text-slate-400 hover:text-emerald-400 transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
