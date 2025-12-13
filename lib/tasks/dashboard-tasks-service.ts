import { apiClient } from "../auth/api-client";

export type DashboardTaskStatus = "PENDING" | "COMPLETED" | "INCOMPLETE";

export interface DashboardTask {
  id: string;
  campoId?: string | null;
  sectorId?: string | null;
  sectorName?: string | null;
  workerId?: string | null;
  workerName?: string | null;
  description: string;
  date: string; // ISO date (day of execution)
  status: DashboardTaskStatus;
  comment?: string | null;
  updatedAt?: string | null;
}

export interface TaskQueryParams {
  tenantId?: string;
  campoId?: string;
  sectorId?: string;
  workerId?: string;
  status?: DashboardTaskStatus;
  date?: string; // YYYY-MM-DD
}

// Wrapper around the Tasks API exposed by Seedor-API (e.g. GET /api/tasks).
// Base URL is configured via NEXT_PUBLIC_API_URL in apiClient.
export const dashboardTasksService = {
  async getTasks(params: TaskQueryParams = {}): Promise<DashboardTask[]> {
    const response = await apiClient.get<{ tasks: DashboardTask[] }>("/tasks", {
      params,
    });
    return response.data?.tasks ?? [];
  },
};
