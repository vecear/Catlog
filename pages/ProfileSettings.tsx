import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Edit2, Check, User, Link, Mail, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { updateUserProfile } from '../services/storage';
import { linkGoogleAccount, linkEmailPassword, getLinkedProviders, updateUserEmail, updateUserPassword } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { OWNER_COLORS } from '../types';

export const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile, refreshUserProfile } = useAuth();

  const [isSaving, setIsSaving] = useState(false);

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
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (user) {
      const providers = getLinkedProviders(user);
      setLinkedProviders(providers);
    }
    if (userProfile) {
      setDisplayNameInput(userProfile.displayName);
    }
  }, [user, userProfile]);

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

      {/* User Profile Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" />
          個人資料
        </h3>

        <div className="space-y-4">
          {/* Display Name with Color */}
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
                {/* Color picker button */}
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-7 h-7 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                    style={{ backgroundColor: userProfile?.color || '#3B82F6' }}
                    title="選擇代表色"
                  />
                  {showColorPicker && (
                    <div className="absolute top-9 right-0 bg-white p-3 rounded-xl shadow-xl border border-stone-200 z-50 animate-fade-in">
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
