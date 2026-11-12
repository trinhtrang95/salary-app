'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthView from '@/components/AuthView';
import SalaryConfigTab from '@/components/SalaryConfigTab';
import TimesheetTab from '@/components/TimesheetTab';
import PayrollTab from '@/components/PayrollTab';
import { SalaryConfig } from '@/types';
import { Settings, CalendarDays, Receipt, LogOut } from 'lucide-react';

export default function MainPage() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timesheet' | 'payroll' | 'settings'>('timesheet');

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

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!session) {
    return <AuthView onSuccess={checkUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-black text-indigo-600 text-lg">💰 CHẤM CÔNG & LƯƠNG</div>
          <button
            onClick={() => supabase.auth.signOut().then(() => setSession(null))}
            className="flex items-center gap-1 text-xs text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-xl transition hover:bg-rose-100"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-4 flex gap-2">
          <button
            onClick={() => setActiveTab('timesheet')}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-1.5 ${
              activeTab === 'timesheet' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
            }`}
          >
            <CalendarDays className="w-4 h-4" /> Chấm Công
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-1.5 ${
              activeTab === 'payroll' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
            }`}
          >
            <Receipt className="w-4 h-4" /> Phiếu Lương
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
            }`}
          >
            <Settings className="w-4 h-4" /> Cài Đặt
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6">
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
        {activeTab === 'payroll' && (
          <PayrollTab
            userId={session.user.id}
            config={salaryConfig}
            currentMonth={currentMonth}
            currentYear={currentYear}
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
    </div>
  );
}
