import { apiClient } from '../auth/api-client';
import type { Farm, Lot, Task, CreateFarmData, CreateLotData, CreateTaskData, TaskStatus, TaskType } from '../types';
import { isDemoModeClient } from '../demo/utils';
import {
  demoFarmsList,
  demoFarmsGetById,
  demoFarmsCreate,
  demoFarmsUpdate,
  demoFarmsDelete,
  demoLotsByFarm,
  demoLotsGetById,
  demoLotsCreate,
  demoLotsUpdate,
  demoLotsDelete,
  demoLotStatuses,
  demoTasksByLot,
  demoTasksGetById,
  demoTasksCreate,
  demoTasksUpdate,
  demoTasksDelete,
  demoTaskStatuses,
  demoTaskTypes,
} from '../demo/store';

// ==================== FARMS API ====================

export const farmsApiService = {
  async getFarms(tenantId: string): Promise<Farm[]> {
    if (isDemoModeClient()) {
      return demoFarmsList(tenantId);
    }

    const response = await apiClient.get(`/campo/farms/tenant/${tenantId}`);
    return response.data.farms;
  },

  async getFarmById(farmId: string): Promise<Farm | null> {
    if (isDemoModeClient()) {
      return demoFarmsGetById(farmId);
    }

    const response = await apiClient.get(`/campo/farms/${farmId}`);
    return response.data.farm;
  },

  async createFarm(tenantId: string, userId: string, farmData: CreateFarmData): Promise<Farm> {
    if (isDemoModeClient()) {
      return demoFarmsCreate(tenantId, farmData, userId);
    }

    const response = await apiClient.post(`/campo/farms/tenant/${tenantId}`, {
      name: farmData.name,
      location: farmData.location,
      areaHa: farmData.area_ha,
      defaultCrop: farmData.default_crop,
      notes: farmData.notes,
    });
    return response.data.farm;
  },

  async updateFarm(farmId: string, farmData: Partial<CreateFarmData>): Promise<Farm> {
    if (isDemoModeClient()) {
      return demoFarmsUpdate(farmId, farmData);
    }

    const response = await apiClient.put(`/campo/farms/${farmId}`, {
      name: farmData.name,
      location: farmData.location,
      areaHa: farmData.area_ha,
      defaultCrop: farmData.default_crop,
      notes: farmData.notes,
    });
    return response.data.farm;
  },

  async deleteFarm(farmId: string): Promise<void> {
    if (isDemoModeClient()) {
      demoFarmsDelete(farmId);
      return;
    }

    await apiClient.delete(`/campo/farms/${farmId}`);
  },
};

// ==================== LOTS API ====================

export const lotsApiService = {
  async getLotsByFarm(farmId: string): Promise<Lot[]> {
    if (isDemoModeClient()) {
      return demoLotsByFarm(farmId);
    }

    const response = await apiClient.get(`/campo/lots/farm/${farmId}`);
    return response.data.lots;
  },

  async getLotById(lotId: string): Promise<Lot | null> {
    if (isDemoModeClient()) {
      return demoLotsGetById(lotId);
    }

    const response = await apiClient.get(`/campo/lots/${lotId}`);
    return response.data.lot;
  },

  async createLot(tenantId: string, lotData: CreateLotData): Promise<Lot> {
    if (isDemoModeClient()) {
      return demoLotsCreate(tenantId, lotData);
    }

    const response = await apiClient.post(`/campo/lots/tenant/${tenantId}`, {
      farmId: lotData.farm_id,
      code: lotData.code,
      crop: lotData.crop,
      variety: lotData.variety,
      areaHa: lotData.area_ha,
      plantDate: lotData.plant_date,
      status: lotData.status,
    });
    return response.data.lot;
  },

  async updateLot(lotId: string, lotData: Partial<CreateLotData>): Promise<Lot> {
    if (isDemoModeClient()) {
      return demoLotsUpdate(lotId, lotData);
    }

    const response = await apiClient.put(`/campo/lots/${lotId}`, {
      code: lotData.code,
      crop: lotData.crop,
      variety: lotData.variety,
      areaHa: lotData.area_ha,
      plantDate: lotData.plant_date,
      status: lotData.status,
    });
    return response.data.lot;
  },

  async deleteLot(lotId: string): Promise<void> {
    if (isDemoModeClient()) {
      demoLotsDelete(lotId);
      return;
    }

    await apiClient.delete(`/campo/lots/${lotId}`);
  },

  async getLotStatuses(): Promise<{ code: string; name: string }[]> {
    if (isDemoModeClient()) {
      return demoLotStatuses();
    }

    const response = await apiClient.get('/campo/lots/statuses/all');
    return response.data.statuses;
  },
};

// ==================== TASKS API ====================

export const tasksApiService = {
  async getTasksByLot(lotId: string): Promise<Task[]> {
    if (isDemoModeClient()) {
      return demoTasksByLot(lotId);
    }

    const response = await apiClient.get(`/campo/tasks/lot/${lotId}`);
    return response.data.tasks;
  },

  async getTaskById(taskId: string): Promise<Task | null> {
    if (isDemoModeClient()) {
      return demoTasksGetById(taskId);
    }

    const response = await apiClient.get(`/campo/tasks/${taskId}`);
    return response.data.task;
  },

  async createTask(tenantId: string, taskData: CreateTaskData, userId?: string): Promise<Task> {
    if (isDemoModeClient()) {
      return demoTasksCreate(tenantId, taskData, userId);
    }

    const response = await apiClient.post(`/campo/tasks/tenant/${tenantId}`, {
      farmId: taskData.farm_id,
      lotId: taskData.lot_id,
      title: taskData.title,
      description: taskData.description,
      typeCode: taskData.type_code,
      statusCode: taskData.status_code,
      scheduledDate: taskData.scheduled_date,
      responsibleMembershipId: taskData.responsible_membership_id,
      workerId: taskData.worker_id,
    });
    return response.data.task;
  },

  async updateTask(taskId: string, taskData: Partial<CreateTaskData>): Promise<Task> {
    if (isDemoModeClient()) {
      return demoTasksUpdate(taskId, taskData);
    }

    const response = await apiClient.put(`/campo/tasks/${taskId}`, {
      farmId: taskData.farm_id,
      lotId: taskData.lot_id,
      title: taskData.title,
      description: taskData.description,
      typeCode: taskData.type_code,
      statusCode: taskData.status_code,
      scheduledDate: taskData.scheduled_date,
      responsibleMembershipId: taskData.responsible_membership_id,
      workerId: taskData.worker_id,
    });
    return response.data.task;
  },

  async deleteTask(taskId: string): Promise<void> {
    if (isDemoModeClient()) {
      demoTasksDelete(taskId);
      return;
    }

    await apiClient.delete(`/campo/tasks/${taskId}`);
  },

  async getTaskStatuses(): Promise<TaskStatus[]> {
    if (isDemoModeClient()) {
      return demoTaskStatuses();
    }

    const response = await apiClient.get('/campo/tasks/statuses/all');
    return response.data.statuses;
  },

  async getTaskTypes(): Promise<TaskType[]> {
    if (isDemoModeClient()) {
      return demoTaskTypes();
    }

    const response = await apiClient.get('/campo/tasks/types/all');
    return response.data.types;
  },
};
