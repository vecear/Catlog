import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithGoogle, registerWithEmail } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export const RegisterPage: React.FC = () => {
    const { isAuthenticated, needsOnboarding } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            if (needsOnboarding) {
                navigate('/onboarding');
            } else {
                navigate('/');
            }
        }
    }, [isAuthenticated, needsOnboarding, navigate]);

    const handleGoogleRegister = async () => {
        setError('');
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Registration failed", error);
            setError("Google 註冊失敗，請重試");
        }
        setIsLoading(false);
    };

    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password || !confirmPassword) {
            setError('請填寫所有欄位');
            return;
        }

        if (password !== confirmPassword) {
            setError('兩次輸入的密碼不一致');
            return;
        }

        if (password.length < 6) {
            setError('密碼至少需要 6 個字元');
            return;
        }

        setIsLoading(true);
        try {
            await registerWithEmail(email, password);
        } catch (error: any) {
            setError(error.message || "註冊失敗，請重試");
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <UserPlus className="w-8 h-8 text-green-500" />
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-2">建立帳號</h1>
                <p className="text-gray-500 mb-6">開始記錄您的寵物照護日記</p>

                {error && (
                    <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Email Registration Form */}
                <form onSubmit={handleEmailRegister} className="w-full space-y-4 mb-6">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="電子郵件"
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-300 transition-all"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="密碼（至少 6 個字元）"
                            className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-300 transition-all"
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

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="確認密碼"
                            className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-300 transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '註冊中...' : '註冊'}
                    </button>
                </form>

                {/* Divider */}
                <div className="w-full flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-gray-400 text-sm">或</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Google Registration */}
                <button
                    onClick={handleGoogleRegister}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="w-6 h-6"
                    />
                    使用 Google 帳號註冊
                </button>

                {/* Login Link */}
                <p className="mt-6 text-sm text-gray-500">
                    已經有帳號？{' '}
                    <Link to="/login" className="text-blue-500 font-medium hover:underline">
                        登入
                    </Link>
                </p>
            </div>
        </div>
    );
};
