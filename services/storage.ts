import { CareLog, DayStatus, TaskProgress } from '../types';

const STORAGE_KEY = 'meowlog_records';

export const getLogs = (): CareLog[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load logs", e);
    return [];
  }
};

export const saveLog = (log: CareLog): void => {
  const logs = getLogs();
  const newLogs = [log, ...logs].sort((a, b) => b.timestamp - a.timestamp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
};

export const deleteLog = (id: string): void => {
  const logs = getLogs();
  const newLogs = logs.filter(l => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
};

export const clearAllLogs = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

const getTimePeriod = (timestamp: number): 'morning' | 'afternoon' | 'bedtime' => {
  const hour = new Date(timestamp).getHours();
  if (hour < 12) return 'morning'; // 00:00 - 11:59
  if (hour < 18) return 'afternoon'; // 12:00 - 17:59
  return 'bedtime'; // 18:00 - 23:59
};

export const getTodayStatus = (): DayStatus => {
  const logs = getLogs();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayLogs = logs.filter(log => log.timestamp >= startOfDay);

  const initProgress = (hasAfternoon: boolean): TaskProgress => ({
    morning: false,
    afternoon: hasAfternoon ? false : undefined,
    bedtime: false,
    isComplete: false
  });

  const status: DayStatus = {
    food: initProgress(false),
    water: initProgress(false),
    litter: initProgress(true),
  };

  todayLogs.forEach(log => {
    const period = getTimePeriod(log.timestamp);

    if (log.actions.food) {
      if (period === 'morning') status.food.morning = true;
      // Food doesn't have afternoon requirement, but if logged in afternoon, counts towards bedtime or valid entry?
      // Requirement: Morning and Bedtime.
      // If user logs food in afternoon, let's count it as afternoon but the requirement is purely Morning & Bedtime.
      // To be lenient: 
      // Morning slot: < 12
      // Bedtime slot: >= 12 (Simplifying "rest of day" or strict "bedtime"? 
      // Requirement said: "Morning, Bedtime". Let's stick to the strict time slots defined above for clarity.
      if (period === 'bedtime') status.food.bedtime = true;
    }

    if (log.actions.water) {
      if (period === 'morning') status.water.morning = true;
      if (period === 'bedtime') status.water.bedtime = true;
    }

    if (log.actions.litter) {
      if (period === 'morning') status.litter.morning = true;
      if (period === 'afternoon') status.litter.afternoon = true;
      if (period === 'bedtime') status.litter.bedtime = true;
    }
  });

  // Calculate completion
  status.food.isComplete = status.food.morning && status.food.bedtime;
  status.water.isComplete = status.water.morning && status.water.bedtime;
  // Litter needs afternoon as well (TS will see afternoon as boolean | undefined, check truthiness)
  status.litter.isComplete = status.litter.morning && (status.litter.afternoon === true) && status.litter.bedtime;

  return status;
};