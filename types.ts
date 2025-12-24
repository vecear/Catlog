export type StoolType = 'FORMED' | 'UNFORMED' | 'DIARRHEA' | null;
export type UrineStatus = 'HAS_URINE' | 'NO_URINE' | null;

export interface CareLog {
  id: string;
  timestamp: number; // Unix timestamp in milliseconds
  actions: {
    food: boolean;
    water: boolean;
    litter: boolean;
  };
  stoolType?: StoolType;
  urineStatus?: UrineStatus;
  isLitterClean?: boolean;
  author: 'RURU' | 'CCL';
  note?: string;
}

export interface TaskProgress {
  morning: boolean;
  afternoon?: boolean;
  bedtime: boolean;
  isComplete: boolean;
}

export interface DayStatus {
  food: TaskProgress;
  water: TaskProgress;
  litter: TaskProgress;
}

export enum CareActionType {
  FOOD = 'FOOD',
  WATER = 'WATER',
  LITTER = 'LITTER',
}