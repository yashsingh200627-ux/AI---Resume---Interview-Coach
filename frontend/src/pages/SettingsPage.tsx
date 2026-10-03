import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../store';
import { addToast } from '../store/uiSlice';
import { settingsApi } from '../services/api';
import { SettingsStatus } from '../types';
import {
  Settings, Key, Database, Sparkles, CheckCircle2,
  AlertTriangle, Loader2, Save, Activity, RefreshCw, Cpu, Cloud
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingMongo, setIsSyncingMongo] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSyncMongo = async () => {
    setIsSyncingMongo(true);
    try {
      await settingsApi.syncMongo();
      dispatch(addToast({ type: 'success', message: 'Successfully synced all data to MongoDB Atlas!' }));
      await loadSettings();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to sync data to MongoDB Atlas.';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsSyncingMongo(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await settingsApi.getStatus();
      setStatus(res.data);
      setBaseUrl(res.data.ai_api_base_url || 'https://api.openai.com/v1');
      setModel(res.data.ai_model || 'gpt-4o-mini');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTestResult(null);
    try {
      const payload: any = {
        ai_api_base_url: baseUrl.trim(),
        ai_model: model.trim(),
      };
      if (apiKey.trim()) {
        payload.ai_api_key = apiKey.trim();
      }
      await settingsApi.update(payload);
      setApiKey('');
      await loadSettings();
      dispatch(addToast({ type: 'success', message: 'Settings successfully updated!' }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: 'Failed to update settings.' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await settingsApi.testAi();
      setTestResult('Success: AI Provider responded with status 200 OK.');
      dispatch(addToast({ type: 'success', message: 'AI Connection verified successfully!' }));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'AI connection test failed.';
      setTestResult(`Error: ${msg}`);
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System &amp; AI Provider Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure real LLM provider credentials, verify model endpoints, and inspect system database connectivity.
        </p>
      </div>

      {/* Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI Key Status */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              status?.has_ai_api_key ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              <Key className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">AI Engine Status</span>
              <span className="text-sm font-bold text-white block mt-0.5">
                {status?.has_ai_api_key ? 'Cloud LLM (Connected)' : 'Aura Engine (Active & Ready)'}
              </span>
            </div>
          </div>
          {status?.has_ai_api_key ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Cloud Active
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Aura Ready
            </span>
          )}
        </div>

        {/* Database Status */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              status?.mongodb_connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Database Storage</span>
              <span className="text-sm font-bold text-white block mt-0.5">
                MongoDB Atlas (Cloud Active)
              </span>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            status?.mongodb_connected
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            {status?.mongodb_connected ? 'Atlas Cloud Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* MongoDB Atlas Cloud Persistence Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">MongoDB Atlas Cloud Database (Primary Engine)</h3>
                {status?.mongodb_connected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Connected
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cluster: <span className="font-mono text-emerald-400">{status?.mongodb_cluster || 'cluster0.yahem2x.mongodb.net'}</span> • DB: <span className="font-mono text-slate-200">{status?.mongodb_database || 'ai_resume_coach'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadSettings}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-xs font-semibold text-emerald-300 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Atlas Stats</span>
          </button>
        </div>

        {/* Live Collections Counter */}
        {status?.mongodb_collections && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Users</span>
              <span className="text-base font-bold text-white mt-0.5 block">{status.mongodb_collections.users ?? 0} docs</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Resumes</span>
              <span className="text-base font-bold text-white mt-0.5 block">{status.mongodb_collections.resumes ?? 0} docs</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Mock Interviews</span>
              <span className="text-base font-bold text-white mt-0.5 block">{status.mongodb_collections.interview_sessions ?? 0} docs</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Chat History</span>
              <span className="text-base font-bold text-white mt-0.5 block">{status.mongodb_collections.career_messages ?? 0} docs</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block font-medium">Target Jobs</span>
              <span className="text-base font-bold text-white mt-0.5 block">{status.mongodb_collections.job_descriptions ?? 0} docs</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Key & Model Form */}
      <form onSubmit={handleSaveSettings} className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span>LLM Provider Settings</span>
          </h3>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Test Connection Live</span>
          </button>
        </div>

        {testResult && (
          <div className={`p-3.5 rounded-xl border text-xs ${
            testResult.startsWith('Success') ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
          }`}>
            {testResult}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              AI API Key {status?.has_ai_api_key && '(Leave blank to keep currently saved key)'}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={status?.has_ai_api_key ? '••••••••••••••••••••••••••••••••' : 'sk-...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Never exposed to the frontend. Sent securely to the backend for streaming inference.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                AI API Base URL
              </label>
              <input
                type="text"
                required
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                OpenAI: https://api.openai.com/v1 | Groq: https://api.groq.com/openai/v1 | Ollama: http://localhost:11434/v1
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                AI Model Identifier
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                e.g. gpt-4o-mini, gpt-4o, llama-3.3-70b-versatile, deepseek-chat
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
