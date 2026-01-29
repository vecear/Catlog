import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Utensils, Droplets, Trash2, User, AlertCircle, CheckCircle, HelpCircle, XCircle, Sparkles, Clock, Pill, Scale, ShowerHead, Bug, Leaf } from 'lucide-react';
import { CombIcon } from '../components/icons/CombIcon';
import { CareLog, StoolType, UrineStatus, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePet } from '../context/PetContext';

export const AddLog: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const { user, userProfile } = useAuth();
    const { selectedPet, selectedPetOwners, logs, saveLog, updateLog, getLog } = usePet();

    // Helper function to format date in local timezone (YYYY-MM-DD)
    const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Default to current date and time
    const now = new Date();
    const defaultDate = formatLocalDate(now);
    const defaultTime = now.toTimeString().slice(0, 5); // HH:MM

    const [date, setDate] = useState(defaultDate);
    const [time, setTime] = useState(defaultTime);
    const [author, setAuthor] = useState<string>('');
    const [actionOrder, setActionOrder] = useState<string[]>(['food', 'water', 'litter', 'grooming', 'medication', 'deworming', 'bath', 'weight']);
    const [actions, setActions] = useState({
        food: false,
        water: false,
        litter: false,
        grooming: false,
        medication: false,
        supplements: false,
        deworming: false,
        bath: false,
    });
    const [stoolType, setStoolType] = useState<StoolType>(null);
    const [urineStatus, setUrineStatus] = useState<UrineStatus>(null);
    const [isLitterClean, setIsLitterClean] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Weight recording state
    const [recordWeight, setRecordWeight] = useState(false);
    const [weightInt, setWeightInt] = useState(6);
    const [weightDecimal, setWeightDecimal] = useState(0);

    // Load latest weight for default
    const loadLatestWeight = () => {
        const lastWeightLog = logs
            .filter(l => l.weight)
            .sort((a, b) => b.timestamp - a.timestamp)[0];

        if (lastWeightLog && lastWeightLog.weight) {
            const intPart = Math.floor(lastWeightLog.weight);
            const decPart = Math.round((lastWeightLog.weight - intPart) * 10);
            setWeightInt(intPart);
            setWeightDecimal(decPart);
        }
    };

    // Set default author and action order
    useEffect(() => {
        if (!isEditMode && selectedPetOwners.length > 0) {
            // Set default author to current user if they're an owner
            const currentUserOwner = selectedPetOwners.find(o => o.id === user?.uid);
            if (currentUserOwner) {
                setAuthor(currentUserOwner.displayName);
            } else if (selectedPetOwners.length > 0) {
                setAuthor(selectedPetOwners[0].displayName);
            }
        }

        // Load action order from pet if available
        if (selectedPet?.actionOrder) {
            setActionOrder(selectedPet.actionOrder);
        }
    }, [selectedPetOwners, selectedPet, user?.uid, isEditMode]);

    useEffect(() => {
        if (!isEditMode) {
            loadLatestWeight();
        }
    }, [logs, isEditMode]);

    useEffect(() => {
        if (isEditMode && id) {
            setIsLoading(true);
            const log = getLog(id);
            if (log) {
                const dateObj = new Date(log.timestamp);
                setDate(formatLocalDate(dateObj));
                setTime(dateObj.toTimeString().slice(0, 5));
                setAuthor(log.author);
                setActions(log.actions);
                if (log.actions.litter) {
                    setStoolType(log.stoolType || null);
                    setUrineStatus(log.urineStatus || null);
                    setIsLitterClean(log.isLitterClean || false);
                }
                // Load weight data if present
                if (log.weight !== undefined && log.weight !== null) {
                    setRecordWeight(true);
                    const intPart = Math.floor(log.weight);
                    const decPart = Math.round((log.weight - intPart) * 10);
                    setWeightInt(intPart);
                    setWeightDecimal(decPart);
                }
            } else {
                alert('找不到紀錄');
                navigate('/');
            }
            setIsLoading(false);
        }
    }, [isEditMode, id, navigate, getLog]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!selectedPet) {
            alert('請先選擇寵物');
            return;
        }

        const timestamp = new Date(`${date}T${time}`).getTime();

        // Validate that at least one action is selected OR weight is being recorded
        const hasAnyAction = actions.food || actions.water || actions.litter || actions.grooming || actions.medication || actions.supplements || actions.deworming || actions.bath;
        if (!hasAnyAction && !recordWeight) {
            alert("請至少選擇一個項目！");
            return;
        }

        // Validate litter details if litter is selected
        if (actions.litter) {
            // Must select either "乾淨不用清" OR at least one of urine status/stool type
            if (!isLitterClean && !urineStatus && !stoolType) {
                alert("請選擇「乾淨不用清」或是填寫尿尿狀態或便便狀態！");
                return;
            }
        }

        setIsSubmitting(true);
        try {

            const logData: CareLog = {
                id: isEditMode && id ? id : crypto.randomUUID(),
                timestamp,
                actions,
                author,
                stoolType: actions.litter ? stoolType : null,
                urineStatus: actions.litter ? urineStatus : null,
                isLitterClean: actions.litter ? isLitterClean : undefined,
                weight: recordWeight ? (weightInt + weightDecimal / 10) : undefined,
                note: ''
            };

            if (isEditMode) {
                await updateLog(logData);
            } else {
                await saveLog(logData);
            }
            navigate('/');
        } catch (e) {
            console.error(e);
            alert("儲存失敗，請檢查網路連線");
            setIsSubmitting(false);
        }
    };

    const toggleAction = (key: keyof typeof actions) => {
        setActions(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            // Reset details if litter is deselected
            if (key === 'litter' && !newState.litter) {
                setStoolType(null);
                setUrineStatus(null);
                setIsLitterClean(false);
            }
            return newState;
        });
    };

    const handleCleanClick = () => {
        const newCleanState = !isLitterClean;
        setIsLitterClean(newCleanState);
        if (newCleanState) {
            setStoolType(null);
            setUrineStatus(null);
        }
    };

    const handleUrineClick = (status: UrineStatus) => {
        setUrineStatus(prev => {
            const newVal = prev === status ? null : status;
            if (newVal) setIsLitterClean(false);
            return newVal;
        });
    };

    const handleStoolClick = (type: StoolType) => {
        setStoolType(prev => {
            const newVal = prev === type ? null : type;
            if (newVal) setIsLitterClean(false);
            return newVal;
        });
    };

    const handleSetCurrentTime = () => {
        const now = new Date();
        setDate(formatLocalDate(now));
        setTime(now.toTimeString().slice(0, 5));
    };

    const ActionButton = ({
        id,
        label,
        icon: Icon,
        active,
        activeColorClass,
        activeIconClass
    }: {
        key?: React.Key,
        id: keyof typeof actions,
        label: string,
        icon: React.ElementType,
        active: boolean,
        activeColorClass: string,
        activeIconClass: string
    }) => (
        <button
            type="button"
            onClick={() => toggleAction(id)}
            className={`
        w-full p-4 rounded-2xl flex items-center gap-4 border transition-all duration-200
        ${active
                    ? `${activeColorClass} shadow-md border-transparent transform scale-[1.01]`
                    : 'border-stone-100 bg-white text-stone-400 hover:bg-stone-50'}
      `}
        >
            <div className={`p-3 rounded-full ${active ? 'bg-white/50' : 'bg-stone-100'}`}>
                <Icon className={`w-6 h-6 ${active ? activeIconClass : 'text-stone-400'}`} />
            </div>
            <span className={`font-bold text-lg flex-1 text-left ${active ? 'text-stone-700' : ''}`}>{label}</span>
            <div className={`
        w-6 h-6 rounded-full border-2 flex items-center justify-center
        ${active ? 'border-stone-600 bg-stone-600' : 'border-stone-300'}
      `}>
                {active && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
        </button>
    );

    if (!selectedPet) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="text-6xl mb-4">🐾</div>
                <h2 className="text-xl font-bold text-stone-700 mb-2">還沒有寵物</h2>
                <p className="text-stone-500 mb-4 text-center">請先完成設定流程來新增您的寵物</p>
                <button
                    onClick={() => navigate('/onboarding')}
                    className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors"
                >
                    開始設定
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up max-w-lg mx-auto">
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-stone-700" />
                </button>

                <h2 className="text-2xl font-bold text-stone-800">{isEditMode ? '編輯紀錄' : '新增紀錄'}</h2>
            </div>

            {
                isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-800"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Author Selection */}
                        <section className="bg-white p-5 rounded-2xl shadow-sm space-y-3">
                            <div className="flex items-center gap-2 text-stone-500 mb-2">
                                <User className="w-4 h-4" />
                                <h3 className="text-sm font-bold uppercase tracking-wider">紀錄人</h3>
                            </div>
                            <div className={`grid gap-4 ${selectedPetOwners.length <= 2 ? 'grid-cols-2' : selectedPetOwners.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                {selectedPetOwners.map((owner) => {
                                    const isActive = author === owner.displayName;
                                    return (
                                        <button
                                            key={owner.id}
                                            type="button"
                                            onClick={() => setAuthor(owner.displayName)}
                                            className={`
                                                py-3 px-4 rounded-xl font-bold transition-all duration-200
                                                ${isActive
                                                    ? 'text-white shadow-lg ring-2'
                                                    : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}
                                            `}
                                            style={isActive ? {
                                                backgroundColor: owner.color,
                                                boxShadow: `0 10px 15px -3px ${owner.color}40`,
                                                ringColor: `${owner.color}20`
                                            } : undefined}
                                        >
                                            {owner.displayName}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Date Time Selection */}
                        <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">時間</label>
                                <button
                                    type="button"
                                    onClick={handleSetCurrentTime}
                                    className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
                                >
                                    <Clock className="w-3 h-3" />
                                    現在時間
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-5 w-full px-2">
                                <div className="space-y-1 min-w-0">
                                    <label className="text-xs text-stone-400">日期</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full min-w-0 h-12 appearance-none py-0 bg-stone-50 border border-stone-200 rounded-xl px-1 text-sm text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 text-center tracking-tight"
                                        required
                                    />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <label className="text-xs text-stone-400">時間</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full min-w-0 h-12 appearance-none py-0 bg-stone-50 border border-stone-200 rounded-xl px-0 text-sm text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 text-center tracking-tight"
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Actions Selection */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider px-1">完成項目</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {actionOrder.map((actionId) => {
                                    switch (actionId) {
                                        case 'food':
                                            return (
                                                <ActionButton
                                                    key="food"
                                                    id="food"
                                                    label="更換飼料"
                                                    icon={Utensils}
                                                    active={actions.food}
                                                    activeColorClass="bg-yellow-50 border-yellow-200"
                                                    activeIconClass="text-yellow-600"
                                                />
                                            );
                                        case 'water':
                                            return (
                                                <ActionButton
                                                    key="water"
                                                    id="water"
                                                    label="更換飲水"
                                                    icon={Droplets}
                                                    active={actions.water}
                                                    activeColorClass="bg-[#921AFF]/5 border-[#921AFF]/20"
                                                    activeIconClass="text-[#921AFF]"
                                                />
                                            );
                                        case 'litter':
                                            return (
                                                <div key="litter" className={`rounded-2xl transition-all duration-300 ${actions.litter ? 'bg-emerald-50 p-2 border border-emerald-200' : ''}`}>
                                                    <ActionButton
                                                        id="litter"
                                                        label="清理貓砂"
                                                        icon={Trash2}
                                                        active={actions.litter}
                                                        activeColorClass="bg-emerald-100 border-emerald-200"
                                                        activeIconClass="text-emerald-700"
                                                    />
                                                    {actions.litter && (
                                                        <div className="mt-4 animate-fade-in space-y-4 px-1 pb-2">
                                                            <button
                                                                type="button"
                                                                onClick={handleCleanClick}
                                                                className={`w-full py-4 px-2 rounded-xl text-lg font-bold border flex items-center justify-center gap-2 transition-all ${isLitterClean
                                                                    ? 'bg-emerald-500 text-white shadow-md border-transparent transform scale-[1.02]'
                                                                    : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                                                                    }`}
                                                            >
                                                                <Sparkles className={`w-5 h-5 ${isLitterClean ? 'text-white' : 'text-emerald-500'}`} />
                                                                乾淨不用清
                                                            </button>
                                                            {!isLitterClean && (
                                                                <div className="space-y-4 animate-fade-in">
                                                                    <div className="border-t border-stone-100 pt-4">
                                                                        <h4 className="text-xs font-bold text-stone-500 mb-2 pl-1">尿尿狀態</h4>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleUrineClick('HAS_URINE')}
                                                                                className={`py-3 px-2 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${urineStatus === 'HAS_URINE'
                                                                                    ? 'bg-sky-100 border-sky-300 text-sky-700 shadow-sm ring-1 ring-sky-200'
                                                                                    : 'bg-white border-stone-200 text-stone-400'
                                                                                    }`}
                                                                            >
                                                                                <Droplets className="w-4 h-4" />
                                                                                有尿
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleUrineClick('NO_URINE')}
                                                                                className={`py-3 px-2 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all ${urineStatus === 'NO_URINE'
                                                                                    ? 'bg-stone-200 border-stone-300 text-stone-600 shadow-sm ring-1 ring-stone-200'
                                                                                    : 'bg-white border-stone-200 text-stone-400'
                                                                                    }`}
                                                                            >
                                                                                <XCircle className="w-4 h-4" />
                                                                                沒尿
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-xs font-bold text-stone-500 mb-2 pl-1">便便狀態</h4>
                                                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleStoolClick('FORMED')}
                                                                                className={`py-2 px-1 rounded-lg text-sm font-bold border flex flex-col items-center gap-1 transition-all ${stoolType === 'FORMED'
                                                                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700 shadow-sm'
                                                                                    : 'bg-white border-stone-200 text-stone-400'
                                                                                    }`}
                                                                            >
                                                                                <CheckCircle className="w-4 h-4" />
                                                                                成形
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleStoolClick('UNFORMED')}
                                                                                className={`py-2 px-1 rounded-lg text-sm font-bold border flex flex-col items-center gap-1 transition-all ${stoolType === 'UNFORMED'
                                                                                    ? 'bg-orange-100 border-orange-300 text-orange-700 shadow-sm'
                                                                                    : 'bg-white border-stone-200 text-stone-400'
                                                                                    }`}
                                                                            >
                                                                                <HelpCircle className="w-4 h-4" />
                                                                                不成形
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleStoolClick('DIARRHEA')}
                                                                                className={`py-2 px-1 rounded-lg text-sm font-bold border flex flex-col items-center gap-1 transition-all ${stoolType === 'DIARRHEA'
                                                                                    ? 'bg-red-100 border-red-300 text-red-700 shadow-sm'
                                                                                    : 'bg-white border-stone-200 text-stone-400'
                                                                                    }`}
                                                                            >
                                                                                <AlertCircle className="w-4 h-4" />
                                                                                腹瀉
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        case 'grooming':
                                            return (
                                                <ActionButton
                                                    key="grooming"
                                                    id="grooming"
                                                    label="梳毛"
                                                    icon={CombIcon}
                                                    active={actions.grooming}
                                                    activeColorClass="bg-pink-50 border-pink-200"
                                                    activeIconClass="text-pink-600"
                                                />
                                            );
                                        case 'medication':
                                            return (
                                                <ActionButton
                                                    key="medication"
                                                    id="medication"
                                                    label="給藥"
                                                    icon={Pill}
                                                    active={actions.medication}
                                                    activeColorClass="bg-cyan-50 border-cyan-200"
                                                    activeIconClass="text-cyan-600"
                                                />
                                            );
                                        case 'supplements':
                                            return (
                                                <ActionButton
                                                    key="supplements"
                                                    id="supplements"
                                                    label="保健食品"
                                                    icon={Leaf}
                                                    active={actions.supplements}
                                                    activeColorClass="bg-indigo-50 border-indigo-200"
                                                    activeIconClass="text-indigo-600"
                                                />
                                            );
                                        case 'deworming':
                                            return (
                                                <ActionButton
                                                    key="deworming"
                                                    id="deworming"
                                                    label="驅蟲"
                                                    icon={Bug}
                                                    active={actions.deworming}
                                                    activeColorClass="bg-red-50 border-red-200"
                                                    activeIconClass="text-red-500"
                                                />
                                            );
                                        case 'bath':
                                            return (
                                                <ActionButton
                                                    key="bath"
                                                    id="bath"
                                                    label="洗澡"
                                                    icon={ShowerHead}
                                                    active={actions.bath}
                                                    activeColorClass="bg-blue-50 border-blue-200"
                                                    activeIconClass="text-blue-500"
                                                />
                                            );
                                        case 'weight':
                                            return (
                                                <div key="weight" className={`rounded-2xl transition-all duration-300 ${recordWeight ? 'bg-[#EA7500]/10 p-2 border border-[#EA7500]/30' : ''}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRecordWeight(!recordWeight)}
                                                        className={`
                                                            w-full p-4 rounded-2xl flex items-center gap-4 border transition-all duration-200
                                                            ${recordWeight
                                                                ? 'bg-[#EA7500]/20 border-[#EA7500]/30 shadow-md border-transparent transform scale-[1.01]'
                                                                : 'border-stone-100 bg-white text-stone-400 hover:bg-stone-50'}
                                                        `}
                                                    >
                                                        <div className={`p-3 rounded-full ${recordWeight ? 'bg-white/50' : 'bg-stone-100'}`}>
                                                            <Scale className={`w-6 h-6 ${recordWeight ? 'text-[#EA7500]' : 'text-stone-400'}`} />
                                                        </div>
                                                        <span className={`font-bold text-lg flex-1 text-left ${recordWeight ? 'text-stone-700' : ''}`}>紀錄體重</span>
                                                        <div className={`
                                                            w-6 h-6 rounded-full border-2 flex items-center justify-center
                                                            ${recordWeight ? 'border-stone-600 bg-stone-600' : 'border-stone-300'}
                                                        `}>
                                                            {recordWeight && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                                        </div>
                                                    </button>
                                                    {recordWeight && (
                                                        <div className="mt-4 animate-fade-in px-1 pb-2">
                                                            <div className="flex items-center justify-center gap-0">
                                                                <select
                                                                    value={weightInt}
                                                                    onChange={(e) => setWeightInt(Number(e.target.value))}
                                                                    className="h-14 w-20 text-2xl font-bold text-center bg-white border-2 border-[#EA7500]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA7500]/50 text-[#EA7500] appearance-none"
                                                                    style={{ textAlignLast: 'center' }}
                                                                >
                                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => (
                                                                        <option key={n} value={n}>{n}</option>
                                                                    ))}
                                                                </select>
                                                                <span className="text-3xl font-bold text-[#EA7500] px-1">.</span>
                                                                <select
                                                                    value={weightDecimal}
                                                                    onChange={(e) => setWeightDecimal(Number(e.target.value))}
                                                                    className="h-14 w-20 text-2xl font-bold text-center bg-white border-2 border-[#EA7500]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA7500]/50 text-[#EA7500] appearance-none"
                                                                    style={{ textAlignLast: 'center' }}
                                                                >
                                                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                                        <option key={n} value={n}>{n}</option>
                                                                    ))}
                                                                </select>
                                                                <span className="text-lg font-medium text-stone-500 ml-1">公斤</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                            </div>
                        </section>

                        {/* Submit Button */}
                        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-lg p-4 bg-white/80 backdrop-blur-md border-t border-stone-100 z-50">
                            <button
                                type="submit"
                                className="w-full bg-stone-800 text-white flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg hover:bg-stone-700 active:scale-98 transition-all shadow-lg"
                            >
                                <Save className="w-5 h-5" />
                                <span>{isSubmitting ? '儲存中...' : '儲存紀錄'}</span>
                            </button>
                        </div>

                        {/* Spacer for fixed bottom button - Increased height for safety */}
                        <div className="h-32" />
                    </form>
                )
            }
        </div>
    );
};
