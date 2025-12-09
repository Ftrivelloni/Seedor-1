// Area/Module codes for workers
export type AreaModule = 'admin' | 'campo' | 'empaque' | 'finanzas';

// Worker status
export type WorkerStatus = 'active' | 'inactive';

// Worker
export interface Worker {
  id: string;
  tenant_id: string;
  full_name: string;
  document_id: string;
  email: string;
  phone: string | null;
  area_module: AreaModule;
  membership_id: string | null;
  status: WorkerStatus;
  created_at: string;
  updated_at: string;
}

// Attendance status codes (matching existing DB codes)
export type AttendanceStatusCode =
  | 'PRE'
  | 'AUS'
  | 'TAR'
  | 'LIC'
  | 'VAC';

// Attendance record
export interface AttendanceRecord {
  id: string;
  tenant_id: string;
  worker_id: string;
  date: string;
  status: AttendanceStatusCode;
  reason: string | null;
  created_at?: string;
  updated_at?: string;
}

// Attendance status configuration
export interface AttendanceStatus {
  code: AttendanceStatusCode;
  name: string;
}

// DTOs
export interface CreateWorkerDto {
  fullName: string;
  documentId: string;
  email: string;
  phone?: string;
  areaModule: AreaModule;
  membershipId?: string;
}

export interface UpdateWorkerDto {
  fullName?: string;
  documentId?: string;
  email?: string;
  phone?: string;
  areaModule?: AreaModule;
  membershipId?: string;
  status?: WorkerStatus;
}

export interface CreateAttendanceDto {
  workerId: string;
  date: string;
  status: AttendanceStatusCode;
  reason?: string;
}

export interface UpdateAttendanceDto {
  status?: AttendanceStatusCode;
  reason?: string;
}

// Worker stats
export interface WorkerStats {
  total: number;
  active: number;
  inactive: number;
  byArea: Record<string, number>;
}
