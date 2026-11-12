export interface SalaryConfig {
  id?: string;
  user_id?: string;
  rank_level: string;
  basic_salary: number;
  responsibility_salary: number;
  seniority_allowance: number;
  diligence_allowance: number;
  standard_work_days: number;
  insurance_rate: number;
  union_rate: number;
}

export interface DayTimesheet {
  id?: string;
  dateStr: string;
  dayOfWeek: string;
  dayNumber: number;
  isSunday: boolean;
  normal_hours: number;
  ot_150_hours: number;
  ot_200_hours: number;
  leave_hours: number;
  note?: string;
}

export interface MonthlyAdjustment {
  id?: string;
  user_id?: string;
  month: number;
  year: number;
  other_amount: number;
  note?: string;
}