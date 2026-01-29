import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/auth';
import { completeOnboarding, createPet, getPet, createCareRequest, updateUserProfile } from '../services/storage';
import { PetType, PetGender, PET_TYPE_LABELS, PET_TYPE_ICONS, PET_GENDER_LABELS } from '../types';
import { User, PawPrint, Plus, Users, ArrowRight, ArrowLeft, Check, Search, Sparkles, Database, LogOut } from 'lucide-react';

type OnboardingStep = 'displayName' | 'petChoice' | 'addPet' | 'joinPet' | 'joinPetConfirm';

export const OnboardingPage: React.FC = () => {
    const { user, userProfile, isAuthenticated, needsOnboarding, refreshUserProfile } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<OnboardingStep>('displayName');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Display name
    const [displayName, setDisplayName] = useState('');

    // Add pet form
    const [petName, setPetName] = useState('');
    const [petType, setPetType] = useState<PetType>('cat');
    const [petGender, setPetGender] = useState<PetGender>('unknown');
    const [petBirthday, setPetBirthday] = useState('');
    const [petAdoptionDate, setPetAdoptionDate] = useState('');

    // Join pet form
    const [petIdInput, setPetIdInput] = useState('');
    const [foundPet, setFoundPet] = useState<any>(null);

    useEffect(() => {
        const checkUserStatus = async () => {
            if (!isAuthenticated) {
                navigate('/login');
                return;
            }

            if (!needsOnboarding && userProfile?.onboardingComplete) {
                navigate('/');
                return;
            }

            // Check if user already has pets (from migration) but onboarding not complete
            if (user && userProfile && userProfile.petIds && userProfile.petIds.length > 0 && !userProfile.onboardingComplete) {
                // User has pets but onboarding not marked complete, fix it and redirect
                try {
                    await completeOnboarding(user.uid, userProfile.displayName || user.email?.split('@')[0] || 'User');
                    await refreshUserProfile();
                    navigate('/');
                } catch (err) {
                    console.error('Error completing onboarding:', err);
                }
            }
        };

        checkUserStatus();
    }, [isAuthenticated, needsOnboarding, userProfile, user, navigate, refreshUserProfile]);

    const handleDisplayNameSubmit = async () => {
        if (!displayName.trim()) {
            setError('請輸入顯示名稱');
            return;
        }

        if (!user) return;

        setIsLoading(true);
        setError('');
        try {
            await updateUserProfile(user.uid, { displayName: displayName.trim() });
            await refreshUserProfile();

            // Check if user already has pets (from migration)
            const updatedProfile = await import('../services/storage').then(m => m.getUserProfile(user.uid));
            if (updatedProfile && updatedProfile.petIds && updatedProfile.petIds.length > 0) {
                // User already has pets, complete onboarding and go to home
                await completeOnboarding(user.uid, displayName.trim());
                await refreshUserProfile();
                navigate('/');
                return;
            }

            setStep('petChoice');
        } catch (err: any) {
            setError(err.message || '更新失敗，請重試');
        }
        setIsLoading(false);
    };

    const handleAddPet = async () => {
        if (!petName.trim()) {
            setError('請輸入寵物名稱');
            return;
        }
        if (!petBirthday) {
            setError('請選擇出生日期');
            return;
        }
        if (!petAdoptionDate) {
            setError('請選擇來家裡的日期');
            return;
        }

        if (!user || !userProfile) return;

        setIsLoading(true);
        setError('');
        try {
            await createPet(user.uid, {
                name: petName.trim(),
                type: petType,
                gender: petGender,
                birthday: petBirthday,
                adoptionDate: petAdoptionDate,
            });

            await completeOnboarding(user.uid, userProfile.displayName || displayName.trim());
            await refreshUserProfile();
            navigate('/');
        } catch (err: any) {
            setError(err.message || '建立寵物失敗，請重試');
        }
        setIsLoading(false);
    };

    const handleSearchPet = async () => {
        if (!petIdInput.trim()) {
            setError('請輸入寵物 ID');
            return;
        }

        if (petIdInput.length !== 6 || !/^\d+$/.test(petIdInput)) {
            setError('寵物 ID 必須是 6 位數字');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const pet = await getPet(petIdInput);
            if (pet) {
                setFoundPet(pet);
                setStep('joinPetConfirm');
            } else {
                setError('找不到此寵物，請確認 ID 是否正確');
            }
        } catch (err: any) {
            setError(err.message || '搜尋失敗，請重試');
        }
        setIsLoading(false);
    };

    const handleJoinPetRequest = async () => {
        if (!user || !userProfile || !foundPet) return;

        // Check if already an owner
        if (foundPet.ownerIds.includes(user.uid)) {
            setError('您已經是這隻寵物的照顧者');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await createCareRequest(
                foundPet.id,
                user.uid,
                userProfile.displayName || displayName.trim(),
                userProfile.email
            );

            await completeOnboarding(user.uid, userProfile.displayName || displayName.trim());
            await refreshUserProfile();

            alert('申請已送出！請等待原照顧者審核。');
            navigate('/');
        } catch (err: any) {
            setError(err.message || '申請失敗，請重試');
        }
        setIsLoading(false);
    };

    const petTypes: PetType[] = ['cat', 'dog', 'fish', 'duck', 'rabbit', 'mouse', 'lizard'];
    const petGenders: PetGender[] = ['male', 'female', 'unknown'];

    const renderStep = () => {
        switch (step) {
            case 'displayName':
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">設定您的名稱</h2>
                            <p className="text-gray-500">這個名稱會顯示在照護記錄中</p>
                        </div>

                        <div>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="輸入您的名稱"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-center text-lg"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={handleDisplayNameSubmit}
                            disabled={isLoading || !displayName.trim()}
                            className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? '處理中...' : (
                                <>
                                    下一步
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <button
                            onClick={async () => {
                                await logout();
                                navigate('/login');
                            }}
                            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            <LogOut className="w-4 h-4" />
                            返回登入頁面
                        </button>
                    </div>
                );

            case 'petChoice':
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PawPrint className="w-8 h-8 text-orange-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">設定您的寵物</h2>
                            <p className="text-gray-500">選擇新增寵物或加入照顧</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => setStep('addPet')}
                                className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-all flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <Plus className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-800">新增寵物</p>
                                    <p className="text-sm text-gray-500">建立新的寵物檔案</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setStep('joinPet')}
                                className="w-full p-4 bg-purple-50 border-2 border-purple-200 rounded-xl hover:bg-purple-100 hover:border-purple-300 transition-all flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-800">共同照顧寵物</p>
                                    <p className="text-sm text-gray-500">輸入寵物 ID 加入照顧行列</p>
                                </div>
                            </button>
                        </div>

                        <button
                            onClick={() => setStep('displayName')}
                            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            返回上一步
                        </button>

                        {/* Migration link for existing users */}
                        <div className="border-t border-gray-100 pt-4 mt-4">
                            <Link
                                to="/migrate"
                                className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all flex items-center gap-3 text-left"
                            >
                                <Database className="w-5 h-5 text-amber-600" />
                                <div>
                                    <p className="font-medium text-amber-800 text-sm">已有舊資料？</p>
                                    <p className="text-xs text-amber-600">點此遷移小賀的照顧紀錄</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                );

            case 'addPet':
                return (
                    <div className="space-y-5">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">新增寵物</h2>
                            <p className="text-gray-500">填寫您寵物的資料</p>
                        </div>

                        {/* Pet Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">寵物類別</label>
                            <div className="grid grid-cols-4 gap-2">
                                {petTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setPetType(type)}
                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                                            petType === type
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className="text-2xl">{PET_TYPE_ICONS[type]}</span>
                                        <span className="text-xs text-gray-600">{PET_TYPE_LABELS[type]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pet Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">寵物名稱</label>
                            <input
                                type="text"
                                value={petName}
                                onChange={(e) => setPetName(e.target.value)}
                                placeholder="輸入寵物名稱"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Pet Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
                            <div className="grid grid-cols-3 gap-2">
                                {petGenders.map((gender) => (
                                    <button
                                        key={gender}
                                        onClick={() => setPetGender(gender)}
                                        className={`p-3 rounded-xl border-2 transition-all ${
                                            petGender === gender
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className="text-sm font-medium text-gray-700">{PET_GENDER_LABELS[gender]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pet Birthday */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">出生日期</label>
                            <input
                                type="date"
                                value={petBirthday}
                                onChange={(e) => setPetBirthday(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Adoption Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">來家裡的日子</label>
                            <input
                                type="date"
                                value={petAdoptionDate}
                                onChange={(e) => setPetAdoptionDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            onClick={handleAddPet}
                            disabled={isLoading}
                            className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? '建立中...' : (
                                <>
                                    <Check className="w-5 h-5" />
                                    建立寵物
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setStep('petChoice')}
                            disabled={isLoading}
                            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            返回上一步
                        </button>
                    </div>
                );

            case 'joinPet':
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-purple-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">共同照顧寵物</h2>
                            <p className="text-gray-500">輸入寵物的 6 位數 ID</p>
                        </div>

                        <div>
                            <input
                                type="text"
                                value={petIdInput}
                                onChange={(e) => setPetIdInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="輸入 6 位數字 ID"
                                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 text-center text-2xl tracking-widest font-mono"
                                disabled={isLoading}
                                maxLength={6}
                                autoFocus
                            />
                            <p className="mt-2 text-sm text-gray-400 text-center">
                                可以向寵物的主人詢問 ID
                            </p>
                        </div>

                        <button
                            onClick={handleSearchPet}
                            disabled={isLoading || petIdInput.length !== 6}
                            className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? '搜尋中...' : (
                                <>
                                    <Search className="w-5 h-5" />
                                    搜尋寵物
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setStep('petChoice')}
                            disabled={isLoading}
                            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            返回上一步
                        </button>
                    </div>
                );

            case 'joinPetConfirm':
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">{foundPet && PET_TYPE_ICONS[foundPet.type as PetType]}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">找到寵物了！</h2>
                            <p className="text-gray-500">確認是否要申請共同照顧</p>
                        </div>

                        {foundPet && (
                            <div className="bg-purple-50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">名稱</span>
                                    <span className="font-bold text-gray-800">{foundPet.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">類別</span>
                                    <span className="font-medium text-gray-700">{PET_TYPE_LABELS[foundPet.type as PetType]}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">性別</span>
                                    <span className="font-medium text-gray-700">{PET_GENDER_LABELS[foundPet.gender as PetGender]}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">出生日期</span>
                                    <span className="font-medium text-gray-700">{foundPet.birthday}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">ID</span>
                                    <span className="font-mono text-gray-500">{foundPet.id}</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <p className="text-yellow-700 text-sm">
                                按下「申請加入」後，原照顧者會收到您的申請通知。
                                待對方同意後，您就可以開始共同照顧這隻寵物。
                            </p>
                        </div>

                        <button
                            onClick={handleJoinPetRequest}
                            disabled={isLoading}
                            className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? '申請中...' : (
                                <>
                                    <Users className="w-5 h-5" />
                                    申請加入
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setStep('joinPet');
                                setFoundPet(null);
                            }}
                            disabled={isLoading}
                            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            返回搜尋
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
            <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {renderStep()}

                {/* Progress indicator */}
                <div className="mt-6 flex justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors ${step === 'displayName' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <div className={`w-2 h-2 rounded-full transition-colors ${step === 'petChoice' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <div className={`w-2 h-2 rounded-full transition-colors ${['addPet', 'joinPet', 'joinPetConfirm'].includes(step) ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                </div>
            </div>
        </div>
    );
};
