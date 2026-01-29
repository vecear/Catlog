import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithGoogle, signInWithEmail, resetPassword } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, X } from 'lucide-react';

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
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    // Pet sound animation state - array to support multiple simultaneous sounds
    const [petSounds, setPetSounds] = useState<Array<{ id: number; text: string; x: number; y: number }>>([]);

    const handleLogoClick = () => {
        const sounds = ['喵~', '喵喵!', '汪!', '汪汪~', '嗚~', '呼嚕呼嚕'];
        const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        // Random position within the viewport
        const x = Math.random() * 60 + 20; // 20% to 80% from left
        const y = Math.random() * 40 + 20; // 20% to 60% from top
        const id = Date.now();
        setPetSounds(prev => [...prev, { id, text: randomSound, x, y }]);
        setTimeout(() => {
            setPetSounds(prev => prev.filter(s => s.id !== id));
        }, 2500);
    };

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
        setForgotEmail(email);
        setForgotError('');
        setForgotSuccess('');
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

    return (
        <div className="min-h-screen flex">
            {/* Left side - Large image (desktop only) */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 items-center justify-center p-12">
                <div className="max-w-lg text-center">
                    <img
                        src="/Catlog/banner_logo.png"
                        alt="PetLog Logo"
                        className="w-full max-w-md mx-auto"
                    />
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center lg:justify-start px-4 pt-2 pb-4 lg:p-8 lg:pl-0">
                <div className="w-full max-w-md">
                    {/* Mobile only - Logo (click for pet sound) */}
                    <div
                        className="lg:hidden mb-4 h-24 cursor-pointer"
                        onClick={handleLogoClick}
                    >
                        <img
                            src="/Catlog/banner_logo.png"
                            alt="PetLog Logo"
                            className="h-full w-full object-contain"
                        />
                    </div>

                    {/* Pet sound animations - random positions with fade out */}
                    {petSounds.map(sound => (
                        <div
                            key={sound.id}
                            className="lg:hidden fixed pointer-events-none z-50 animate-[fadeUp_2.5s_ease-out_forwards]"
                            style={{ left: `${sound.x}%`, top: `${sound.y}%` }}
                        >
                            <span className="text-amber-500/70 font-bold text-2xl drop-shadow-sm">{sound.text}</span>
                        </div>
                    ))}

                    {/* Login Card */}
                    <div className="relative px-2 py-6 lg:p-0">
                        {/* Decorative bottom border for mobile - coffee colored elegant lines */}
                        <div className="lg:hidden absolute -bottom-2 left-0 right-0 flex items-center justify-center gap-3">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-800/30"></div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-amber-700/40"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-700/50"></div>
                                <div className="w-1 h-1 rounded-full bg-amber-700/40"></div>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-800/30"></div>
                        </div>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 lg:mb-2">登入</h2>
                            <p className="text-gray-500">登入以管理您的寵物記錄</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                                {successMessage}
                            </div>
                        )}

                        {/* Google Login */}
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
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-gray-400 text-sm">或使用電子郵件登入</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        {/* Email Login Form */}
                        <form onSubmit={handleEmailLogin} className="space-y-4">
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

                            {/* Register Link */}
                            <p className="text-sm text-gray-500 text-center pt-2">
                                還沒有帳號？{' '}
                                <Link to="/register" className="text-blue-500 font-medium hover:underline">
                                    立即註冊
                                </Link>
                            </p>
                        </form>
                    </div>
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

                            {/* Email Input */}
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
