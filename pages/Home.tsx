import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarDays, Sparkles, Droplets, XCircle, CheckCircle, HelpCircle, AlertCircle, Trash2, Edit, RefreshCw, Settings as SettingsIcon, Scale, ChevronUp, ChevronLeft, ChevronRight, ShowerHead } from 'lucide-react';
import { StatusCard } from '../components/StatusCard';
import { getTodayStatus, getLogs, deleteLog, getProfile } from '../services/storage';
import { CareLog, AppProfile, Owner } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const PET_TITLES = [
  "拆家王", "暴走王", "午睡王", "肥肥王", "臭屁王",
  "夜衝王", "刮抓王", "液態王", "吵醒王", "翻肚王",
  "破壞王", "吃貨王", "瞪人王", "卡屎王", "廢萌王",
  "黏黏王", "小霸王", "毛球王", "跳桌王", "亂吃王",
  "開門王", "鬼叫王", "撒嬌王", "冷眼王", "軟爛王",
  "毛怪王", "掉毛王", "咬手王", "貼身王", "瞬移王"
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<any>({
    food: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    water: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    litter: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    grooming: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    medication: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false },
    weight: { morning: false, noon: false, evening: false, bedtime: false, isComplete: false }
  });
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [profile, setProfile] = useState<AppProfile | null>(null);

  const randomTitle = useMemo(() => {
    return PET_TITLES[Math.floor(Math.random() * PET_TITLES.length)];
  }, []);

  const fetchData = async () => {
    setIsRefreshing(true);
    const [todayStatus, allLogs, loadedProfile] = await Promise.all([
      getTodayStatus(),
      getLogs(),
      getProfile()
    ]);
    setStatus(todayStatus);
    setLogs(allLogs);
    setProfile(loadedProfile);
    setTimeout(() => setIsRefreshing(false), 500); // Visual delay
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent potentially triggering other click events if any
    if (window.confirm('確定要刪除這筆紀錄嗎？')) {
      try {
        await deleteLog(id);
        await fetchData(); // Refresh data
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

    // Get number of days in month
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


  // ... (existing helper functions)

  // Helper to get owner by name
  const getOwnerByName = (name: string): Owner | undefined => {
    return profile?.owners.find(o => o.name === name);
  };

  // Calculate scores for the current week (Monday 00:00 to Sunday 23:59)
  const getWeeklyScores = () => {
    if (!profile) return {} as Record<string, number>;

    const today = new Date();
    const ownerScores: Record<string, number> = {};

    // Initialize scores for all owners
    profile.owners.forEach(owner => {
      ownerScores[owner.name] = 0;
    });

    // Calculate Monday of the current week
    // getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday goes back 6 days, others go to Monday
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday);
    const mondayStart = monday.getTime();
    const sundayEnd = mondayStart + 7 * 86400000; // Monday + 7 days

    logs.forEach(log => {
      if (log.timestamp >= mondayStart && log.timestamp < sundayEnd) {
        const points = (log.actions.litter ? (log.isLitterClean ? 1 : 4) : 0) + (log.actions.food ? 2 : 0) + (log.actions.water ? 2 : 0) + (log.actions.grooming ? 3 : 0) + (log.actions.medication ? 2 : 0) + (log.weight ? 2 : 0);
        if (ownerScores[log.author] !== undefined) {
          ownerScores[log.author] += points;
        }
      }
    });

    return ownerScores;
  };

  // Calculate chart data for the last 7 days
  const getChartData = () => {
    if (!profile) return [];

    const today = new Date();
    const data = [];

    // Create array for last 7 days (including today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const dateStr = d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });

      const dayScores: Record<string, number> = {};
      profile.owners.forEach(owner => {
        dayScores[owner.name] = 0;
      });

      logs.forEach(log => {
        if (log.timestamp >= dayStart && log.timestamp < dayEnd) {
          const points = (log.actions.litter ? (log.isLitterClean ? 1 : 4) : 0) + (log.actions.food ? 2 : 0) + (log.actions.water ? 2 : 0) + (log.actions.grooming ? 3 : 0) + (log.actions.medication ? 2 : 0) + (log.weight ? 2 : 0);
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

    // Calculate ISO week number (week starts on Monday)
    const thursdayOfWeek = new Date(monday);
    thursdayOfWeek.setDate(monday.getDate() + 3); // Thursday of the current week
    const yearStart = new Date(thursdayOfWeek.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((thursdayOfWeek.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return `年度第${weekNumber}週, ${mondayStr} - ${sundayStr}`;
  };
  const weekRange = getWeekRange();

  // Find winner
  const getWinner = () => {
    if (!profile || profile.owners.length === 0) return null;
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
    if (!profile) return {} as Record<string, number>;
    const totals: Record<string, number> = {};
    profile.owners.forEach(owner => {
      totals[owner.name] = 0;
    });
    logs.forEach(log => {
      const points = (log.actions.litter ? (log.isLitterClean ? 1 : 4) : 0) + (log.actions.food ? 2 : 0) + (log.actions.water ? 2 : 0) + (log.actions.grooming ? 3 : 0) + (log.actions.medication ? 2 : 0) + (log.weight ? 2 : 0);
      if (totals[log.author] !== undefined) {
        totals[log.author] += points;
      }
    });
    return totals;
  };
  const allTimeTotals = getAllTimeTotals();

  // Get weight data for chart
  const getWeightChartData = () => {
    return logs
      .filter(log => log.weight)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(log => ({
        date: new Date(log.timestamp).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
        weight: log.weight
      }));
  };
  const weightChartData = getWeightChartData();
  const hasWeightData = weightChartData.length > 0;

  // Generate random cat message
  const generateCatMessage = () => {
    const parts = ['喵', '~', '!'];
    const additionalLength = Math.floor(Math.random() * 19) + 1; // 1 to 19 more chars
    let message = '喵'; // Always start with 喵
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

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">

      <header className="bg-white p-4 shadow-sm z-10 sticky top-0 md:rounded-2xl md:mt-2 md:mx-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-stone-800 tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-lg">🐱</span>
              <span>
                <span className="text-orange-500 mr-1">{randomTitle}</span>
                {profile?.pet.name || '小賀'}的生活
              </span>
            </h1>
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-stone-400 hover:bg-stone-50 rounded-full transition-colors"
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="text-center text-xs text-stone-400 mt-2">
          {new Date().toLocaleString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' })}
        </div>
        {profile?.pet.birthday && (() => {
          const today = new Date();
          const [birthYear, birthMonth, birthDay] = profile.pet.birthday.split('-').map(Number);
          const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
          const nextBirthday = thisYearBirthday < today && thisYearBirthday.toDateString() !== today.toDateString()
            ? new Date(today.getFullYear() + 1, birthMonth - 1, birthDay)
            : thisYearBirthday;
          const diffTime = nextBirthday.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const nextAge = nextBirthday.getFullYear() - birthYear;
          const isBirthdayToday = today.getMonth() === birthMonth - 1 && today.getDate() === birthDay;
          return (
            <div className="text-center text-xs mt-1">
              {isBirthdayToday ? (
                <span className="text-orange-500 font-bold">🎂 今天是 {profile.pet.name} 的 {nextAge} 歲生日！🎉</span>
              ) : (
                <span className="text-stone-400">🎂 距離 {nextAge} 歲生日還有 <span className="font-bold text-orange-500">{diffDays}</span> 天</span>
              )}
            </div>
          );
        })()}
        {(() => {
          const lastBathLog = logs.filter(l => l.actions.bath).sort((a, b) => b.timestamp - a.timestamp)[0];
          if (lastBathLog) {
            const daysSinceBath = Math.floor((Date.now() - lastBathLog.timestamp) / (1000 * 60 * 60 * 24));
            return (
              <div className="text-center text-xs text-stone-400 mt-1">
                🚿 距離上次洗澡已經 <span className="font-bold text-blue-500">{daysSinceBath}</span> 天
              </div>
            );
          }
          return null;
        })()}
        {(() => {
          const latestWeightLog = logs.filter(l => l.weight).sort((a, b) => b.timestamp - a.timestamp)[0];
          if (latestWeightLog?.weight) {
            return (
              <div className="text-center text-xs text-stone-400 mt-1">
                ⚖️ 目前體重 <span className="font-bold text-[#EA7500]">{latestWeightLog.weight.toFixed(1)}</span> 公斤
              </div>
            );
          }
          return null;
        })()}
      </header>

      {/* Desktop: Two Column Layout / Mobile: Stack */}
      <div className="md:grid md:grid-cols-5 md:gap-6">
        {/* Left Column - Scoreboard & Weight */}
        <div className="md:col-span-2 space-y-6">
          {/* Weekly Scoreboard */}
          <section>
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 mb-4 md:mb-0 border border-orange-100">
              <h3 className="text-center font-bold text-stone-700 mb-1">
                {winnerInfo?.type === 'none' ? (
                  <>本週{profile?.pet.name || '小賀'}<span className="text-[#CE0000] text-xl">還沒有愛</span></>
                ) : winnerInfo?.type === 'tie' ? (
                  <>本週{profile?.pet.name || '小賀'}愛大家<span className="text-[#CE0000] text-xl">一樣多</span></>
                ) : winnerInfo?.type === 'winner' ? (
                  <>本週{profile?.pet.name || '小賀'}更愛 <span style={{ color: getOwnerByName(winnerInfo.name)?.color }} className="text-xl">{winnerInfo.name}</span></>
                ) : null}
              </h3>
              <p className="text-center text-xs text-stone-400 mb-2">本週給{profile?.pet.name || '小賀'}的愛 ({weekRange})</p>
              <div className="flex justify-center gap-4 items-center text-sm font-medium mb-2 flex-wrap">
                {profile?.owners.map((owner, index) => {
                  const score = ownerScores[owner.name] || 0;
                  const maxScore = Math.max(...Object.values(ownerScores));
                  const isWinning = score === maxScore && score > 0;
                  return (
                    <React.Fragment key={owner.id}>
                      {index > 0 && <div className="h-4 w-px bg-stone-300"></div>}
                      <div
                        className={`text-center ${isWinning ? 'scale-110 font-bold' : ''} transition-transform`}
                        style={{ color: owner.color }}
                      >
                        {owner.name}: <span className="text-lg">{score}</span> 分
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
              <p className="text-center text-xs text-stone-400 mb-1">全部累積總分</p>
              <div className="text-center text-xs text-stone-400 mb-4">
                {profile?.owners.map((owner, index) => (
                  <span key={owner.id}>
                    {index > 0 && '，'}
                    <span style={{ color: owner.color }} className="font-medium">{owner.name}</span>
                    累積<span style={{ color: owner.color }} className="font-medium">{allTimeTotals[owner.name] || 0}</span>分愛
                  </span>
                ))}
              </div>

              <p className="text-center text-xs text-stone-400 mb-1">過去7天</p>
              <div className="h-[72px] w-full mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fed7aa" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
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
                    {profile?.owners.map(owner => (
                      <Line
                        key={owner.id}
                        type="monotone"
                        dataKey={owner.name}
                        stroke={owner.color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: owner.color, strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[10px] text-stone-400 text-center mt-2 opacity-70">
                (梳毛 +3, 飼料/水/給藥/體重 +2, 貓砂:乾淨+1/髒+4)
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Today's Tasks */}
        <div className="md:col-span-3">
          {/* Today's Status Section */}
          <section>
            <div className="flex items-center gap-2 mb-2 px-1 md:px-0">
              <CalendarDays className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-stone-800">今日任務</h2>
            </div>
            <div className="text-xs text-stone-400 mb-4 px-1 md:px-0">
              早 06:00-10:59 ｜ 中 11:00-16:59 ｜ 晚 17:00-22:59 ｜ 睡 23:00-05:59
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <StatusCard type="food" progress={status.food} />
              <StatusCard type="water" progress={status.water} />
              <StatusCard type="litter" progress={status.litter} />
              <StatusCard type="grooming" progress={status.grooming} />
              <StatusCard type="medication" progress={status.medication} />
              <StatusCard type="weight" progress={status.weight} />
            </div>
          </section>
        </div>
      </div>

      {/* Monthly Logs Section */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-stone-400" />
            <h2 className="text-lg font-bold text-stone-700">月份紀錄</h2>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-orange-500 transition-all ml-2"
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
            <div className="text-center py-10 text-stone-400 bg-white rounded-xl border border-stone-200 border-dashed">
              本月尚無紀錄
            </div>
          ) : (
            <>
              {(isExpanded ? monthlyLogs : monthlyLogs.slice(0, 3)).map((dayGroup) => (
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
                        <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between relative overflow-hidden group">
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
              {!isExpanded && monthlyLogs.length > 3 && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="w-full py-3 text-stone-500 font-bold text-sm bg-white rounded-xl border border-stone-200 shadow-sm hover:bg-stone-50 hover:text-stone-600 hover:border-stone-300 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>顯示當月所有紀錄 ({monthlyLogs.length} 天)</span>
                </button>
              )}
              {isExpanded && monthlyLogs.length > 3 && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-full py-3 text-stone-500 font-bold text-sm bg-white rounded-xl border border-stone-200 shadow-sm hover:bg-stone-50 hover:text-stone-600 hover:border-stone-300 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>顯示近三天</span>
                </button>
              )}
            </>
          )}
        </div>
      </section >

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <button
          onClick={() => navigate('/add')}
          className="pointer-events-auto bg-stone-800 text-white flex items-center gap-2 px-6 py-4 rounded-full shadow-xl hover:bg-stone-700 hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-orange-50"
        >
          <Plus className="w-6 h-6" />
          <span className="font-bold text-lg">紀錄一下</span>
        </button>
      </div>
    </div >
  );
};