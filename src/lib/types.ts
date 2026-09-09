export type Role = 'DRIVER' | 'SUPERVISOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type LeaveType = 'SAKIT' | 'URUSAN_KELUARGA' | 'IZIN' | 'LAINNYA';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AttendanceSource = 'DRIVER' | 'ADMIN';

export interface User {
  id: string;
  employee_code: string;
  name: string;
  phone: string;
  pin_hash: string;
  role: Role;
  supervisor_id?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  attendance_key: string; // DRIVER_ID_YYYY-MM-DD
  attendance_date: string; // YYYY-MM-DD
  attendance_time: string; // HH:mm:ss
  driver_id: string;
  driver_name: string;
  latitude: string;
  longitude: string;
  gps_accuracy: string;
  source: AttendanceSource;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  driver_id: string;
  driver_name: string;
  supervisor_id: string;
  leave_type: LeaveType;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  reason: string;
  status: LeaveStatus;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  company_name: string;
  timezone: string;
  attendance_enabled: boolean;
  attendance_start_time: string; // HH:mm
  attendance_end_time: string; // HH:mm
  require_gps: boolean;
  leave_enabled: boolean;
  leave_reason_required: boolean;
  monday_enabled: boolean;
  tuesday_enabled: boolean;
  wednesday_enabled: boolean;
  thursday_enabled: boolean;
  friday_enabled: boolean;
  saturday_enabled: boolean;
  sunday_enabled: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: string;
  reference_id: string;
  old_value?: string;
  new_value?: string;
}

export interface SessionPayload {
  userId: string;
  name: string;
  phone: string;
  role: Role;
  supervisorId?: string;
}

export type DriverAttendanceState = 
  | 'BEFORE_START'      // STATE 1 — Belum Waktu Absen
  | 'OPEN'              // STATE 2 — Absensi Aktif (Bisa Absen)
  | 'ATTENDED'          // STATE 3 — Sudah Absen Hari Ini
  | 'CLOSED'            // STATE 4 — Waktu Absen Sudah Berakhir
  | 'OFF_DAY'           // STATE 5 — Hari Libur
  | 'LEAVE_APPROVED';   // STATE 6 — Izin Disetujui
