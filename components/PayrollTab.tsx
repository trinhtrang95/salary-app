'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SalaryConfig } from '@/types';
import { ShieldAlert, Award, Clock, HeartHandshake, PlusCircle, CheckCircle2 } from 'lucide-react';

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

  // Công thức chuẩn xác
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

  return (
    <div className="space-y-6">
      {/* THẺ LƯƠNG KIM CƯƠNG (FINTECH CARD) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white shadow-2xl shadow-indigo-500/20 border border-indigo-400/20">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wider uppercase mb-3">
              Tháng {currentMonth}/{currentYear} • Bậc {config.rank_level}
            </div>
            <div className="text-xs text-indigo-200 font-medium">THỰC LĨNH VỀ TÀI KHOẢN</div>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-1">
              {vnd(netSalary)}
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial bg-black/25 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-indigo-200 block">Tổng Thu Nhập</span>
              <span className="text-sm sm:text-base font-bold text-emerald-300">+{vnd(totalIncome)}</span>
            </div>
            <div className="flex-1 sm:flex-initial bg-black/25 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-indigo-200 block">Giảm Trừ</span>
              <span className="text-sm sm:text-base font-bold text-rose-300">-{vnd(totalDeduction)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CHI TIẾT THU NHẬP DẠNG THẺ CAO CẤP */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-xl">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          Chi Tiết Các Khoản Thu Nhập
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                LCB
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Lương cơ bản thực tế</p>
                <p className="text-xs text-slate-500">{totalHC} giờ hành chính</p>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-100">{vnd(actualBasic)}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm">
                TN
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Lương trách nhiệm</p>
                <p className="text-xs text-slate-500">{totalHC + totalLeave} giờ hưởng TN</p>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-100">{vnd(actualResp)}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
                P
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Tiền nghỉ phép có lương</p>
                <p className="text-xs text-slate-500">{totalLeave} giờ phép</p>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-100">{vnd(leavePay)}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Làm thêm (Tăng ca)</p>
                <p className="text-xs text-amber-400/80">{totalOT150}h (x1.5) + {totalOT200}h (x2.0)</p>
              </div>
            </div>
            <span className="text-sm font-bold text-amber-400">+{vnd(otPay)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">Thâm niên</span>
              </div>
              <span className="text-xs font-bold text-slate-100">{vnd(seniority)}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">Chuyên cần</span>
              </div>
              <span className="text-xs font-bold text-slate-100">{vnd(diligence)}</span>
            </div>
          </div>

          {/* Ô Nhập Khoản Khác Sang Trọng */}
          <div className="p-4 bg-indigo-950/30 rounded-2xl border border-indigo-500/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-200">Khoản điều chỉnh khác (Thưởng / Phạt):</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={otherAmount || ''}
                  onChange={(e) => setOtherAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-32 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-right text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSaveAdj}
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition"
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
              className="w-full text-xs px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-300 placeholder:text-slate-600 focus:outline-none"
            />
            {savedSuccess && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu thành công
              </span>
            )}
          </div>
        </div>

        {/* CÁC KHOẢN GIẢM TRỪ */}
        <h3 className="text-sm font-bold text-rose-400/90 uppercase tracking-wider mt-6 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Các Khoản Trích Nộp
        </h3>

        <div className="space-y-2.5">
          <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-2xl border border-slate-800/60 text-xs">
            <span className="text-slate-400">Bảo hiểm xã hội ({config.insurance_rate}%)</span>
            <span className="font-bold text-rose-400">-{vnd(insDeduct)}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-2xl border border-slate-800/60 text-xs">
            <span className="text-slate-400">Đoàn phí ({config.union_rate}%)</span>
            <span className="font-bold text-rose-400">-{vnd(unionDeduct)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
