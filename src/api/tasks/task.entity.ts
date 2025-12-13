export type TaskStatus = 'PENDING' | 'COMPLETED' | 'INCOMPLETE';

export interface Task {
  id: string;
  tenantId: string;
  campoId: string;
  sectorId: string;
  workerId: string;
  description: string;
  date: Date; // Execution date
  status: TaskStatus;
  comment?: string;
  createdByAdminId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
