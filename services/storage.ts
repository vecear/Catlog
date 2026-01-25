import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, Timestamp, getDoc, updateDoc, limit, setDoc } from 'firebase/firestore';
import { CareLog, DayStatus, TaskProgress, WeightLog, AppProfile } from '../types';

const COLLECTION_NAME = 'logs';
const WEIGHT_COLLECTION_NAME = 'weight_logs';
const PROFILE_COLLECTION_NAME = 'app_profile';
const PROFILE_DOC_ID = 'main_profile';

// Default profile with initial owners and pet
export const DEFAULT_PROFILE: AppProfile = {
  owners: [
    { id: 'owner_1', name: 'RURU', color: '#F97316' },
    { id: 'owner_2', name: 'CCL', color: '#3B82F6' },
  ],
  pet: {
    name: '小賀',
    birthday: '2025-06-08',
    adoptionDate: '2025-09-16',
  },
};

// Profile functions
export const getProfile = async (): Promise<AppProfile> => {
  try {
    const docRef = doc(db, PROFILE_COLLECTION_NAME, PROFILE_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AppProfile;
      // Migration: Ensure 'deworming' is in actionOrder if it's missing
      if (data.actionOrder && !data.actionOrder.includes('deworming')) {
        const newOrder = [...data.actionOrder];
        // Insert before 'bath' or at the end
        const bathIndex = newOrder.indexOf('bath');
        if (bathIndex !== -1) {
          newOrder.splice(bathIndex, 0, 'deworming');
        } else {
          newOrder.push('deworming');
        }
        data.actionOrder = newOrder;
      }
      return data;
    }
    // Return default if not exists
    return DEFAULT_PROFILE;
  } catch (e) {
    console.error("Failed to load profile from Firebase", e);
    return DEFAULT_PROFILE;
  }
};

export const saveProfile = async (profile: AppProfile): Promise<void> => {
  try {
    const docRef = doc(db, PROFILE_COLLECTION_NAME, PROFILE_DOC_ID);
    await setDoc(docRef, profile);
  } catch (e) {
    console.error("Failed to save profile to Firebase", e);
    throw e;
  }
};

export const getLogs = async (): Promise<CareLog[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CareLog));
  } catch (e) {
    console.error("Failed to load logs from Firebase", e);
    return [];
  }
};

export const getLog = async (id: string): Promise<CareLog | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CareLog;
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch log", e);
    return null;
  }
};

export const saveLog = async (log: CareLog): Promise<void> => {
  try {
    // Remove id from log if it exists (Firestore generates its own, or we use log.id as doc id?)
    // Best practice: let Firestore generate ID or use the one we created.
    // If we want to use the ID we generated:
    // await setDoc(doc(db, COLLECTION_NAME, log.id), log);
    // But since `log` object usually has ID, we can exclude it when adding?
    // Let's use `addDoc` and let Firestore generate ID, BUT our app expects `id`.
    // We should probably just store the log with its ID or omit ID.
    // Let's keep it simple: Use `addDoc`. The returned doc ref has ID.
    // But the UI generates an ID for optimistic UI? The AddLog page generated a UUID.
    // Let's just save the whole object first.
    // WAIT: If we use `addDoc`, the document ID is not inside the document data by default.
    // When reading back, we map `doc.id` to `id`.
    // So when saving, we should NOT save `id` field if we want to rely on Firestore ID.
    // However, AddLog generates an ID.
    // Let's remove `id` from the object before saving to avoid duplication/confusion,
    // OR just save it as a field `uid`?
    // Let's trust Firestore ID.
    const { id, ...logData } = log;
    const cleanData = JSON.parse(JSON.stringify(logData));
    await addDoc(collection(db, COLLECTION_NAME), cleanData);
  } catch (e) {
    console.error("Failed to save log to Firebase", e);
    throw e;
  }
};

export const updateLog = async (log: CareLog): Promise<void> => {
  try {
    const { id, ...logData } = log;
    if (!id) throw new Error("Log ID is required for update");
    const docRef = doc(db, COLLECTION_NAME, id);
    const cleanData = JSON.parse(JSON.stringify(logData));
    await updateDoc(docRef, cleanData);
  } catch (e) {
    console.error("Failed to update log", e);
    throw e;
  }
};

export const deleteLog = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {
    console.error("Failed to delete log", e);
    throw e;
  }
};

export const clearAllLogs = async (): Promise<void> => {
  // Warning: Deleting all documents in a collection from client is expensive/not direct.
  // We have to list and delete one by one.
  const logs = await getLogs();
  const batchPromises = logs.map(log => deleteLog(log.id));
  await Promise.all(batchPromises);
};

// Weight Log Functions
export const getWeightLogs = async (): Promise<WeightLog[]> => {
  try {
    const q = query(collection(db, WEIGHT_COLLECTION_NAME), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WeightLog));
  } catch (e) {
    console.error("Failed to load weight logs from Firebase", e);
    return [];
  }
};

