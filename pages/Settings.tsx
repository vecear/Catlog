import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertTriangle, X, Lock, Plus, Palette, Edit2, Check, User, Cat, Download, Upload, GripVertical } from 'lucide-react';
import { clearAllLogs, getProfile, saveProfile, getLogs, saveLog } from '../services/storage';
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
  const [newOwnerName, setNewOwnerName] = useState('');
  const [showAddOwner, setShowAddOwner] = useState(false);

  // Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<{ profile: AppProfile; logs: any[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragItemRef = React.useRef<string | null>(null);
  const initialOwnersRef = React.useRef<Owner[] | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    const loadedProfile = await getProfile();
    setProfile(loadedProfile);
    setPetNameInput(loadedProfile.pet.name);
    setPetBirthdayInput(loadedProfile.pet.birthday);
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
    // Find unused color
    const usedColors = profile.owners.map(o => o.color);
    const availableColor = OWNER_COLORS.find(c => !usedColors.includes(c.value))?.value || OWNER_COLORS[0].value;

    const newOwner: Owner = {
      id: `owner_${Date.now()}`,
      name: newOwnerName.trim(),
      color: availableColor,
    };
    const newProfile = {
      ...profile,
      owners: [...profile.owners, newOwner],
    };
    await handleSaveProfile(newProfile);
    setNewOwnerName('');
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
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-stone-700" />
        </button>
        <h2 className="text-2xl font-bold text-stone-800">設定</h2>
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
            onClick={() => setShowAddOwner(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增
          </button>
        </div>

        {/* Add Owner Form */}
        {showAddOwner && (
          <div className="mb-4 p-4 bg-stone-50 rounded-xl border border-stone-200 animate-fade-in">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
                placeholder="輸入主人名稱"
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                autoFocus
              />
              <button
                onClick={handleAddOwner}
                disabled={isSaving || !newOwnerName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                確認
              </button>
              <button
                onClick={() => {
                  setShowAddOwner(false);
                  setNewOwnerName('');
                }}
                className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Owner List */}
        <div className="space-y-3">
          {profile?.owners.map((owner, index) => (
            <div
              key={owner.id}
              data-owner-id={owner.id}
              className={`flex items-center justify-between p-3 bg-stone-50 rounded-xl border transition-all ${draggingId === owner.id
                ? 'opacity-80 border-blue-400 bg-blue-50 shadow-lg scale-[1.02] z-10 relative'
                : 'border-stone-100'
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

        <div className="flex gap-3">
          <button
            onClick={handleExportData}
            className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200 font-bold hover:bg-green-100 active:bg-green-200 transition-colors"
          >
            <Download className="w-5 h-5" />
            匯出資料
          </button>
          <button
            onClick={handleImportData}
            className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 font-bold hover:bg-blue-100 active:bg-blue-200 transition-colors"
          >
            <Upload className="w-5 h-5" />
            匯入資料
          </button>
        </div>
      </section>

      {/* Danger Zone Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          危ない！
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