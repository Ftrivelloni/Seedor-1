import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DashboardTask,
  DashboardTaskStatus,
  TaskQueryParams,
  dashboardTasksService,
} from "../lib/tasks";

interface UseDashboardTasksState {
  tasks: DashboardTask[];
  loading: boolean;
  error: string | null;
  filters: TaskQueryParams;
  setFilters: (updater: (prev: TaskQueryParams) => TaskQueryParams) => void;
  refresh: () => void;
}

interface UseDashboardTasksOptions {
  enabled?: boolean;
}

export function useDashboardTasks(
  initialFilters: TaskQueryParams = {},
  options: UseDashboardTasksOptions = {},
): UseDashboardTasksState {
  const [filters, setFiltersState] = useState<TaskQueryParams>(initialFilters);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadFlag, setReloadFlag] = useState(0);
  const { enabled = true } = options;

  const setFilters = useCallback(
    (updater: (prev: TaskQueryParams) => TaskQueryParams) => {
      setFiltersState((prev) => updater(prev));
    },
    [],
  );

  const refresh = useCallback(() => {
    setReloadFlag((n) => n + 1);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadTasks() {
      if (!enabled) return;

      setLoading(true);
      setError(null);
      try {
        const data = await dashboardTasksService.getTasks(filters);
        if (mounted) setTasks(data);
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "No se pudieron cargar las tareas";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTasks();
    return () => {
      mounted = false;
    };
  }, [filters, reloadFlag, enabled]);

  return useMemo(
    () => ({
      tasks,
      loading: enabled ? loading : false,
      error,
      filters,
      setFilters,
      refresh,
    }),
    [tasks, loading, error, filters, setFilters, refresh],
  );
}
