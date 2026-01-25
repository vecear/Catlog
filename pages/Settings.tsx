import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertTriangle, X, Lock, Plus, Palette, Edit2, Check, User, Cat, Download, Upload, GripVertical, Utensils, Droplets, Pill, Scale, ShowerHead, LogOut, Bug, Leaf } from 'lucide-react';
import { CombIcon } from '../components/icons/CombIcon';
import { clearAllLogs, getProfile, saveProfile, getLogs, saveLog } from '../services/storage';
import { logout } from '../services/auth';
import { AppProfile, Owner, OWNER_COLORS } from '../types';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Profile state
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Edit states
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null);
  const [editingOwnerName, setEditingOwnerName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [editingPetName, setEditingPetName] = useState(false);
  const [petNameInput, setPetNameInput] = useState('');
  const [editingPetBirthday, setEditingPetBirthday] = useState(false);
  const [petBirthdayInput, setPetBirthdayInput] = useState('');
  const [editingAdoptionDate, setEditingAdoptionDate] = useState(false);
  const [adoptionDateInput, setAdoptionDateInput] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerColor, setNewOwnerColor] = useState(OWNER_COLORS[0].value);
  const [showAddOwner, setShowAddOwner] = useState(false);

  // Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<{ profile: AppProfile; logs: any[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Drag state for owners
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragItemRef = React.useRef<string | null>(null);
  const initialOwnersRef = React.useRef<Owner[] | null>(null);
  const dragOverlayRef = React.useRef<HTMLDivElement>(null);
  const dragOffsetRef = React.useRef<{ x: number, y: number }>({ x: 0, y: 0 });

  // Drag state for action order
  const [draggingActionId, setDraggingActionId] = useState<string | null>(null);
  const actionDragOverlayRef = React.useRef<HTMLDivElement>(null);
  const actionDragOffsetRef = React.useRef<{ x: number, y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    const loadedProfile = await getProfile();
    setProfile(loadedProfile);
    setPetNameInput(loadedProfile.pet.name);
    setPetBirthdayInput(loadedProfile.pet.birthday);
    setAdoptionDateInput(loadedProfile.pet.adoptionDate || '');
    setIsLoading(false);
  };

  const handleSaveProfile = async (newProfile: AppProfile) => {
    setIsSaving(true);
    try {
      await saveProfile(newProfile);
      setProfile(newProfile);
    } catch (error) {
      alert('儲存失敗，請檢查網路連線');
    }
    setIsSaving(false);
  };

  const handleClearAll = () => {
    setSelectedDate('');
    setShowBirthdayModal(true);
  };

  // Export data function
  const handleExportData = async () => {
    try {
      const logs = await getLogs();
      const exportData = {
        exportDate: new Date().toISOString(),
        profile: profile,
        logs: logs,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `catlog_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`✅ 資料已匯出\n\n包含 ${logs.length} 筆紀錄`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('❌ 匯出失敗，請稍後再試');
    }
  };

  // Import data function
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate structure
        if (!data.profile || !data.logs || !Array.isArray(data.logs)) {
          alert('❌ 無效的備份檔案格式');
          return;
        }

        // Validate profile structure
        if (!data.profile.pet || !data.profile.owners) {
          alert('❌ 備份檔案缺少必要資料');
          return;
        }

        setImportData({ profile: data.profile, logs: data.logs });
        setShowImportModal(true);
      } catch (error) {
        console.error('Import parse failed:', error);
        alert('❌ 無法解析檔案，請確認是正確的 JSON 備份檔');
      }
    };
    input.click();
  };

  const handleConfirmImport = async () => {
    if (!importData) return;

    setIsImporting(true);
    try {
      // Clear existing logs first
      await clearAllLogs();

      // Save new profile
      await saveProfile(importData.profile);

      // Save all logs
      for (const log of importData.logs) {
        await saveLog(log);
      }

      // Reload profile
      await loadProfile();

      setShowImportModal(false);
      setImportData(null);
      alert(`✅ 匯入成功！\n\n已匯入 ${importData.logs.length} 筆紀錄`);
    } catch (error) {
      console.error('Import failed:', error);
      alert('❌ 匯入失敗，請稍後再試');
    }
    setIsImporting(false);
  };

  const handleBirthdaySubmit = () => {
    if (!profile) return;
    // Validate against stored birthday
    if (selectedDate === profile.pet.birthday) {
      setShowBirthdayModal(false);
      const petName = profile.pet.name;

      // First confirmation
      const confirm1 = window.confirm(`⚠️ 第一次確認 (1/3)\n\n您即將刪除所有紀錄！\n此動作無法復原，所有${petName}的照護紀錄都會消失。\n\n確定要繼續嗎？`);
      if (!confirm1) {
        alert('❌ 已取消刪除');
        return;
      }

      // Second confirmation
      const confirm2 = window.confirm(`⚠️ 第二次確認 (2/3)\n\n真的確定要刪除嗎？\n這是不可逆的操作！\n\n確定要繼續嗎？`);
      if (!confirm2) {
        alert('❌ 已取消刪除');
        return;
      }

      // Third confirmation
      const confirm3 = window.confirm(`⚠️ 最終確認 (3/3)\n\n這是最後一次確認！\n按下確定後，所有資料將永久刪除！\n\n最後一次機會，確定要刪除嗎？`);
      if (!confirm3) {
        alert('❌ 已取消刪除');
        return;
      }

      // All 3 confirmations passed
      clearAllLogs();
      alert('✅ 所有紀錄已清除');
      navigate('/');
    } else {
      alert('❌ 答案不正確！\n\n無法清除資料。');
    }
  };

  // Owner management functions
  const handleAddOwner = async () => {
    if (!profile || !newOwnerName.trim()) return;
    if (profile.owners.length >= 10) {
      alert('最多只能新增 10 位主人');
      return;
    }

    const newOwner: Owner = {
      id: `owner_${Date.now()}`,
      name: newOwnerName.trim(),
      color: newOwnerColor,
    };
    const newProfile = {
      ...profile,
      owners: [...profile.owners, newOwner],
    };
    await handleSaveProfile(newProfile);
    setNewOwnerName('');
    // Pick next available color for next time, or random
    const usedColors = newProfile.owners.map(o => o.color);
    const nextColor = OWNER_COLORS.find(c => !usedColors.includes(c.value))?.value || OWNER_COLORS[0].value;
    setNewOwnerColor(nextColor);

    setShowAddOwner(false);
  };

  const handleDeleteOwner = async (ownerId: string) => {
    if (!profile) return;
    if (profile.owners.length <= 1) {
      alert('至少需要保留一位主人');
      return;
    }
    const ownerName = profile.owners.find(o => o.id === ownerId)?.name;
    if (window.confirm(`確定要刪除「${ownerName}」嗎？`)) {
      const newProfile = {
        ...profile,
        owners: profile.owners.filter(o => o.id !== ownerId),
      };
      await handleSaveProfile(newProfile);
    }
  };

  const handleUpdateOwnerName = async (ownerId: string) => {
    if (!profile || !editingOwnerName.trim()) return;
    const newProfile = {
      ...profile,
      owners: profile.owners.map(o =>
        o.id === ownerId ? { ...o, name: editingOwnerName.trim() } : o
      ),
    };
    await handleSaveProfile(newProfile);
    setEditingOwnerId(null);
    setEditingOwnerName('');
  };

  // Pointer Event Handlers for Cross-Platform Drag and Drop
  const handlePointerDown = (e: React.PointerEvent, ownerId: string) => {
    if (!profile) return;
    e.preventDefault();
    e.stopPropagation();

    const row = (e.currentTarget as HTMLElement).closest('[data-owner-id]');
    if (!row) return;

    const rect = row.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // Set drag state
    setDraggingId(ownerId);
    dragItemRef.current = ownerId;
    initialOwnersRef.current = [...profile.owners];

    // Add global listeners
    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
  };

  const handleGlobalPointerMove = (e: PointerEvent) => {
    if (!dragItemRef.current) return;

    // Prevent scrolling on mobile while dragging
    e.preventDefault();

    // Update overlay position
    if (dragOverlayRef.current) {
      const x = e.clientX - dragOffsetRef.current.x;
      const y = e.clientY - dragOffsetRef.current.y;
      dragOverlayRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }

    // Find the row under the cursor
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const row = target?.closest('[data-owner-id]');

    if (row) {
      const targetId = row.getAttribute('data-owner-id');
      if (targetId && targetId !== dragItemRef.current) {
        // Perform swap
        setProfile(currentProfile => {
          if (!currentProfile) return null;
          const currentIndex = currentProfile.owners.findIndex(o => o.id === dragItemRef.current);
          const targetIndex = currentProfile.owners.findIndex(o => o.id === targetId);

          if (currentIndex === -1 || targetIndex === -1) return currentProfile;

          const newOwners = [...currentProfile.owners];
          // Swap logic
          const item = newOwners[currentIndex];
          newOwners.splice(currentIndex, 1);
          newOwners.splice(targetIndex, 0, item);

          return { ...currentProfile, owners: newOwners };
        });
      }
    }
  };

  const handleGlobalPointerUp = async () => {
    // Clean up listeners
    window.removeEventListener('pointermove', handleGlobalPointerMove);
    window.removeEventListener('pointerup', handleGlobalPointerUp);
    window.removeEventListener('pointercancel', handleGlobalPointerUp);

    // Save final state to DB
    setProfile(currentProfile => {
      if (currentProfile) {
        saveProfile(currentProfile).catch(err => {
          console.error("Failed to save reordered profile", err);
          alert("排序儲存失敗，請重試");
          // Revert on error if needed, or just let user retry
        });
      }
      return currentProfile;
    });

    // Reset state
    setDraggingId(null);
    dragItemRef.current = null;
    initialOwnersRef.current = null;
  };

  const handleUpdateOwnerColor = async (ownerId: string, color: string) => {
    if (!profile) return;
    const newProfile = {
      ...profile,
      owners: profile.owners.map(o =>
        o.id === ownerId ? { ...o, color } : o
      ),
    };
    await handleSaveProfile(newProfile);
    setShowColorPicker(null);
  };

  const handleUpdatePetName = async () => {
    if (!profile || !petNameInput.trim()) return;
    const newProfile = {
      ...profile,
      pet: { ...profile.pet, name: petNameInput.trim() },
    };
    await handleSaveProfile(newProfile);
    setEditingPetName(false);
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-stone-700" />
          </button>
          <h2 className="text-2xl font-bold text-stone-800">設定</h2>
        </div>
        <button
          onClick={async () => {
            if (window.confirm('確定要登出嗎？')) {
              await logout();
              navigate('/login');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-600 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-bold text-sm">登出</span>
        </button>
      </div>

      {/* Pet Profile Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
          <Cat className="w-5 h-5 text-orange-500" />
          寵物資料
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-stone-600">名字</span>
            {editingPetName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={petNameInput}
                  onChange={(e) => setPetNameInput(e.target.value)}
                  className="px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 w-32"
                  autoFocus
                />
                <button
                  onClick={handleUpdatePetName}
                  disabled={isSaving}
                  className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingPetName(false);
                    setPetNameInput(profile?.pet.name || '');
                  }}
                  className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-800">{profile?.pet.name}</span>
                <button
                  onClick={() => setEditingPetName(true)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-stone-600">生日</span>
            {editingPetBirthday ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={petBirthdayInput}
                  onChange={(e) => setPetBirthdayInput(e.target.value)}
                  className="px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  autoFocus
                />
                <button
                  onClick={async () => {
                    if (!profile || !petBirthdayInput) return;
                    const newProfile = {
                      ...profile,
                      pet: { ...profile.pet, birthday: petBirthdayInput },
                    };
                    await handleSaveProfile(newProfile);
                    setEditingPetBirthday(false);
                  }}
                  disabled={isSaving}
                  className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingPetBirthday(false);
                    setPetBirthdayInput(profile?.pet.birthday || '');
                  }}
                  className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-500">{profile?.pet.birthday}</span>
                <button
                  onClick={() => setEditingPetBirthday(true)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-stone-600">來家裡的日子</span>
            {editingAdoptionDate ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={adoptionDateInput}
                  onChange={(e) => setAdoptionDateInput(e.target.value)}
                  className="px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  autoFocus
                />
                <button
                  onClick={async () => {
                    if (!profile || !adoptionDateInput) return;
                    const newProfile = {
                      ...profile,
                      pet: { ...profile.pet, adoptionDate: adoptionDateInput },
                    };
                    await handleSaveProfile(newProfile);
                    setEditingAdoptionDate(false);
                  }}
                  disabled={isSaving}
                  className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingAdoptionDate(false);
                    setAdoptionDateInput(profile?.pet.adoptionDate || '');
                  }}
                  className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-500">{profile?.pet.adoptionDate || '尚未設定'}</span>
                <button
                  onClick={() => setEditingAdoptionDate(true)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Owner Management Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-stone-700 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            主人管理
          </h3>
          <button
            onClick={() => {
              setShowAddOwner(true);
              // Set initial color when opening
              const usedColors = profile?.owners.map(o => o.color) || [];
              const nextColor = OWNER_COLORS.find(c => !usedColors.includes(c.value))?.value || OWNER_COLORS[0].value;
              setNewOwnerColor(nextColor);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增
          </button>
        </div>

        {/* Add Owner Form */}
        {showAddOwner && (
          <div
            className="mb-4 p-4 rounded-xl border animate-fade-in transition-colors"
            style={{
              backgroundColor: `${newOwnerColor}1A`,
              borderColor: `${newOwnerColor}26`
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {/* Color Placeholder / Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(showColorPicker === 'new' ? null : 'new')}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ backgroundColor: newOwnerColor }}
                  >
                    <Palette className="w-4 h-4 text-white opacity-70" />
                  </button>

                  {/* Color Picker Dropdown */}
                  {showColorPicker === 'new' && (
                    <div className="absolute top-10 left-0 bg-white p-3 rounded-xl shadow-xl border border-stone-200 z-50 animate-fade-in">
                      <div className="grid grid-cols-5 gap-2 w-[200px]">
                        {OWNER_COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => {
                              setNewOwnerColor(color.value);
                              setShowColorPicker(null);
                            }}
                            className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${newOwnerColor === color.value ? 'border-stone-800 ring-2 ring-offset-1 ring-stone-400' : 'border-white'
                              }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="輸入主人名稱"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowAddOwner(false);
                    setNewOwnerName('');
                  }}
                  className="p-2 bg-stone-100 text-stone-500 rounded-lg hover:bg-stone-200 hover:text-stone-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleAddOwner}
                  disabled={isSaving || !newOwnerName.trim()}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Owner List */}
        <div className="space-y-3">
          {profile?.owners.map((owner, index) => (
            <div
              key={owner.id}
              data-owner-id={owner.id}
              style={{
                backgroundColor: draggingId === owner.id ? 'rgba(0,0,0,0.02)' : `${owner.color}1A`,
                borderColor: draggingId === owner.id ? 'transparent' : `${owner.color}26`,
                opacity: draggingId === owner.id ? 0.3 : 1,
                borderStyle: draggingId === owner.id ? 'dashed' : 'solid',
                borderWidth: draggingId === owner.id ? '2px' : '1px',
              }}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${draggingId === owner.id
                ? 'scale-95'
                : ''
                }`}
            >
              <div className="flex items-center gap-3">
                {/* Drag Handle */}
                {editingOwnerId !== owner.id && (
                  <div
                    className="text-stone-300 hover:text-stone-500 transition-colors cursor-grab active:cursor-grabbing touch-none p-2 -ml-2"
                    onPointerDown={(e) => handlePointerDown(e, owner.id)}
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>
                )}
                {/* Color indicator */}
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(showColorPicker === owner.id ? null : owner.id)}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ backgroundColor: owner.color }}
                  >
                    <Palette className="w-4 h-4 text-white opacity-70" />
                  </button>

                  {/* Color Picker Dropdown */}
                  {showColorPicker === owner.id && (
                    <div className="absolute top-10 left-0 bg-white p-3 rounded-xl shadow-xl border border-stone-200 z-50 animate-fade-in">
                      <div className="grid grid-cols-5 gap-2 w-[200px]">
                        {OWNER_COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => handleUpdateOwnerColor(owner.id, color.value)}
                            className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${owner.color === color.value ? 'border-stone-800 ring-2 ring-offset-1 ring-stone-400' : 'border-white'
                              }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Name */}
                {editingOwnerId === owner.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingOwnerName}
                      onChange={(e) => setEditingOwnerName(e.target.value)}
                      className="px-2 py-1 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-24"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateOwnerName(owner.id)}
                      disabled={isSaving}
                      className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingOwnerId(null);
                        setEditingOwnerName('');
                      }}
                      className="p-1.5 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="font-bold text-stone-700">{owner.name}</span>
                )}
              </div>

              {/* Actions */}
              {editingOwnerId !== owner.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingOwnerId(owner.id);
                      setEditingOwnerName(owner.name);
                    }}
                    className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-200 rounded-full transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteOwner(owner.id)}
                    className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Drag Overlay */}
          {draggingId && profile?.owners.find(o => o.id === draggingId) && (
            (() => {
              const owner = profile!.owners.find(o => o.id === draggingId)!;
              return (
                <div
                  ref={dragOverlayRef}
                  className="fixed top-0 left-0 w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] z-50 pointer-events-none flex items-center justify-between p-3 rounded-xl border shadow-2xl"
                  style={{
                    // Composite the light tint (1A) over the solid background (#fafaf9) using linear-gradient
                    // This creates a solid-looking card with the correct tint, avoiding transparency issues
                    background: `linear-gradient(${owner.color}1A, ${owner.color}1A), #fafaf9`,
                    borderColor: `${owner.color}26`,
                    width: document.querySelector(`[data-owner-id="${draggingId}"]`)?.clientWidth,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-stone-300 p-2 -ml-2">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center"
                        style={{ backgroundColor: owner.color }}
                      >
                        <Palette className="w-4 h-4 text-white opacity-70" />
                      </div>
                    </div>
                    <span className="font-bold text-lg text-stone-700">{owner.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-50">
                    <div className="p-1.5 text-stone-400 bg-stone-200 rounded-full">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div className="p-1.5 text-stone-400 bg-red-50 rounded-full">
                      <Trash2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </section>

      {/* Action Order Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-2 flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-stone-400" />
          項目順序
        </h3>
        <p className="text-stone-400 text-sm mb-4">拖拉調整新增紀錄中項目的顯示順序</p>

        <div className="space-y-2">
          {(profile?.actionOrder || ['food', 'water', 'litter', 'grooming', 'medication', 'supplements', 'deworming', 'bath', 'weight']).map((actionId) => {
            const actionLabels: Record<string, { name: string; color: string; icon: React.ElementType }> = {
              food: { name: '飼料', color: '#EAB308', icon: Utensils },
              water: { name: '飲水', color: '#921AFF', icon: Droplets },
              litter: { name: '貓砂', color: '#10B981', icon: Trash2 },
              grooming: { name: '梳毛', color: '#EC4899', icon: CombIcon },
              medication: { name: '給藥', color: '#06B6D4', icon: Pill },
              supplements: { name: '保健食品', color: '#6366F1', icon: Leaf }, // Using Indigo-500 (#6366F1) to match StatusCard config
              deworming: { name: '驅蟲', color: '#EF4444', icon: Bug },
              bath: { name: '洗澡', color: '#3B82F6', icon: ShowerHead },
              weight: { name: '體重', color: '#EA7500', icon: Scale },
            };
            const action = actionLabels[actionId];
            if (!action) return null;
            const isDragging = draggingActionId === actionId;

            return (
              <div
                key={actionId}
                data-action-id={actionId}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                style={{
                  backgroundColor: isDragging ? 'rgba(0,0,0,0.02)' : `${action.color}10`,
                  borderColor: isDragging ? 'transparent' : `${action.color}30`,
                  opacity: isDragging ? 0.3 : 1,
                  borderStyle: isDragging ? 'dashed' : 'solid',
                  borderWidth: isDragging ? '2px' : '1px',
                }}
              >
                <div
                  className="text-stone-300 hover:text-stone-500 transition-colors cursor-grab active:cursor-grabbing touch-none p-2 -ml-2"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setDraggingActionId(actionId);

                    const row = e.currentTarget.closest('[data-action-id]');
                    const rect = row?.getBoundingClientRect() || e.currentTarget.getBoundingClientRect();
                    actionDragOffsetRef.current = {
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    };

                    if (actionDragOverlayRef.current) {
                      const x = e.clientX - actionDragOffsetRef.current.x;
                      const y = e.clientY - actionDragOffsetRef.current.y;
                      actionDragOverlayRef.current.style.transform = `translate(${x}px, ${y}px)`;
                    }

                    const handleActionMove = (moveE: PointerEvent) => {
                      moveE.preventDefault();

                      if (actionDragOverlayRef.current) {
                        const x = moveE.clientX - actionDragOffsetRef.current.x;
                        const y = moveE.clientY - actionDragOffsetRef.current.y;
                        actionDragOverlayRef.current.style.transform = `translate(${x}px, ${y}px)`;
                      }

                      const target = document.elementFromPoint(moveE.clientX, moveE.clientY);
                      const targetRow = target?.closest('[data-action-id]');
                      if (targetRow) {
                        const targetId = targetRow.getAttribute('data-action-id');
                        if (targetId && targetId !== actionId) {
                          setProfile(currentProfile => {
                            if (!currentProfile) return null;
                            const currentOrder = currentProfile.actionOrder || ['food', 'water', 'litter', 'grooming', 'medication', 'deworming', 'bath', 'weight'];
                            const currentIndex = currentOrder.indexOf(actionId);
                            const targetIndex = currentOrder.indexOf(targetId);
                            if (currentIndex === -1 || targetIndex === -1) return currentProfile;
                            const newOrder = [...currentOrder];
                            newOrder.splice(currentIndex, 1);
                            newOrder.splice(targetIndex, 0, actionId);
                            return { ...currentProfile, actionOrder: newOrder };
                          });
                        }
                      }
                    };

                    const handleActionUp = () => {
                      window.removeEventListener('pointermove', handleActionMove);
                      window.removeEventListener('pointerup', handleActionUp);
                      setDraggingActionId(null);
                      setProfile(currentProfile => {
                        if (currentProfile) {
                          saveProfile(currentProfile);
                        }
                        return currentProfile;
                      });
                    };

                    window.addEventListener('pointermove', handleActionMove);
                    window.addEventListener('pointerup', handleActionUp);
                  }}
                >
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${action.color}20` }}>
                  <action.icon className="w-4 h-4" style={{ color: action.color }} />
                </div>
                <span className="font-medium text-stone-700">{action.name}</span>
              </div>
            );
          })}

          {/* Action Drag Overlay */}
          {draggingActionId && (() => {
            const actionLabels: Record<string, { name: string; color: string; icon: React.ElementType }> = {
              food: { name: '飼料', color: '#EAB308', icon: Utensils },
              water: { name: '飲水', color: '#921AFF', icon: Droplets },
              litter: { name: '貓砂', color: '#10B981', icon: Trash2 },
              grooming: { name: '梳毛', color: '#EC4899', icon: CombIcon },
              medication: { name: '給藥', color: '#06B6D4', icon: Pill },
              deworming: { name: '驅蟲', color: '#EF4444', icon: Bug },
              bath: { name: '洗澡', color: '#3B82F6', icon: ShowerHead },
              weight: { name: '體重', color: '#EA7500', icon: Scale },
            };
            const action = actionLabels[draggingActionId];
            if (!action) return null;
            return (
              <div
                ref={actionDragOverlayRef}
                className="fixed top-0 left-0 z-50 pointer-events-none flex items-center gap-3 p-3 rounded-xl border shadow-2xl"
                style={{
                  background: `linear-gradient(${action.color}20, ${action.color}20), #fafaf9`,
                  borderColor: `${action.color}40`,
                  width: document.querySelector(`[data-action-id="${draggingActionId}"]`)?.clientWidth,
                }}
              >
                <GripVertical className="w-4 h-4 text-stone-400" />
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${action.color}20` }}>
                  <action.icon className="w-4 h-4" style={{ color: action.color }} />
                </div>
                <span className="font-medium text-stone-700">{action.name}</span>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Data Management Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-green-500" />
          資料管理
        </h3>
        <p className="text-stone-500 mb-4 text-sm leading-relaxed">
          匯出所有資料包含寵物資料、主人設定及所有照護紀錄，可以用於備份或轉移資料。
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 font-bold hover:bg-green-100 active:bg-green-200 transition-colors"
          >
            <Upload className="w-5 h-5" />
            匯出資料
          </button>
          <div className="relative w-full">
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 font-bold hover:bg-blue-100 active:bg-blue-200 transition-colors"
            >
              <Download className="w-5 h-5" />
              匯入資料
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          超級危險！
        </h3>
        <p className="text-stone-500 mb-6 text-sm leading-relaxed">
          這裡的操作將會永久影響您的資料，請謹慎使用。清除資料後無法復原。
        </p>

        <button
          onClick={handleClearAll}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold hover:bg-red-100 active:bg-red-200 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          清除所有紀錄
        </button>
      </section>

      <div className="text-center text-xs text-stone-300 mt-8">
        小賀Log v1.0.0
      </div>

      {/* Birthday Verification Modal */}
      {showBirthdayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-[280px] shadow-xl animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-bold text-stone-800">安全驗證</h3>
              </div>
              <button
                onClick={() => setShowBirthdayModal(false)}
                className="p-1 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <p className="text-stone-600 mb-4 text-sm">
              請選擇{profile?.pet.name}的生日：
            </p>

            <div className="flex justify-center mb-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-3 border border-stone-200 rounded-xl text-stone-700 text-center text-base focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBirthdayModal(false)}
                className="flex-1 p-3 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleBirthdaySubmit}
                disabled={!selectedDate}
                className="flex-1 p-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close color picker */}
      {/* Import Confirmation Modal */}
      {showImportModal && importData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-[320px] shadow-xl animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-bold text-stone-800">確認匯入</h3>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData(null);
                }}
                className="p-1 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
              <p className="text-orange-700 text-sm font-medium mb-2">
                ⚠️ 注意：匯入將會覆蓋現有資料！
              </p>
              <p className="text-orange-600 text-xs">
                現有的所有紀錄將被刪除，並以備份檔案中的資料取代。此動作無法復原。
              </p>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 mb-4 space-y-2">
              <p className="text-stone-600 text-sm">
                <span className="font-medium">寵物名稱：</span>
                {importData.profile.pet.name}
              </p>
              <p className="text-stone-600 text-sm">
                <span className="font-medium">主人數量：</span>
                {importData.profile.owners.length} 位
              </p>
              <p className="text-stone-600 text-sm">
                <span className="font-medium">紀錄數量：</span>
                {importData.logs.length} 筆
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData(null);
                }}
                className="flex-1 p-3 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="flex-1 p-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isImporting ? '匯入中...' : '確認匯入'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showColorPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowColorPicker(null)}
        />
      )}
    </div>
  );
};