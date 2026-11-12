'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DayTimesheet } from '@/types';
import { Save, Wand2, Calendar, CheckCircle2, RotateCcw } from 'lucide-react';

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
    if (confirm('Bạn muốn đưa số giờ về 0 hết?')) {
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
      <div className="bg-white rounded-2xl p-4 shadow-sm border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <select
            value={currentMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="p-2 border rounded-xl font-bold"
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
            className="p-2 border rounded-xl font-bold"
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
            className="px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1"
          >
            <Wand2 className="w-3.5 h-3.5" /> Điền 8h T2-T7
          </button>
          <button
            onClick={handleClearAll}
            type="button"
            className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Xóa
          </button>
          <button
            onClick={handleSaveTimesheet}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Lưu...' : 'Lưu'}
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Đã lưu bảng chấm công thành công!
        </div>
      )}

      {/* Hiển thị trên máy tính (Table) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-slate-600">
              <th className="p-3 text-center w-16">Ngày</th>
              <th className="p-3 text-center w-16">Thứ</th>
              <th className="p-3 text-center">Hành chính (8h)</th>
              <th className="p-3 text-center text-amber-600">Làm thêm 150%</th>
              <th className="p-3 text-center text-rose-600">Làm thêm 200%</th>
              <th className="p-3 text-center text-emerald-600">Phép hưởng lương</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {days.map((d) => (
              <tr key={d.dateStr} className={d.isSunday ? 'bg-rose-50/50' : ''}>
                <td className="p-2 text-center font-bold">{d.dayNumber}</td>
                <td className="p-2 text-center font-semibold text-xs">
                  <span className={d.isSunday ? 'text-rose-600' : 'text-slate-600'}>{d.dayOfWeek}</span>
                </td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    step="0.5"
                    value={d.normal_hours || ''}
                    onChange={(e) => handleHourChange(d.dateStr, 'normal_hours', e.target.value)}
                    className="w-20 text-center py-1 border rounded-lg"
                    placeholder="0"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    step="0.5"
                    value={d.ot_150_hours || ''}
                    onChange={(e) => handleHourChange(d.dateStr, 'ot_150_hours', e.target.value)}
                    className="w-20 text-center py-1 border rounded-lg text-amber-600"
                    placeholder="0"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    step="0.5"
                    value={d.ot_200_hours || ''}
                    onChange={(e) => handleHourChange(d.dateStr, 'ot_200_hours', e.target.value)}
                    className="w-20 text-center py-1 border rounded-lg text-rose-600"
                    placeholder="0"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    step="0.5"
                    value={d.leave_hours || ''}
                    onChange={(e) => handleHourChange(d.dateStr, 'leave_hours', e.target.value)}
                    className="w-20 text-center py-1 border rounded-lg text-emerald-600"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold">
              <td colSpan={2} className="p-3 text-center">Tổng:</td>
              <td className="p-3 text-center text-indigo-700">{totalHC.toFixed(1)}h</td>
              <td className="p-3 text-center text-amber-600">{totalOT150.toFixed(1)}h</td>
              <td className="p-3 text-center text-rose-600">{totalOT200.toFixed(1)}h</td>
              <td className="p-3 text-center text-emerald-600">{totalLeave.toFixed(1)}h</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Hiển thị trên điện thoại (Cards) */}
      <div className="block md:hidden space-y-3">
        {days.map((d) => (
          <div key={d.dateStr} className={`p-4 rounded-2xl border ${d.isSunday ? 'bg-rose-50/50' : 'bg-white'}`}>
            <div className="flex justify-between font-bold mb-2">
              <span>Ngày {d.dayNumber} ({d.dayOfWeek})</span>
              <span className="text-xs text-slate-400 font-normal">{d.dateStr}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span>Hành chính:</span>
                <input
                  type="number"
                  step="0.5"
                  value={d.normal_hours || ''}
                  onChange={(e) => handleHourChange(d.dateStr, 'normal_hours', e.target.value)}
                  className="w-full text-center p-1.5 border rounded-lg font-bold"
                  placeholder="0"
                />
              </div>
              <div>
                <span className="text-amber-600">Tăng ca 150%:</span>
                <input
                  type="number"
                  step="0.5"
                  value={d.ot_150_hours || ''}
                  onChange={(e) => handleHourChange(d.dateStr, 'ot_150_hours', e.target.value)}
                  className="w-full text-center p-1.5 border rounded-lg text-amber-600 font-bold"
                  placeholder="0"
                />
              </div>
              <div>
                <span className="text-rose-600">Tăng ca 200%:</span>
                <input
                  type="number"
                  step="0.5"
                  value={d.ot_200_hours || ''}
                  onChange={(e) => handleHourChange(d.dateStr, 'ot_200_hours', e.target.value)}
                  className="w-full text-center p-1.5 border rounded-lg text-rose-600 font-bold"
                  placeholder="0"
                />
              </div>
              <div>
                <span className="text-emerald-600">Nghỉ phép:</span>
                <input
                  type="number"
                  step="0.5"
                  value={d.leave_hours || ''}
                  onChange={(e) => handleHourChange(d.dateStr, 'leave_hours', e.target.value)}
                  className="w-full text-center p-1.5 border rounded-lg text-emerald-600 font-bold"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="bg-slate-900 text-white p-4 rounded-2xl sticky bottom-2 text-xs grid grid-cols-2 gap-2">
          <div>HC: <b className="text-indigo-300">{totalHC.toFixed(1)}h</b></div>
          <div>LT 150%: <b className="text-amber-300">{totalOT150.toFixed(1)}h</b></div>
          <div>LT 200%: <b className="text-rose-300">{totalOT200.toFixed(1)}h</b></div>
          <div>Phép: <b className="text-emerald-300">{totalLeave.toFixed(1)}h</b></div>
        </div>
      </div>
    </div>
  );
}