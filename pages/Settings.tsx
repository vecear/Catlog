import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Palette, Edit2, Check, User, Cat, LogOut, Link, Mail, Users, Copy, CheckCircle, XCircle, Eye, EyeOff, Database, UserPlus, Loader2, UserMinus } from 'lucide-react';
import {
  getUserPets,
  updatePet,
  getPetOwners,
  getCareRequestsForOwner,
  respondToCareRequest,
  updateUserProfile,
  getUserByEmail,
  addOwnerToPet,
  removeOwnerFromPet
} from '../services/storage';
import { logout, linkGoogleAccount, linkEmailPassword, getLinkedProviders, updateUserEmail, updateUserPassword } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { Pet, UserProfile, CareRequest, OWNER_COLORS, PET_TYPE_LABELS, PET_TYPE_ICONS, PetType, PetGender, PET_GENDER_LABELS } from '../types';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile, refreshUserProfile } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Pets state
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [petOwners, setPetOwners] = useState<UserProfile[]>([]);

  // Care requests
  const [careRequests, setCareRequests] = useState<CareRequest[]>([]);

  // Account linking
  const [linkedProviders, setLinkedProviders] = useState<('google' | 'password')[]>([]);
  const [showLinkEmail, setShowLinkEmail] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPassword, setShowLinkPassword] = useState(false);
  const [linkError, setLinkError] = useState('');

  // Edit email/password states
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [editEmailPassword, setEditEmailPassword] = useState('');
  const [showEditEmailPassword, setShowEditEmailPassword] = useState(false);
  const [editEmailError, setEditEmailError] = useState('');
  const [editEmailLoading, setEditEmailLoading] = useState(false);

  const [showEditPassword, setShowEditPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [editPasswordError, setEditPasswordError] = useState('');
  const [editPasswordLoading, setEditPasswordLoading] = useState(false);

  // Edit states
  const [editingPetName, setEditingPetName] = useState(false);
  const [petNameInput, setPetNameInput] = useState('');
  const [editingPetBirthday, setEditingPetBirthday] = useState(false);
  const [petBirthdayInput, setPetBirthdayInput] = useState('');
  const [editingPetAdoptionDate, setEditingPetAdoptionDate] = useState(false);
  const [petAdoptionDateInput, setPetAdoptionDateInput] = useState('');
  const [editingPetType, setEditingPetType] = useState(false);
  const [petTypeInput, setPetTypeInput] = useState<PetType>('cat');
  const [editingPetGender, setEditingPetGender] = useState(false);
  const [petGenderInput, setPetGenderInput] = useState<PetGender>('unknown');
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Copy ID state
  const [copiedId, setCopiedId] = useState(false);

  // Add owner state
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [addOwnerEmail, setAddOwnerEmail] = useState('');
  const [addOwnerLoading, setAddOwnerLoading] = useState(false);
  const [addOwnerError, setAddOwnerError] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load user's pets
      const userPets = await getUserPets(user.uid);
      setPets(userPets);

      if (userPets.length > 0) {
        setSelectedPetId(userPets[0].id);
        const owners = await getPetOwners(userPets[0].id);
        setPetOwners(owners);
        setPetNameInput(userPets[0].name);
        setPetBirthdayInput(userPets[0].birthday);
        setPetAdoptionDateInput(userPets[0].adoptionDate);
        setPetTypeInput(userPets[0].type);
        setPetGenderInput(userPets[0].gender);
      }

      // Load care requests
      const requests = await getCareRequestsForOwner(user.uid);
      setCareRequests(requests);

      // Load linked providers
      const providers = getLinkedProviders(user);
      setLinkedProviders(providers);

      // Load display name
      if (userProfile) {
        setDisplayNameInput(userProfile.displayName);
      }
    } catch (error) {
      console.error('Error loading settings data:', error);
    }
    setIsLoading(false);
  };

  const selectedPet = pets.find(p => p.id === selectedPetId);

  const handleCopyPetId = async () => {
    if (selectedPet) {
      await navigator.clipboard.writeText(selectedPet.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleUpdatePetName = async () => {
    if (!selectedPet || !petNameInput.trim()) return;

    setIsSaving(true);
    try {
      await updatePet(selectedPet.id, { name: petNameInput.trim() });
      setPets(pets.map(p => p.id === selectedPet.id ? { ...p, name: petNameInput.trim() } : p));
      setEditingPetName(false);
    } catch (error) {
      alert('儲存失敗，請重試');
    }
    setIsSaving(false);
  };

  const handleUpdatePetBirthday = async () => {
    if (!selectedPet || !petBirthdayInput) return;

    setIsSaving(true);
    try {
      await updatePet(selectedPet.id, { birthday: petBirthdayInput });
      setPets(pets.map(p => p.id === selectedPet.id ? { ...p, birthday: petBirthdayInput } : p));
      setEditingPetBirthday(false);
    } catch (error) {
      alert('儲存失敗，請重試');
    }
    setIsSaving(false);
  };

  const handleUpdatePetAdoptionDate = async () => {
    if (!selectedPet || !petAdoptionDateInput) return;

    setIsSaving(true);
    try {
      await updatePet(selectedPet.id, { adoptionDate: petAdoptionDateInput });
      setPets(pets.map(p => p.id === selectedPet.id ? { ...p, adoptionDate: petAdoptionDateInput } : p));
      setEditingPetAdoptionDate(false);
    } catch (error) {
      alert('儲存失敗，請重試');
    }
    setIsSaving(false);
  };

  const handleUpdatePetType = async (newType: PetType) => {
    if (!selectedPet) return;

    setIsSaving(true);
    try {
      await updatePet(selectedPet.id, { type: newType });
      setPets(pets.map(p => p.id === selectedPet.id ? { ...p, type: newType } : p));
      setPetTypeInput(newType);
      setEditingPetType(false);
    } catch (error) {
      alert('儲存失敗，請重試');
    }
    setIsSaving(false);
  };

  const handleUpdatePetGender = async (newGender: PetGender) => {
    if (!selectedPet) return;

    setIsSaving(true);
    try {
      await updatePet(selectedPet.id, { gender: newGender });
      setPets(pets.map(p => p.id === selectedPet.id ? { ...p, gender: newGender } : p));
      setPetGenderInput(newGender);
      setEditingPetGender(false);
    } catch (error) {
      alert('儲存失敗，請重試');
    }
    setIsSaving(false);
  };

  const handleUpdateDisplayName = async () => {
    if (!user || !displayNameInput.trim()) return;

    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { displayName: displayNameInput.trim() });
      await refreshUserProfile();
      setEditingDisplayName(false);
    } catch (error) {
      alert('儲存失敗，請重試');
    }
    setIsSaving(false);
  };

  const handleUpdateUserColor = async (color: string) => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { color });
      await refreshUserProfile();
      setShowColorPicker(false);
    } catch (error) {
      alert('儲存失敗，請重試');
    }
    setIsSaving(false);
  };

  const handleLinkGoogle = async () => {
    if (!user) return;

    try {
      await linkGoogleAccount(user);
      const providers = getLinkedProviders(user);
      setLinkedProviders(providers);
      await refreshUserProfile();
      alert('已成功綁定 Google 帳號！');
    } catch (error: any) {
      alert(error.message || '綁定失敗，請重試');
    }
  };

  const handleLinkEmailPassword = async () => {
    if (!user) return;
    setLinkError('');

    if (!linkEmail.trim() || !linkPassword) {
      setLinkError('請填寫所有欄位');
      return;
    }

    if (linkPassword.length < 6) {
      setLinkError('密碼至少需要 6 個字元');
      return;
    }

    try {
      await linkEmailPassword(user, linkEmail, linkPassword);
      const providers = getLinkedProviders(user);
      setLinkedProviders(providers);
      await refreshUserProfile();
      setShowLinkEmail(false);
      setLinkEmail('');
      setLinkPassword('');
      alert('已成功設定電子郵件登入！');
    } catch (error: any) {
      setLinkError(error.message || '設定失敗，請重試');
    }
  };

  const handleRespondToRequest = async (requestId: string, approved: boolean) => {
    try {
      await respondToCareRequest(requestId, approved);
      setCareRequests(careRequests.filter(r => r.id !== requestId));

      if (approved && selectedPet) {
        const owners = await getPetOwners(selectedPet.id);
        setPetOwners(owners);
      }

      alert(approved ? '已同意申請！' : '已拒絕申請');
    } catch (error: any) {
      alert(error.message || '操作失敗，請重試');
    }
  };

  const handleAddOwner = async () => {
    if (!selectedPet || !addOwnerEmail.trim()) {
      setAddOwnerError('請輸入電子郵件');
      return;
    }

    setAddOwnerLoading(true);
    setAddOwnerError('');

    try {
      // Find user by email
      const targetUser = await getUserByEmail(addOwnerEmail.trim());
      if (!targetUser) {
        setAddOwnerError('找不到此用戶，請確認對方已註冊並登入過');
        setAddOwnerLoading(false);
        return;
      }

      // Check if already an owner
      if (selectedPet.ownerIds.includes(targetUser.id)) {
        setAddOwnerError('此用戶已經是照顧者');
        setAddOwnerLoading(false);
        return;
      }

      // Add owner to pet
      await addOwnerToPet(selectedPet.id, targetUser.id);

      // Refresh owners list
      const owners = await getPetOwners(selectedPet.id);
      setPetOwners(owners);

      // Update local pet state
      setPets(pets.map(p =>
        p.id === selectedPet.id
          ? { ...p, ownerIds: [...p.ownerIds, targetUser.id] }
          : p
      ));

      setShowAddOwner(false);
      setAddOwnerEmail('');
      alert(`已成功將 ${targetUser.displayName || targetUser.email} 加入照顧者！`);
    } catch (error: any) {
      setAddOwnerError(error.message || '新增失敗，請重試');
    }

    setAddOwnerLoading(false);
  };

  const handleUpdateEmail = async () => {
    if (!user) return;
    setEditEmailError('');

    if (!newEmail.trim()) {
      setEditEmailError('請輸入新的電子郵件');
      return;
    }

    if (!editEmailPassword) {
      setEditEmailError('請輸入目前密碼以驗證身份');
      return;
    }

    setEditEmailLoading(true);
    try {
      await updateUserEmail(user, newEmail.trim(), editEmailPassword);
      // Update user profile in Firestore too
      await updateUserProfile(user.uid, { email: newEmail.trim().toLowerCase() });
      await refreshUserProfile();
      setShowEditEmail(false);
      setNewEmail('');
      setEditEmailPassword('');
      alert('電子郵件已更新！');
    } catch (error: any) {
      setEditEmailError(error.message || '更新失敗，請重試');
    }
    setEditEmailLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    setEditPasswordError('');

    if (!currentPassword) {
      setEditPasswordError('請輸入目前密碼');
      return;
    }

    if (!newPassword) {
      setEditPasswordError('請輸入新密碼');
      return;
    }

    if (newPassword.length < 6) {
      setEditPasswordError('新密碼至少需要 6 個字元');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setEditPasswordError('新密碼與確認密碼不符');
      return;
    }

    setEditPasswordLoading(true);
    try {
      await updateUserPassword(user, currentPassword, newPassword);
      setShowEditPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      alert('密碼已更新！');
    } catch (error: any) {
      setEditPasswordError(error.message || '更新失敗，請重試');
    }
    setEditPasswordLoading(false);
  };

  const handleLeavePet = async () => {
    if (!user || !selectedPet) return;

    // Cannot leave if you're the creator
    if (selectedPet.createdBy === user.uid) {
      alert('建立者無法退出照顧');
      return;
    }

    // First confirmation
    if (!window.confirm(`確定要退出照顧「${selectedPet.name}」嗎？`)) {
      return;
    }

    // Second confirmation
    if (!window.confirm('退出後將無法再查看此寵物的照顧紀錄，確定要繼續嗎？')) {
      return;
    }

    // Third confirmation
    if (!window.confirm('這是最後確認！按下確定後將立即退出，您需要重新申請才能再次加入照顧。')) {
      return;
    }

    try {
      await removeOwnerFromPet(selectedPet.id, user.uid);

      // Remove the pet from local state
      const newPets = pets.filter(p => p.id !== selectedPet.id);
      setPets(newPets);

      if (newPets.length > 0) {
        setSelectedPetId(newPets[0].id);
        const owners = await getPetOwners(newPets[0].id);
        setPetOwners(owners);
      } else {
        setSelectedPetId(null);
        setPetOwners([]);
      }

      alert('已成功退出照顧');

      // If no more pets, redirect to onboarding
      if (newPets.length === 0) {
        navigate('/onboarding');
      }
    } catch (error: any) {
      alert(error.message || '退出失敗，請重試');
    }
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

      {/* User Profile Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" />
          個人資料
        </h3>

        <div className="space-y-4">
          {/* Display Name */}
          <div className="flex items-center justify-between">
            <span className="text-stone-600">顯示名稱</span>
            {editingDisplayName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  className="px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-32"
                  autoFocus
                />
                <button
                  onClick={handleUpdateDisplayName}
                  disabled={isSaving}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingDisplayName(false);
                    setDisplayNameInput(userProfile?.displayName || '');
                  }}
                  className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-800">{userProfile?.displayName}</span>
                <button
                  onClick={() => setEditingDisplayName(true)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* User Color */}
          <div className="flex items-center justify-between">
            <span className="text-stone-600">代表色</span>
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                style={{ backgroundColor: userProfile?.color || '#3B82F6' }}
              >
                <Palette className="w-4 h-4 text-white opacity-70" />
              </button>

              {showColorPicker && (
                <div className="absolute top-10 right-0 bg-white p-3 rounded-xl shadow-xl border border-stone-200 z-50 animate-fade-in">
                  <div className="grid grid-cols-5 gap-2 w-[200px]">
                    {OWNER_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleUpdateUserColor(color.value)}
                        className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                          userProfile?.color === color.value ? 'border-stone-800 ring-2 ring-offset-1 ring-stone-400' : 'border-white'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between">
            <span className="text-stone-600">電子郵件</span>
            <span className="text-stone-500 text-sm">{userProfile?.email}</span>
          </div>
        </div>
      </section>

      {/* Account Linking Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
          <Link className="w-5 h-5 text-purple-500" />
          帳號綁定
        </h3>
        <p className="text-stone-500 mb-4 text-sm">
          綁定多種登入方式，讓您更方便登入
        </p>

        <div className="space-y-3">
          {/* Google */}
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
            <div className="flex items-center gap-3">
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-6 h-6"
              />
              <span className="font-medium text-stone-700">Google</span>
            </div>
            {linkedProviders.includes('google') ? (
              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                已綁定
              </span>
            ) : (
              <button
                onClick={handleLinkGoogle}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                綁定
              </button>
            )}
          </div>

          {/* Email/Password */}
          <div className="p-3 bg-stone-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-stone-500" />
                <span className="font-medium text-stone-700">電子郵件密碼</span>
              </div>
              {linkedProviders.includes('password') ? (
                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  已設定
                </span>
              ) : (
                <button
                  onClick={() => setShowLinkEmail(!showLinkEmail)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  設定
                </button>
              )}
            </div>

            {/* Initial setup form (when not linked) */}
            {showLinkEmail && !linkedProviders.includes('password') && (
              <div className="mt-4 space-y-3 pt-4 border-t border-stone-200">
                {linkError && (
                  <p className="text-red-500 text-sm">{linkError}</p>
                )}
                <input
                  type="email"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  placeholder="電子郵件"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <div className="relative">
                  <input
                    type={showLinkPassword ? 'text' : 'password'}
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="密碼（至少 6 個字元）"
                    className="w-full px-3 py-2 pr-10 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLinkPassword(!showLinkPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400"
                  >
                    {showLinkPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleLinkEmailPassword}
                  className="w-full py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  確認設定
                </button>
              </div>
            )}

            {/* Edit options (when already linked) */}
            {linkedProviders.includes('password') && (
              <div className="mt-4 space-y-3 pt-4 border-t border-stone-200">
                {/* Edit Email */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600">電子郵件</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-500">{user?.email}</span>
                    <button
                      onClick={() => {
                        setShowEditEmail(!showEditEmail);
                        setShowEditPassword(false);
                        setEditEmailError('');
                      }}
                      className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {showEditEmail && (
                  <div className="space-y-3 p-3 bg-white rounded-lg border border-stone-200">
                    {editEmailError && (
                      <p className="text-red-500 text-sm">{editEmailError}</p>
                    )}
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="新的電子郵件"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="relative">
                      <input
                        type={showEditEmailPassword ? 'text' : 'password'}
                        value={editEmailPassword}
                        onChange={(e) => setEditEmailPassword(e.target.value)}
                        placeholder="目前密碼（驗證身份）"
                        className="w-full px-3 py-2 pr-10 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditEmailPassword(!showEditEmailPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400"
                      >
                        {showEditEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateEmail}
                        disabled={editEmailLoading}
                        className="flex-1 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {editEmailLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        確認修改
                      </button>
                      <button
                        onClick={() => {
                          setShowEditEmail(false);
                          setNewEmail('');
                          setEditEmailPassword('');
                          setEditEmailError('');
                        }}
                        className="px-4 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Password */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600">密碼</span>
                  <button
                    onClick={() => {
                      setShowEditPassword(!showEditPassword);
                      setShowEditEmail(false);
                      setEditPasswordError('');
                    }}
                    className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors"
                  >
                    修改密碼
                  </button>
                </div>

                {showEditPassword && (
                  <div className="space-y-3 p-3 bg-white rounded-lg border border-stone-200">
                    {editPasswordError && (
                      <p className="text-red-500 text-sm">{editPasswordError}</p>
                    )}
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="目前密碼"
                        className="w-full px-3 py-2 pr-10 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="新密碼（至少 6 個字元）"
                        className="w-full px-3 py-2 pr-10 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="確認新密碼"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdatePassword}
                        disabled={editPasswordLoading}
                        className="flex-1 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {editPasswordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        確認修改
                      </button>
                      <button
                        onClick={() => {
                          setShowEditPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmNewPassword('');
                          setEditPasswordError('');
                        }}
                        className="px-4 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Care Requests Section */}
      {careRequests.length > 0 && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200 border-2">
          <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            共同照顧申請
            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 text-sm rounded-full">
              {careRequests.length}
            </span>
          </h3>

          <div className="space-y-3">
            {careRequests.map((request) => (
              <div key={request.id} className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-stone-800">{request.requesterName}</p>
                    <p className="text-sm text-stone-500">{request.requesterEmail}</p>
                    <p className="text-sm text-stone-600 mt-1">
                      想要共同照顧 <span className="font-medium">{request.petName}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespondToRequest(request.id, true)}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      title="同意"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRespondToRequest(request.id, false)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="拒絕"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pet Selection (if multiple pets) */}
      {pets.length > 1 && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 className="text-lg font-bold text-stone-700 mb-4">選擇寵物</h3>
          <div className="flex gap-2 flex-wrap">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => {
                  setSelectedPetId(pet.id);
                  setPetNameInput(pet.name);
                  setPetBirthdayInput(pet.birthday);
                  setPetAdoptionDateInput(pet.adoptionDate);
                  setPetTypeInput(pet.type);
                  setPetGenderInput(pet.gender);
                }}
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

      {/* Pet Profile Section */}
      {selectedPet && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
            <span className="text-2xl">{PET_TYPE_ICONS[selectedPet.type]}</span>
            寵物資料
          </h3>

          <div className="space-y-4">
            {/* Pet ID */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
              <div>
                <span className="text-stone-600 text-sm">寵物 ID</span>
                <p className="font-mono text-lg font-bold text-purple-600">{selectedPet.id}</p>
              </div>
              <button
                onClick={handleCopyPetId}
                className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
              >
                {copiedId ? (
                  <>
                    <Check className="w-4 h-4" />
                    已複製
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    複製
                  </>
                )}
              </button>
            </div>
            <p className="text-stone-400 text-xs -mt-2">
              分享此 ID 給其他人，讓他們可以申請共同照顧
            </p>

            {/* Pet Name */}
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
                      setPetNameInput(selectedPet.name);
                    }}
                    className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-800">{selectedPet.name}</span>
                  <button
                    onClick={() => setEditingPetName(true)}
                    className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Pet Type */}
            <div className="flex items-center justify-between">
              <span className="text-stone-600">類別</span>
              {editingPetType ? (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {(['cat', 'dog', 'fish', 'duck', 'rabbit', 'mouse', 'lizard'] as PetType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleUpdatePetType(type)}
                      disabled={isSaving}
                      className={`px-2 py-1 rounded-lg border-2 transition-all text-sm ${
                        petTypeInput === type
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {PET_TYPE_ICONS[type]} {PET_TYPE_LABELS[type]}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setEditingPetType(false);
                      setPetTypeInput(selectedPet.type);
                    }}
                    className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-700">
                    {PET_TYPE_ICONS[selectedPet.type]} {PET_TYPE_LABELS[selectedPet.type]}
                  </span>
                  <button
                    onClick={() => setEditingPetType(true)}
                    className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Pet Gender */}
            <div className="flex items-center justify-between">
              <span className="text-stone-600">性別</span>
              {editingPetGender ? (
                <div className="flex items-center gap-2">
                  {(['male', 'female', 'unknown'] as PetGender[]).map((gender) => (
                    <button
                      key={gender}
                      onClick={() => handleUpdatePetGender(gender)}
                      disabled={isSaving}
                      className={`px-3 py-1 rounded-lg border-2 transition-all text-sm ${
                        petGenderInput === gender
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {PET_GENDER_LABELS[gender]}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setEditingPetGender(false);
                      setPetGenderInput(selectedPet.gender);
                    }}
                    className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-700">{PET_GENDER_LABELS[selectedPet.gender]}</span>
                  <button
                    onClick={() => setEditingPetGender(true)}
                    className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Pet Birthday */}
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
                    onClick={handleUpdatePetBirthday}
                    disabled={isSaving}
                    className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingPetBirthday(false);
                      setPetBirthdayInput(selectedPet.birthday);
                    }}
                    className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-500">{selectedPet.birthday}</span>
                  <button
                    onClick={() => setEditingPetBirthday(true)}
                    className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Adoption Date */}
            <div className="flex items-center justify-between">
              <span className="text-stone-600">來家裡的日子</span>
              {editingPetAdoptionDate ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={petAdoptionDateInput}
                    onChange={(e) => setPetAdoptionDateInput(e.target.value)}
                    className="px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdatePetAdoptionDate}
                    disabled={isSaving}
                    className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingPetAdoptionDate(false);
                      setPetAdoptionDateInput(selectedPet.adoptionDate);
                    }}
                    className="p-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-500">{selectedPet.adoptionDate}</span>
                  <button
                    onClick={() => setEditingPetAdoptionDate(true)}
                    className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Co-Caregivers Section */}
      {selectedPet && petOwners.length > 0 && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            照顧者
          </h3>

          <div className="space-y-2">
            {petOwners.map((owner) => (
              <div
                key={owner.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: `${owner.color}15` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: owner.color }}
                >
                  {owner.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-stone-800">{owner.displayName}</p>
                  <p className="text-sm text-stone-500">{owner.email}</p>
                </div>
                {/* Show exit button for current user (if not creator) */}
                {owner.id === user?.uid && selectedPet.createdBy !== user?.uid && (
                  <button
                    onClick={handleLeavePet}
                    className="ml-auto px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-1"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    退出
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Owner - All caregivers can add new caregivers */}
          <div className="mt-4 pt-4 border-t border-stone-100">
              {!showAddOwner ? (
                <button
                  onClick={() => setShowAddOwner(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-green-600 font-medium bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  新增照顧者
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-stone-500">輸入對方的電子郵件（對方需先註冊並登入過）</p>
                  {addOwnerError && (
                    <p className="text-sm text-red-500">{addOwnerError}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={addOwnerEmail}
                      onChange={(e) => setAddOwnerEmail(e.target.value)}
                      placeholder="輸入電子郵件"
                      className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                      disabled={addOwnerLoading}
                    />
                    <button
                      onClick={handleAddOwner}
                      disabled={addOwnerLoading}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {addOwnerLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddOwner(false);
                        setAddOwnerEmail('');
                        setAddOwnerError('');
                      }}
                      className="px-4 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
        </section>
      )}

      {/* No pets message */}
      {pets.length === 0 && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
          <Cat className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500">您還沒有寵物</p>
          <button
            onClick={() => navigate('/onboarding')}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            新增寵物
          </button>
        </section>
      )}

      {/* Data Migration Section - Only visible to admin (CCL) */}
      {(userProfile?.email === 'vecear@gmail.com' || userProfile?.displayName === 'CCL') && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            資料工具
          </h3>
          <button
            onClick={() => navigate('/migrate')}
            className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all flex items-center gap-3 text-left"
          >
            <Database className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-bold text-amber-800">資料遷移工具</p>
              <p className="text-sm text-amber-600">遷移舊資料或更新原有主人資料</p>
            </div>
          </button>
        </section>
      )}

      <div className="text-center text-xs text-stone-300 mt-8">
        PetLog v2.0.0
      </div>

      {/* Click outside to close color picker */}
      {showColorPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
};
