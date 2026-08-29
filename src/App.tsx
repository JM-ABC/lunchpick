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
  MessageSquare
} from 'lucide-react';
import { TeamState, ServerMessage } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'solo' | 'team'>('solo');
  const [dailyRecommend, setDailyRecommend] = useState<any>(null);
  const [teamState, setTeamState] = useState<TeamState | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [tempNickname, setTempNickname] = useState('');
  const [newRestaurant, setNewRestaurant] = useState({ name: '', category: '' });
  const [showResults, setShowResults] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetch('/api/daily-recommend')
      .then(res => res.json())
      .then(data => setDailyRecommend(data));
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
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Utensils className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter italic">LUNCHPICK</h1>
          </div>
          
          <nav className="flex bg-black/5 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('solo')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'solo' ? 'bg-white shadow-sm text-emerald-600' : 'text-[#9e9e9e] hover:text-[#141414]'}`}
            >
              혼밥 추천
            </button>
            <button 
              onClick={() => setActiveTab('team')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'team' ? 'bg-white shadow-sm text-emerald-600' : 'text-[#9e9e9e] hover:text-[#141414]'}`}
            >
              팀 투표
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
                <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-widest">
                        Today's Pick
                      </span>
                      <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]">
                        오늘의<br />추천 메뉴
                      </h2>
                    </div>
                    
                    {dailyRecommend && (
                      <div className="space-y-6">
                        <div className="p-8 bg-[#f9f9f9] rounded-3xl border border-black/5">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-3xl font-bold">{dailyRecommend.name}</h3>
                              <p className="text-[#9e9e9e] font-medium">{dailyRecommend.category} • {dailyRecommend.distance}</p>
                            </div>
                            <div className="flex items-center gap-1 bg-white px-4 py-2 rounded-2xl border border-black/5 shadow-sm">
                              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                              <span className="font-bold">{dailyRecommend.rating}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => fetch('/api/daily-recommend').then(res => res.json()).then(data => setDailyRecommend(data))}
                          className="group -my-3 flex items-center gap-3 py-3 text-sm font-bold text-[#9e9e9e] hover:text-emerald-600 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                          다른 메뉴 추천받기
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative aspect-square rounded-[32px] overflow-hidden bg-emerald-50">
                    <img 
                      src={`https://picsum.photos/seed/${(dailyRecommend?.category || 'food').replace(/\//g, '-')}/800/800`}
                      alt="Food"
                      className="w-full h-full object-cover mix-blend-multiply opacity-80"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent" />
                  </div>
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
                  <aside className="lg:sticky lg:top-32 space-y-6">
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
                  <div className="space-y-8">
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
                            <h4 className="text-6xl sm:text-8xl font-black tracking-tighter">{getWinner()?.name}</h4>
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
                                  {restaurant.distance} • ⭐ {restaurant.rating}
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
              className="bg-white rounded-[40px] p-10 sm:p-16 w-full max-w-xl shadow-2xl space-y-10"
            >
              <div className="space-y-4 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-4xl font-black tracking-tight">반가워요!</h2>
                <p className="text-lg text-[#757575] font-medium">팀원들이 알아볼 수 있게 닉네임을 정해주세요.</p>
              </div>

              <div className="space-y-6">
                <input 
                  type="text" 
                  placeholder="닉네임 입력 (예: 홍길동)"
                  value={tempNickname}
                  onChange={e => setTempNickname(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSetNickname()}
                  className="w-full bg-[#f9f9f9] border-2 border-black/5 rounded-3xl px-8 py-6 text-xl font-bold focus:outline-none focus:border-emerald-500/30 transition-all text-center"
                  autoFocus
                />
                <button 
                  onClick={handleSetNickname}
                  disabled={!tempNickname.trim()}
                  className="w-full bg-black text-white py-6 rounded-3xl font-bold text-xl hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  시작하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-black/5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-sm font-bold text-[#9e9e9e]">© 2026 LUNCHPICK. All rights reserved.</p>
          <div className="flex gap-8 -my-3">
            <a href="#" className="py-3 text-sm font-bold text-[#9e9e9e] hover:text-[#141414]">Privacy</a>
            <a href="#" className="py-3 text-sm font-bold text-[#9e9e9e] hover:text-[#141414]">Terms</a>
            <a href="#" className="py-3 text-sm font-bold text-[#9e9e9e] hover:text-[#141414]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
