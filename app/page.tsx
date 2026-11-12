'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthView from '@/components/AuthView';
import SalaryConfigTab from '@/components/SalaryConfigTab';
import TimesheetTab from '@/components/TimesheetTab';
import PayrollTab from '@/components/PayrollTab';
import { SalaryConfig } from '@/types';
import { Settings, CalendarDays, Wallet, LogOut, Sparkles } from 'lucide-react';

export default function MainPage() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timesheet' | 'payroll' | 'settings'>('payroll');

  const [currentMonth, setCurrentMonth] = useState<number>(11);
  const [currentYear, setCurrentYear] = useState<number>(2025);

  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig>({
    rank_level: 'K-F',
    basic_salary: 6033000,
    responsibility_salary: 3600000,
    seniority_allowance: 400000,
    diligence_allowance: 200000,
    standard_work_days: 26,
    insurance_rate: 10.5,
    union_rate: 0.5,
  });

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        await loadConfig(session.user.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async (userId: string) => {
    const { data } = await supabase.from('salary_configs').select('*').eq('user_id', userId).maybeSingle();
    if (data) setSalaryConfig(data);
  };

  useEffect(() => {
    setMounted(true);
    const d = new Date();
    setCurrentMonth(d.getMonth() + 1);
    setCurrentYear(d.getFullYear());
    checkUser();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm animate-pulse">Đang tải bảng lương...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthView onSuccess={checkUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 sm:pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">Bảng Lương Của Tôi</h1>
              <p className="text-xs text-slate-400 truncate max-w-[180px] sm:max-w-none">{session.user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Tabs */}
            <div className="hidden sm:flex bg-slate-900 border border-slate-800 p-1 rounded-2xl gap-1">
              <button
                onClick={() => setActiveTab('payroll')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'payroll' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Phiếu Lương
              </button>
              <button
                onClick={() => setActiveTab('timesheet')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'timesheet' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Chấm Công
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cài Đặt
              </button>
            </div>

            <button
              onClick={() => supabase.auth.signOut().then(() => setSession(null))}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        {activeTab === 'payroll' && (
          <PayrollTab
            userId={session.user.id}
            config={salaryConfig}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        )}
        {activeTab === 'timesheet' && (
          <TimesheetTab
            userId={session.user.id}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onMonthChange={setCurrentMonth}
            onYearChange={setCurrentYear}
            onTimesheetUpdated={() => {}}
          />
        )}
        {activeTab === 'settings' && (
          <SalaryConfigTab
            config={salaryConfig}
            userId={session.user.id}
            onRefresh={() => loadConfig(session.user.id)}
          />
        )}
      </main>

      {/* Modern Mobile Bottom Navigation (Kiểu iPhone) */}
      <nav className="sm:hidden fixed bottom-4 left-4 right-4 z-50 bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-2 shadow-2xl shadow-black/80 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex flex-col items-center gap-1 py-1 px-5 rounded-2xl transition-all ${
            activeTab === 'payroll' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-bold">Phiếu Lương</span>
        </button>

        <button
          onClick={() => setActiveTab('timesheet')}
          className={`flex flex-col items-center gap-1 py-1 px-5 rounded-2xl transition-all ${
            activeTab === 'timesheet' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-bold">Chấm Công</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-5 rounded-2xl transition-all ${
            activeTab === 'settings' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold">Cài Đặt</span>
        </button>
      </nav>
    </div>
  );
}
