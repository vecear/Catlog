export type StoolType = 'FORMED' | 'UNFORMED' | 'DIARRHEA' | null;
export type UrineStatus = 'HAS_URINE' | 'NO_URINE' | null;

// 20 popular colors for owner display
export const OWNER_COLORS = [
  { name: '橙色', value: '#F97316' },
  { name: '藍色', value: '#3B82F6' },
  { name: '紅色', value: '#EF4444' },
  { name: '綠色', value: '#22C55E' },
  { name: '紫色', value: '#A855F7' },
  { name: '粉色', value: '#EC4899' },
  { name: '青色', value: '#06B6D4' },
  { name: '黃色', value: '#EAB308' },
  { name: '靛藍', value: '#6366F1' },
  { name: '玫瑰', value: '#F43F5E' },
  { name: '翠綠', value: '#10B981' },
  { name: '琥珀', value: '#F59E0B' },
  { name: '萊姆', value: '#84CC16' },
  { name: '天藍', value: '#0EA5E9' },
  { name: '紫羅蘭', value: '#8B5CF6' },
  { name: '珊瑚', value: '#FB7185' },
  { name: '湖水綠', value: '#14B8A6' },
  { name: '深灰', value: '#6B7280' },
  { name: '石板藍', value: '#64748B' },
  { name: '棕色', value: '#A16207' },
] as const;

export interface Owner {
  id: string;
  name: string;
  color: string; // hex color
}

export interface PetProfile {
  name: string;
  birthday: string; // YYYY-MM-DD format
  adoptionDate?: string; // YYYY-MM-DD format - when the pet came home
}

export interface AppProfile {
  owners: Owner[];
  pet: PetProfile;
  actionOrder?: string[]; // Order of action items: ['food', 'water', 'litter', 'grooming', 'medication', 'deworming', 'bath', 'weight']
}

export interface CareLog {
  id: string;
  timestamp: number; // Unix timestamp in milliseconds
  actions: {
    food: boolean;
    water: boolean;
    litter: boolean;
    grooming?: boolean;
    medication?: boolean;
    supplements?: boolean;
    deworming?: boolean;
    bath?: boolean;
  };
  stoolType?: StoolType;
  urineStatus?: UrineStatus;
  isLitterClean?: boolean;
  weight?: number; // in kg, e.g. 4.5 (optional)
  author: string; // dynamic owner name
  note?: string;
}

export interface TaskProgress {
  morning: boolean;
  noon: boolean;
  evening: boolean;
  bedtime: boolean;
  isComplete: boolean;
}

export interface DayStatus {
  food: TaskProgress;
  water: TaskProgress;
  litter: TaskProgress;
  grooming: TaskProgress;
  medication: TaskProgress;
  supplements: TaskProgress;
  weight: TaskProgress;
}

export enum CareActionType {
  FOOD = 'FOOD',
  WATER = 'WATER',
  LITTER = 'LITTER',
  GROOMING = 'GROOMING',
  MEDICATION = 'MEDICATION',
  SUPPLEMENTS = 'SUPPLEMENTS',
}

export interface WeightLog {
  id: string;
  timestamp: number;
  weight: number; // in kg, e.g. 4.5
  author: string;
}

// Pet types for the new multi-user system
export type PetType = 'cat' | 'dog' | 'fish' | 'duck' | 'rabbit' | 'mouse' | 'lizard';

export const PET_TYPE_LABELS: Record<PetType, string> = {
  cat: '貓',
  dog: '狗',
  fish: '魚',
  duck: '鴨子',
  rabbit: '兔子',
  mouse: '鼠',
  lizard: '蜥蜴',
};

export const PET_TYPE_ICONS: Record<PetType, string> = {
  cat: '🐱',
  dog: '🐕',
  fish: '🐟',
  duck: '🦆',
  rabbit: '🐰',
  mouse: '🐭',
  lizard: '🦎',
};

export type PetGender = 'male' | 'female' | 'unknown';

export const PET_GENDER_LABELS: Record<PetGender, string> = {
  male: '公',
  female: '母',
  unknown: '不確定',
};

// New Pet structure for multi-user system
export interface Pet {
  id: string; // 6-digit unique ID
  name: string;
  type: PetType;
  birthday: string; // YYYY-MM-DD
  gender: PetGender;
  adoptionDate: string; // YYYY-MM-DD - when pet joined the family
  ownerIds: string[]; // Array of user IDs who can care for this pet
  legacyOwners?: Owner[]; // Legacy owners without Firebase accounts (from migration)
  createdBy: string; // User ID who created this pet
  createdAt: number; // timestamp
  actionOrder?: string[];
  actionLabels?: Record<string, string>; // Custom labels for actions (affects all co-caregivers)
  vaccineRecords?: VaccineRecord[]; // Vaccine history
}

