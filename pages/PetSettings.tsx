import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Edit2, Check, Cat, Users, Copy, CheckCircle, XCircle, UserPlus, Loader2, UserMinus, GripVertical, Database } from 'lucide-react';
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
import { useAuth } from '../context/AuthContext';
import { Pet, UserProfile, CareRequest, PET_TYPE_LABELS, PET_TYPE_ICONS, PetType, PetGender, PET_GENDER_LABELS } from '../types';

export const PetSettings: React.FC = () => {
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

  // Copy ID state
  const [copiedId, setCopiedId] = useState(false);

  // Add owner state
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [addOwnerEmail, setAddOwnerEmail] = useState('');
  const [addOwnerLoading, setAddOwnerLoading] = useState(false);
  const [addOwnerError, setAddOwnerError] = useState('');

  // Caregiver order state
  const [caregiverOrder, setCaregiverOrder] = useState<string[]>([]);
  const [draggedCaregiver, setDraggedCaregiver] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  // Load owners and caregiver order when selected pet changes
  useEffect(() => {
    const loadPetOwners = async () => {
      if (!selectedPetId || !userProfile) return;
      try {
        const owners = await getPetOwners(selectedPetId);
        setPetOwners(owners);
        // Load caregiver order from user's preferences
        const userCaregiverOrder = userProfile.caregiverOrders?.[selectedPetId];
        if (userCaregiverOrder) {
          const missingCaregivers = owners.map(o => o.id).filter(id => !userCaregiverOrder.includes(id));
          setCaregiverOrder([...userCaregiverOrder, ...missingCaregivers]);
        } else {
          setCaregiverOrder(owners.map(o => o.id));
        }
      } catch (error) {
        console.error('Failed to load pet owners:', error);
      }
    };
    loadPetOwners();
  }, [selectedPetId, userProfile]);

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
        // Load caregiver order from user's preferences
        const userCaregiverOrder = userProfile?.caregiverOrders?.[userPets[0].id];
        if (userCaregiverOrder) {
          const missingCaregivers = owners.map(o => o.id).filter(id => !userCaregiverOrder.includes(id));
          setCaregiverOrder([...userCaregiverOrder, ...missingCaregivers]);
        } else {
          setCaregiverOrder(owners.map(o => o.id));
        }
      }

      // Load care requests
      const requests = await getCareRequestsForOwner(user.uid);
      setCareRequests(requests);
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
      const targetUser = await getUserByEmail(addOwnerEmail.trim());
      if (!targetUser) {
        setAddOwnerError('找不到此用戶，請確認對方已註冊並登入過');
        setAddOwnerLoading(false);
        return;
      }

      if (selectedPet.ownerIds.includes(targetUser.id)) {
        setAddOwnerError('此用戶已經是照顧者');
        setAddOwnerLoading(false);
        return;
      }

      await addOwnerToPet(selectedPet.id, targetUser.id);

      const owners = await getPetOwners(selectedPet.id);
      setPetOwners(owners);

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

  const handleLeavePet = async () => {
    if (!user || !selectedPet) return;

    if (selectedPet.createdBy === user.uid) {
      alert('建立者無法退出照顧');
      return;
    }

    if (!window.confirm(`確定要退出照顧「${selectedPet.name}」嗎？`)) {
      return;
    }

    if (!window.confirm('退出後將無法再查看此寵物的照顧紀錄，確定要繼續嗎？')) {
      return;
    }

    if (!window.confirm('這是最後確認！按下確定後將立即退出，您需要重新申請才能再次加入照顧。')) {
      return;
    }

    try {
      await removeOwnerFromPet(selectedPet.id, user.uid);

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

      if (newPets.length === 0) {
        navigate('/onboarding');
      }
    } catch (error: any) {
      alert(error.message || '退出失敗，請重試');
    }
  };

  // Caregiver order management functions
  const handleCaregiverDragStart = (caregiverId: string) => {
    setDraggedCaregiver(caregiverId);
  };

  const handleCaregiverDragOver = (e: React.DragEvent, targetCaregiverId: string) => {
    e.preventDefault();
    if (!draggedCaregiver || draggedCaregiver === targetCaregiverId) return;

    const newOrder = [...caregiverOrder];
    const draggedIndex = newOrder.indexOf(draggedCaregiver);
    const targetIndex = newOrder.indexOf(targetCaregiverId);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedCaregiver);

    setCaregiverOrder(newOrder);
  };

  const handleCaregiverDragEnd = async () => {
    setDraggedCaregiver(null);
    if (selectedPet && user) {
      try {
        const newCaregiverOrders = {
          ...(userProfile?.caregiverOrders || {}),
          [selectedPet.id]: caregiverOrder
        };
        await updateUserProfile(user.uid, { caregiverOrders: newCaregiverOrders });
        await refreshUserProfile();
      } catch (error) {
        console.error('Failed to save caregiver order:', error);
      }
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
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-bold text-sm">返回</span>
        </button>
      </div>

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
            {(caregiverOrder.length > 0 ? caregiverOrder : petOwners.map(o => o.id)).map((caregiverId) => {
              const owner = petOwners.find(o => o.id === caregiverId);
              if (!owner) return null;
              return (
                <div
                  key={owner.id}
                  draggable
                  onDragStart={() => handleCaregiverDragStart(owner.id)}
                  onDragOver={(e) => handleCaregiverDragOver(e, owner.id)}
                  onDragEnd={handleCaregiverDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-move transition-all ${
                    draggedCaregiver === owner.id ? 'opacity-50 scale-95' : 'hover:shadow-sm'
                  }`}
                  style={{ backgroundColor: `${owner.color}15` }}
                >
                  <GripVertical className="w-5 h-5 text-stone-400 flex-shrink-0" />
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: owner.color }}
                  >
                    {owner.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 truncate">{owner.displayName}</p>
                    <p className="text-sm text-stone-500 truncate">{owner.email}</p>
                  </div>
                  {owner.id === user?.uid && selectedPet.createdBy !== user?.uid && (
                    <button
                      onClick={handleLeavePet}
                      className="ml-auto px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-1 flex-shrink-0"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      退出
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Owner */}
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

      {/* Data Migration Section - Only visible to admin */}
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
    </div>
  );
};
