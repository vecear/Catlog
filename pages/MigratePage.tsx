import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { generateUniquePetId, updateUserProfile } from '../services/storage';
import { Pet, CareLog, Owner, OWNER_COLORS } from '../types';

interface MigrationStatus {
    step: string;
    success: boolean;
    message: string;
}

export const MigratePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, userProfile, refreshUserProfile } = useAuth();
    const [isRunning, setIsRunning] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statuses, setStatuses] = useState<MigrationStatus[]>([]);
    const [newPetId, setNewPetId] = useState<string | null>(null);

    const addStatus = (step: string, success: boolean, message: string) => {
        setStatuses(prev => [...prev, { step, success, message }]);
    };

    // Update legacy owners for existing pet
    const updateLegacyOwners = async () => {
        if (!user || !userProfile || !userProfile.petIds || userProfile.petIds.length === 0) {
            setError('沒有找到已遷移的寵物');
            return;
        }

        setIsRunning(true);
        setError(null);
        setStatuses([]);

        try {
            // Read old profile to get owners
            addStatus('讀取舊資料', true, '正在讀取原有主人資料...');
            const oldProfileRef = doc(db, 'app_profile', 'main_profile');
            const oldProfileSnap = await getDoc(oldProfileRef);

            if (!oldProfileSnap.exists()) {
                addStatus('讀取舊資料', false, '找不到舊的資料');
                setError('找不到舊的資料 (app_profile/main_profile)');
                setIsRunning(false);
                return;
            }

            const oldProfile = oldProfileSnap.data();
            const legacyOwners: Owner[] = oldProfile.owners || [];
            addStatus('讀取主人', true, `找到 ${legacyOwners.length} 位原有主人: ${legacyOwners.map((o: Owner) => o.name).join(', ')}`);

            // Update each pet with legacy owners
            for (const petId of userProfile.petIds) {
                addStatus('更新寵物', true, `正在更新寵物 ${petId}...`);
                const petRef = doc(db, 'pets', petId);
                await setDoc(petRef, { legacyOwners }, { merge: true });
                addStatus('更新寵物', true, `寵物 ${petId} 已更新`);
            }

            // Refresh user profile
            await refreshUserProfile();

            addStatus('完成', true, '主人資料更新完成！');
            setCompleted(true);

        } catch (err: any) {
            console.error('Update legacy owners error:', err);
            setError(err.message || '更新過程發生錯誤');
            addStatus('錯誤', false, err.message || '更新過程發生錯誤');
        } finally {
            setIsRunning(false);
        }
    };

    const runMigration = async () => {
        if (!user || !userProfile) {
            setError('請先登入');
            return;
        }

        setIsRunning(true);
        setError(null);
        setStatuses([]);

        try {
            // Step 1: Read old profile
            addStatus('讀取舊資料', true, '正在讀取舊的寵物資料...');
            const oldProfileRef = doc(db, 'app_profile', 'main_profile');
            const oldProfileSnap = await getDoc(oldProfileRef);

            if (!oldProfileSnap.exists()) {
                addStatus('讀取舊資料', false, '找不到舊的寵物資料');
                setError('找不到舊的寵物資料 (app_profile/main_profile)');
                setIsRunning(false);
                return;
            }

            const oldProfile = oldProfileSnap.data();
            addStatus('讀取舊資料', true, `找到寵物: ${oldProfile.pet?.name || '未命名'}`);

            // Step 2: Read old logs
            addStatus('讀取紀錄', true, '正在讀取照顧紀錄...');
            const logsQuery = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
            const logsSnap = await getDocs(logsQuery);
            const oldLogs = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CareLog[];
            addStatus('讀取紀錄', true, `找到 ${oldLogs.length} 筆照顧紀錄`);

            // Step 3: Generate new pet ID
            addStatus('建立寵物', true, '正在產生新的寵物 ID...');
            const petId = await generateUniquePetId();
            setNewPetId(petId);

            // Step 4: Create new pet document
            // Get legacy owners from old profile
            const legacyOwners: Owner[] = oldProfile.owners || [];
            addStatus('讀取主人', true, `找到 ${legacyOwners.length} 位原有主人: ${legacyOwners.map((o: Owner) => o.name).join(', ')}`);

            const newPet: Pet = {
                id: petId,
                name: oldProfile.pet?.name || '小賀',
                type: 'cat', // Default to cat since it was a cat app
                birthday: oldProfile.pet?.birthday || '2025-06-08',
                gender: 'unknown',
                adoptionDate: oldProfile.pet?.adoptionDate || '2025-09-16',
                ownerIds: [user.uid],
                legacyOwners: legacyOwners, // Preserve original owners for log display
                createdBy: user.uid,
                createdAt: Date.now(),
                actionOrder: oldProfile.actionOrder || ['food', 'water', 'litter', 'grooming', 'medication', 'supplements', 'deworming', 'bath', 'weight'],
            };

            await setDoc(doc(db, 'pets', petId), newPet);
            addStatus('建立寵物', true, `寵物 "${newPet.name}" 已建立，ID: ${petId}`);

            // Step 5: Migrate logs in batches
            addStatus('遷移紀錄', true, '正在遷移照顧紀錄...');
            const batchSize = 400; // Firestore batch limit is 500
            let migratedCount = 0;

            for (let i = 0; i < oldLogs.length; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = oldLogs.slice(i, i + batchSize);

                for (const log of chunk) {
                    const { id, ...logData } = log;
                    const newLogRef = doc(collection(db, 'pets', petId, 'logs'));
                    batch.set(newLogRef, logData);
                }

                await batch.commit();
                migratedCount += chunk.length;
                addStatus('遷移紀錄', true, `已遷移 ${migratedCount}/${oldLogs.length} 筆紀錄`);
            }

            // Step 6: Update user profile with pet ID and mark onboarding complete
            addStatus('更新用戶', true, '正在更新用戶資料...');
            await updateUserProfile(user.uid, {
                petIds: [...(userProfile.petIds || []), petId],
                onboardingComplete: true,
                displayName: userProfile.displayName || user.email?.split('@')[0] || 'User',
            });
            addStatus('更新用戶', true, '用戶資料已更新');

            // Step 7: Refresh user profile
            await refreshUserProfile();

            addStatus('完成', true, '資料遷移完成！');
            setCompleted(true);

        } catch (err: any) {
            console.error('Migration error:', err);
            setError(err.message || '遷移過程發生錯誤');
            addStatus('錯誤', false, err.message || '遷移過程發生錯誤');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
            <div className="max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-white/50 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-stone-700" />
                    </button>
                    <h1 className="text-2xl font-bold text-stone-800">資料遷移</h1>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Database className="w-8 h-8 text-amber-500" />
                        <div>
                            <h2 className="font-bold text-stone-800">遷移舊資料</h2>
                            <p className="text-sm text-stone-500">將小賀的資料遷移到新系統</p>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-4 mb-4 text-sm text-amber-800">
                        <p className="font-medium mb-2">此操作會：</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>讀取 app_profile 中的寵物資料</li>
                            <li>讀取 logs 中的所有照顧紀錄</li>
                            <li>建立新的寵物資料（產生6位數ID）</li>
                            <li>將所有紀錄遷移到新結構</li>
                            <li>將寵物綁定到您的帳號</li>
                        </ul>
                    </div>

                    {!completed && !isRunning && (
                        <button
                            onClick={runMigration}
                            disabled={isRunning}
                            className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                            開始遷移
                        </button>
                    )}

                    {isRunning && (
                        <div className="flex items-center justify-center gap-2 py-3 text-amber-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>正在遷移中...</span>
                        </div>
                    )}

                    {completed && (
                        <div className="bg-emerald-50 rounded-xl p-4 text-center">
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                            <p className="font-bold text-emerald-700 mb-1">遷移完成！</p>
                            {newPetId && (
                                <p className="text-sm text-emerald-600 mb-3">
                                    寵物 ID: <span className="font-mono font-bold">{newPetId}</span>
                                </p>
                            )}
                            <button
                                onClick={() => navigate('/')}
                                className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                            >
                                回到首頁
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 rounded-xl p-4 mt-4 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
                </div>

                {/* Update Legacy Owners for existing pets */}
                {userProfile && userProfile.petIds && userProfile.petIds.length > 0 && !isRunning && !completed && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="w-8 h-8 text-blue-500" />
                            <div>
                                <h2 className="font-bold text-stone-800">更新原有主人</h2>
                                <p className="text-sm text-stone-500">為已遷移的寵物添加原有主人資料</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm text-blue-800">
                            <p className="font-medium mb-2">此操作會：</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>讀取 app_profile 中的原有主人資料</li>
                                <li>將 RURU、CCL 等原有主人加到寵物資料中</li>
                                <li>讓舊的照顧紀錄可以正確顯示主人名稱和顏色</li>
                            </ul>
                        </div>

                        <button
                            onClick={updateLegacyOwners}
                            disabled={isRunning}
                            className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            更新主人資料
                        </button>
                    </div>
                )}

                {statuses.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <h3 className="font-bold text-stone-700 mb-3">執行進度</h3>
                        <div className="space-y-2">
                            {statuses.map((status, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm">
                                    {status.success ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    )}
                                    <span className={status.success ? 'text-stone-600' : 'text-red-600'}>
                                        {status.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
