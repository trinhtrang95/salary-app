'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SalaryConfig } from '@/types';
import { Calculator, Save } from 'lucide-react';

export default function PayrollTab({ userId, config, currentMonth, currentYear }: any) {
  const [totalHC, setTotalHC] = useState(0);
  const [totalOT150, setTotalOT150] = useState(0);
  const [totalOT200, setTotalOT200] = useState(0);
  const [totalLeave, setTotalLeave] = useState(0);
  const [otherAmount, setOtherAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

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
    alert('Đã lưu khoản khác thành công!');
  };

  // Tính toán
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
  const netSalary = totalIncome - insDeduct - unionDeduct;

  const vnd = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold">
          <Calculator className="w-4 h-4" /> PHIẾU LƯƠNG THÁNG {currentMonth}/{currentYear}
        </div>
        <div className="text-4xl sm:text-5xl font-black mt-2">{vnd(netSalary)}</div>
        <div className="text-xs text-indigo-200 mt-1">Lương thực lĩnh về tài khoản</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-3 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span>1. Lương cơ bản thực tế ({totalHC}h):</span>
          <b>{vnd(actualBasic)}</b>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span>2. Lương trách nhiệm thực tế:</span>
          <b>{vnd(actualResp)}</b>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span>3. Tiền nghỉ phép ({totalLeave}h):</span>
          <b>{vnd(leavePay)}</b>
        </div>
        <div className="flex justify-between border-b pb-2 text-amber-600">
          <span>4. Lương làm thêm ({totalOT150 + totalOT200}h):</span>
          <b>+{vnd(otPay)}</b>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span>5. Phụ cấp thâm niên:</span>
          <b>{vnd(seniority)}</b>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span>6. Phụ cấp chuyên cần:</span>
          <b>{vnd(diligence)}</b>
        </div>

        {/* Khoản khác */}
        <div className="bg-slate-50 p-3 rounded-xl space-y-2 border">
          <div className="flex justify-between items-center gap-2">
            <span className="font-semibold">7. Khoản khác (Thưởng / Trừ):</span>
            <div className="flex gap-2">
              <input
                type="number"
                value={otherAmount}
                onChange={(e) => setOtherAmount(Number(e.target.value))}
                className="w-32 p-1 border rounded-lg text-right font-bold"
              />
              <button
                onClick={handleSaveAdj}
                disabled={saving}
                className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Lưu
              </button>
            </div>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú lý do..."
            className="w-full text-xs p-1.5 border rounded-lg"
          />
        </div>

        <div className="flex justify-between py-2 text-base font-bold text-indigo-700 border-b">
          <span>TỔNG THU NHẬP:</span>
          <span>{vnd(totalIncome)}</span>
        </div>

        <div className="flex justify-between text-rose-600 border-b pb-2">
          <span>8. Trừ bảo hiểm ({config.insurance_rate}%):</span>
          <b>-{vnd(insDeduct)}</b>
        </div>

        <div className="flex justify-between text-rose-600 border-b pb-2">
          <span>9. Trừ phí công đoàn ({config.union_rate}%):</span>
          <b>-{vnd(unionDeduct)}</b>
        </div>

        <div className="flex justify-between pt-2 text-xl font-black text-slate-900">
          <span>THỰC LĨNH:</span>
          <span className="text-indigo-600">{vnd(netSalary)}</span>
        </div>
      </div>
    </div>
  );
}