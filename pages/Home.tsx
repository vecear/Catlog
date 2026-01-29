import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarDays, Sparkles, Droplets, XCircle, CheckCircle, HelpCircle, AlertCircle, Trash2, Edit, RefreshCw, Settings as SettingsIcon, Scale, ChevronUp, ChevronLeft, ChevronRight, ShowerHead, Bug, Clock, LogOut, User, Cat, ListChecks } from 'lucide-react';
import { StatusCard } from '../components/StatusCard';
import { CareLog, UserProfile, CareRequest, HomeCardSettings, DEFAULT_HOME_CARD_SETTINGS } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { usePet } from '../context/PetContext';
import { getPendingCareRequestsForUser } from '../services/storage';
import { logout } from '../services/auth';


export const Home: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { selectedPet, selectedPetOwners, logs, todayStatus, loading, refreshLogs, refreshTodayStatus } = usePet();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<CareRequest[]>([]);

  // Settings dropdown state
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // Pet sound animation state
  const [petSounds, setPetSounds] = useState<Array<{ id: number; text: string; x: number; y: number }>>([]);

  // Pet name animation state
  const [petNameAnimation, setPetNameAnimation] = useState<string>('');
  const [petNameClickCount, setPetNameClickCount] = useState(0);
  const [petNameHidden, setPetNameHidden] = useState(false);

  // Pet type to base sound mapping
  const petSoundMap: Record<string, string> = {
    cat: '喵',
    dog: '汪',
    duck: '呱',
    fish: '啵',
    rabbit: '嚼',
    mouse: '吱',
    lizard: '嘶',
  };

  const generatePetSound = (petType: string) => {
    // Special case for cat: sometimes purr
    if (petType === 'cat' && Math.random() < 0.3) {
      const purrCount = Math.floor(Math.random() * 2) + 1; // 1-2 times
      return '呼嚕'.repeat(purrCount) + '~';
    }
    const baseSound = petSoundMap[petType] || '喵';
    const punctuations = ['~', '!', '~!', '!!', '~~~', '!~'];
    const repeatCount = Math.floor(Math.random() * 3) + 1; // 1-3 times
    const punctuation = punctuations[Math.floor(Math.random() * punctuations.length)];
    return baseSound.repeat(repeatCount) + punctuation;
  };

  const handlePetNameClick = () => {
    if (petNameHidden) return;

    const newCount = petNameClickCount + 1;
    setPetNameClickCount(newCount);

    const petType = selectedPet?.type || 'cat';
    const randomSound = generatePetSound(petType);
    const x = Math.random() * 60 + 20;
    const y = Math.random() * 40 + 10;
    const id = Date.now();
    setPetSounds(prev => [...prev, { id, text: randomSound, x, y }]);
    setTimeout(() => {
      setPetSounds(prev => prev.filter(s => s.id !== id));
    }, 2500);

    // If clicked more than 5 times, run away!
    if (newCount > 5) {
      const exitAnimations = ['animate__backOutRight', 'animate__bounceOutRight', 'animate__bounceOut', 'animate__bounceOutUp', 'animate__bounceOutLeft'];
      const randomExitAnim = exitAnimations[Math.floor(Math.random() * exitAnimations.length)];
      setPetNameAnimation(`animate__animated ${randomExitAnim}`);
      setTimeout(() => setPetNameHidden(true), 800);
      return;
    }

    // Apply random animation to pet name
    const animations = ['animate__rubberBand', 'animate__bounce', 'animate__tada', 'animate__heartBeat', 'animate__headShake', 'animate__wobble', 'animate__swing'];
    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
    setPetNameAnimation(`animate__animated ${randomAnim}`);
    setTimeout(() => setPetNameAnimation(''), 1000);
  };

  const fetchData = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshLogs(), refreshTodayStatus()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Check for pending care requests if no pet
  useEffect(() => {
    const checkPendingRequests = async () => {
      if (!selectedPet && user) {
        const requests = await getPendingCareRequestsForUser(user.uid);
        setPendingRequests(requests);
      }
    };
    checkPendingRequests();
  }, [selectedPet, user]);

  useEffect(() => {
    if (selectedPet) {
      fetchData();
    }
  }, [selectedPet?.id]);

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsMenu]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('確定要刪除這筆紀錄嗎？')) {
      try {
        const { deleteLog } = await import('../context/PetContext').then(m => {
          // We need to use the context's deleteLog
          return { deleteLog: async (logId: string) => {
            const { deletePetLog } = await import('../services/storage');
            if (selectedPet) {
              await deletePetLog(selectedPet.id, logId);
              await fetchData();
            }
          }};
        });
        await deleteLog(id);
      } catch (error) {
        console.error(error);
        alert('刪除失敗');
      }
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit/${id}`);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value);
    setSelectedDate(new Date(year, selectedDate.getMonth(), 1));
    setIsExpanded(false);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = parseInt(e.target.value);
    setSelectedDate(new Date(selectedDate.getFullYear(), month, 1));
    setIsExpanded(false);
  };

  // Group logs by date for the selected month
  const getMonthlyLogs = () => {
    const monthlyData: { date: string; logs: CareLog[] }[] = [];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = daysInMonth; i >= 1; i--) {
      const dayStart = new Date(year, month, i).getTime();
      const dayEnd = dayStart + 86400000;
      const dateStr = new Date(year, month, i).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });

      const dayLogs = logs.filter(l => l.timestamp >= dayStart && l.timestamp < dayEnd);
      if (dayLogs.length > 0) {
        monthlyData.push({ date: dateStr, logs: dayLogs });
      }
    }
    return monthlyData;
  };

  const monthlyLogs = getMonthlyLogs();

  const renderLitterDetails = (log: CareLog) => {
    if (log.isLitterClean) {
      return (
        <span className="bg-white text-emerald-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>乾淨</span>
        </span>
      );
    }

    return (
      <>
        {log.urineStatus === 'HAS_URINE' && (
          <span className="bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-sky-200 flex items-center gap-1">
            <Droplets className="w-3 h-3" />
            <span>有尿</span>
          </span>
        )}
        {log.urineStatus === 'NO_URINE' && (
          <span className="bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded text-[10px] font-bold border border-stone-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>沒尿</span>
          </span>
        )}
        {log.stoolType === 'FORMED' && (
          <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>成形</span>
          </span>
        )}
        {log.stoolType === 'UNFORMED' && (
          <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-200 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>不成形</span>
          </span>
        )}
        {log.stoolType === 'DIARRHEA' && (
          <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>腹瀉</span>
          </span>
        )}
      </>
    );
  };


  // Helper to get owner by name
  const getOwnerByName = (name: string): UserProfile | undefined => {
    return selectedPetOwners.find(o => o.displayName === name);
  };

  // Calculate scores for the current week (Monday 00:00 to Sunday 23:59)
  const getWeeklyScores = () => {
    if (selectedPetOwners.length === 0) return {} as Record<string, number>;

    const today = new Date();
    const ownerScores: Record<string, number> = {};

    selectedPetOwners.forEach(owner => {
      ownerScores[owner.displayName] = 0;
    });

    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday);
    const mondayStart = monday.getTime();
    const sundayEnd = mondayStart + 7 * 86400000;

    logs.forEach(log => {
      if (log.timestamp >= mondayStart && log.timestamp < sundayEnd) {
        const points = (log.actions.litter ? (log.isLitterClean ? 1 : 4) : 0) + (log.actions.food ? 2 : 0) + (log.actions.water ? 2 : 0) + (log.actions.grooming ? 3 : 0) + (log.actions.medication ? 2 : 0) + (log.actions.supplements ? 2 : 0) + (log.weight ? 2 : 0);
        if (ownerScores[log.author] !== undefined) {
          ownerScores[log.author] += points;
        }
      }
    });

    return ownerScores;
  };

  // Calculate chart data for the last 7 days
  const getChartData = () => {
    if (selectedPetOwners.length === 0) return [];

    const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const dateStr = d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });

      const dayScores: Record<string, number> = {};
      selectedPetOwners.forEach(owner => {
        dayScores[owner.displayName] = 0;
      });

      logs.forEach(log => {
        if (log.timestamp >= dayStart && log.timestamp < dayEnd) {
          const points = (log.actions.litter ? (log.isLitterClean ? 1 : 4) : 0) + (log.actions.food ? 2 : 0) + (log.actions.water ? 2 : 0) + (log.actions.grooming ? 3 : 0) + (log.actions.medication ? 2 : 0) + (log.actions.supplements ? 2 : 0) + (log.weight ? 2 : 0);
          if (dayScores[log.author] !== undefined) {
            dayScores[log.author] += points;
          }
        }
      });

      data.push({
        date: dateStr,
        ...dayScores
      });
    }

    return data;
  };

  const ownerScores = getWeeklyScores();
  const chartData = getChartData();

  // Get current week date range string with week number
  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const mondayStr = monday.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
    const sundayStr = sunday.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });

    const thursdayOfWeek = new Date(monday);
    thursdayOfWeek.setDate(monday.getDate() + 3);
    const yearStart = new Date(thursdayOfWeek.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((thursdayOfWeek.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return `年度第${weekNumber}週, ${mondayStr} - ${sundayStr}`;
  };
  const weekRange = getWeekRange();

  // Sort pet owners based on user's caregiver order preference
  const sortedPetOwners = useMemo(() => {
    if (!selectedPet || selectedPetOwners.length === 0) return selectedPetOwners;
    const userCaregiverOrder = userProfile?.caregiverOrders?.[selectedPet.id];
    if (!userCaregiverOrder) return selectedPetOwners;

    const sorted = [...selectedPetOwners].sort((a, b) => {
      const indexA = userCaregiverOrder.indexOf(a.id);
      const indexB = userCaregiverOrder.indexOf(b.id);
      // Items not in the order go to the end
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    return sorted;
  }, [selectedPet, selectedPetOwners, userProfile?.caregiverOrders]);

  // Get home card settings for selected pet
  const cardSettings = useMemo((): HomeCardSettings => {
    if (!selectedPet || !userProfile?.homeCardSettings?.[selectedPet.id]) {
      return DEFAULT_HOME_CARD_SETTINGS;
    }
    return { ...DEFAULT_HOME_CARD_SETTINGS, ...userProfile.homeCardSettings[selectedPet.id] };
  }, [selectedPet, userProfile?.homeCardSettings]);

  // Find winner
  const getWinner = () => {
    if (selectedPetOwners.length === 0) return null;
    const scores = Object.entries(ownerScores);
    if (scores.every(([_, score]) => score === 0)) return { type: 'none' as const };
    const maxScore = Math.max(...scores.map(([_, s]) => s));
    const winners = scores.filter(([_, s]) => s === maxScore);
    if (winners.length > 1) return { type: 'tie' as const };
    return { type: 'winner' as const, name: winners[0][0], score: winners[0][1] };
  };
  const winnerInfo = getWinner();

  // Calculate all-time total scores
  const getAllTimeTotals = () => {
    if (selectedPetOwners.length === 0) return {} as Record<string, number>;
    const totals: Record<string, number> = {};
    selectedPetOwners.forEach(owner => {
      totals[owner.displayName] = 0;
    });
    logs.forEach(log => {
      const points = (log.actions.litter ? (log.isLitterClean ? 1 : 4) : 0) + (log.actions.food ? 2 : 0) + (log.actions.water ? 2 : 0) + (log.actions.grooming ? 3 : 0) + (log.actions.medication ? 2 : 0) + (log.actions.supplements ? 2 : 0) + (log.weight ? 2 : 0);
      if (totals[log.author] !== undefined) {
        totals[log.author] += points;
      }
    });
    return totals;
  };
  const allTimeTotals = getAllTimeTotals();

  // Get weight data for chart
  const getWeightChartData = () => {
    const weightLogs = logs
      .filter(log => log.weight)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (weightLogs.length === 0) return [];

    const weightByDate = new Map<string, { date: string; weight: number; timestamp: number }>();

    weightLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const dateKey = `${logDate.getFullYear()}-${logDate.getMonth()}-${logDate.getDate()}`;
      const dateStr = logDate.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });

      const existing = weightByDate.get(dateKey);
      if (!existing || log.timestamp > existing.timestamp) {
        weightByDate.set(dateKey, {
          date: dateStr,
          weight: log.weight!,
          timestamp: log.timestamp
        });
      }
    });

    let result = Array.from(weightByDate.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    // Apply filter based on card settings
    if (cardSettings.weightChartType === 'entries') {
      // Show last N entries
      result = result.slice(-cardSettings.weightChartValue);
    } else {
      // Show last N days
      const cutoffTime = Date.now() - (cardSettings.weightChartValue * 24 * 60 * 60 * 1000);
      result = result.filter(item => item.timestamp >= cutoffTime);
    }

    return result.map(({ date, weight }) => ({ date, weight }));
  };
  const weightChartData = getWeightChartData();
  const hasWeightData = weightChartData.length > 0;

  // Generate random cat message
  const generateCatMessage = () => {
    const parts = ['喵', '~', '!'];
    const additionalLength = Math.floor(Math.random() * 19) + 1;
    let message = '喵';
    for (let i = 0; i < additionalLength; i++) {
      message += parts[Math.floor(Math.random() * parts.length)];
    }
    return message;
  };
  const catMessage = generateCatMessage();

  const getDailyStats = (dayLogs: CareLog[]) => {
    const urineCount = dayLogs.filter(l => l.urineStatus === 'HAS_URINE').length;
    const formedCount = dayLogs.filter(l => l.stoolType === 'FORMED').length;
    const unformedCount = dayLogs.filter(l => l.stoolType === 'UNFORMED').length;
    const diarrheaCount = dayLogs.filter(l => l.stoolType === 'DIARRHEA').length;

    const stoolParts = [];
    if (formedCount > 0) stoolParts.push(`成形${formedCount}`);
    if (unformedCount > 0) stoolParts.push(`不成形${unformedCount}`);
    if (diarrheaCount > 0) stoolParts.push(`腹瀉${diarrheaCount}`);

    const stoolText = stoolParts.length > 0 ? stoolParts.join('，') : '0';

    return `(尿尿: ${urineCount}, 便便: ${stoolText})`;
  };

  // Show loading or no pet message
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!selectedPet) {
    // Check if user has pending care requests
    if (pendingRequests.length > 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-stone-700 mb-2">等待審核中</h2>
          <p className="text-stone-500 mb-6 text-center">
            您已申請加入照顧「{pendingRequests[0].petName}」<br />
            請等待原照顧者審核
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm text-amber-700">
              申請時間：{new Date(pendingRequests[0].createdAt).toLocaleDateString('zh-TW')}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 flex items-center gap-2 text-stone-500 hover:text-stone-700"
          >
            <RefreshCw className="w-4 h-4" />
            重新整理
          </button>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="mt-4 flex items-center gap-2 text-stone-400 hover:text-stone-600"
          >
            <LogOut className="w-4 h-4" />
            返回登入畫面
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-6xl mb-4">🐾</div>
        <h2 className="text-xl font-bold text-stone-700 mb-2">還沒有寵物</h2>
        <p className="text-stone-500 mb-4 text-center">請先完成設定流程來新增您的寵物</p>
        <button
          onClick={() => navigate('/onboarding')}
          className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors"
        >
          開始設定
        </button>
      </div>
    );
  }

  const petName = selectedPet.name;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">

      <header className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-sm p-4 shadow-sm z-10 sticky top-0 md:rounded-2xl md:mt-2 md:mx-0 border-b border-amber-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-stone-600 tracking-tight">
              {selectedPet.adoptionDate ? (
                <>
                  有<span className={`text-amber-600 font-black cursor-pointer hover:scale-105 transition-transform inline-block text-[1.25em] ${petNameAnimation} ${petNameHidden ? 'invisible' : ''}`} onClick={handlePetNameClick}>{petName}</span>的第<span className="text-amber-600 font-black">{Math.floor((Date.now() - new Date(selectedPet.adoptionDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}</span>天
                </>
              ) : (
                <>
                  <span className={`text-amber-600 font-black cursor-pointer hover:scale-105 transition-transform inline-block text-[1.25em] ${petNameAnimation} ${petNameHidden ? 'invisible' : ''}`} onClick={handlePetNameClick}>{petName}</span>的生活
                </>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt="User Profile"
                className="w-8 h-8 rounded-full border border-stone-200"
              />
            )}
            <div className="relative" ref={settingsMenuRef}>
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 text-stone-400 hover:bg-stone-50 rounded-full transition-colors"
              >
                <SettingsIcon className="w-6 h-6" />
              </button>
              {showSettingsMenu && (
                <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-stone-200 py-2 min-w-[160px] z-50 animate-fade-in">
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      navigate('/settings/profile');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-sm">個人資料</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      navigate('/settings/pet');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <Cat className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-sm">寵物資料</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      navigate('/settings/interface');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <ListChecks className="w-4 h-4 text-teal-500" />
                    <span className="font-medium text-sm">介面設定</span>
                  </button>
                  <div className="h-px bg-stone-200 my-2" />
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      window.location.reload();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-stone-500" />
                    <span className="font-medium text-sm">重新整理</span>
                  </button>
                  <button
                    onClick={async () => {
                      setShowSettingsMenu(false);
                      if (window.confirm('確定要登出嗎？')) {
                        await logout();
                        navigate('/login');
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium text-sm">登出</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Pet Stats Highlights Card */}
      <section className="bg-gradient-to-br from-white to-amber-50/30 p-4 rounded-2xl shadow-sm border border-amber-100/50 grid grid-cols-4 gap-2">
        {/* Birthday Stat */}
        {selectedPet.birthday && (() => {
          const today = new Date();
          const [birthYear, birthMonth, birthDay] = selectedPet.birthday.split('-').map(Number);
          const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
          const nextBirthday = thisYearBirthday < today && thisYearBirthday.toDateString() !== today.toDateString()
            ? new Date(today.getFullYear() + 1, birthMonth - 1, birthDay)
            : thisYearBirthday;
          const diffTime = nextBirthday.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const nextAge = nextBirthday.getFullYear() - birthYear;
          const isBirthdayToday = today.getMonth() === birthMonth - 1 && today.getDate() === birthDay;

          return (
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-2 rounded-xl flex flex-col items-center justify-center text-center min-w-0 border border-rose-100/50">
              <span className="text-base mb-1">🎂</span>
              <span className="text-[10px] text-stone-500 font-medium truncate w-full">
                <span className="text-rose-500 font-semibold">{nextAge}歲</span>倒數
              </span>
              <div className="text-[11px] sm:text-sm font-bold text-stone-600 truncate w-full">
                {isBirthdayToday ? (
                  <span className="text-rose-500 animate-pulse">{nextAge} 歲生日！</span>
                ) : (
                  <><span className="text-rose-500">{diffDays}</span> 天</>
                )}
              </div>
            </div>
          );
        })()}

        {/* Bath Stat */}
        {(() => {
          const lastBathLog = logs.filter(l => l.actions.bath).sort((a, b) => b.timestamp - a.timestamp)[0];
          const daysSinceBath = lastBathLog ? Math.floor((Date.now() - lastBathLog.timestamp) / (1000 * 60 * 60 * 24)) : null;

          return (
            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 p-2 rounded-xl flex flex-col items-center justify-center text-center min-w-0 border border-sky-100/50">
              <span className="text-base mb-1">🚿</span>
              <span className="text-[10px] text-stone-500 font-medium truncate w-full">上次洗澡</span>
              <div className="text-[11px] sm:text-sm font-bold text-stone-600 truncate w-full">
                {daysSinceBath !== null ? (
                  <><span className="text-sky-500">{daysSinceBath}</span> 天前</>
                ) : (
                  <span className="text-stone-300">無紀錄</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Deworming Stat */}
        {(() => {
          const lastDewormingLog = logs.filter(l => l.actions.deworming).sort((a, b) => b.timestamp - a.timestamp)[0];
          const daysSinceDeworming = lastDewormingLog ? Math.floor((Date.now() - lastDewormingLog.timestamp) / (1000 * 60 * 60 * 24)) : null;

          return (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-2 rounded-xl flex flex-col items-center justify-center text-center min-w-0 border border-emerald-100/50">
              <span className="text-base mb-1">🦠</span>
              <span className="text-[10px] text-stone-500 font-medium truncate w-full">上次驅蟲</span>
              <div className="text-[11px] sm:text-sm font-bold text-stone-600 truncate w-full">
                {daysSinceDeworming !== null ? (
                  <><span className="text-emerald-600">{daysSinceDeworming}</span> 天前</>
                ) : (
                  <span className="text-stone-300">無紀錄</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Weight Stat */}
        {(() => {
          const latestWeightLog = logs.filter(l => l.weight).sort((a, b) => b.timestamp - a.timestamp)[0];

          return (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-2 rounded-xl flex flex-col items-center justify-center text-center min-w-0 border border-amber-100/50">
              <span className="text-base mb-1">⚖️</span>
              <span className="text-[10px] text-stone-500 font-medium truncate w-full">目前體重</span>
              <div className="text-[11px] sm:text-sm font-bold text-stone-600 truncate w-full">
                {latestWeightLog?.weight ? (
                  <><span className="text-amber-600">{latestWeightLog.weight.toFixed(1)}</span> kg</>
                ) : (
                  <span className="text-stone-300">無紀錄</span>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Desktop: Two Column Layout / Mobile: Stack */}
      <div className={`md:grid md:gap-6 ${cardSettings.showScoreboard && cardSettings.showTodayTasks ? 'md:grid-cols-5' : ''}`}>
        {/* Left Column - Scoreboard */}
        {cardSettings.showScoreboard && (
          <div className={`${cardSettings.showTodayTasks ? 'md:col-span-2' : ''} space-y-6`}>
            {/* Weekly Scoreboard */}
            <section>
              <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-rose-50/30 rounded-2xl p-4 mb-4 md:mb-0 border border-amber-200/50 shadow-sm">
                <h3 className="text-center font-bold text-stone-600 mb-1">
                  {winnerInfo?.type === 'none' ? (
                    <>本週{petName}<span className="text-rose-500 text-xl font-black">還沒有愛</span></>
                  ) : winnerInfo?.type === 'tie' ? (
                    <>本週{petName}愛大家<span className="text-amber-600 text-xl font-black">一樣多</span></>
                  ) : winnerInfo?.type === 'winner' ? (
                    <>本週{petName}更愛 <span style={{ color: getOwnerByName(winnerInfo.name)?.color }} className="text-xl font-black">{winnerInfo.name}</span></>
                  ) : null}
                </h3>
                <p className="text-center text-xs text-stone-400 mb-2">本週給{petName}的愛 ({weekRange})</p>
                <div className="flex justify-center gap-4 items-center text-sm font-medium mb-2 flex-wrap">
                  {sortedPetOwners.map((owner, index) => {
                    const score = ownerScores[owner.displayName] || 0;
                    const maxScore = Math.max(...Object.values(ownerScores));
                    const isWinning = score === maxScore && score > 0;
                    return (
                      <React.Fragment key={owner.id}>
                        {index > 0 && <div className="h-4 w-px bg-stone-300"></div>}
                        <div
                          className={`text-center ${isWinning ? 'scale-110 font-bold' : ''} transition-transform`}
                          style={{ color: owner.color }}
                        >
                          {owner.displayName}: <span className="text-lg">{score}</span> 分
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-stone-400 mb-1">全部累積總分</p>
                <div className="text-center text-xs text-stone-400 mb-4">
                  {sortedPetOwners.map((owner, index) => (
                    <span key={owner.id}>
                      {index > 0 && '，'}
                      <span style={{ color: owner.color }} className="font-medium">{owner.displayName}</span>
                      累積<span style={{ color: owner.color }} className="font-medium">{allTimeTotals[owner.displayName] || 0}</span>分愛
                    </span>
                  ))}
                </div>

                <p className="text-center text-xs text-stone-400 mb-1">過去7天</p>
                <div className="h-[72px] w-full mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fcd9b6" opacity={0.6} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#78716c' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                        padding={{ left: 20, right: 20 }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#78716c' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px' }}
                        labelStyle={{ fontSize: '12px', color: '#78716c', marginBottom: '4px' }}
                      />
                      {sortedPetOwners.map(owner => (
                        <Line
                          key={owner.id}
                          type="monotone"
                          dataKey={owner.displayName}
                          stroke={owner.color}
                          strokeWidth={2}
                          dot={{ r: 3, fill: owner.color, strokeWidth: 0 }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[10px] text-stone-400 text-center mt-2 bg-white/50 rounded-lg py-1.5 px-2">
                  梳毛 +3 ｜ 飼料/水/藥/保健/體重 +2 ｜ 貓砂 乾淨+1 髒+4
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Right Column - Today's Tasks */}
        {cardSettings.showTodayTasks && (
          <div className={`${cardSettings.showScoreboard ? 'md:col-span-3' : ''}`}>
            {/* Today's Status Section */}
            <section>
              <div className="flex items-center gap-2 mb-2 px-1 md:px-0">
                <CheckCircle className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-stone-700">今日任務</h2>
              </div>
              <div className="text-xs text-stone-400 mb-4 px-1 md:px-0 bg-stone-50 rounded-lg py-1.5 px-3 inline-block">
                早 06-10 ｜ 中 11-16 ｜ 晚 17-22 ｜ 睡 23-05
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {(userProfile?.actionOrders?.[selectedPet.id] || ['food', 'water', 'litter', 'grooming', 'medication', 'supplements', 'deworming', 'bath', 'weight']).map((actionType) => {
                  // Only render StatusCard for supported types
                  const validTypes = ['food', 'water', 'litter', 'grooming', 'medication', 'supplements', 'weight'] as const;
                  if (!validTypes.includes(actionType as any)) return null;
                  // Check if this item is hidden in today tasks card settings
                  if ((cardSettings.hiddenTodayTaskItems || []).includes(actionType)) return null;
                  const type = actionType as typeof validTypes[number];
                  return (
                    <StatusCard
                      key={type}
                      type={type}
                      progress={todayStatus[type]}
                      customLabel={selectedPet.actionLabels?.[type]}
                    />
                );
              })}
            </div>
          </section>
        </div>
        )}
      </div>

      {/* Weight Chart Section */}
      {cardSettings.showWeightChart && hasWeightData && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-2 px-1 md:px-0">
            <Scale className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-stone-700">體重變化</h2>
          </div>
          <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-4 rounded-2xl border border-amber-200/50 shadow-sm">
            <div className="h-[70px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fed7aa" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#78716c' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: '#78716c' }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', color: '#EA7500' }}
                    labelStyle={{ fontSize: '12px', color: '#78716c', marginBottom: '4px' }}
                    formatter={(value: number) => [`${value} kg`, '體重']}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#EA7500"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#EA7500', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-stone-400 mt-2">歷史紀錄</p>
          </div>
        </section>
      )}

      {/* Monthly Logs Section */}
      <section>
        <div className="mb-4 px-1">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-stone-700">月份紀錄</h2>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="p-1 rounded-full hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition-all ml-2"
              title="回到當月"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
                setSelectedDate(newDate);
                setIsExpanded(false);
              }}
              className="p-2 rounded-lg bg-white border border-stone-100 shadow-sm text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors"
              title="上個月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-stone-100">
              <select
                value={selectedDate.getFullYear()}
                onChange={handleYearChange}
                className="bg-transparent text-sm font-bold text-stone-600 py-1.5 px-2 outline-none cursor-pointer hover:bg-stone-50 rounded-md transition-colors appearance-none text-center"
                style={{ textAlignLast: 'center' }}
              >
                {Array.from({ length: 2045 - 2024 + 1 }, (_, i) => {
                  const year = 2024 + i;
                  return (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  );
                })}
              </select>
              <div className="w-px h-4 bg-stone-200"></div>
              <select
                value={selectedDate.getMonth()}
                onChange={handleMonthChange}
                className="bg-transparent text-sm font-bold text-stone-600 py-1.5 px-2 outline-none cursor-pointer hover:bg-stone-50 rounded-md transition-colors appearance-none text-center"
                style={{ textAlignLast: 'center' }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {i + 1}月
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
                setSelectedDate(newDate);
                setIsExpanded(false);
              }}
              className="p-2 rounded-lg bg-white border border-stone-100 shadow-sm text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors"
              title="下個月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="space-y-6">
          {monthlyLogs.length === 0 ? (
            <div className="text-center py-10 text-stone-400 bg-gradient-to-br from-white to-amber-50/30 rounded-xl border border-amber-200/50 border-dashed">
              本月尚無紀錄
            </div>
          ) : (
            <>
              {(isExpanded || cardSettings.monthlyLogsDefaultDays === 0 ? monthlyLogs : monthlyLogs.slice(0, cardSettings.monthlyLogsDefaultDays)).map((dayGroup) => (
                <div key={dayGroup.date} className="animate-fade-in-up">
                  <h3 className="text-sm font-bold text-stone-400 mb-2 pl-1 flex items-center gap-2">
                    <span>{dayGroup.date}</span>
                    <span className="text-xs text-stone-300 font-normal">
                      {getDailyStats(dayGroup.logs)}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {dayGroup.logs.map((log) => {
                      const ownerData = getOwnerByName(log.author);
                      return (
                        <div key={log.id} className="bg-gradient-to-r from-white to-amber-50/20 p-4 rounded-xl shadow-sm border border-amber-100/50 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1"
                            style={{ backgroundColor: ownerData?.color || '#a8a29e' }}
                          ></div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider"
                                style={{
                                  backgroundColor: ownerData ? `${ownerData.color}20` : '#e7e5e4',
                                  color: ownerData?.color || '#78716c'
                                }}
                              >
                                {log.author || '未知'}
                              </span>
                              <span className="text-xs text-stone-400 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2 items-center flex-wrap justify-end">
                              {log.actions.food && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-xs font-medium">飼料</span>}
                              {log.actions.water && <span className="bg-[#921AFF]/10 text-[#921AFF] px-2 py-1 rounded-md text-xs font-medium">飲水</span>}
                              {log.actions.litter && (
                                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium border border-emerald-100">
                                  <span className="mr-1">貓砂</span>
                                  {renderLitterDetails(log)}
                                </div>
                              )}
                              {log.actions.grooming && <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-md text-xs font-medium">梳毛</span>}
                              {log.actions.medication && <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded-md text-xs font-medium">給藥</span>}
                              {log.actions.supplements && <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium">保健</span>}
                              {log.actions.deworming && <span className="bg-red-100 text-red-600 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1"><Bug className="w-3 h-3" />驅蟲</span>}
                              {log.actions.bath && <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1"><ShowerHead className="w-3 h-3" />洗澡</span>}
                              {log.weight && (
                                <span className="bg-[#EA7500]/10 text-[#EA7500] px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                                  <Scale className="w-3 h-3" />
                                  {log.weight.toFixed(1)} kg
                                </span>
                              )}
                            </div>
                            <div className="flex flex-row gap-1 whitespace-nowrap">
                              <button
                                onClick={(e) => handleEdit(log.id, e)}
                                className="p-1.5 text-stone-300 hover:text-stone-600 hover:bg-stone-50 rounded-full transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(log.id, e)}
                                className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {!isExpanded && cardSettings.monthlyLogsDefaultDays !== 0 && monthlyLogs.length > cardSettings.monthlyLogsDefaultDays && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="w-full py-3 text-amber-700 font-bold text-sm bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50 shadow-sm hover:from-amber-100 hover:to-orange-100 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>顯示當月所有紀錄 ({monthlyLogs.length} 天)</span>
                </button>
              )}
              {isExpanded && cardSettings.monthlyLogsDefaultDays !== 0 && monthlyLogs.length > cardSettings.monthlyLogsDefaultDays && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-full py-3 text-stone-600 font-bold text-sm bg-gradient-to-r from-stone-50 to-stone-100 rounded-xl border border-stone-200/50 shadow-sm hover:from-stone-100 hover:to-stone-200 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>顯示近 {cardSettings.monthlyLogsDefaultDays} 天</span>
                </button>
              )}
            </>
          )}
        </div>
      </section >

      {/* Spacer for floating action button */}
      <div className="h-12" />

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <button
          onClick={() => navigate('/add')}
          className="pointer-events-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-2 px-6 py-4 rounded-full shadow-xl hover:from-amber-600 hover:to-orange-600 hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-amber-100"
        >
          <Plus className="w-6 h-6" />
          <span className="font-bold text-lg">紀錄一下</span>
        </button>
      </div>

      {/* Pet sound animations */}
      {petSounds.map(sound => (
        <div
          key={sound.id}
          className="fixed pointer-events-none z-50 animate-[fadeUp_2.5s_ease-out_forwards]"
          style={{ left: `${sound.x}%`, top: `${sound.y}%` }}
        >
          <span className="text-amber-500/70 font-bold text-2xl drop-shadow-sm">{sound.text}</span>
        </div>
      ))}
    </div >
  );
};