// Home page card visibility settings
export interface HomeCardSettings {
  showScoreboard: boolean; // 愛的積分 (寵物更愛誰)
  showTodayTasks: boolean; // 今日任務
  hiddenTodayTaskItems?: string[]; // Hidden items in today's tasks (e.g., ['grooming', 'medication'])
  showWeightChart: boolean; // 體重變化
  weightChartType: 'days' | 'entries'; // Show by recent days or recent entries
  weightChartValue: number; // Number of days or entries to show
  monthlyLogsDefaultDays: number; // Default number of days to show in monthly logs (3, 5, 7, or 0 for all)
}

// Default home card settings
export const DEFAULT_HOME_CARD_SETTINGS: HomeCardSettings = {
  showScoreboard: true,
  showTodayTasks: true,
  hiddenTodayTaskItems: [],
  showWeightChart: true,
  weightChartType: 'entries',
  weightChartValue: 10,
  monthlyLogsDefaultDays: 3,
};

// User profile for the new multi-user system
export interface UserProfile {
  id: string; // Firebase Auth UID
  displayName: string;
  email: string;
  color: string; // User's display color
  linkedProviders: ('google' | 'password')[]; // Which auth methods are linked
  petIds: string[]; // Array of pet IDs the user cares for
  onboardingComplete: boolean;
  createdAt: number;
  updatedAt: number;
  actionOrders?: Record<string, string[]>; // Per-pet action order preferences (petId -> order)
  hiddenActions?: Record<string, string[]>; // Per-pet hidden actions (petId -> hidden action ids)
  caregiverOrders?: Record<string, string[]>; // Per-pet caregiver order (petId -> array of user IDs)
  homeCardSettings?: Record<string, HomeCardSettings>; // Per-pet home card visibility settings
}

// Vaccine types for cats
export type CatVaccineType =
  | 'FVRCP'           // 三合一
  | 'FVRCP_CHLAMYDIA' // 四合一 (FVRCP + 披衣菌)
  | 'FVRCP_CHLAMYDIA_FELV' // 五合一 (FVRCP + 披衣菌 + 貓白血病)
  | 'FELV'            // 貓白血病
  | 'RABIES'          // 狂犬病
  | 'FIV';            // 貓愛滋

// Vaccine types for dogs
export type DogVaccineType =
  | 'DHPPI'           // 多合一疫苗
  | 'LEPTOSPIROSIS'   // 鉤端螺旋體
  | 'RABIES'          // 狂犬病
  | 'BORDETELLA'      // 肯尼氏咳/支氣管敗血桿菌
  | 'LYME';           // 萊姆病

export type VaccineType = CatVaccineType | DogVaccineType;

export const CAT_VACCINE_LABELS: Record<CatVaccineType, string> = {
  FVRCP: '三合一 (FVRCP)',
  FVRCP_CHLAMYDIA: '四合一 (FVRCP + 披衣菌)',
  FVRCP_CHLAMYDIA_FELV: '五合一 (FVRCP + 披衣菌 + 貓白血病)',
  FELV: '貓白血病 (FeLV)',
  RABIES: '狂犬病 (Rabies)',
  FIV: '貓愛滋 (FIV)',
};

export const DOG_VACCINE_LABELS: Record<DogVaccineType, string> = {
  DHPPI: '多合一疫苗 (DHPPi)',
  LEPTOSPIROSIS: '鉤端螺旋體 (Leptospirosis)',
  RABIES: '狂犬病 (Rabies)',
  BORDETELLA: '肯尼氏咳/支氣管敗血桿菌 (Bordetella)',
  LYME: '萊姆病 (Lyme Disease)',
};

// Vaccine record
export interface VaccineRecord {
  id: string;
  vaccineType: VaccineType;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: number;
  createdBy: string; // User ID
}

// Care request for co-caring pets
export type CareRequestStatus = 'pending' | 'approved' | 'rejected';

export interface CareRequest {
  id: string;
  petId: string;
  petName: string;
  requesterId: string; // User ID who wants to join
  requesterName: string;
  requesterEmail: string;
  ownerId: string; // Pet owner who needs to approve
  status: CareRequestStatus;
  createdAt: number;
  respondedAt?: number;
}