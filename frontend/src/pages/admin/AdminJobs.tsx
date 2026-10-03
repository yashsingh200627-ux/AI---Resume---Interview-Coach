import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { Search, Loader2, Briefcase, FileSearch, Target, Users } from 'lucide-react';
import clsx from 'clsx';

interface JobDescription {
  id: string;
  title: string;
  company: string;
  user_name: string;
  created_at: string;
}

interface JobMatch {
  id: string;
  user_name: string;
  job_title: string;
  overall_match_score: number;
  ats_compatibility_score: number;
  created_at: string;
}

interface SkillGap {
  skill_name: string;
  missing_count: number;
}

export const AdminJobs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matches' | 'descriptions' | 'skills'>('matches');
  
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [descriptions, setDescriptions] = useState<JobDescription[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async (searchQuery = '') => {
    setLoading(true);
    try {
      if (activeTab === 'matches') {
        const res = await adminApi.get('/jobs/matches', { params: { search: searchQuery } });
        setMatches(res.data.items);
      } else if (activeTab === 'descriptions') {
        const res = await adminApi.get('/jobs/descriptions', { params: { search: searchQuery } });
        setDescriptions(res.data.items);
      } else if (activeTab === 'skills') {
        const res = await adminApi.get('/career/skill-gaps/aggregate');
        setSkillGaps(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(search);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Job & Career Analytics</h1>
        <p className="text-slate-400 mt-1">Review job matching activity, target roles, and aggregate skill gaps.</p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('matches')}
          className={clsx(
            "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'matches' 
              ? "border-indigo-500 text-indigo-400" 
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Job Matches
          </div>
        </button>
        <button
          onClick={() => setActiveTab('descriptions')}
          className={clsx(
            "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'descriptions' 
              ? "border-indigo-500 text-indigo-400" 
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Job Descriptions
          </div>
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={clsx(
            "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'skills' 
              ? "border-indigo-500 text-indigo-400" 
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Skill Gap Analytics
          </div>
        </button>
      </div>

      {activeTab !== 'skills' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
          <form onSubmit={handleSearch} className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
            />
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'matches' && (
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Target Job</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Match Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ATS Compatibility</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900">
                  {matches.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No match records found.</td></tr>
                  ) : (
                    matches.map(m => (
                      <tr key={m.id} className="hover:bg-slate-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{m.user_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{m.job_title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {Math.round(m.overall_match_score)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{Math.round(m.ats_compatibility_score)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(m.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'descriptions' && (
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Job Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900">
                  {descriptions.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No job descriptions found.</td></tr>
                  ) : (
                    descriptions.map(d => (
                      <tr key={d.id} className="hover:bg-slate-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white flex items-center gap-3">
                           <FileSearch className="w-4 h-4 text-slate-400" />
                           {d.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{d.company || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{d.user_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(d.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'skills' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-white mb-4">Most Common Missing Skills</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {skillGaps.length === 0 ? (
                    <p className="text-slate-400">Not enough data to aggregate skill gaps.</p>
                  ) : (
                    skillGaps.map((sg, i) => (
                      <div key={i} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-lg flex items-center justify-between">
                        <span className="text-slate-200 font-medium">{sg.skill_name}</span>
                        <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 text-xs border border-rose-500/20 font-bold">
                          {sg.missing_count} Users Missing
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
