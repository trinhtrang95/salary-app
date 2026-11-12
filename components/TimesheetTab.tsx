'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DayTimesheet } from '@/types';
import { Save, Wand2, RotateCcw, CheckCircle2 } from 'lucide-react';

const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function TimesheetTab({
  userId,
  currentMonth,
  currentYear,
  onMonthChange,
  onYearChange,
  onTimesheetUpdated,
}: any) {
  const [days, setDays] = useState<DayTimesheet[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(false);

  const generateMonthDays = (year: number, month: number): DayTimesheet[] => {
    const totalDays = new Date(year, month, 0).getDate();
    const result: DayTimesheet[] = [];

    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeekIdx = dateObj.getDay();
      const padM = String(month).padStart(2, '0');
      const padD = String(day).padStart(2, '0');
      const dateStr = `${year}-${padM}-${padD}`;

      result.push({
        dateStr,
        dayNumber: day,
        dayOfWeek: dayNames[dayOfWeekIdx],
        isSunday: dayOfWeekIdx === 0,
        normal_hours: 0,
        ot_150_hours: 0,
        ot_200_hours: 0,
        leave_hours: 0,
      });
    }
    return result;
  };

  const loadTimesheets = async () => {
    const baseDays = generateMonthDays(currentYear, currentMonth);
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(baseDays.length).padStart(2, '0')}`;

    const { data } = await supabase
      .from('timesheets')
      .select('*')
      .eq('user_id', userId)
      .gte('work_date', startDate)
      .lte('work_date', endDate);

    if (data && data.length > 0) {
      setDays(
        baseDays.map((d) => {
          const found = data.find((row) => row.work_date === d.dateStr);
          return found
            ? {
                ...d,
                normal_hours: Number(found.normal_hours),
                ot_150_hours: Number(found.ot_150_hours),
                ot_200_hours: Number(found.ot_200_hours),
                leave_hours: Number(found.leave_hours),
              }
            : d;
        })
      );
    } else {
      setDays(baseDays);
    }
  };

  useEffect(() => {
    if (userId) loadTimesheets();
  }, [userId, currentMonth, currentYear]);

  const handleHourChange = (dateStr: string, field: any, val: string) => {
    const num = Math.max(0, Number(val) || 0);
    setDays((prev) => prev.map((d) => (d.dateStr === dateStr ? { ...d, [field]: num } : d)));
  };

  const handleQuickFillWeekdays = () => {
    setDays((prev) =>
      prev.map((d) => (!d.isSunday && d.normal_hours === 0 && d.leave_hours === 0 ? { ...d, normal_hours: 8 } : d))
    );
  };

  const handleClearAll = () => {
    if (confirm('Bạn muốn đặt lại số giờ của tháng này về 0?')) {
      setDays((prev) => prev.map((d) => ({ ...d, normal_hours: 0, ot_150_hours: 0, ot_200_hours: 0, leave_hours: 0 })));
    }
  };

  const handleSaveTimesheet = async () => {
    setSaving(true);
    try {
      const recordsToUpsert = days.map((d) => ({
        user_id: userId,
        work_date: d.dateStr,
        normal_hours: d.normal_hours,
        ot_150_hours: d.ot_150_hours,
        ot_200_hours: d.ot_200_hours,
        leave_hours: d.leave_hours,
      }));

      await supabase.from('timesheets').upsert(recordsToUpsert, { onConflict: 'user_id,work_date' });
      setMsg(true);
      onTimesheetUpdated();
      setTimeout(() => setMsg(false), 2500);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalHC = days.reduce((sum, d) => sum + d.normal_hours, 0);
  const totalOT150 = days.reduce((sum, d) => sum + d.ot_150_hours, 0);
  const totalOT200 = days.reduce((sum, d) => sum + d.ot_200_hours, 0);
  const totalLeave = days.reduce((sum, d) => sum + d.leave_hours, 0);

  return (
    <div className="space-y-4">
      {/* THANH ĐIỀU KHIỂN & CHỌN THÁNG */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2">
          <select
            value={currentMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="bg-slate-800 text-white border border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="bg-slate-800 text-white border border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickFillWeekdays}
            type="button"
            className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Wand2 className="w-3.5 h-3.5" /> Điền 8h T2-T7
          </button>
          <button
            onClick={handleClearAll}
            type="button"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl transition"
            title="Xóa trắng tháng"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSaveTimesheet}
            disabled={saving}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? '...' : 'Lưu'}
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Đã lưu thành công dữ liệu chấm công!
        </div>
      )}

      {/* DANH SÁCH THẺ CHẤM CÔNG MOBILE (VUỐT CHẠM CỰC SANG) */}
      <div className="space-y-2.5">
        {days.map((d) => (
          <div
            key={d.dateStr}
            className={`p-3.5 rounded-3xl border transition-all ${
              d.isSunday
                ? 'bg-rose-950/20 border-rose-900/40'
                : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                    d.isSunday ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {d.dayNumber}
                </span>
                <span className={`text-xs font-bold ${d.isSunday ? 'text-rose-400' : 'text-slate-400'}`}>
                  {d.dayOfWeek}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">{d.dateStr}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              <div className="bg-slate-950/60 p-2 rounded-2xl border border-slate-800/60">
                <span className="text-slate-400 block mb-1">HC (8h)</span>
                <input
                  type="number"
                  step="0.5"
                  value={d.normal_hours || ''}
                  onChange={(e) => handleHourChange(d.dateStr, 'normal_hours', e.target.value)}
                  placeholder="0"
                  className="w-full text-center bg-transparent font-bold text-white focus:outline-none"
                />
              </div>

              <div className="bg-amber-950/20 p-2 rounded-2xl border border-amber-900/30">
                <span className="text-amber-400 block mb-1">150%</span>
                <input
                  type="number"
                  step="0.5"
                  value={d.ot_150_hours || ''}
                  onChange={(e) => handleHourChange(d.dateStr, 'ot_150_hours', e.target.value)}
                  placeholder="0"
                  className="w-full text-center bg-transparent font-bold text-amber-300 focus:outline-none"
                />
              </div>

              <div className="bg-rose-950/20 p-2 rounded-2xl border border-rose-900/30">
                <span className="text-rose-400 block mb-1">200%</span>
                <input
                  type="number"
                  step="0.5"
                  value={d.ot_200_hours || ''}
                  onChange={(e) => handleHourChange(d.dateStr, 'ot_200_hours', e.target.value)}
                  placeholder="0"
                  className="w-full text-center bg-transparent font-bold text-rose-300 focus:outline-none"
                />
              </div>

              <div className="bg-emerald-950/20 p-2 rounded-2xl border border-emerald-900/30">
                <span className="text-emerald-400 block mb-1">Phép</span>
                <input
                  type="number"
                  step="0.5"
                  value={d.leave_hours || ''}
                  onChange={(e) => handleHourChange(d.dateStr, 'leave_hours', e.target.value)}
                  placeholder="0"
                  className="w-full text-center bg-transparent font-bold text-emerald-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* THANH TỔNG CỘNG NẰM NỔI Ở ĐÁY */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-4 rounded-3xl shadow-2xl sticky bottom-20 sm:bottom-4">
        <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
          Tổng Giờ Làm Tháng {currentMonth}
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs font-bold">
          <div>HC: <span className="text-indigo-400">{totalHC.toFixed(1)}h</span></div>
          <div>150%: <span className="text-amber-400">{totalOT150.toFixed(1)}h</span></div>
          <div>200%: <span className="text-rose-400">{totalOT200.toFixed(1)}h</span></div>
          <div>Phép: <span className="text-emerald-400">{totalLeave.toFixed(1)}h</span></div>
        </div>
      </div>
    </div>
  );
}
