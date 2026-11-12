'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SalaryConfig } from '@/types';
import {
  Wallet,
  ShieldCheck,
  TrendingUp,
  Clock,
  Award,
  HeartHandshake,
  PlusCircle,
  CheckCircle2,
  PieChart,
} from 'lucide-react';

export default function PayrollTab({ userId, config, currentMonth, currentYear }: any) {
  const [totalHC, setTotalHC] = useState(0);
  const [totalOT150, setTotalOT150] = useState(0);
  const [totalOT200, setTotalOT200] = useState(0);
  const [totalLeave, setTotalLeave] = useState(0);
  const [otherAmount, setOtherAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadData = async () => {
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`;

    const { data: ts } = await supabase
      .from('timesheets')
      .select('normal_hours, ot_150_hours, ot_200_hours, leave_hours')
      .eq('user_id', userId)
      .gte('work_date', startDate)
      .lte('work_date', endDate);

    if (ts) {
      setTotalHC(ts.reduce((sum, r) => sum + Number(r.normal_hours), 0));
      setTotalOT150(ts.reduce((sum, r) => sum + Number(r.ot_150_hours), 0));
      setTotalOT200(ts.reduce((sum, r) => sum + Number(r.ot_200_hours), 0));
      setTotalLeave(ts.reduce((sum, r) => sum + Number(r.leave_hours), 0));
    }

    const { data: adj } = await supabase
      .from('monthly_adjustments')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .maybeSingle();

    if (adj) {
      setOtherAmount(Number(adj.other_amount) || 0);
      setNote(adj.note || '');
    } else {
      setOtherAmount(0);
      setNote('');
    }
  };

  useEffect(() => {
    if (userId) loadData();
  }, [userId, currentMonth, currentYear]);

  const handleSaveAdj = async () => {
    setSaving(true);
    await supabase.from('monthly_adjustments').upsert(
      {
        user_id: userId,
        month: currentMonth,
        year: currentYear,
        other_amount: Number(otherAmount) || 0,
        note: note,
      },
      { onConflict: 'user_id,month,year' }
    );
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // CÔNG THỨC CHUẨN XÁC
  const standardHours = (config.standard_work_days || 26) * 8;
  const unitBasic = standardHours > 0 ? config.basic_salary / standardHours : 0;
  const unitResp = standardHours > 0 ? config.responsibility_salary / standardHours : 0;

  const actualBasic = Math.round(unitBasic * totalHC);
  const actualResp = Math.round(unitResp * (totalHC + totalLeave));
  const leavePay = Math.round(unitBasic * totalLeave);
  const otPay = Math.round(unitBasic * 1.5 * totalOT150 + unitBasic * 2.0 * totalOT200);
  const seniority = Math.round(config.seniority_allowance);
  const diligence = Math.round(config.diligence_allowance);
  const other = Math.round(Number(otherAmount) || 0);

  const totalIncome = actualBasic + actualResp + leavePay + otPay + seniority + diligence + other;
  const insDeduct = Math.round(config.basic_salary * (config.insurance_rate / 100));
  const unionDeduct = Math.round(config.basic_salary * (config.union_rate / 100));
  const totalDeduction = insDeduct + unionDeduct;
  const netSalary = totalIncome - totalDeduction;

  const vnd = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  // Tỷ lệ phần trăm thanh tiến độ
  const basicPercent = totalIncome > 0 ? (actualBasic / totalIncome) * 100 : 0;
  const respPercent = totalIncome > 0 ? (actualResp / totalIncome) * 100 : 0;
  const otPercent = totalIncome > 0 ? (otPay / totalIncome) * 100 : 0;
  const otherPercent = Math.max(0, 100 - basicPercent - respPercent - otPercent);

  return (
    <div className="space-y-6">
      {/* THẺ LƯƠNG TITANIUM ĐẲNG CẤP APPLE CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl text-white">
        {/* Vệt sáng trang trí Hologram */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between min-h-[220px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-xs text-indigo-300">
                P
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                PAYROLL PASSPORT • BẬC {config.rank_level}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-black/40 px-3 py-1 rounded-full border border-white/5">
              Tháng {currentMonth}/{currentYear}
            </span>
          </div>

          <div className="my-5">
            <span className="text-xs font-semibold text-indigo-300/80 block uppercase tracking-wider">
              LƯƠNG THỰC LĨNH (NET SALARY)
            </span>
            <div className="text-4xl sm:text-6xl font-black tracking-tight text-white mt-1">
              {vnd(netSalary)}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-bold">
            <div>
              <span className="text-slate-400 block text-[10px]">TỔNG THU NHẬP</span>
              <span className="text-emerald-400 font-extrabold text-sm">+{vnd(totalIncome)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">CÁC KHOẢN TRỪ</span>
              <span className="text-rose-400 font-extrabold text-sm">-{vnd(totalDeduction)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ THANH TỶ TRỌNG THU NHẬP (RATIO BAR) */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 shadow-xl backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-indigo-400" /> Tỷ Trọng Cơ Cấu Thu Nhập
          </span>
          <span className="text-indigo-400 font-extrabold">{totalIncome > 0 ? '100%' : '0%'}</span>
        </div>

        {/* Thanh tỷ lệ đa màu */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          <div style={{ width: `${basicPercent}%` }} className="h-full bg-cyan-400 rounded-full" title="LCB" />
          <div style={{ width: `${respPercent}%` }} className="h-full bg-purple-400 rounded-full" title="Trách nhiệm" />
          <div style={{ width: `${otPercent}%` }} className="h-full bg-amber-400 rounded-full" title="Tăng ca" />
          <div style={{ width: `${otherPercent}%` }} className="h-full bg-emerald-400 rounded-full" title="Khác" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-medium text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> LCB: {basicPercent.toFixed(0)}%
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Trách nhiệm: {respPercent.toFixed(0)}%
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Tăng ca: {otPercent.toFixed(0)}%
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Phụ cấp: {otherPercent.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* DANH SÁCH CHI TIẾT TỪNG KHOẢN DẠNG THẺ FINTECH */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
          Chi Tiết Bảng Kê Thu Nhập
        </h3>

        <div className="space-y-2.5 text-xs sm:text-sm">
          {/* Lương Cơ Bản */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                LCB
              </div>
              <div>
                <p className="font-bold text-slate-200">Lương cơ bản thực tế</p>
                <p className="text-[11px] text-slate-500">{totalHC}h × {vnd(unitBasic)}/h</p>
              </div>
            </div>
            <span className="font-black text-slate-100">{vnd(actualBasic)}</span>
          </div>

          {/* Lương Trách Nhiệm */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                TN
              </div>
              <div>
                <p className="font-bold text-slate-200">Lương trách nhiệm</p>
                <p className="text-[11px] text-slate-500">{totalHC + totalLeave}h × {vnd(unitResp)}/h</p>
              </div>
            </div>
            <span className="font-black text-slate-100">{vnd(actualResp)}</span>
          </div>

          {/* Nghỉ phép */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                P
              </div>
              <div>
                <p className="font-bold text-slate-200">Tiền nghỉ phép có lương</p>
                <p className="text-[11px] text-slate-500">{totalLeave} giờ phép</p>
              </div>
            </div>
            <span className="font-black text-slate-100">{vnd(leavePay)}</span>
          </div>

          {/* Tăng ca */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-200">Tiền làm thêm (Tăng ca)</p>
                <p className="text-[11px] text-amber-400/80">{totalOT150}h (x1.5) + {totalOT200}h (x2.0)</p>
              </div>
            </div>
            <span className="font-black text-amber-400">+{vnd(otPay)}</span>
          </div>

          {/* Thâm niên & Chuyên cần */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Thâm niên</span>
                <span className="font-bold text-slate-200 text-xs">{vnd(seniority)}</span>
              </div>
              <Award className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Chuyên cần</span>
                <span className="font-bold text-slate-200 text-xs">{vnd(diligence)}</span>
              </div>
              <HeartHandshake className="w-4 h-4 text-indigo-400" />
            </div>
          </div>

          {/* Khoản Khác (Thưởng / Trừ) */}
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-200 text-xs flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-indigo-400" /> Khoản Khác (Thưởng / Phạt):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={otherAmount || ''}
                  onChange={(e) => setOtherAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-28 px-3 py-1 bg-slate-950 border border-slate-700 rounded-xl text-right font-black text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSaveAdj}
                  disabled={saving}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
                >
                  {saving ? '...' : 'Lưu'}
                </button>
              </div>
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú lý do thưởng/trừ..."
              className="w-full text-xs px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 placeholder:text-slate-600 focus:outline-none"
            />
            {savedSuccess && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu khoản điều chỉnh thành công!
              </span>
            )}
          </div>
        </div>

        {/* Các Khoản Giảm Trừ */}
        <h3 className="text-xs font-black uppercase tracking-wider text-rose-400/90 pt-4 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Các Khoản Trích Nộp Theo Quy Định
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
            <span className="text-slate-400">Bảo hiểm bắt buộc ({config.insurance_rate}% LCB)</span>
            <span className="font-bold text-rose-400">-{vnd(insDeduct)}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
            <span className="text-slate-400">Đoàn phí công đoàn ({config.union_rate}% LCB)</span>
            <span className="font-bold text-rose-400">-{vnd(unionDeduct)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
