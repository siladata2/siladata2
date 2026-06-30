import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Users, Eye, Landmark, Activity, Calendar, FileText, Search, Download, Trash2, 
  Settings as SettingsIcon, LogOut, Lock, Check, RefreshCw, ChevronRight, FileDown, 
  Settings, Link as LinkIcon, Database, AlertTriangle, TrendingUp, Info
} from 'lucide-react';
import { ApiService } from '../utils/api';
import { Contact, VcfBatch, DashboardStats, AnalyticsData } from '../types';

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'contacts' | 'settings'>('dashboard');

  // Stats State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Settings edit state
  const [threshold, setThreshold] = useState<number>(100);
  const [groupUrl, setGroupUrl] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [newPin, setNewPin] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // General loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem('sila_vcf_admin_token');
    if (savedToken) {
      setIsLoggedIn(true);
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!pin.trim()) {
      setLoginError('Please enter your Admin PIN.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await ApiService.login(pin.trim());
      if (res.success) {
        localStorage.setItem('sila_vcf_admin_token', res.token);
        setIsLoggedIn(true);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Incorrect PIN. Try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sila_vcf_admin_token');
    setIsLoggedIn(false);
    setStats(null);
    setAnalytics(null);
    setContacts([]);
  };

  // Fetch all admin data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const dashboardStats = await ApiService.getDashboard();
      setStats(dashboardStats);
      setThreshold(dashboardStats.threshold);
      setGroupUrl(dashboardStats.whatsappGroupUrl);
      setChannelUrl(dashboardStats.whatsappChannelUrl);

      // Load analytics data
      const analyticsData = await ApiService.getAnalytics();
      setAnalytics(analyticsData);

      // Load initial contacts
      const initialContacts = await ApiService.searchContacts('');
      setContacts(initialContacts);
    } catch (err: any) {
      console.error('Failed to load admin panel data:', err);
      if (err.message?.includes('Unauthorized') || err.message?.includes('session')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Trigger search
  const handleSearch = async () => {
    try {
      const filtered = await ApiService.searchContacts(searchQuery);
      setContacts(filtered);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  // Delete specific contact
  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact? This action is irreversible.')) return;
    
    setActionLoading(true);
    try {
      await ApiService.deleteContact(id);
      // Refresh contacts list & stats
      const filtered = await ApiService.searchContacts(searchQuery);
      setContacts(filtered);
      
      const dashboardStats = await ApiService.getDashboard();
      setStats(dashboardStats);
    } catch (err: any) {
      alert(err.message || 'Failed to delete contact.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Counter
  const handleResetCounter = async () => {
    if (!confirm('Are you sure you want to reset the contact counter to 0? This will NOT delete contacts, only reset the threshold batch counter.')) return;
    
    setActionLoading(true);
    try {
      await ApiService.resetCounter();
      const dashboardStats = await ApiService.getDashboard();
      setStats(dashboardStats);
    } catch (err: any) {
      alert(err.message || 'Failed to reset counter.');
    } finally {
      setActionLoading(false);
    }
  };

  // Manual VCF Generation
  const handleManualVcf = async () => {
    setActionLoading(true);
    try {
      const res = await ApiService.manualGenerateVcf();
      if (res.success) {
        alert(`Success! Manual batch #${res.batch.batchNumber} generated with ${res.batch.contactsCount} contacts.`);
        loadAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to manually generate VCF.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save updated configurations
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(false);
    setActionLoading(true);

    try {
      await ApiService.updateSettings({
        downloadThreshold: threshold,
        whatsappGroupUrl: groupUrl,
        whatsappChannelUrl: channelUrl,
        adminPin: newPin.trim() || undefined
      });
      
      setSettingsSuccess(true);
      setNewPin('');
      
      // Reload stats
      const dashboardStats = await ApiService.getDashboard();
      setStats(dashboardStats);

      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setActionLoading(false);
    }
  };

  // Exporters
  const handleExportCSV = () => {
    try {
      const token = localStorage.getItem('sila_vcf_admin_token');
      window.open(`/api/admin/export/csv?token=${encodeURIComponent(token || '')}`, '_blank');
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  const handleExportJSON = () => {
    try {
      const token = localStorage.getItem('sila_vcf_admin_token');
      window.open(`/api/admin/export/json?token=${encodeURIComponent(token || '')}`, '_blank');
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  // Recharts Chart Colors
  const COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative"
        >
          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">SILA VCF Admin</h2>
            <p className="text-xs text-neutral-400">Enter secure dashboard access PIN to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Secure PIN Code
              </label>
              <input
                type="password"
                required
                maxLength={20}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center tracking-[0.5em] font-mono text-xl py-3.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-700 placeholder:tracking-normal"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-emerald-600/15 cursor-pointer flex items-center justify-center gap-2"
            >
              {loginLoading ? 'Unlocking...' : 'Unlock Workspace'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-neutral-900 bg-neutral-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center text-neutral-950 font-bold text-base">
              S
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base">SILA</span>
              <span className="text-xs text-emerald-400 font-medium ml-1.5 uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Admin Portal</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="hidden md:flex items-center gap-1.5 bg-neutral-950/60 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-100'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-100'}`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'contacts' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-100'}`}
            >
              Contacts Directory
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-100'}`}
            >
              Settings
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors bg-red-500/5 border border-red-500/10 hover:border-red-500/20 px-3.5 py-2 rounded-xl cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lock Session</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex overflow-x-auto border-t border-neutral-900 bg-neutral-950 p-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 text-center py-2.5 text-[11px] font-bold tracking-wider uppercase border-b-2 ${activeTab === 'dashboard' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-neutral-400'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 text-center py-2.5 text-[11px] font-bold tracking-wider uppercase border-b-2 ${activeTab === 'analytics' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-neutral-400'}`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 text-center py-2.5 text-[11px] font-bold tracking-wider uppercase border-b-2 ${activeTab === 'contacts' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-neutral-400'}`}
          >
            Contacts
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 text-center py-2.5 text-[11px] font-bold tracking-wider uppercase border-b-2 ${activeTab === 'settings' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-neutral-400'}`}
          >
            Settings
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-neutral-400">Loading secure admin data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Stat Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Contacts */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-4 right-4 h-9 w-9 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <div className="text-neutral-400 text-xs font-semibold tracking-wider uppercase">Total Contacts</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  {stats?.totalContacts.toLocaleString() || 0}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">Overall registered entries</p>
              </div>

              {/* Contacts Today */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-4 right-4 h-9 w-9 bg-cyan-500/10 text-cyan-400 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="text-neutral-400 text-xs font-semibold tracking-wider uppercase">Contacts Today</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  {stats?.contactsToday.toLocaleString() || 0}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">Submitted in last 24h</p>
              </div>

              {/* Total Visits */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-4 right-4 h-9 w-9 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center">
                  <Eye className="h-4 w-4" />
                </div>
                <div className="text-neutral-400 text-xs font-semibold tracking-wider uppercase">Website Visits</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  {stats?.totalVisits.toLocaleString() || 0}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">Visits log tracking count</p>
              </div>

              {/* Online Now */}
              <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-4 right-4 h-9 w-9 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="text-neutral-400 text-xs font-semibold tracking-wider uppercase font-sans flex items-center gap-1.5">
                  Online Visitors
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse inline-block" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  {stats?.onlineVisitors.toLocaleString() || 0}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">Active in previous 5m</p>
              </div>
            </div>

            {/* TAB CONTENT: 1. Dashboard Overview */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Columns - Batch Status & History */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Batch Threshold Gauge */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Database className="h-5 w-5 text-emerald-400" />
                          Current Batch Status
                        </h3>
                        <p className="text-xs text-neutral-400 mt-1">Monitor the live threshold queue and manual actions</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleManualVcf}
                          disabled={actionLoading}
                          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Generate VCF Manually
                        </button>
                        <button
                          onClick={handleResetCounter}
                          disabled={actionLoading}
                          className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Reset Counter
                        </button>
                      </div>
                    </div>

                    <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800">
                      <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                        <span>Threshold Progress Status</span>
                        <span className="font-bold text-emerald-400">
                          {stats?.currentCounter} / {stats?.threshold} Contacts ({Math.round(((stats?.currentCounter || 0) / (stats?.threshold || 100)) * 100)}%)
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-neutral-900 h-4 rounded-full overflow-hidden p-[2px] border border-neutral-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(((stats?.currentCounter || 0) / (stats?.threshold || 100)) * 100, 100)}%` }}
                          className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-3">
                        <span>Min Threshold: {stats?.threshold}</span>
                        <span>Counter resets to zero after download is triggered</span>
                      </div>
                    </div>
                  </div>

                  {/* VCF Batch Download History */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                      <FileDown className="h-5 w-5 text-emerald-400" />
                      Generated VCF Batches ({stats?.downloadHistory.length})
                    </h3>

                    {stats && stats.downloadHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-neutral-800 text-neutral-400 font-semibold uppercase">
                              <th className="py-3 px-2">Batch</th>
                              <th className="py-3 px-2">File Name</th>
                              <th className="py-3 px-2">Contacts</th>
                              <th className="py-3 px-2">Created Date</th>
                              <th className="py-3 px-2 text-right">Download</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-900">
                            {stats.downloadHistory.map((batch) => (
                              <tr key={batch._id} className="hover:bg-neutral-950/40 transition-colors">
                                <td className="py-3.5 px-2 font-mono text-emerald-400 font-bold">
                                  #{batch.batchNumber}
                                </td>
                                <td className="py-3.5 px-2 text-neutral-200 truncate max-w-[150px]">
                                  {batch.filename}
                                </td>
                                <td className="py-3.5 px-2 font-semibold">
                                  {batch.contactsCount} contacts
                                </td>
                                <td className="py-3.5 px-2 text-neutral-400">
                                  {new Date(batch.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-3.5 px-2 text-right">
                                  <a
                                    href={`/api/admin/download-batch/${batch._id}`}
                                    className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg font-semibold transition-all"
                                  >
                                    <Download className="h-3 w-3" />
                                    <span>Download</span>
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-neutral-500 bg-neutral-950/40 rounded-2xl border border-neutral-800 text-xs">
                        No previous VCF batches have been generated yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Recent Contacts */}
                <div className="space-y-8">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Recent Submissions</h3>
                      <button
                        onClick={() => setActiveTab('contacts')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-0.5"
                      >
                        View All
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {stats && stats.recentContacts.length > 0 ? (
                      <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[460px] pr-1">
                        {stats.recentContacts.map((contact) => (
                          <div
                            key={contact._id}
                            className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between hover:border-emerald-500/20 transition-all"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold text-white truncate">{contact.name}</div>
                              <div className="text-[10px] text-neutral-400 mt-1 font-mono">{contact.phone}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] bg-neutral-900 px-2 py-0.5 rounded text-neutral-400 border border-neutral-800 uppercase tracking-wider">
                                {contact.country || 'KE'}
                              </span>
                              <div className="text-[9px] text-neutral-500 mt-1">
                                {new Date(contact.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-neutral-500 italic text-xs">
                        No contacts submitted yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. Analytics Insights */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Traffic vs Submissions Chart */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Audience Traffic & submissions Trend (Last 15 Days)
                  </h3>
                  
                  {analytics && analytics.dailyVisits.length > 0 ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={analytics.dailyVisits.map((v, i) => ({
                            date: v.date,
                            visits: v.count,
                            submissions: analytics.submissionsByDay.find(s => s.date === v.date)?.count || 0
                          }))}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                          <XAxis dataKey="date" stroke="#737373" style={{ fontSize: '10px' }} />
                          <YAxis stroke="#737373" style={{ fontSize: '10px' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                          <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" name="Page Visits" />
                          <Area type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSubmissions)" name="Submissions" />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-neutral-500 italic text-xs">
                      Not enough visit metrics logged to render analytical graphs.
                    </div>
                  )}
                </div>

                {/* Demographics row - Country, Device, Browser */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Countries Chart */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-5">Country Analytics</h4>
                    {analytics && analytics.countries.length > 0 ? (
                      <div className="h-64 flex flex-col justify-between">
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analytics.countries}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {analytics.countries.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '10px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400 pt-2">
                          {analytics.countries.slice(0, 6).map((item, index) => (
                            <div key={item.name} className="flex items-center gap-1.5 truncate">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="font-mono text-white">{item.name}</span>
                              <span className="text-neutral-500">({item.value})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-neutral-500 text-xs">No country metrics.</div>
                    )}
                  </div>

                  {/* Device Distribution Chart */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-5">Device Distribution</h4>
                    {analytics && analytics.devices.length > 0 ? (
                      <div className="h-64 flex flex-col justify-between">
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analytics.devices}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {analytics.devices.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '10px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400 pt-2">
                          {analytics.devices.map((item, index) => (
                            <div key={item.name} className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                              <span className="text-white capitalize">{item.name}</span>
                              <span className="text-neutral-500">({item.value})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-neutral-500 text-xs">No device metrics.</div>
                    )}
                  </div>

                  {/* Browser analytics */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-5">Browsers Tracked</h4>
                    {analytics && analytics.browsers.length > 0 ? (
                      <div className="h-64 flex flex-col justify-between">
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.browsers} layout="vertical" margin={{ left: -10, right: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                              <XAxis type="number" stroke="#737373" style={{ fontSize: '9px' }} />
                              <YAxis dataKey="name" type="category" stroke="#737373" style={{ fontSize: '9px' }} width={55} />
                              <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '10px' }} />
                              <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-center text-[10px] text-neutral-500 pt-2 italic">
                          Most popular client browsers logging sessions
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-neutral-500 text-xs">No browser metrics.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. Contacts Database */}
            {activeTab === 'contacts' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6">
                
                {/* Search & Actions Header */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-400" />
                      Contacts Directory
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">Review, search, and manage registered contacts and export spreadsheets</p>
                  </div>
                  
                  {/* Export Spreadsheet actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export JSON
                    </button>
                  </div>
                </div>

                {/* Search Input Bar */}
                <div className="flex gap-2.5 max-w-md">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                      <Search className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search Name, Phone, IP or Country..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-9 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-neutral-600"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Search
                  </button>
                </div>

                {/* Contacts Table */}
                <div className="overflow-x-auto">
                  {contacts.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-neutral-800 text-neutral-400 font-semibold uppercase">
                          <th className="py-3 px-3">Name</th>
                          <th className="py-3 px-3">Phone Number</th>
                          <th className="py-3 px-3">IP Address</th>
                          <th className="py-3 px-3">Country</th>
                          <th className="py-3 px-3">Device/Browser</th>
                          <th className="py-3 px-3">Date Registered</th>
                          <th className="py-3 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900">
                        {contacts.map((contact) => (
                          <tr key={contact._id} className="hover:bg-neutral-950/40 transition-colors">
                            <td className="py-3.5 px-3 font-semibold text-white">
                              {contact.name}
                            </td>
                            <td className="py-3.5 px-3 font-mono text-emerald-400">
                              {contact.phone}
                            </td>
                            <td className="py-3.5 px-3 text-neutral-400 font-mono">
                              {contact.ip}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="font-mono bg-neutral-950 px-2 py-0.5 border border-neutral-800 rounded text-neutral-400">
                                {contact.country || 'Unknown'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-neutral-400">
                              <span className="capitalize">{contact.device}</span> / {contact.browser}
                            </td>
                            <td className="py-3.5 px-3 text-neutral-500">
                              {new Date(contact.createdAt).toLocaleDateString()} {new Date(contact.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <button
                                onClick={() => handleDeleteContact(contact._id!)}
                                disabled={actionLoading}
                                className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-16 text-neutral-500 italic">
                      No matching contacts found in the registry directory.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 4. Platform Settings */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-emerald-400" />
                  SILA VCF Configurations
                </h3>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  {settingsSuccess && (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      <span>Configurations saved successfully.</span>
                    </div>
                  )}

                  {/* Threshold setting */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                      Auto-Download Threshold Counter
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10000}
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                    <p className="text-[11px] text-neutral-500 mt-2">
                      Adjust how many contacts must register before generating and downloading the batch. Default is 100.
                    </p>
                  </div>

                  {/* WhatsApp Group Url */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5 text-emerald-500" />
                      WhatsApp Group invitation Link
                    </label>
                    <input
                      type="url"
                      required
                      value={groupUrl}
                      onChange={(e) => setGroupUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono text-xs"
                    />
                  </div>

                  {/* WhatsApp Channel Url */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5 text-emerald-500" />
                      WhatsApp Channel invitation Link
                    </label>
                    <input
                      type="url"
                      required
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono text-xs"
                    />
                  </div>

                  {/* Change login PIN */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                      Change Admin login PIN
                    </label>
                    <input
                      type="password"
                      placeholder="Leave empty to keep existing PIN"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                    <p className="text-[11px] text-neutral-500 mt-2">
                      Set a new security code PIN to access this panel. Make sure to remember it!
                    </p>
                  </div>

                  {/* Submit updates */}
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    Save Configuration Settings
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