export const getLatestWeightLog = async (): Promise<WeightLog | null> => {
  try {
    const q = query(
      collection(db, WEIGHT_COLLECTION_NAME),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as WeightLog;
  } catch (e) {
    console.error("Failed to get latest weight log", e);
    return null;
  }
};

export const saveWeightLog = async (log: WeightLog): Promise<void> => {
  try {
    const { id, ...logData } = log;
    await addDoc(collection(db, WEIGHT_COLLECTION_NAME), logData);
  } catch (e) {
    console.error("Failed to save weight log to Firebase", e);
    throw e;
  }
};

export const deleteWeightLog = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, WEIGHT_COLLECTION_NAME, id));
  } catch (e) {
    console.error("Failed to delete weight log", e);
    throw e;
  }
};

export const updateWeightLog = async (log: WeightLog): Promise<void> => {
  try {
    const { id, ...logData } = log;
    if (!id) throw new Error("Weight log ID is required for update");
    const docRef = doc(db, WEIGHT_COLLECTION_NAME, id);
    await updateDoc(docRef, logData);
  } catch (e) {
    console.error("Failed to update weight log", e);
    throw e;
  }
};

// Helper for status calculation
// Helper for status calculation
const getTimePeriod = (timestamp: number): 'morning' | 'noon' | 'evening' | 'bedtime' => {
  const hour = new Date(timestamp).getHours();
  if (hour >= 6 && hour < 11) return 'morning'; // 06:00 - 10:59
  if (hour >= 11 && hour < 17) return 'noon'; // 11:00 - 16:59
  if (hour >= 17 && hour < 23) return 'evening'; // 17:00 - 22:59
  return 'bedtime'; // 23:00 - 05:59
};

// Optimization: We could query only today's logs from Firestore
export const getTodayStatus = async (): Promise<DayStatus> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  try {
    // Query logs where timestamp >= startOfDay
    const q = query(
      collection(db, COLLECTION_NAME),
      where('timestamp', '>=', startOfDay)
    );
    const querySnapshot = await getDocs(q);
    const todayLogs = querySnapshot.docs.map(doc => ({ ...doc.data() } as CareLog));

    const initProgress = (): TaskProgress => ({
      morning: false,
      noon: false,
      evening: false,
      bedtime: false,
      isComplete: false
    });

    const status: DayStatus = {
      food: initProgress(),
      water: initProgress(),
      litter: initProgress(),
      grooming: initProgress(),
      medication: initProgress(),
      weight: initProgress(),
    };

    todayLogs.forEach(log => {
      const period = getTimePeriod(log.timestamp);

      if (log.actions.food) {
        if (period === 'morning') status.food.morning = true;
        if (period === 'noon') status.food.noon = true;
        if (period === 'evening') status.food.evening = true;
        if (period === 'bedtime') status.food.bedtime = true;
      }

      if (log.actions.water) {
        if (period === 'morning') status.water.morning = true;
        if (period === 'noon') status.water.noon = true;
        if (period === 'evening') status.water.evening = true;
        if (period === 'bedtime') status.water.bedtime = true;
      }

      if (log.actions.litter) {
        if (period === 'morning') status.litter.morning = true;
        if (period === 'noon') status.litter.noon = true;
        if (period === 'evening') status.litter.evening = true;
        if (period === 'bedtime') status.litter.bedtime = true;
      }

      if (log.actions.grooming) {
        if (period === 'morning') status.grooming.morning = true;
        if (period === 'noon') status.grooming.noon = true;
        if (period === 'evening') status.grooming.evening = true;
        if (period === 'bedtime') status.grooming.bedtime = true;
      }

      if (log.actions.medication) {
        if (period === 'morning') status.medication.morning = true;
        if (period === 'noon') status.medication.noon = true;
        if (period === 'evening') status.medication.evening = true;
        if (period === 'bedtime') status.medication.bedtime = true;
      }

      if (log.weight !== undefined && log.weight !== null) {
        if (period === 'morning') status.weight.morning = true;
        if (period === 'noon') status.weight.noon = true;
        if (period === 'evening') status.weight.evening = true;
        if (period === 'bedtime') status.weight.bedtime = true;
      }
    });

    // Calculate completion (all 4 periods must be done)
    status.food.isComplete = status.food.morning && status.food.noon && status.food.evening && status.food.bedtime;
    status.water.isComplete = status.water.morning && status.water.noon && status.water.evening && status.water.bedtime;
    status.litter.isComplete = status.litter.morning && status.litter.noon && status.litter.evening && status.litter.bedtime;
    status.grooming.isComplete = status.grooming.morning && status.grooming.noon && status.grooming.evening && status.grooming.bedtime;
    status.medication.isComplete = status.medication.morning && status.medication.noon && status.medication.evening && status.medication.bedtime;
    status.weight.isComplete = status.weight.morning && status.weight.noon && status.weight.evening && status.weight.bedtime;

    return status;

  } catch (e) {
    console.error("Failed to calculate today's status", e);
    // Return empty status on error
    return {
      food: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
      water: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
      litter: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
      grooming: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
      medication: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
      weight: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false }
    };
  }
};