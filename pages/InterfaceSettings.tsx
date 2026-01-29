import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Edit2, Check, Eye, EyeOff, GripVertical, Trash2, ListChecks, Utensils, Droplets, Pill, Scale, Leaf, ShowerHead, Bug, LayoutGrid, Heart, CheckCircle, LineChart, Calendar } from 'lucide-react';
import { CombIcon } from '../components/icons/CombIcon';
import { getUserPets, updatePet, updateUserProfile } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { Pet, PET_TYPE_ICONS, HomeCardSettings, DEFAULT_HOME_CARD_SETTINGS } from '../types';

export const InterfaceSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile, refreshUserProfile } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Pets state
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  // Action order state
  const [actionOrder, setActionOrder] = useState<string[]>([]);
  const [draggedAction, setDraggedAction] = useState<string | null>(null);
  const [hiddenActions, setHiddenActions] = useState<string[]>([]);
  const [editingActionLabel, setEditingActionLabel] = useState<string | null>(null);
  const [actionLabelInput, setActionLabelInput] = useState('');

  // Home card settings state
  const [cardSettings, setCardSettings] = useState<HomeCardSettings>(DEFAULT_HOME_CARD_SETTINGS);

  // All available actions with labels, icons, and colors
  const ALL_ACTIONS: Record<string, { label: string; icon: React.ComponentType<any>; bgColor: string; textColor: string }> = {
    food: { label: '更換飼料', icon: Utensils, bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
    water: { label: '更換飲水', icon: Droplets, bgColor: 'bg-[#921AFF]/10', textColor: 'text-[#921AFF]' },
    litter: { label: '清理貓砂', icon: Trash2, bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
    grooming: { label: '梳毛', icon: CombIcon, bgColor: 'bg-pink-100', textColor: 'text-pink-700' },
    medication: { label: '給藥', icon: Pill, bgColor: 'bg-cyan-100', textColor: 'text-cyan-700' },
    supplements: { label: '保健食品', icon: Leaf, bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
    deworming: { label: '驅蟲', icon: Bug, bgColor: 'bg-lime-100', textColor: 'text-lime-700' },
    bath: { label: '洗澡', icon: ShowerHead, bgColor: 'bg-sky-100', textColor: 'text-sky-700' },
    weight: { label: '紀錄體重', icon: Scale, bgColor: 'bg-[#EA7500]/10', textColor: 'text-[#EA7500]' },
  };

  // Today task items (subset that can be shown on home page)
  const TODAY_TASK_ITEMS = ['food', 'water', 'litter', 'grooming', 'medication', 'supplements', 'weight'];

  const DEFAULT_ACTION_ORDER = ['food', 'water', 'litter', 'grooming', 'medication', 'supplements', 'deworming', 'bath', 'weight'];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userPets = await getUserPets(user.uid);
      setPets(userPets);

      if (userPets.length > 0) {
        setSelectedPetId(userPets[0].id);
        // Load action order from user's preferences
        const userActionOrder = userProfile?.actionOrders?.[userPets[0].id];
        const allActionKeys = Object.keys(ALL_ACTIONS);
        if (userActionOrder) {
          const missingActions = allActionKeys.filter(a => !userActionOrder.includes(a));
          setActionOrder([...userActionOrder, ...missingActions]);
        } else {
          setActionOrder(DEFAULT_ACTION_ORDER);
        }
        // Load hidden actions from user's preferences
        const userHiddenActions = userProfile?.hiddenActions?.[userPets[0].id];
        setHiddenActions(userHiddenActions || []);
        // Load home card settings
        const userCardSettings = userProfile?.homeCardSettings?.[userPets[0].id];
        setCardSettings(userCardSettings || DEFAULT_HOME_CARD_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading settings data:', error);
    }
    setIsLoading(false);
  };

  const selectedPet = pets.find(p => p.id === selectedPetId);

  const handleSelectPet = (pet: Pet) => {
    setSelectedPetId(pet.id);
    // Load action order from user's preferences
    const userActionOrder = userProfile?.actionOrders?.[pet.id];
    const allActionKeys = Object.keys(ALL_ACTIONS);
    if (userActionOrder) {
      const missingActions = allActionKeys.filter(a => !userActionOrder.includes(a));
      setActionOrder([...userActionOrder, ...missingActions]);
    } else {
      setActionOrder(DEFAULT_ACTION_ORDER);
    }
    // Load hidden actions from user's preferences
    const userHiddenActions = userProfile?.hiddenActions?.[pet.id];
    setHiddenActions(userHiddenActions || []);
    // Load home card settings
    const userCardSettings = userProfile?.homeCardSettings?.[pet.id];
    setCardSettings(userCardSettings || DEFAULT_HOME_CARD_SETTINGS);
  };

  // Save card settings
  const saveCardSettings = async (newSettings: HomeCardSettings) => {
    if (!selectedPet || !user) return;

    try {
      const allCardSettings = {
        ...(userProfile?.homeCardSettings || {}),
        [selectedPet.id]: newSettings
      };
      await updateUserProfile(user.uid, { homeCardSettings: allCardSettings });
      await refreshUserProfile();
    } catch (error) {
      console.error('Failed to save card settings:', error);
    }
  };

  const handleToggleCard = async (card: 'showScoreboard' | 'showTodayTasks' | 'showWeightChart') => {
    const newSettings = { ...cardSettings, [card]: !cardSettings[card] };
    setCardSettings(newSettings);
    await saveCardSettings(newSettings);
  };

  const handleToggleTodayTaskItem = async (item: string) => {
    const currentHidden = cardSettings.hiddenTodayTaskItems || [];
    const isHidden = currentHidden.includes(item);
    const newHidden = isHidden
      ? currentHidden.filter(i => i !== item)
      : [...currentHidden, item];
    const newSettings = { ...cardSettings, hiddenTodayTaskItems: newHidden };
    setCardSettings(newSettings);
    await saveCardSettings(newSettings);
  };

  const handleWeightChartTypeChange = async (type: 'days' | 'entries') => {
    const newSettings = { ...cardSettings, weightChartType: type };
    setCardSettings(newSettings);
    await saveCardSettings(newSettings);
  };

  const handleWeightChartValueChange = async (value: number) => {
    const newSettings = { ...cardSettings, weightChartValue: value };
    setCardSettings(newSettings);
    await saveCardSettings(newSettings);
  };

  const handleMonthlyLogsDefaultDaysChange = async (days: number) => {
    const newSettings = { ...cardSettings, monthlyLogsDefaultDays: days };
    setCardSettings(newSettings);
    await saveCardSettings(newSettings);
  };

  // Action order management functions
  const handleDragStart = (action: string) => {
    setDraggedAction(action);
  };

  const handleDragOver = (e: React.DragEvent, targetAction: string) => {
    e.preventDefault();
    if (!draggedAction || draggedAction === targetAction) return;

    const newOrder = [...actionOrder];
    const draggedIndex = newOrder.indexOf(draggedAction);
    const targetIndex = newOrder.indexOf(targetAction);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedAction);

    setActionOrder(newOrder);
  };

  const handleDragEnd = async () => {
    setDraggedAction(null);
    if (selectedPet && user) {
      try {
        const newActionOrders = {
          ...(userProfile?.actionOrders || {}),
          [selectedPet.id]: actionOrder
        };
        await updateUserProfile(user.uid, { actionOrders: newActionOrders });
        await refreshUserProfile();
      } catch (error) {
        console.error('Failed to save action order:', error);
      }
    }
  };

  const handleToggleVisibility = async (action: string) => {
    const isHidden = hiddenActions.includes(action);
    const newHiddenActions = isHidden
      ? hiddenActions.filter(a => a !== action)
      : [...hiddenActions, action];
    setHiddenActions(newHiddenActions);

    if (selectedPet && user) {
      try {
        const allHiddenActions = {
          ...(userProfile?.hiddenActions || {}),
          [selectedPet.id]: newHiddenActions
        };
        await updateUserProfile(user.uid, { hiddenActions: allHiddenActions });
        await refreshUserProfile();
      } catch (error) {
        console.error('Failed to toggle action visibility:', error);
      }
    }
  };

  const handleStartEditLabel = (action: string) => {
    const currentLabel = selectedPet?.actionLabels?.[action] || ALL_ACTIONS[action]?.label || '';
    setActionLabelInput(currentLabel);
    setEditingActionLabel(action);
  };

  const handleSaveActionLabel = async () => {
    if (!selectedPet || !editingActionLabel || !actionLabelInput.trim()) {
      setEditingActionLabel(null);
      return;
    }

    setIsSaving(true);
    try {
      const newActionLabels = {
        ...(selectedPet.actionLabels || {}),
        [editingActionLabel]: actionLabelInput.trim()
      };
      await updatePet(selectedPet.id, { actionLabels: newActionLabels });
      // Update local pet state
      setPets(pets.map(p =>
        p.id === selectedPet.id
          ? { ...p, actionLabels: newActionLabels }
          : p
      ));
      setEditingActionLabel(null);
    } catch (error) {
      console.error('Failed to update action label:', error);
      alert('儲存失敗，請重試');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-bold text-sm">返回</span>
        </button>
      </div>

      {/* Pet Selection (if multiple pets) */}
      {pets.length > 1 && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 className="text-lg font-bold text-stone-700 mb-4">選擇寵物</h3>
          <div className="flex gap-2 flex-wrap">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => handleSelectPet(pet)}
                className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                  selectedPetId === pet.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <span>{PET_TYPE_ICONS[pet.type]}</span>
                <span className="font-medium">{pet.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Home Card Settings Section */}
      {selectedPet && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-purple-500" />
            首頁卡片設定
          </h3>

          <div className="space-y-4">
            {/* Scoreboard Card */}
            <div className="p-4 bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <span className="font-medium text-stone-700">愛的積分</span>
                </div>
                <button
                  onClick={() => handleToggleCard('showScoreboard')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    cardSettings.showScoreboard
                      ? 'bg-green-100 text-green-700'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {cardSettings.showScoreboard ? '顯示' : '隱藏'}
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-2 ml-8">寵物更愛誰的積分排行榜</p>
            </div>

            {/* Today Tasks Card */}
            <div className="p-4 bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-stone-700">今日任務</span>
                </div>
                <button
                  onClick={() => handleToggleCard('showTodayTasks')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    cardSettings.showTodayTasks
                      ? 'bg-green-100 text-green-700'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {cardSettings.showTodayTasks ? '顯示' : '隱藏'}
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-2 ml-8">今天的照顧任務完成狀態</p>

              {/* Sub-items for today tasks */}
              {cardSettings.showTodayTasks && (
                <div className="mt-4 ml-8 space-y-2">
                  <p className="text-xs text-stone-500 font-medium mb-2">選擇要顯示的項目：</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TODAY_TASK_ITEMS.map((item) => {
                      const actionConfig = ALL_ACTIONS[item];
                      if (!actionConfig) return null;
                      const IconComponent = actionConfig.icon;
                      const isHidden = (cardSettings.hiddenTodayTaskItems || []).includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => handleToggleTodayTaskItem(item)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isHidden
                              ? 'bg-stone-100 text-stone-400'
                              : 'bg-white border border-stone-200 text-stone-700'
                          }`}
                        >
                          <IconComponent className={`w-4 h-4 ${isHidden ? 'text-stone-300' : actionConfig.textColor}`} />
                          <span>{selectedPet.actionLabels?.[item] || actionConfig.label}</span>
                          {isHidden ? (
                            <EyeOff className="w-3 h-3 ml-auto text-stone-300" />
                          ) : (
                            <Eye className="w-3 h-3 ml-auto text-stone-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Weight Chart Card */}
            <div className="p-4 bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LineChart className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-stone-700">體重變化</span>
                </div>
                <button
                  onClick={() => handleToggleCard('showWeightChart')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    cardSettings.showWeightChart
                      ? 'bg-green-100 text-green-700'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {cardSettings.showWeightChart ? '顯示' : '隱藏'}
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-2 ml-8">體重歷史趨勢圖表</p>

              {/* Weight chart options */}
              {cardSettings.showWeightChart && (
                <div className="mt-4 ml-8 space-y-3">
                  <p className="text-xs text-stone-500 font-medium">顯示範圍：</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleWeightChartTypeChange('entries')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        cardSettings.weightChartType === 'entries'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-white border border-stone-200 text-stone-600'
                      }`}
                    >
                      最近幾筆
                    </button>
                    <button
                      onClick={() => handleWeightChartTypeChange('days')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        cardSettings.weightChartType === 'days'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-white border border-stone-200 text-stone-600'
                      }`}
                    >
                      最近幾天
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-600">
                      {cardSettings.weightChartType === 'entries' ? '顯示最近' : '顯示最近'}
                    </span>
                    <select
                      value={cardSettings.weightChartValue}
                      onChange={(e) => handleWeightChartValueChange(parseInt(e.target.value))}
                      className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      {cardSettings.weightChartType === 'entries' ? (
                        <>
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                          <option value={20}>20</option>
                          <option value={30}>30</option>
                        </>
                      ) : (
                        <>
                          <option value={7}>7</option>
                          <option value={14}>14</option>
                          <option value={30}>30</option>
                          <option value={60}>60</option>
                          <option value={90}>90</option>
                        </>
                      )}
                    </select>
                    <span className="text-sm text-stone-600">
                      {cardSettings.weightChartType === 'entries' ? '筆' : '天'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Logs Card */}
            <div className="p-4 bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-stone-700">月份紀錄</span>
                </div>
                <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-stone-200 text-stone-400">
                  固定顯示
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-2 ml-8">每月的照顧紀錄列表</p>

              {/* Monthly logs default days */}
              <div className="mt-4 ml-8 space-y-3">
                <p className="text-xs text-stone-500 font-medium">預設展開顯示：</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 3, label: '近 3 天' },
                    { value: 5, label: '近 5 天' },
                    { value: 7, label: '近 7 天' },
                    { value: 0, label: '全部展開' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleMonthlyLogsDefaultDaysChange(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        cardSettings.monthlyLogsDefaultDays === option.value
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-white border border-stone-200 text-stone-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Action Order Section */}
      {selectedPet && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-teal-500" />
            完成項目設定
          </h3>
          <p className="text-xs text-stone-400 mb-4">調整紀錄頁面的項目順序和顯示</p>

          {/* Current actions list */}
          <div className="space-y-2 mb-4">
            {actionOrder.map((action) => {
              const actionConfig = ALL_ACTIONS[action];
              if (!actionConfig) return null;
              const IconComponent = actionConfig.icon;
              const isHidden = hiddenActions.includes(action);
              const customLabel = selectedPet.actionLabels?.[action];
              const displayLabel = customLabel || actionConfig.label;
              const isEditing = editingActionLabel === action;
              return (
                <div
                  key={action}
                  draggable={!isEditing}
                  onDragStart={() => !isEditing && handleDragStart(action)}
                  onDragOver={(e) => !isEditing && handleDragOver(e, action)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 bg-stone-50 rounded-xl transition-all ${
                    isEditing ? '' : 'cursor-move'
                  } ${draggedAction === action ? 'opacity-50 scale-95' : 'hover:bg-stone-100'
                  } ${isHidden ? 'opacity-50' : ''}`}
                >
                  <GripVertical className="w-5 h-5 text-stone-400 flex-shrink-0" />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isHidden ? 'bg-stone-200' : actionConfig.bgColor}`}>
                    <IconComponent className={`w-5 h-5 ${isHidden ? 'text-stone-400' : actionConfig.textColor}`} />
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={actionLabelInput}
                        onChange={(e) => setActionLabelInput(e.target.value)}
                        className="flex-1 px-2 py-1 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveActionLabel();
                          if (e.key === 'Escape') setEditingActionLabel(null);
                        }}
                      />
                      <button
                        onClick={handleSaveActionLabel}
                        disabled={isSaving}
                        className="p-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingActionLabel(null)}
                        className="p-1.5 bg-stone-200 text-stone-600 rounded-lg hover:bg-stone-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={`font-medium flex-1 ${isHidden ? 'text-stone-400' : 'text-stone-700'}`}>
                      {displayLabel}
                    </span>
                  )}
                  <button
                    onClick={() => handleStartEditLabel(action)}
                    className="p-1.5 rounded-lg transition-colors text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                    title="修改名稱"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(action)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      hiddenActions.includes(action)
                        ? 'text-stone-300 hover:text-stone-500 hover:bg-stone-100'
                        : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                    }`}
                    title={hiddenActions.includes(action) ? '顯示' : '隱藏'}
                  >
                    {hiddenActions.includes(action) ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* No pets message */}
      {pets.length === 0 && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
          <p className="text-stone-500">您還沒有寵物，請先新增寵物</p>
          <button
            onClick={() => navigate('/onboarding')}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            新增寵物
          </button>
        </section>
      )}

      <div className="text-center text-xs text-stone-300 mt-8">
        PetLog v2.0.0
      </div>
    </div>
  );
};
