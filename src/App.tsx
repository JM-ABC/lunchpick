import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Plus, 
  ArrowRight, 
  Check, 
  Trophy, 
  RefreshCw, 
  Utensils,
  CheckCircle2,
  ChevronRight,
  User,
  MessageSquare,
  X
} from 'lucide-react';
import { TeamState, ServerMessage } from './types';

const PRICE_LABELS: Record<string, string> = {
  '₩': '1만원 이하',
  '₩₩': '1~2만원대',
  '₩₩₩': '2~3만원대',
  '₩₩₩₩': '3만원 이상',
};

const formatPrice = (price: string) => {
  const label = PRICE_LABELS[price];
  return label ? `${price} (${label})` : price;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'solo' | 'cafe' | 'group' | 'team'>('solo');
  const [dailyRecommend, setDailyRecommend] = useState<any>(null);
  const [dailyRecommendError, setDailyRecommendError] = useState(false);
  const [dailyRecommendEmpty, setDailyRecommendEmpty] = useState(false);
  const [restaurantCategories, setRestaurantCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [soloOnly, setSoloOnly] = useState(false);
  const [dailyCafeRecommend, setDailyCafeRecommend] = useState<any>(null);
  const [dailyCafeRecommendError, setDailyCafeRecommendError] = useState(false);
  const [dailyGroupRecommend, setDailyGroupRecommend] = useState<any>(null);
  const [dailyGroupRecommendError, setDailyGroupRecommendError] = useState(false);
  const [dailyGroupRecommendEmpty, setDailyGroupRecommendEmpty] = useState(false);
  const [groupCategories, setGroupCategories] = useState<string[]>([]);
  const [selectedGroupCategory, setSelectedGroupCategory] = useState<string>('all');
  const [teamState, setTeamState] = useState<TeamState | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [tempNickname, setTempNickname] = useState('');
  const [newRestaurant, setNewRestaurant] = useState({ name: '', category: '' });
  const [showResults, setShowResults] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const fetchDailyRecommend = (category: string = selectedCategory, solo: boolean = soloOnly) => {
    setDailyRecommendError(false);
    setDailyRecommendEmpty(false);
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (solo) params.set('solo', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    fetch(`/api/daily-recommend${query}`)
      .then(res => {
        if (res.status === 404) {
          setDailyRecommend(null);
          setDailyRecommendEmpty(true);
          return null;
        }
        return res.json();
      })
      .then(data => { if (data) setDailyRecommend(data); })
      .catch(() => setDailyRecommendError(true));
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    fetchDailyRecommend(category, soloOnly);
  };

  const handleToggleSoloOnly = () => {
    const next = !soloOnly;
    setSoloOnly(next);
    fetchDailyRecommend(selectedCategory, next);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSoloOnly(false);
    fetchDailyRecommend('all', false);
  };

  const fetchDailyCafeRecommend = () => {
    setDailyCafeRecommendError(false);
    fetch('/api/daily-cafe-recommend')
      .then(res => res.json())
      .then(data => setDailyCafeRecommend(data))
      .catch(() => setDailyCafeRecommendError(true));
  };

  const fetchDailyGroupRecommend = (category: string = selectedGroupCategory) => {
    setDailyGroupRecommendError(false);
    setDailyGroupRecommendEmpty(false);
    const query = category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    fetch(`/api/daily-group-recommend${query}`)
      .then(res => {
        if (res.status === 404) {
          setDailyGroupRecommend(null);
          setDailyGroupRecommendEmpty(true);
          return null;
        }
        return res.json();
      })
      .then(data => { if (data) setDailyGroupRecommend(data); })
      .catch(() => setDailyGroupRecommendError(true));
  };

  const handleSelectGroupCategory = (category: string) => {
    setSelectedGroupCategory(category);
    fetchDailyGroupRecommend(category);
  };

  const handleResetGroupFilters = () => {
    setSelectedGroupCategory('all');
    fetchDailyGroupRecommend('all');
  };

  useEffect(() => {
    fetchDailyRecommend();
    fetchDailyCafeRecommend();
    fetchDailyGroupRecommend();
    fetch('/api/restaurant-categories')
      .then(res => res.json())
      .then(data => setRestaurantCategories(data))
      .catch(() => {});
    fetch('/api/group-categories')
      .then(res => res.json())
      .then(data => setGroupCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'team' && !socketRef.current) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
      socketRef.current = socket;

      socket.onopen = () => {
        const savedUserId = localStorage.getItem('lunchpick_userid');
        socket.send(JSON.stringify({ type: 'IDENTIFY', userId: savedUserId }));
      };

      socket.onmessage = (event) => {
        const data: ServerMessage = JSON.parse(event.data);
        if (data.type === 'SYNC_STATE') {
          setTeamState(data.state);
          setUserId(data.userId);
          localStorage.setItem('lunchpick_userid', data.userId);
          if (data.nickname) {
            setNickname(data.nickname);
          } else if (!nickname && !showNicknamePrompt) {
            setShowNicknamePrompt(true);
          }
        } else if (data.type === 'STATE_UPDATED') {
          setTeamState(data.state);
        }
      };

      return () => {
        socket.close();
        socketRef.current = null;
      };
    }
  }, [activeTab]);

  const handleSetNickname = () => {
    if (tempNickname.trim() && socketRef.current) {
      socketRef.current.send(JSON.stringify({ type: 'SET_NICKNAME', nickname: tempNickname }));
      setNickname(tempNickname);
      setShowNicknamePrompt(false);
    }
  };

  const handleVote = (restaurantId: string) => {
    if (socketRef.current && teamState?.status === 'voting') {
      socketRef.current.send(JSON.stringify({ type: 'SUBMIT_VOTE', restaurantId }));
    }
  };

  const handleAddRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRestaurant.name && socketRef.current) {
      socketRef.current.send(JSON.stringify({ 
        type: 'ADD_CANDIDATE', 
        name: newRestaurant.name, 
        category: newRestaurant.category || '기타' 
      }));
      setNewRestaurant({ name: '', category: '' });
    }
  };

  const handleFinishVoting = () => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ type: 'FINISH_VOTING' }));
    }
  };

  const handleReset = () => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ type: 'RESET_VOTE' }));
      setShowResults(false);
    }
  };

  const getWinner = () => {
    if (!teamState || !teamState.winnerId) return null;
    return teamState.candidates.find(c => c.id === teamState.winnerId);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#141414] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-4 sm:h-20 sm:py-0 flex flex-col sm:flex-row items-center gap-4 sm:gap-0 sm:justify-between">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Utensils className="text-white w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="font-logo text-2xl font-bold tracking-tight">LUNCHPICK</h1>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full">
                잠실
              </span>
            </div>
          </div>

          <nav className="flex w-full sm:w-auto bg-black/5 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('solo')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'solo' ? 'bg-white shadow-sm text-emerald-600' : 'text-[#9e9e9e] hover:text-[#141414]'}`}
            >
              밥집추천
            </button>
            <button
              onClick={() => setActiveTab('cafe')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'cafe' ? 'bg-white shadow-sm text-emerald-600' : 'text-[#9e9e9e] hover:text-[#141414]'}`}
            >
              카페추천
            </button>
            <button
              onClick={() => setActiveTab('group')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'group' ? 'bg-white shadow-sm text-emerald-600' : 'text-[#9e9e9e] hover:text-[#141414]'}`}
            >
              회식추천
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'team' ? 'bg-white shadow-sm text-emerald-600' : 'text-[#9e9e9e] hover:text-[#141414]'}`}
            >
              팀투표
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'solo' ? (
            <motion.div 
              key="solo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Daily Recommendation */}
              <section className="relative overflow-hidden bg-white border border-black/5 rounded-[40px] p-8 sm:p-16 shadow-sm">
                <div className="relative z-10 max-w-2xl space-y-8">
                  <div className="space-y-4">
                    <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-widest">
                      Today's Pick
                    </span>
                    <h2 className="text-3xl sm:text-7xl font-black tracking-tight leading-[1.05]">
                      오늘의 추천 식당
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {restaurantCategories.length > 0 && (
                      <>
                        <button
                          onClick={() => handleSelectCategory('all')}
                          className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedCategory === 'all' ? 'bg-emerald-500 text-white' : 'bg-black/5 text-[#757575] hover:bg-black/10'}`}
                        >
                          전체
                        </button>
                        {restaurantCategories.map(category => (
                          <button
                            key={category}
                            onClick={() => handleSelectCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedCategory === category ? 'bg-emerald-500 text-white' : 'bg-black/5 text-[#757575] hover:bg-black/10'}`}
                          >
                            {category}
                          </button>
                        ))}
                      </>
                    )}
                    <button
                      onClick={handleToggleSoloOnly}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors ${soloOnly ? 'bg-emerald-500 text-white' : 'bg-black/5 text-[#757575] hover:bg-black/10'}`}
                    >
                      <User className="w-4 h-4" />
                      혼밥 가능(추정)
                    </button>
                  </div>

                  {dailyRecommendEmpty ? (
                    <div className="space-y-6">
                      <div className="p-6 sm:p-10 bg-[#f9f9f9] rounded-3xl border border-black/5">
                        <p className="text-[#757575] font-medium">선택한 조건(카테고리 + 혼밥 가능)에 맞는 곳이 없어요.</p>
                      </div>
                      <button
                        onClick={handleResetFilters}
                        className="group -my-3 flex items-center gap-3 py-3 text-sm font-bold text-[#9e9e9e] hover:text-emerald-600 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        필터 초기화
                      </button>
                    </div>
                  ) : dailyRecommendError ? (
                    <div className="space-y-6">
                      <div className="p-6 sm:p-10 bg-red-50 rounded-3xl border border-red-100">
                        <p className="text-red-600 font-medium">추천을 불러오지 못했어요. 다시 시도해주세요.</p>
                      </div>
                      <button
                        onClick={() => fetchDailyRecommend()}
                        className="group -my-3 flex items-center gap-3 py-3 text-sm font-bold text-[#9e9e9e] hover:text-emerald-600 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        다시 시도하기
                      </button>
                    </div>
                  ) : dailyRecommend ? (
                    <div className="space-y-6">
                      <div className="p-6 sm:p-10 bg-[#f9f9f9] rounded-3xl border border-black/5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="text-xl sm:text-4xl font-bold break-keep">{dailyRecommend.name}</h3>
                            <p className="text-[#9e9e9e] font-medium">{dailyRecommend.category} • {dailyRecommend.distance} • {formatPrice(dailyRecommend.price)}</p>
                            {dailyRecommend.isSoloFriendly && (
                              <span className="inline-block mt-2 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">
                                🙋 혼밥 가능 추정
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 self-start sm:self-auto bg-white px-4 py-2 rounded-2xl border border-black/5 shadow-sm">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span className="font-bold">{dailyRecommend.rating}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => fetchDailyRecommend()}
                        className="group -my-3 flex items-center gap-3 py-3 text-sm font-bold text-[#9e9e9e] hover:text-emerald-600 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        다른 메뉴 추천받기
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 sm:p-10 bg-[#f9f9f9] rounded-3xl border border-black/5 animate-pulse">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <div className="min-w-0 space-y-3 w-full">
                          <div className="h-8 sm:h-10 w-2/3 bg-black/5 rounded-lg" />
                          <div className="h-4 w-1/3 bg-black/5 rounded-lg" />
                        </div>
                        <div className="h-10 w-20 bg-black/5 rounded-2xl shrink-0" />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : activeTab === 'cafe' ? (
            <motion.div
              key="cafe"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Daily Cafe Recommendation */}
              <section className="relative overflow-hidden bg-white border border-black/5 rounded-[40px] p-8 sm:p-16 shadow-sm">
                <div className="relative z-10 max-w-2xl space-y-8">
                  <div className="space-y-4">
                    <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-widest">
                      Today's Pick
                    </span>
                    <h2 className="text-3xl sm:text-7xl font-black tracking-tight leading-[1.05]">
                      오늘의 추천 카페
                    </h2>
                  </div>

                  {dailyCafeRecommendError ? (
                    <div className="space-y-6">
                      <div className="p-6 sm:p-10 bg-red-50 rounded-3xl border border-red-100">
                        <p className="text-red-600 font-medium">추천을 불러오지 못했어요. 다시 시도해주세요.</p>
                      </div>
                      <button
                        onClick={fetchDailyCafeRecommend}
                        className="group -my-3 flex items-center gap-3 py-3 text-sm font-bold text-[#9e9e9e] hover:text-emerald-600 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        다시 시도하기
                      </button>
                    </div>
                  ) : dailyCafeRecommend ? (
                    <div className="space-y-6">
                      <div className="p-6 sm:p-10 bg-[#f9f9f9] rounded-3xl border border-black/5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="text-xl sm:text-4xl font-bold break-keep">{dailyCafeRecommend.name}</h3>
                            <p className="text-[#9e9e9e] font-medium">{dailyCafeRecommend.category} • {dailyCafeRecommend.distance} • {formatPrice(dailyCafeRecommend.price)}</p>
                          </div>
                          <div className="flex items-center gap-1 self-start sm:self-auto bg-white px-4 py-2 rounded-2xl border border-black/5 shadow-sm">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span className="font-bold">{dailyCafeRecommend.rating}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={fetchDailyCafeRecommend}
                        className="group -my-3 flex items-center gap-3 py-3 text-sm font-bold text-[#9e9e9e] hover:text-emerald-600 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        다른 카페 추천받기
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 sm:p-10 bg-[#f9f9f9] rounded-3xl border border-black/5 animate-pulse">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <div className="min-w-0 space-y-3 w-full">
                          <div className="h-8 sm:h-10 w-2/3 bg-black/5 rounded-lg" />
                          <div className="h-4 w-1/3 bg-black/5 rounded-lg" />
                        </div>
                        <div className="h-10 w-20 bg-black/5 rounded-2xl shrink-0" />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : activeTab === 'group' ? (
            <motion.div
              key="group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Daily Group Recommendation */}
              <section className="relative overflow-hidden bg-white border border-black/5 rounded-[40px] p-8 sm:p-16 shadow-sm">
                <div className="relative z-10 max-w-2xl space-y-8">
                  <div className="space-y-4">
                    <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-widest">
                      Today's Pick
                    </span>
                    <h2 className="text-3xl sm:text-7xl font-black tracking-tight leading-[1.05]">
                      오늘의 추천 회식장소
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {groupCategories.length > 0 && (
                      <>
                        <button
                          onClick={() => handleSelectGroupCategory('all')}
                          className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedGroupCategory === 'all' ? 'bg-emerald-500 text-white' : 'bg-black/5 text-[#757575] hover:bg-black/10'}`}
                        >
                          전체
                        </button>
                        {groupCategories.map(category => (
                          <button
                            key={category}
                            onClick={() => handleSelectGroupCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedGroupCategory === category ? 'bg-emerald-500 text-white' : 'bg-black/5 text-[#757575] hover:bg-black/10'}`}
                          >
                            {category}
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  {dailyGroupRecommendEmpty ? (
                    <div className="space-y-6">
                      <div className="p-6 sm:p-10 bg-[#f9f9f9] rounded-3xl border border-black/5">
                        <p className="text-[#757575] font-medium">선택한 카테고리에 맞는 곳이 없어요.</p>
                      </div>
                      <button
                        onClick={handleResetGroupFilters}
                        className="group -my-3 flex items-center gap-3 py-3 text-sm font-bold text-[#9e9e9e] hover:text-emerald-600 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        필터 초기화
                      </button>
                    </div>
                  ) : dailyGroupRecommendError ? (
                    <div className="space-y-6">
                      <div className="p-6 sm:p-10 bg-red-50 rounded-3xl border border-red-100">
                        <p className="text-red-600 font-medium">추천을 불러오지 못했어요. 다시 시도해주세요.</p>
                      </div>
                      <button
                        onClick={() => fetchDailyGroupRecommend()}
                        className="group -my-3 flex items-center gap-3 py-3 text-sm font-bold text-[#9e9e9e] hover:text-emerald-600 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        다시 시도하기
                      </button>
                    </div>
                  ) : dailyGroupRecommend ? (
                    <div className="space-y-6">
                      <div className="p-6 sm:p-10 bg-[#f9f9f9] rounded-3xl border border-black/5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="text-xl sm:text-4xl font-bold break-keep">{dailyGroupRecommend.name}</h3>
                            <p className="text-[#9e9e9e] font-medium">{dailyGroupRecommend.category} • {dailyGroupRecommend.distance} • {formatPrice(dailyGroupRecommend.price)}</p>
                          </div>
                          <div className="flex items-center gap-1 self-start sm:self-auto bg-white px-4 py-2 rounded-2xl border border-black/5 shadow-sm">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span className="font-bold">{dailyGroupRecommend.rating}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => fetchDailyGroupRecommend()}
                        className="group -my-3 flex items-center gap-3 py-3 text-sm font-bold text-[#9e9e9e] hover:text-emerald-600 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        다른 회식장소 추천받기
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 sm:p-10 bg-[#f9f9f9] rounded-3xl border border-black/5 animate-pulse">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <div className="min-w-0 space-y-3 w-full">
                          <div className="h-8 sm:h-10 w-2/3 bg-black/5 rounded-lg" />
                          <div className="h-4 w-1/3 bg-black/5 rounded-lg" />
                        </div>
                        <div className="h-10 w-20 bg-black/5 rounded-2xl shrink-0" />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {teamState && (
                <div className="grid lg:grid-cols-[350px_1fr] gap-8 items-start">
                  {/* Sidebar: PC View */}
                  <aside className="order-2 lg:order-none lg:sticky lg:top-32 space-y-6">
                    <div className="bg-white border border-black/5 rounded-[32px] p-8 shadow-sm space-y-8">
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">투표 관리</h3>
                        <p className="text-sm text-[#9e9e9e]">팀원들과 함께 메뉴를 결정하세요.</p>
                      </div>

                      {teamState.status === 'voting' && (
                        <div className="pt-4">
                          <button 
                            onClick={handleFinishVoting}
                            className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
                          >
                            <CheckCircle2 className="w-6 h-6" />
                            투표 종료 및 결정
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-emerald-50 rounded-[32px] p-8 flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Users className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Active Users</p>
                        <p className="text-xl font-black">{teamState.userCount}명 접속 중</p>
                      </div>
                    </div>
                  </aside>

                  {/* Main Content */}
                  <div className="order-1 lg:order-none space-y-8">
                    {/* Add Restaurant: Horizontal Bar for PC */}
                    {teamState.status === 'voting' && (
                      <div className="bg-white border border-black/5 rounded-[32px] p-6 shadow-sm">
                        <form onSubmit={handleAddRestaurant} className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1">
                            <input 
                              type="text" 
                              placeholder="추가하고 싶은 식당 이름"
                              value={newRestaurant.name}
                              onChange={e => setNewRestaurant({...newRestaurant, name: e.target.value})}
                              className="w-full bg-[#f9f9f9] border border-black/5 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:border-emerald-500/30 transition-colors"
                            />
                          </div>
                          <div className="sm:w-48">
                            <input 
                              type="text" 
                              placeholder="카테고리"
                              value={newRestaurant.category}
                              onChange={e => setNewRestaurant({...newRestaurant, category: e.target.value})}
                              className="w-full bg-[#f9f9f9] border border-black/5 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:border-emerald-500/30 transition-colors"
                            />
                          </div>
                          <button 
                            type="submit"
                            className="bg-black text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            추가
                          </button>
                        </form>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Team Decision</span>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                          {teamState.status === 'done' ? '투표 결과' : '오늘의 점심 메뉴 투표'}
                        </h2>
                      </div>
                      {nickname && (
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-black/5 shadow-sm">
                          <User className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-bold">{nickname}님</span>
                        </div>
                      )}
                    </div>

                    {teamState.status === 'done' ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border-4 border-emerald-500 rounded-[40px] p-12 sm:p-20 text-center space-y-12 shadow-2xl shadow-emerald-100 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                        <div className="space-y-6 relative z-10">
                          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Trophy className="w-12 h-12 text-emerald-500" />
                          </div>
                          <h3 className="text-2xl font-bold text-[#9e9e9e]">오늘의 점심은 바로!</h3>
                          <div className="space-y-2">
                            <span className="text-emerald-600 font-bold text-sm uppercase tracking-widest">{getWinner()?.category}</span>
                            <h4 className="text-6xl sm:text-8xl font-black tracking-tighter break-keep">{getWinner()?.name}</h4>
                          </div>
                        </div>
                        
                        <div className="pt-12 border-t border-black/5 flex flex-col sm:flex-row items-center justify-center gap-6">
                          <button 
                            onClick={handleReset}
                            className="flex items-center gap-3 text-lg font-bold text-emerald-600 hover:opacity-70 transition-opacity"
                          >
                            <RefreshCw className="w-5 h-5" />
                            다시 투표하기
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-6">
                        {teamState.candidates.map((restaurant) => {
                          const isVoted = teamState.votes[userId] === restaurant.id;
                          const voteCount = Object.values(teamState.votes).filter(id => id === restaurant.id).length;
                          
                          return (
                            <motion.button
                              key={restaurant.id}
                              whileHover={{ y: -5 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleVote(restaurant.id)}
                              className={`group relative flex flex-col items-start p-8 rounded-[32px] border transition-all text-left ${
                                isVoted 
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-200' 
                                : 'bg-white border-black/5 hover:border-emerald-500/30 shadow-sm'
                              }`}
                            >
                              <div className="w-full flex justify-between items-start mb-12">
                                <span className={`text-xs font-bold uppercase tracking-widest ${isVoted ? 'text-emerald-100' : 'text-[#9e9e9e]'}`}>
                                  {restaurant.category}
                                </span>
                                {voteCount > 0 && (
                                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${isVoted ? 'bg-white text-emerald-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {voteCount}표
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-2 mt-auto">
                                <h4 className="text-2xl font-black tracking-tight leading-tight">{restaurant.name}</h4>
                                <p className={`text-sm font-medium ${isVoted ? 'text-emerald-100' : 'text-[#9e9e9e]'}`}>
                                  {restaurant.distance} • ⭐ {restaurant.rating} • {formatPrice(restaurant.price)}
                                </p>
                              </div>

                              <div className={`mt-8 flex items-center gap-2 text-sm font-bold ${isVoted ? 'text-white' : 'text-emerald-600'}`}>
                                {isVoted ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    선택됨
                                  </>
                                ) : (
                                  <>
                                    클릭하여 투표
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                  </>
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {/* Vote Summary Section */}
                    {teamState.status === 'done' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-black/5 rounded-[40px] p-8 sm:p-12 space-y-8 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <h3 className="text-2xl font-bold">투표 취합 결과</h3>
                        </div>

                        <div className="grid gap-4">
                          {teamState.candidates
                            .map(restaurant => ({
                              ...restaurant,
                              voters: Object.entries(teamState.votes)
                                .filter(([_, rid]) => rid === restaurant.id)
                                .map(([uid, _]) => teamState.userNames[uid] || '익명')
                            }))
                            .filter(r => r.voters.length > 0)
                            .sort((a, b) => b.voters.length - a.voters.length)
                            .map(restaurant => (
                              <div key={restaurant.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-[#f9f9f9] rounded-2xl gap-4">
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-[#9e9e9e] uppercase">{restaurant.category}</span>
                                  <h4 className="font-bold text-lg">{restaurant.name}</h4>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mr-2">
                                    {restaurant.voters.length}표
                                  </span>
                                  {restaurant.voters.map((name, i) => (
                                    <span key={i} className="px-3 py-1 bg-white border border-black/5 rounded-full text-xs font-medium text-[#757575]">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Nickname Prompt Overlay */}
      <AnimatePresence>
        {showNicknamePrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative bg-white rounded-[40px] p-6 sm:p-16 w-full max-w-xl shadow-2xl space-y-6 sm:space-y-10"
            >
              <button
                onClick={() => { setShowNicknamePrompt(false); setActiveTab('solo'); }}
                aria-label="닫고 밥집추천으로 돌아가기"
                className="absolute top-4 right-4 sm:top-8 sm:right-8 w-10 h-10 flex items-center justify-center rounded-full text-[#9e9e9e] hover:bg-black/5 hover:text-[#141414] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="space-y-3 sm:space-y-4 text-center">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6">
                  <User className="w-7 h-7 sm:w-10 sm:h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">반가워요!</h2>
                <p className="text-sm sm:text-lg text-[#757575] font-medium">팀원들이 알아볼 수 있게 닉네임을 정해주세요.</p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <input
                  type="text"
                  placeholder="닉네임 입력 (예: 홍길동)"
                  value={tempNickname}
                  onChange={e => setTempNickname(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSetNickname()}
                  className="w-full bg-[#f9f9f9] border-2 border-black/5 rounded-3xl px-5 py-4 sm:px-6 sm:py-6 text-base sm:text-xl font-bold focus:outline-none focus:border-emerald-500/30 transition-all text-center"
                  autoFocus
                />
                <button
                  onClick={handleSetNickname}
                  disabled={!tempNickname.trim()}
                  className="w-full bg-black text-white py-4 sm:py-6 rounded-3xl font-bold text-base sm:text-xl hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  시작하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-black/5 space-y-6">
        <p className="text-xs text-[#9e9e9e]">
          ⭐ 별점은 제작자의 극히 주관적인 평가입니다. 정확한 평가는 네이버지도·카카오맵 등에서 확인해주세요.
        </p>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-sm font-bold text-[#9e9e9e]">© 2026 LUNCHPICK. All rights reserved.</p>
          <div className="flex gap-8 -my-3">
            <a href="mailto:jmyoonkr@gmail.com" className="py-3 text-sm font-bold text-[#9e9e9e] hover:text-[#141414]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
