import { apiClient } from '../auth/api-client';
import {
  Worker,
  AttendanceRecord,
  AttendanceStatus,
  CreateWorkerDto,
  UpdateWorkerDto,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  WorkerStats,
} from './types';

class WorkersService {
  // ==================== WORKERS CRUD ====================

  async getWorkersByTenant(
    tenantId: string,
    includeInactive = false,
  ): Promise<Worker[]> {
    const response = await apiClient.get<{ workers: Worker[] }>(
      `/workers/tenant/${tenantId}?includeInactive=${includeInactive}`,
    );
    return response.data.workers;
  }

  async getWorkerById(workerId: string): Promise<Worker | null> {
    const response = await apiClient.get<{ worker: Worker | null }>(
      `/workers/${workerId}`,
    );
    return response.data.worker;
  }

  async createWorker(tenantId: string, dto: CreateWorkerDto): Promise<Worker> {
    const response = await apiClient.post<{ worker: Worker }>(
      `/workers/tenant/${tenantId}`,
      dto,
    );
    return response.data.worker;
  }

  async updateWorker(workerId: string, dto: UpdateWorkerDto): Promise<Worker> {
    const response = await apiClient.put<{ worker: Worker }>(
      `/workers/${workerId}`,
      dto,
    );
    return response.data.worker;
  }

  async deleteWorker(workerId: string): Promise<void> {
    await apiClient.delete(`/workers/${workerId}`);
  }

  async hardDeleteWorker(workerId: string): Promise<void> {
    await apiClient.delete(`/workers/${workerId}/hard`);
  }

  async searchWorkers(
    tenantId: string,
    query: string,
    includeInactive = false,
  ): Promise<Worker[]> {
    const response = await apiClient.get<{ workers: Worker[] }>(
      `/workers/tenant/${tenantId}/search?q=${encodeURIComponent(query)}&includeInactive=${includeInactive}`,
    );
    return response.data.workers;
  }

  async getWorkersByArea(
    tenantId: string,
    areaModule: string,
    includeInactive = false,
  ): Promise<Worker[]> {
    const response = await apiClient.get<{ workers: Worker[] }>(
      `/workers/tenant/${tenantId}/area/${areaModule}?includeInactive=${includeInactive}`,
    );
    return response.data.workers;
  }

  async getWorkerStats(tenantId: string): Promise<WorkerStats> {
    const response = await apiClient.get<WorkerStats>(
      `/workers/tenant/${tenantId}/stats`,
    );
    return response.data;
  }

  // ==================== ATTENDANCE ====================

  async getAttendanceByTenant(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceRecord[]> {
    let url = `/workers/tenant/${tenantId}/attendance`;
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const response = await apiClient.get<{ records: AttendanceRecord[] }>(url);
    return response.data.records;
  }

  async getAttendanceByDate(
    tenantId: string,
    date: string,
  ): Promise<AttendanceRecord[]> {
    const response = await apiClient.get<{ records: AttendanceRecord[] }>(
      `/workers/tenant/${tenantId}/attendance/date/${date}`,
    );
    return response.data.records;
  }

  async getAttendanceByWorker(
    workerId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceRecord[]> {
    let url = `/workers/${workerId}/attendance`;
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const response = await apiClient.get<{ records: AttendanceRecord[] }>(url);
    return response.data.records;
  }

  async createAttendance(
    tenantId: string,
    dto: CreateAttendanceDto,
  ): Promise<AttendanceRecord> {
    const response = await apiClient.post<{ record: AttendanceRecord }>(
      `/workers/tenant/${tenantId}/attendance`,
      dto,
    );
    return response.data.record;
  }

  async bulkCreateAttendance(
    tenantId: string,
    attendances: CreateAttendanceDto[],
  ): Promise<AttendanceRecord[]> {
    const response = await apiClient.post<{ records: AttendanceRecord[] }>(
      `/workers/tenant/${tenantId}/attendance/bulk`,
      { attendances },
    );
    return response.data.records;
  }

  async updateAttendance(
    attendanceId: string,
    dto: UpdateAttendanceDto,
  ): Promise<AttendanceRecord> {
    const response = await apiClient.put<{ record: AttendanceRecord }>(
      `/workers/attendance/${attendanceId}`,
      dto,
    );
    return response.data.record;
  }

  async deleteAttendance(attendanceId: string): Promise<void> {
    await apiClient.delete(`/workers/attendance/${attendanceId}`);
  }

  async getAttendanceStatuses(): Promise<AttendanceStatus[]> {
    const response = await apiClient.get<{ statuses: AttendanceStatus[] }>(
      '/workers/attendance/statuses',
    );
    return response.data.statuses;
  }

  // ==================== LEGACY FORMAT METHODS ====================
  // For backwards compatibility with existing components

  async getWorkersByTenantLegacy(
    tenantId: string,
    includeInactive = false,
  ): Promise<{ success: boolean; data?: Worker[]; error?: string }> {
    try {
      const workers = await this.getWorkersByTenant(tenantId, includeInactive);
      return { success: true, data: workers };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al obtener trabajadores';
      return { success: false, error: message };
    }
  }

  async createWorkerLegacy(
    tenantId: string,
    dto: CreateWorkerDto,
  ): Promise<{ success: boolean; data?: Worker; error?: string }> {
    try {
      const worker = await this.createWorker(tenantId, dto);
      return { success: true, data: worker };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al crear trabajador';
      return { success: false, error: message };
    }
  }

  async updateWorkerLegacy(
    workerId: string,
    dto: UpdateWorkerDto,
  ): Promise<{ success: boolean; data?: Worker; error?: string }> {
    try {
      const worker = await this.updateWorker(workerId, dto);
      return { success: true, data: worker };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al actualizar trabajador';
      return { success: false, error: message };
    }
  }

  async deleteWorkerLegacy(
    workerId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.deleteWorker(workerId);
      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al eliminar trabajador';
      return { success: false, error: message };
    }
  }

  async getAttendanceByTenantLegacy(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{ success: boolean; data?: AttendanceRecord[]; error?: string }> {
    try {
      const records = await this.getAttendanceByTenant(
        tenantId,
        startDate,
        endDate,
      );
      return { success: true, data: records };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al obtener asistencias';
      return { success: false, error: message };
    }
  }

  async createAttendanceLegacy(
    tenantId: string,
    dto: CreateAttendanceDto,
  ): Promise<{ success: boolean; data?: AttendanceRecord; error?: string }> {
    try {
      const record = await this.createAttendance(tenantId, dto);
      return { success: true, data: record };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al crear asistencia';
      return { success: false, error: message };
    }
  }

  async bulkCreateAttendanceLegacy(
    tenantId: string,
    attendances: CreateAttendanceDto[],
  ): Promise<{ success: boolean; data?: AttendanceRecord[]; error?: string }> {
    try {
      const records = await this.bulkCreateAttendance(tenantId, attendances);
      return { success: true, data: records };
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al crear asistencias en bulk';
      return { success: false, error: message };
    }
  }
}

export const workersService = new WorkersService();
