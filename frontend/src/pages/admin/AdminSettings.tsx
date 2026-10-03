import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { useAppSelector } from '../../store';
import { Settings, Shield, Key, Loader2, Server, Save } from 'lucide-react';
import clsx from 'clsx';

export const AdminSettings: React.FC = () => {
  const { admin } = useAppSelector((state) => state.adminAuth);
  const isSuperAdmin = admin?.role?.name === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'config' | 'admins' | 'audit'>('config');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'audit' && isSuperAdmin) {
        const res = await adminApi.get('/logs/audit');
        setAuditLogs(res.data.items);
      } else if (activeTab === 'admins' && isSuperAdmin) {
        const res = await adminApi.get('/management/admins');
        setAdminUsers(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          System Settings
        </h1>
        <p className="text-slate-400 mt-1">Configure application parameters, manage administrators, and view audit trails.</p>
      </div>

      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('config')}
          className={clsx(
            "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'config' ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Configuration
          </div>
        </button>
        {isSuperAdmin && (
          <>
            <button
              onClick={() => setActiveTab('admins')}
              className={clsx(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'admins' ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin Users
              </div>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={clsx(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'audit' ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Audit Logs
              </div>
            </button>
          </>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div>
            {activeTab === 'config' && (
              <div className="p-6 space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Application Toggles</h3>
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div>
                        <p className="text-sm font-medium text-white">Maintenance Mode</p>
                        <p className="text-xs text-slate-400">Disable the frontend for standard users</p>
                      </div>
                      <div className="w-11 h-6 bg-slate-700 rounded-full cursor-pointer relative">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full transition-transform"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div>
                        <p className="text-sm font-medium text-white">Allow New Registrations</p>
                        <p className="text-xs text-slate-400">Toggle whether new users can sign up</p>
                      </div>
                      <div className="w-11 h-6 bg-indigo-500 rounded-full cursor-pointer relative">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform translate-x-5"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <Save className="w-4 h-4" />
                    Save Configuration
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'admins' && isSuperAdmin && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Admin Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {adminUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx(
                            "px-2 py-1 text-xs font-semibold rounded-md border",
                            user.status === 'active' 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          )}>
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'audit' && isSuperAdmin && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Resource</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500">No audit logs available</td></tr>
                    ) : (
                      auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-800/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{log.admin_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-400 font-mono">{log.action}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{log.resource_type} ({log.resource_id})</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">{log.ip_address}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
