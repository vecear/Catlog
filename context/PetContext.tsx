import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Pet, CareLog, DayStatus, UserProfile } from '../types';
import { getUserPets, getPet, getPetLogs, getPetTodayStatus, savePetLog, updatePetLog, deletePetLog, getPetOwners } from '../services/storage';

interface PetContextType {
    pets: Pet[];
    selectedPet: Pet | null;
    selectedPetOwners: UserProfile[];
    logs: CareLog[];
    todayStatus: DayStatus;
    loading: boolean;
    selectPet: (petId: string) => Promise<void>;
    refreshPets: () => Promise<void>;
    refreshLogs: () => Promise<void>;
    refreshTodayStatus: () => Promise<void>;
    saveLog: (log: CareLog) => Promise<void>;
    updateLog: (log: CareLog) => Promise<void>;
    deleteLog: (logId: string) => Promise<void>;
    getLog: (logId: string) => CareLog | undefined;
}

const defaultStatus: DayStatus = {
    food: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    water: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    litter: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    grooming: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    medication: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    supplements: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    weight: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
};

const PetContext = createContext<PetContextType>({
    pets: [],
    selectedPet: null,
    selectedPetOwners: [],
    logs: [],
    todayStatus: defaultStatus,
    loading: true,
    selectPet: async () => {},
    refreshPets: async () => {},
    refreshLogs: async () => {},
    refreshTodayStatus: async () => {},
    saveLog: async () => {},
    updateLog: async () => {},
    deleteLog: async () => {},
    getLog: () => undefined,
});

export const usePet = () => useContext(PetContext);

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userProfile } = useAuth();
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [selectedPetOwners, setSelectedPetOwners] = useState<UserProfile[]>([]);
    const [logs, setLogs] = useState<CareLog[]>([]);
    const [todayStatus, setTodayStatus] = useState<DayStatus>(defaultStatus);
    const [loading, setLoading] = useState(true);

    // Load user's pets when user profile changes
    const refreshPets = useCallback(async () => {
        if (!user) {
            setPets([]);
            setSelectedPet(null);
            setLoading(false);
            return;
        }

        try {
            const userPets = await getUserPets(user.uid);
            setPets(userPets);

            // Auto-select first pet if none selected
            if (userPets.length > 0 && !selectedPet) {
                const firstPet = userPets[0];
                setSelectedPet(firstPet);
                // Load owners for the selected pet
                const owners = await getPetOwners(firstPet.id);
                setSelectedPetOwners(owners);
            }
        } catch (error) {
            console.error('Failed to load pets:', error);
        } finally {
            setLoading(false);
        }
    }, [user, selectedPet]);

    // Select a specific pet
    const selectPet = useCallback(async (petId: string) => {
        try {
            const pet = await getPet(petId);
            if (pet) {
                setSelectedPet(pet);
                const owners = await getPetOwners(petId);
                setSelectedPetOwners(owners);
            }
        } catch (error) {
            console.error('Failed to select pet:', error);
        }
    }, []);

    // Load logs for selected pet
    const refreshLogs = useCallback(async () => {
        if (!selectedPet) {
            setLogs([]);
            return;
        }

        try {
            const petLogs = await getPetLogs(selectedPet.id);
            setLogs(petLogs);
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
    }, [selectedPet]);

    // Load today's status for selected pet
    const refreshTodayStatus = useCallback(async () => {
        if (!selectedPet) {
            setTodayStatus(defaultStatus);
            return;
        }

        try {
            const status = await getPetTodayStatus(selectedPet.id);
            setTodayStatus(status);
        } catch (error) {
            console.error('Failed to load today status:', error);
        }
    }, [selectedPet]);

    // Save a new log for selected pet
    const saveLogHandler = useCallback(async (log: CareLog) => {
        if (!selectedPet) {
            throw new Error('No pet selected');
        }
        await savePetLog(selectedPet.id, log);
        await refreshLogs();
        await refreshTodayStatus();
    }, [selectedPet, refreshLogs, refreshTodayStatus]);

    // Update an existing log
    const updateLogHandler = useCallback(async (log: CareLog) => {
        if (!selectedPet) {
            throw new Error('No pet selected');
        }
        await updatePetLog(selectedPet.id, log);
        await refreshLogs();
        await refreshTodayStatus();
    }, [selectedPet, refreshLogs, refreshTodayStatus]);

    // Delete a log
    const deleteLogHandler = useCallback(async (logId: string) => {
        if (!selectedPet) {
            throw new Error('No pet selected');
        }
        await deletePetLog(selectedPet.id, logId);
        await refreshLogs();
        await refreshTodayStatus();
    }, [selectedPet, refreshLogs, refreshTodayStatus]);

    // Get a specific log by ID
    const getLog = useCallback((logId: string): CareLog | undefined => {
        return logs.find(log => log.id === logId);
    }, [logs]);

    // Load pets when user changes
    useEffect(() => {
        refreshPets();
    }, [user?.uid]);

    // Load logs and status when selected pet changes
    useEffect(() => {
        if (selectedPet) {
            refreshLogs();
            refreshTodayStatus();
        }
    }, [selectedPet?.id]);

    const value = {
        pets,
        selectedPet,
        selectedPetOwners,
        logs,
        todayStatus,
        loading,
        selectPet,
        refreshPets,
        refreshLogs,
        refreshTodayStatus,
        saveLog: saveLogHandler,
        updateLog: updateLogHandler,
        deleteLog: deleteLogHandler,
        getLog,
    };

    return (
        <PetContext.Provider value={value}>
            {children}
        </PetContext.Provider>
    );
};
