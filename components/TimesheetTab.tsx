'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DayTimesheet } from '@/types';
import {
  Save,
  Wand2,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Minus,
  Sparkles,
  Clock,
} from 'lucide-react';

const dayHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const dayNamesFull = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // State quản lý khay kéo Bottom Sheet
  const [selectedDay, setSelectedDay] = useState<DayTimesheet | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Sinh danh sách ngày và các ô trống đầu tháng
  const generateMonthData = (year: number, month: number) => {
    const totalDays = new Date(year, month, 0).getDate();
    // Thứ của ngày mùng 1 (0 là CN, 1 là T2,...)
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    // Đổi về chuẩn T2 = 0, CN = 6
    const paddingCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

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
        dayOfWeek: dayNamesFull[dayOfWeekIdx],
        isSunday: dayOfWeekIdx === 0,
        normal_hours: 0,
        ot_150_hours: 0,
        ot_200_hours: 0,
        leave_hours: 0,
      });
    }
    return { days: result, paddingCount };
  };

  const { paddingCount } = generateMonthData(currentYear, currentMonth);

  const loadTimesheets = async () => {
    const { days: baseDays } = generateMonthData(currentYear, currentMonth);
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

  // Đổi tháng trước/sau
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      onMonthChange(12);
      onYearChange(currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onMonthChange(1);
      onYearChange(currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1);
    }
  };

  // Mở Bottom Sheet cho ngày được chọn
  const handleOpenDay = (day: DayTimesheet) => {
    setSelectedDay({ ...day });
    setIsSheetOpen(true);
  };

  // Cập nhật giá trị trong Bottom Sheet
  const updateSelectedHour = (
    field: 'normal_hours' | 'ot_150_hours' | 'ot_200_hours' | 'leave_hours',
    delta: number
  ) => {
    if (!selectedDay) return;
    const currentVal = selectedDay[field] || 0;
    const newVal = Math.max(0, Math.min(24, Math.round((currentVal + delta) * 10) / 10));
    setSelectedDay({ ...selectedDay, [field]: newVal });
  };

  // Nút chọn nhanh (Quick Presets)
  const applyPreset = (type: 'standard' | 'leave' | 'ot1' | 'ot2') => {
    if (!selectedDay) return;
    if (type === 'standard') {
      setSelectedDay({ ...selectedDay, normal_hours: 8, leave_hours: 0 });
    } else if (type === 'leave') {
      setSelectedDay({ ...selectedDay, leave_hours: 8, normal_hours: 0 });
    } else if (type === 'ot1') {
      setSelectedDay({ ...selectedDay, ot_150_hours: (selectedDay.ot_150_hours || 0) + 1.0 });
    } else if (type === 'ot2') {
      setSelectedDay({ ...selectedDay, ot_150_hours: (selectedDay.ot_150_hours || 0) + 2.0 });
    }
  };

  // Lưu ngày hiện tại từ Bottom Sheet vào danh sách chính
  const handleSaveDayModal = () => {
    if (!selectedDay) return;
    setDays((prev) => prev.map((d) => (d.dateStr === selectedDay.dateStr ? selectedDay : d)));
    setIsSheetOpen(false);
  };

  // Điền nhanh cả tháng
  const handleQuickFillMonth = () => {
    setDays((prev) =>
      prev.map((d) => (!d.isSunday && d.normal_hours === 0 && d.leave_hours === 0 ? { ...d, normal_hours: 8 } : d))
    );
    showToast('Đã điền 8h cho toàn bộ các ngày T2 - T7!');
  };

  const handleClearMonth = () => {
    if (confirm('Đặt lại toàn bộ số giờ trong tháng về 0?')) {
      setDays((prev) =>
        prev.map((d) => ({ ...d, normal_hours: 0, ot_150_hours: 0, ot_200_hours: 0, leave_hours: 0 }))
      );
      showToast('Đã xóa trắng số giờ trong tháng!');
    }
  };

  // Lưu vào Supabase Database
  const handleSaveTimesheet = async () => {
    setSaving(true);
    try {
      const payload = days.map((d) => ({
        user_id: userId,
        work_date: d.dateStr,
        normal_hours: d.normal_hours,
        ot_150_hours: d.ot_150_hours,
        ot_200_hours: d.ot_200_hours,
        leave_hours: d.leave_hours,
      }));

      await supabase.from('timesheets').upsert(payload, { onConflict: 'user_id,work_date' });
      showToast('Đã lưu dữ liệu chấm công lên đám mây!');
      onTimesheetUpdated();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Tính tổng số giờ
  const totalHC = days.reduce((sum, d) => sum + d.normal_hours, 0);
  const totalOT150 = days.reduce((sum, d) => sum + d.ot_150_hours, 0);
  const totalOT200 = days.reduce((sum, d) => sum + d.ot_200_hours, 0);
  const totalLeave = days.reduce((sum, d) => sum + d.leave_hours, 0);
  const totalAllHours = totalHC + totalOT150 + totalOT200 + totalLeave;

  return (
    <div className="space-y-5">
      {/* THANH ĐIỀU HƯỚNG THÁNG DẠNG LỊCH CAO CẤP */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="w-10 h-10 rounded-2xl bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
              Tháng {currentMonth}, {currentYear}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">Tổng tích lũy: {totalAllHours.toFixed(1)} giờ</p>
          </div>
          <button
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-2xl bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-all active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickFillMonth}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-2xl text-xs font-bold transition"
            title="Điền 8h cho T2-T7"
          >
            <Wand2 className="w-3.5 h-3.5" /> Điền 8h T2-T7
          </button>
          <button
            onClick={handleClearMonth}
            className="p-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-400 rounded-2xl transition"
            title="Xóa trắng tháng"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSaveTimesheet}
            disabled={saving}
            className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu Công'}
          </button>
        </div>
      </div>

      {/* TOAST THÔNG BÁO NỔI */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      {/* LƯỚI LỊCH THÁNG CHUẨN IOS CALENDAR (7 CỘT) */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-3 sm:p-6 shadow-2xl backdrop-blur-xl">
        {/* Hàng Tiêu đề Thứ */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {dayHeaders.map((dh, idx) => (
            <div
              key={dh}
              className={`text-xs font-bold py-2 ${
                idx === 6 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {dh}
            </div>
          ))}
        </div>

        {/* Ma trận các ngày */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
          {/* Ô trống đệm đầu tháng */}
          {Array.from({ length: paddingCount }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square rounded-2xl bg-slate-950/20 border border-transparent" />
          ))}

          {/* Các ngày trong tháng */}
          {days.map((day) => {
            const hasWork = day.normal_hours > 0;
            const hasOT150 = day.ot_150_hours > 0;
            const hasOT200 = day.ot_200_hours > 0;
            const hasLeave = day.leave_hours > 0;
            const dayTotal = day.normal_hours + day.ot_150_hours + day.ot_200_hours + day.leave_hours;

            return (
              <button
                key={day.dateStr}
                onClick={() => handleOpenDay(day)}
                className={`relative aspect-square sm:aspect-auto sm:min-h-[92px] p-1.5 sm:p-2.5 rounded-2xl border transition-all flex flex-col justify-between items-center sm:items-start group active:scale-90 ${
                  day.isSunday
                    ? 'bg-rose-950/10 border-rose-900/20 text-rose-300'
                    : hasWork || hasLeave
                    ? 'bg-slate-800/60 border-slate-700/80 hover:border-indigo-500/60 text-slate-100'
                    : 'bg-slate-950/40 border-slate-800/40 hover:border-slate-700 text-slate-400'
                }`}
              >
                {/* Số ngày */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs sm:text-sm font-black w-6 h-6 rounded-lg flex items-center justify-center ${
                      day.isSunday ? 'text-rose-400' : 'text-slate-200'
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                  {dayTotal > 0 && (
                    <span className="hidden sm:inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                      {dayTotal}h
                    </span>
                  )}
                </div>

                {/* Hệ thống đèn chấm màu trực quan (Dots indicator) */}
                <div className="flex items-center gap-1 mt-auto pb-0.5">
                  {hasWork && (
                    <span
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"
                      title={`HC: ${day.normal_hours}h`}
                    />
                  )}
                  {hasOT150 && (
                    <span
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"
                      title={`OT 150%: ${day.ot_150_hours}h`}
                    />
                  )}
                  {hasOT200 && (
                    <span
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"
                      title={`OT 200%: ${day.ot_200_hours}h`}
                    />
                  )}
                  {hasLeave && (
                    <span
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"
                      title={`Phép: ${day.leave_hours}h`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Chú thích màu sắc */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Hành chính (HC)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Tăng ca 150%
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Tăng ca 200%
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Nghỉ phép (P)
          </div>
        </div>
      </div>

      {/* THANH THỐNG KÊ TỔNG NỔI BẬT */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Giờ Hành Chính</span>
          <span className="text-xl font-black text-cyan-400">{totalHC.toFixed(1)}h</span>
        </div>
        <div className="p-3.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-amber-400/80 block mb-1">Tăng Ca 150%</span>
          <span className="text-xl font-black text-amber-400">{totalOT150.toFixed(1)}h</span>
        </div>
        <div className="p-3.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-rose-400/80 block mb-1">Tăng Ca 200%</span>
          <span className="text-xl font-black text-rose-400">{totalOT200.toFixed(1)}h</span>
        </div>
        <div className="p-3.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-emerald-400/80 block mb-1">Nghỉ Phép Hưởng Lương</span>
          <span className="text-xl font-black text-emerald-400">{totalLeave.toFixed(1)}h</span>
        </div>
      </div>

      {/* KHAY KÉO BOTTOM SHEET CHẤM CÔNG CỰC ĐÃ (SLIDING DRAWER) */}
      {isSheetOpen && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Header Bottom Sheet */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                  {selectedDay.dayOfWeek}
                </span>
                <h3 className="text-lg font-black text-white">{selectedDay.dateStr}</h3>
              </div>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Các Nút Bấm 1 Chạm Nhanh (Preset Pills) */}
            <div className="my-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Điền Nhanh 1 Chạm:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('standard')}
                  className="px-3 py-2.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Ca Chuẩn 8.0h
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('leave')}
                  className="px-3 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  Nghỉ Phép 8.0h
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('ot1')}
                  className="px-3 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  +1.0h Tăng ca
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('ot2')}
                  className="px-3 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  +2.0h Tăng ca
                </button>
              </div>
            </div>

            {/* Các Nút Tăng Giảm Tactile Stepper */}
            <div className="space-y-3 pt-2">
              {/* Giờ Hành chính */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Hành chính (HC)</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateSelectedHour('normal_hours', -0.5)}
                    className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold active:scale-90"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-black text-cyan-400 text-base">
                    {selectedDay.normal_hours.toFixed(1)}
                  </span>
                  <button
                    onClick={() => updateSelectedHour('normal_hours', 0.5)}
                    className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tăng ca 150% */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs font-bold text-amber-300">Tăng ca 150%</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateSelectedHour('ot_150_hours', -0.5)}
                    className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold active:scale-90"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-black text-amber-400 text-base">
                    {selectedDay.ot_150_hours.toFixed(1)}
                  </span>
                  <button
                    onClick={() => updateSelectedHour('ot_150_hours', 0.5)}
                    className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tăng ca 200% */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs font-bold text-rose-300">Tăng ca 200%</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateSelectedHour('ot_200_hours', -0.5)}
                    className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold active:scale-90"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-black text-rose-400 text-base">
                    {selectedDay.ot_200_hours.toFixed(1)}
                  </span>
                  <button
                    onClick={() => updateSelectedHour('ot_200_hours', 0.5)}
                    className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Nghỉ phép */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs font-bold text-emerald-300">Nghỉ phép hưởng lương</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateSelectedHour('leave_hours', -0.5)}
                    className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold active:scale-90"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-black text-emerald-400 text-base">
                    {selectedDay.leave_hours.toFixed(1)}
                  </span>
                  <button
                    onClick={() => updateSelectedHour('leave_hours', 0.5)}
                    className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center font-bold active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Nút Xác Nhận Ngày */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleSaveDayModal}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-500/30 transition active:scale-95"
              >
                Xác Nhận Ngày Này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
