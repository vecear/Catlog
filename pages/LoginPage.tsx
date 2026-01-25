import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { LogIn, ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { user, isAuthorized } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // If logged in AND authorized, go home
        if (user && isAuthorized) {
            navigate('/');
        }
    }, [user, isAuthorized, navigate]);

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Login failed", error);
            alert("登入失敗，請重試");
        }
    };

    if (user && !isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
                <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">存取被拒</h1>
                <p className="text-gray-600 mb-6">
                    抱歉，您的帳號 ({user.email}) 沒有權限存取此應用程式。
                </p>
                <button
                    onClick={() => window.location.reload()} // Simple way to retry or maybe a logout button needed here?
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    重新嘗試 / 登出
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <LogIn className="w-8 h-8 text-blue-500" />
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-2">歡迎回來</h1>
                <p className="text-gray-500 mb-8">請登入以管理您的記錄</p>

                <button
                    onClick={handleLogin}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm active:scale-[0.98]"
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="w-6 h-6"
                    />
                    使用 Google 帳號登入
                </button>

                <p className="mt-6 text-xs text-gray-400">
                    僅限授權人員 (RURU & CCL) 使用
                </p>
            </div>
        </div>
    );
};
