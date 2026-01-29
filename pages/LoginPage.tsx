import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithGoogle, signInWithEmail, resetPassword } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { verifyPetOwnership } from '../services/storage';
import { Mail, Lock, Eye, EyeOff, X, Calendar, PawPrint } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { isAuthenticated, needsOnboarding } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Forgot password modal state
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotMethod, setForgotMethod] = useState<'email' | 'pet'>('email');
    const [forgotEmail, setForgotEmail] = useState('');
    const [petName, setPetName] = useState('');
    const [petBirthday, setPetBirthday] = useState('');
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            if (needsOnboarding) {
                navigate('/onboarding');
            } else {
                navigate('/');
            }
        }
    }, [isAuthenticated, needsOnboarding, navigate]);

    const handleGoogleLogin = async () => {
        setError('');
        setSuccessMessage('');
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Login failed", error);
            setError("Google 登入失敗，請重試");
        }
        setIsLoading(false);
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!email.trim() || !password) {
            setError('請填寫所有欄位');
            return;
        }

        setIsLoading(true);
        try {
            await signInWithEmail(email, password);
        } catch (error: any) {
            setError(error.message || "登入失敗，請重試");
        }
        setIsLoading(false);
    };

    const openForgotModal = () => {
        setForgotEmail(email); // Pre-fill with login email if entered
        setForgotError('');
        setForgotSuccess('');
        setPetName('');
        setPetBirthday('');
        setShowForgotModal(true);
    };

    const closeForgotModal = () => {
        setShowForgotModal(false);
        setForgotError('');
        setForgotSuccess('');
    };

    const handleEmailReset = async () => {
        setForgotError('');
        setForgotSuccess('');

        if (!forgotEmail.trim()) {
            setForgotError('請輸入電子郵件');
            return;
        }

        setForgotLoading(true);
        try {
            await resetPassword(forgotEmail);
            setForgotSuccess('密碼重設郵件已發送，請檢查您的信箱（可能被自動歸到垃圾信件）');
        } catch (error: any) {
            setForgotError(error.message || "發送失敗，請重試");
        }
        setForgotLoading(false);
    };

    const handlePetVerifyReset = async () => {
        setForgotError('');
        setForgotSuccess('');

        if (!forgotEmail.trim()) {
            setForgotError('請輸入電子郵件');
            return;
        }
        if (!petName.trim()) {
            setForgotError('請輸入寵物名稱');
            return;
        }
        if (!petBirthday) {
            setForgotError('請選擇寵物生日');
            return;
        }

        setForgotLoading(true);
        try {
            const result = await verifyPetOwnership(forgotEmail, petName, petBirthday);
            if (result.verified) {
                // Verification passed, send reset email
                await resetPassword(forgotEmail);
                setForgotSuccess('驗證成功！密碼重設郵件已發送，請檢查您的信箱（可能被自動歸到垃圾信件）');
            } else {
                setForgotError(result.error || '驗證失敗');
            }
        } catch (error: any) {
            setForgotError(error.message || "驗證失敗，請重試");
        }
        setForgotLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center text-center overflow-hidden">
                <div className="w-full">
                    <img
                        src="/Catlog/banner_logo.png"
                        alt="PetLog Logo"
                        className="w-full h-40 object-cover object-center"
                    />
                </div>

                <div className="p-8 w-full flex flex-col items-center">
                    <p className="text-gray-500 mb-6">登入以管理您的寵物記錄</p>

                    {error && (
                        <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="w-full mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                            {successMessage}
                        </div>
                    )}

                    {/* Google Login - Now at top */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google"
                            className="w-6 h-6"
                        />
                        使用 Google 帳號登入
                    </button>

                    {/* Divider */}
                    <div className="w-full flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-gray-400 text-sm">或使用電子郵件登入</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Email Login Form */}
                    <form onSubmit={handleEmailLogin} className="w-full space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="電子郵件"
                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="密碼"
                                className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={openForgotModal}
                                disabled={isLoading}
                                className="text-sm text-blue-500 hover:underline disabled:opacity-50"
                            >
                                忘記密碼？
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '處理中...' : '登入'}
                        </button>

                        {/* Register Link - Now below login button */}
                        <p className="text-sm text-gray-500 text-center pt-2">
                            還沒有帳號？{' '}
                            <Link to="/register" className="text-blue-500 font-medium hover:underline">
                                立即註冊
                            </Link>
                        </p>
                    </form>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-bold text-gray-800">忘記密碼</h2>
                            <button
                                onClick={closeForgotModal}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Method Tabs */}
                        <div className="flex border-b">
                            <button
                                onClick={() => setForgotMethod('email')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                    forgotMethod === 'email'
                                        ? 'text-blue-500 border-b-2 border-blue-500'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                電子郵件驗證
                            </button>
                            <button
                                onClick={() => setForgotMethod('pet')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                    forgotMethod === 'pet'
                                        ? 'text-blue-500 border-b-2 border-blue-500'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                寵物資料驗證
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4">
                            {forgotError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                    {forgotError}
                                </div>
                            )}

                            {forgotSuccess && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                                    {forgotSuccess}
                                </div>
                            )}

                            {/* Email Input (common for both methods) */}
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="電子郵件"
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                                    disabled={forgotLoading}
                                />
                            </div>

                            {forgotMethod === 'email' ? (
                                <>
                                    <p className="text-sm text-gray-500">
                                        我們會寄送密碼重設連結到您的信箱（可能被自動歸到垃圾信件）
                                    </p>
                                    <button
                                        onClick={handleEmailReset}
                                        disabled={forgotLoading}
                                        className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {forgotLoading ? '處理中...' : '發送重設郵件'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-500">
                                        輸入您帳號中任一寵物的名稱和生日來驗證身份
                                    </p>

                                    {/* Pet Name Input */}
                                    <div className="relative">
                                        <PawPrint className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={petName}
                                            onChange={(e) => setPetName(e.target.value)}
                                            placeholder="寵物名稱"
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                                            disabled={forgotLoading}
                                        />
                                    </div>

                                    {/* Pet Birthday Input */}
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            value={petBirthday}
                                            onChange={(e) => setPetBirthday(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                                            disabled={forgotLoading}
                                        />
                                    </div>

                                    <button
                                        onClick={handlePetVerifyReset}
                                        disabled={forgotLoading}
                                        className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {forgotLoading ? '驗證中...' : '驗證並重設密碼'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
