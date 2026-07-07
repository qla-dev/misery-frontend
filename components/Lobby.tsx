import React, { useEffect } from 'react';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Apple, Check, Copy, Crown, Flame, Loader2, LogIn, Plus, ArrowLeft, Sparkles, User } from 'lucide-react-native';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { AppButton, SegmentTabs, Surface } from './AppPrimitives';
import { InfoModal } from './InfoModal';
import ManSilhouette from './ManSilhouette';

const AVAILABLE_COLORS = [
  { id: 'yellow', nameEn: 'Amber Gold', nameBs: 'Zlatni Ćilibar', bgClass: 'bg-yellow-400', borderClass: 'border-yellow-400 bg-yellow-400/5 text-yellow-400' },
  { id: 'blue', nameEn: 'Electric Blue', nameBs: 'Električna Plava', bgClass: 'bg-blue-400', borderClass: 'border-blue-400 bg-blue-400/5 text-blue-400' },
  { id: 'emerald', nameEn: 'Neon Emerald', nameBs: 'Neon Zelena', bgClass: 'bg-emerald-400', borderClass: 'border-emerald-400 bg-emerald-400/5 text-emerald-400' },
  { id: 'purple', nameEn: 'Vibrant Purple', nameBs: 'Ljubičasta', bgClass: 'bg-purple-400', borderClass: 'border-purple-400 bg-purple-400/5 text-purple-400' },
  { id: 'rose', nameEn: 'Radical Rose', nameBs: 'Koralno Crvena', bgClass: 'bg-rose-400', borderClass: 'border-rose-400 bg-rose-400/5 text-rose-400' },
  { id: 'cyan', nameEn: 'Cyber Cyan', nameBs: 'Sajber Plava', bgClass: 'bg-cyan-400', borderClass: 'border-cyan-400 bg-cyan-400/5 text-cyan-400' },
];

const BOT_NAMES = ['Sanjin', 'Lejla', 'Aida', 'Kenan', 'Selma', 'Tarik', 'Emina', 'Amar'];

function GoogleIcon() {
  return (
    <View style={{ width: 16, height: 16 }}>
      <Text style={{ fontSize: 16, lineHeight: 16 }}>G</Text>
    </View>
  );
}

function SmallBrand({ isBs }: { isBs: boolean }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <LinearGradient colors={['#fbbf24', '#facc15']} className="w-6 h-6 rounded items-center justify-center">
        <Text className="text-[10px] text-black font-black">⛈</Text>
      </LinearGradient>
      <Text className="text-xs font-black uppercase tracking-wider text-neutral-200">
        THE <Text className="text-amber-400">MISERY</Text> INDEX
      </Text>
    </View>
  );
}

export default function Lobby() {
  const insets = useSafeAreaInsets();
  const {
    language,
    lobbyView,
    setLobbyView,
    setupTab,
    setSetupTab,
    userName,
    setUserName,
    selectedColor,
    setSelectedColor,
    targetScore,
    setTargetScore,
    selectedDeck,
    setSelectedDeck,
    isSocialUser,
    setIsSocialUser,
    socialProvider,
    setSocialProvider,
    roomCode,
    setRoomCode,
    enteredCode,
    setEnteredCode,
    roomPlayers,
    setRoomPlayers,
    isCopied,
    setIsCopied,
    countdown,
    setCountdown,
    joinStatusText,
    setJoinStatusText,
    setSession,
  } = useGame();

  const isBs = language === 'bs';

  const handleCreateRoom = () => {
    const finalName = userName.trim() || (isBs ? 'Igrač 1' : 'Player 1');
    const userColor = AVAILABLE_COLORS.find((c) => c.id === selectedColor)?.borderClass || AVAILABLE_COLORS[0].borderClass;
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomCode(code);
    setRoomPlayers([{ name: finalName, color: userColor, isBot: false }]);
    setLobbyView('ROOM_CREATED');
  };

  const handleJoinWithCode = () => {
    if (!enteredCode.trim()) return;
    const cleanCode = enteredCode.trim().toUpperCase();
    setRoomCode(cleanCode);
    setLobbyView('ROOM_JOINING');
    setJoinStatusText(isBs ? 'Traženje sobe...' : 'Searching for room...');

    setTimeout(() => {
      setJoinStatusText(isBs ? 'Soba pronađena! Sinkronizacija...' : 'Room found! Synchronizing...');
      setTimeout(() => {
        const finalName = userName.trim() || (isBs ? 'Igrač 2' : 'Player 2');
        const userColor = AVAILABLE_COLORS.find((c) => c.id === selectedColor)?.borderClass || AVAILABLE_COLORS[1].borderClass;
        const hostBotColor = AVAILABLE_COLORS[3].borderClass;
        const otherBotColor = AVAILABLE_COLORS[2].borderClass;
        setRoomPlayers([
          { name: 'Selma 👑', color: hostBotColor, isBot: true },
          { name: 'Kenan', color: otherBotColor, isBot: true },
          { name: finalName, color: userColor, isBot: false },
        ]);
        setLobbyView('ROOM_JOINED');
        setCountdown(3);
      }, 1200);
    }, 1000);
  };

  useEffect(() => {
    if (lobbyView !== 'ROOM_CREATED') return;
    if (roomPlayers.length >= 4) return;
    const timer = setTimeout(() => {
      const usedNames = roomPlayers.map((p) => p.name);
      const availableNames = BOT_NAMES.filter((name) => !usedNames.includes(name) && name !== userName.trim());
      const botName = availableNames[Math.floor(Math.random() * availableNames.length)] || 'Simulirani Igrač';
      const usedColors = roomPlayers.map((p) => p.color);
      const availableColorConfigs = AVAILABLE_COLORS.filter((c) => !usedColors.includes(c.borderClass));
      const botColorConfig = availableColorConfigs[Math.floor(Math.random() * availableColorConfigs.length)] || AVAILABLE_COLORS[2];
      setRoomPlayers((prev) => [...prev, { name: botName, color: botColorConfig.borderClass, isBot: true }]);
    }, 1200 + Math.random() * 800);
    return () => clearTimeout(timer);
  }, [lobbyView, roomPlayers, userName, setRoomPlayers]);

  useEffect(() => {
    if (lobbyView !== 'ROOM_JOINED' || countdown === null) return;
    if (countdown === 0) {
      startGame('MULTIPLAYER', roomPlayers, targetScore, selectedDeck);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [lobbyView, countdown, roomPlayers, targetScore, selectedDeck, setCountdown]);

  const startGame = (
    mode: 'SOLO' | 'MULTIPLAYER',
    players: { name: string; color: string; isBot?: boolean }[],
    tScore: number,
    deck: 'NORMAL' | 'SPICY'
  ) => {
    setSession({ mode, players, targetScore: tScore, deckType: deck });
    router.push('/game');
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(roomCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const activeColorConfig = AVAILABLE_COLORS.find((c) => c.id === selectedColor) || AVAILABLE_COLORS[0];

  const renderTopBar = () => {
    if (lobbyView === 'WELCOME') {
      return (
        <View className="pt-12 pb-8 px-6 items-center bg-neutral-950 border-b border-neutral-900/80">
          <LinearGradient colors={['#fcd34d', '#facc15', '#fbbf24']} className="w-20 h-20 rounded-2xl items-center justify-center shadow-lg border-2 border-white/20 mb-5 -rotate-3">
            <ManSilhouette width={52} height={52} color="#0a0a0a" />
          </LinearGradient>
          <Text className="text-3xl font-black uppercase tracking-tight leading-none text-center">
            THE <Text className="text-amber-400">MISERY</Text> INDEX
          </Text>
          <Text className="text-[10px] text-neutral-500 uppercase tracking-widest mt-2.5 font-mono font-medium">
            {isBs ? 'ONLINE SIMULACIJA • ZERO TO MISERABLE' : 'ONLINE SIMULATION • ZERO TO MISERABLE'}
          </Text>
        </View>
      );
    }
    if (lobbyView === 'SETUP') {
      return (
        <View className="bg-neutral-900 border-b border-neutral-900">
          <View className="py-2.5 px-5 flex-row items-center justify-between border-b border-neutral-950 bg-neutral-950/40">
            <View className="flex-row items-center gap-1.5">
              <Pressable
                onPress={() => setLobbyView('WELCOME')}
                className="p-1.5 rounded bg-neutral-800"
              >
                <ArrowLeft size={16} color="#fbbf24" />
              </Pressable>
              <SmallBrand isBs={isBs} />
            </View>
          </View>
          <View className="flex-row bg-neutral-950/20">
            <Pressable
              onPress={() => setSetupTab('CREATE')}
              className={`flex-1 py-3.5 items-center justify-center flex-row gap-2 border-b-2 ${setupTab === 'CREATE' ? 'border-amber-400 bg-amber-400/5' : 'border-transparent'}`}
            >
              <Plus size={14} color={setupTab === 'CREATE' ? '#fcd34d' : '#737373'} />
              <Text className={`text-xs font-black uppercase tracking-wider ${setupTab === 'CREATE' ? 'text-amber-300' : 'text-neutral-500'}`}>
                {isBs ? 'Kreiraj Sobu' : 'Create Room'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSetupTab('JOIN')}
              className={`flex-1 py-3.5 items-center justify-center flex-row gap-2 border-b-2 ${setupTab === 'JOIN' ? 'border-amber-400 bg-amber-400/5' : 'border-transparent'}`}
            >
              <LogIn size={14} color={setupTab === 'JOIN' ? '#fcd34d' : '#737373'} />
              <Text className={`text-xs font-black uppercase tracking-wider ${setupTab === 'JOIN' ? 'text-amber-300' : 'text-neutral-500'}`}>
                {isBs ? 'Pridruži se' : 'Enter Code'}
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }
    return (
      <View className="py-3.5 px-5 flex-row items-center justify-between bg-neutral-900/40 border-b border-neutral-900">
        <SmallBrand isBs={isBs} />
      </View>
    );
  };

  const renderContent = () => {
    if (lobbyView === 'WELCOME') {
      return (
        <View className="space-y-6">
          <View className="bg-neutral-900/35 border border-neutral-900/60 p-6 rounded-2xl space-y-4 shadow-lg">
            <Text className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase text-center font-bold">
              {isBs ? 'INDEKS BIJEDE • MISERABLE MATCH' : 'MISERY INDEX • MISERABLE MATCH'}
            </Text>
            <View className="flex-row items-center justify-around py-3 bg-neutral-950/40 rounded-xl relative overflow-hidden border border-neutral-900/40 px-2">
              {['Gost 1', 'Gost 2', null, 'Gost 3', 'Gost 4'].map((label, idx) => (
                <View key={idx} className="items-center gap-1.5">
                  <View className={`w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700/60 items-center justify-center ${idx === 2 ? 'w-11 h-11 border-2 border-rose-400 bg-rose-500 -mt-1 scale-110' : ''}`}>
                    <Text className={`text-[11px] font-bold ${idx === 2 ? 'text-white text-xs' : 'text-neutral-400'}`}>
                      {idx === 2 ? '☠' : '☺'}
                    </Text>
                  </View>
                  <Text className="text-[7px] font-mono text-neutral-600">{label}</Text>
                </View>
              ))}
              <View className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Text className="text-cyan-400 text-[8px]">⛈</Text>
              </View>
            </View>
            <Text className="text-xs text-neutral-400 text-center leading-relaxed font-sans">
              {isBs
                ? 'Svako od nas ima loše dane... Ali ko prolazi kroz najgoru životnu patnju? Pridruži se i saznaj!'
                : 'We all have bad days... But who experiences the absolute worst life misery? Sign in to prove your resilience!'}
            </Text>
          </View>

          <View className="space-y-4">
            <Text className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase text-center font-bold">
              {isBs ? 'PRIJAVI SE BRZO' : 'QUICK SIGN IN'}
            </Text>
            <View className="space-y-3">
              <Pressable
                onPress={() => {
                  setUserName('Amel Kulašin');
                  setIsSocialUser(true);
                  setSocialProvider('google');
                  setLobbyView('SETUP');
                }}
                className="w-full py-3.5 px-4 bg-white rounded-xl flex-row items-center justify-center gap-3 shadow-md"
              >
                <GoogleIcon />
                <Text className="text-black font-black text-xs tracking-wider uppercase">
                  {isBs ? 'Prijavi se sa Google-om' : 'Sign in with Google'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setUserName('Amel Kulašin');
                  setIsSocialUser(true);
                  setSocialProvider('apple');
                  setLobbyView('SETUP');
                }}
                className="w-full py-3.5 px-4 bg-black rounded-xl flex-row items-center justify-center gap-3 shadow-md border border-neutral-800"
              >
                <Apple size={16} color="#fff" />
                <Text className="text-white font-black text-xs tracking-wider uppercase">
                  {isBs ? 'Prijavi se sa Apple-om' : 'Sign in with Apple'}
                </Text>
              </Pressable>
            </View>
            <View className="flex-row items-center justify-center gap-4 py-1">
              <View className="h-px bg-neutral-900 flex-1" />
              <Text className="text-[10px] font-mono text-neutral-600 font-black uppercase">{isBs ? 'ILI' : 'OR'}</Text>
              <View className="h-px bg-neutral-900 flex-1" />
            </View>
            <Pressable
              onPress={() => {
                setIsSocialUser(false);
                setSocialProvider(null);
                setUserName('');
                setLobbyView('SETUP');
              }}
              className="w-full py-3.5 bg-neutral-900/30 border border-neutral-800 rounded-xl flex-row items-center justify-center gap-2"
            >
              <User size={16} color="#a3a3a3" />
              <Text className="text-neutral-300 font-extrabold text-xs tracking-wider uppercase">
                {isBs ? 'Igraj kao gost' : 'Play as Guest'}
              </Text>
            </Pressable>
          </View>

          <View className="pt-4 pb-2 items-center">
            <Text className="text-[10px] text-neutral-600 font-mono">© 2026 The Misery Index Clone</Text>
            <Text className="text-[10px] text-neutral-600 font-mono opacity-80">
              {isBs ? 'Simulirani mrežni kod • Potpuno klijentska simulacija' : 'Simulated netplay • Zero servers required'}
            </Text>
          </View>
        </View>
      );
    }

    if (lobbyView === 'SETUP') {
      return (
        <View className="space-y-6">
          <View className="space-y-2.5">
            <Text className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-bold">
              {isBs ? 'PROFIL IGRAČA' : 'PLAYER PROFILE'}
            </Text>
            {isSocialUser ? (
              <View className="flex-row items-center justify-between bg-neutral-900/30 p-3.5 rounded-xl border border-neutral-900">
                <View className="flex-row items-center gap-3">
                  <LinearGradient colors={['#f59e0b', '#facc15']} className="relative w-10 h-10 rounded-full items-center justify-center">
                    <Text className="text-neutral-950 font-black text-xs">
                      {userName.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </LinearGradient>
                  <View>
                    <Text className="font-bold text-xs text-neutral-200">{userName}</Text>
                    <Text className="text-[8px] text-emerald-400 font-mono">
                      {socialProvider === 'google' ? 'Google Account Connected' : 'Apple ID Connected'}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    setIsSocialUser(false);
                    setSocialProvider(null);
                    setUserName('');
                    setLobbyView('WELCOME');
                  }}
                  className="px-2 py-1 rounded bg-neutral-800"
                >
                  <Text className="text-[9px] text-neutral-400">{isBs ? 'Odjavi se' : 'Sign out'}</Text>
                </Pressable>
              </View>
            ) : (
              <View className="flex-row items-center gap-3.5 bg-neutral-900/30 px-4 py-3 rounded-xl border border-neutral-900">
                <User size={16} color="#737373" />
                <TextInput
                  maxLength={15}
                  value={userName}
                  onChangeText={setUserName}
                  placeholder={isBs ? 'Npr. Damir' : 'E.g. Damir'}
                  placeholderTextColor="#404040"
                  className="flex-1 text-sm font-semibold text-neutral-200"
                />
              </View>
            )}
          </View>

          <View className="space-y-2.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-bold">
                {isBs ? 'ODABERITE SVOJU BOJU' : 'CHOOSE YOUR COLOR'}
              </Text>
              <Text className="text-neutral-400 font-medium text-[9px] uppercase tracking-wider">
                {isBs ? activeColorConfig.nameBs : activeColorConfig.nameEn}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-3 bg-neutral-900/10 p-2.5 rounded-xl border border-neutral-900/60">
              {AVAILABLE_COLORS.map((color) => {
                const isSelected = selectedColor === color.id;
                return (
                  <Pressable
                    key={color.id}
                    onPress={() => setSelectedColor(color.id)}
                    className={`h-9 w-9 rounded-full ${color.bgClass} items-center justify-center border border-white/10`}
                    style={isSelected ? { borderWidth: 3, borderColor: '#0a0a0a' } : undefined}
                  >
                    {isSelected && <Check size={16} color="#0a0a0a" strokeWidth={3.5} />}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {setupTab === 'CREATE' && (
            <View className="space-y-6">
              <View className="space-y-2.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-bold">
                    {isBs ? 'CILJ KARATA ZA POBJEDU' : 'CARDS REQUIRED TO WIN'}
                  </Text>
                  <Text className="text-amber-400 font-extrabold font-mono">{targetScore}</Text>
                </View>
                <View className="flex-row gap-2">
                  {[5, 7, 10, 12].map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => setTargetScore(num)}
                      className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold items-center justify-center ${targetScore === num ? 'bg-amber-400' : 'bg-neutral-900/30 border border-neutral-900'}`}
                    >
                      <Text className={targetScore === num ? 'text-black font-black' : 'text-neutral-400'}>
                        {num} {isBs ? 'karata' : 'cards'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="space-y-2.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-bold">
                    {isBs ? 'ODABERITE ŠPIL KARTICA' : 'CHOOSE THE CARD DECK'}
                  </Text>
                  <Text
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-black ${selectedDeck === 'SPICY' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}
                  >
                    {selectedDeck === 'SPICY' ? (isBs ? 'LJUTI' : 'SPICY') : (isBs ? 'NORMALNI' : 'NORMAL')}
                  </Text>
                </View>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setSelectedDeck('NORMAL')}
                    className={`flex-1 py-3 px-3 rounded-xl border-2 items-center justify-center gap-1 ${selectedDeck === 'NORMAL' ? 'border-emerald-500 bg-emerald-500/5' : 'border-neutral-900 bg-neutral-900/10'}`}
                  >
                    <Sparkles size={16} color={selectedDeck === 'NORMAL' ? '#34d399' : '#737373'} />
                    <Text className={`text-[10px] uppercase tracking-wider font-bold ${selectedDeck === 'NORMAL' ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {isBs ? 'Normala' : 'Normal'}
                    </Text>
                    <Text className={`text-[7px] ${selectedDeck === 'NORMAL' ? 'text-emerald-400/75' : 'text-neutral-500'} text-center leading-tight`}>
                      {isBs ? 'Smiješne i čudne situacije' : 'Funny & awkward situations'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedDeck('SPICY')}
                    className={`flex-1 py-3 px-3 rounded-xl border-2 items-center justify-center gap-1 ${selectedDeck === 'SPICY' ? 'border-rose-500 bg-rose-500/5' : 'border-neutral-900 bg-neutral-900/10'}`}
                  >
                    <Flame size={16} color={selectedDeck === 'SPICY' ? '#fb7185' : '#737373'} />
                    <Text className={`text-[10px] uppercase tracking-wider font-bold ${selectedDeck === 'SPICY' ? 'text-rose-400' : 'text-neutral-500'}`}>
                      {isBs ? 'Ljuti (Spicy)' : 'Spicy'}
                    </Text>
                    <Text className={`text-[7px] ${selectedDeck === 'SPICY' ? 'text-rose-400/75' : 'text-neutral-500'} text-center leading-tight`}>
                      {isBs ? 'Ekstremne i bizarne nesreće' : 'Extreme & bizarre misery'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>
      );
    }

    if (lobbyView === 'ROOM_JOINING') {
      return (
        <View className="py-12 items-center justify-center space-y-4">
          <Loader2 size={40} color="#fbbf24" className="animate-spin" />
          <Text className="text-sm font-semibold tracking-wider text-neutral-400 font-mono">{joinStatusText}</Text>
        </View>
      );
    }

    if (lobbyView === 'ROOM_CREATED') {
      return (
        <View className="space-y-6">
          <View className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-5 items-center space-y-2">
            <Text className="text-[10px] font-mono tracking-widest text-neutral-500 font-bold uppercase">
              {isBs ? 'KOD SVOJE SOBE' : 'YOUR ROOM CODE'}
            </Text>
            <View className="flex-row items-center justify-center gap-3">
              <Text className="text-3xl font-black tracking-widest text-amber-400 font-mono">{roomCode}</Text>
              <Pressable onPress={handleCopyCode} className="p-1.5 rounded-lg bg-neutral-900">
                {isCopied ? <Check size={16} color="#34d399" /> : <Copy size={16} color="#a3a3a3" />}
              </Pressable>
            </View>
            <Text className="text-[9px] text-neutral-500 uppercase tracking-wider">
              {isBs ? 'Podijelite ovaj kod sa prijateljima da se pridruže!' : 'Share this code to simulate other players joining!'}
            </Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-bold">
                {isBs ? `IGRAČI U SOBI (${roomPlayers.length}/4)` : `PLAYERS IN LOBBY (${roomPlayers.length}/4)`}
              </Text>
              {roomPlayers.length < 4 && (
                <Text className="text-[8px] font-mono text-amber-500/80 uppercase animate-pulse">
                  {isBs ? 'Čekanje igrača...' : 'Waiting for bots...'}
                </Text>
              )}
            </View>
            <View className="space-y-2.5">
              {roomPlayers.map((player, idx) => (
                <View key={idx} className="flex-row items-center justify-between bg-neutral-900/30 px-4 py-3.5 rounded-xl border border-neutral-900">
                  <View className="flex-row items-center gap-3">
                    <View className={`w-3 h-3 rounded-full ${player.color.split(' ')[0]} ${player.color.split(' ')[1]}`} />
                    <Text className="text-sm font-bold text-neutral-200">{player.name}</Text>
                    {idx === 0 && <Crown size={16} color="#facc15" fill="#facc15" />}
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    {player.isBot ? (
                      <Text className="text-[9px] px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-300 font-semibold uppercase font-mono">
                        BOT
                      </Text>
                    ) : (
                      <Text className="text-[9px] px-2 py-0.5 rounded bg-yellow-500 text-black font-extrabold uppercase font-mono">
                        {isBs ? 'TI (HOST)' : 'YOU (HOST)'}
                      </Text>
                    )}
                    <Text className="text-emerald-400 text-xs font-mono ml-2">✓</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      );
    }

    if (lobbyView === 'ROOM_JOINED') {
      return (
        <View className="space-y-6">
          <View className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-6 items-center space-y-4">
            <Text className="text-[10px] font-mono tracking-widest text-amber-400 font-black uppercase animate-pulse">
              {isBs ? 'SINKRONIZACIJA USPJEŠNA' : 'SYNC COMPLETED SUCCESSFULLY'}
            </Text>
            <View className="items-center space-y-1">
              <Text className="text-xs text-neutral-400">{isBs ? 'Domaćin pokreće igru za:' : 'Host is starting the game in:'}</Text>
              <Text className="text-5xl font-black text-amber-400 font-mono">{countdown}</Text>
            </View>
            <View className="bg-neutral-900/80 px-4 py-1.5 rounded-lg text-neutral-400 font-mono text-[10px]">
              {isBs ? `PRIDRUŽEN SOBE: #${roomCode}` : `CONNECTED TO ROOM: #${roomCode}`}
            </View>
          </View>
          <View className="space-y-3">
            <Text className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-bold">
              {isBs ? 'SVI IGRAČI U SOBI' : 'ALL PLAYERS IN LOBBY'}
            </Text>
            <View className="space-y-2.5">
              {roomPlayers.map((player, idx) => (
                <View key={idx} className="flex-row items-center justify-between bg-neutral-900/30 px-4 py-3.5 rounded-xl border border-neutral-900">
                  <View className="flex-row items-center gap-3">
                    <View className={`w-3 h-3 rounded-full ${player.color.split(' ')[0]} ${player.color.split(' ')[1]}`} />
                    <Text className="text-sm font-bold text-neutral-200">{player.name}</Text>
                    {idx === 0 && <Crown size={16} color="#facc15" fill="#facc15" />}
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    {player.isBot ? (
                      idx === 0 ? (
                        <Text className="text-[9px] px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-300 font-bold uppercase font-mono">
                          HOST BOT
                        </Text>
                      ) : (
                        <Text className="text-[9px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">BOT</Text>
                      )
                    ) : (
                      <Text className="text-[9px] px-2 py-0.5 rounded bg-yellow-500 text-black font-extrabold uppercase font-mono animate-pulse">
                        {isBs ? 'TI' : 'YOU'}
                      </Text>
                    )}
                    <Text className="text-emerald-400 text-xs font-mono ml-2">✓</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  const renderBottomCTA = () => {
    if (lobbyView === 'SETUP') {
      return setupTab === 'CREATE' ? (
        <GradientButton onPress={handleCreateRoom}>
          <Plus size={16} color="#0a0a0a" strokeWidth={3} />
          <Text className="text-black font-black uppercase text-xs tracking-wider">
            {isBs ? 'Kreiraj Sobu' : 'Create Room'}
          </Text>
        </GradientButton>
      ) : (
        <View className="space-y-3">
          <View className="space-y-1.5 items-center">
            <Text className="text-[9px] font-mono tracking-widest uppercase text-neutral-500 font-bold">
              {isBs ? 'UNESITE KOD ZA PRIDRUŽIVANJE' : 'ENTER CODE TO JOIN'}
            </Text>
            <TextInput
              maxLength={4}
              value={enteredCode}
              onChangeText={(t) => setEnteredCode(t.toUpperCase())}
              placeholder={isBs ? 'NPR. ABCD' : 'E.G. ABCD'}
              placeholderTextColor="#404040"
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-center font-mono font-black text-lg uppercase tracking-widest text-amber-400 w-full"
            />
          </View>
          <Pressable
            onPress={handleJoinWithCode}
            disabled={!enteredCode.trim()}
            className={`rounded-xl py-4 items-center justify-center flex-row gap-2 ${enteredCode.trim() ? 'bg-amber-400' : 'bg-neutral-900/60'}`}
          >
            <LogIn size={16} color={enteredCode.trim() ? '#0a0a0a' : '#525252'} strokeWidth={3} />
            <Text className={`uppercase text-xs tracking-wider font-extrabold ${enteredCode.trim() ? 'text-black' : 'text-neutral-600'}`}>
              {isBs ? 'Pridruži se' : 'Join Game'}
            </Text>
          </Pressable>
        </View>
      );
    }

    if (lobbyView === 'ROOM_CREATED') {
      return (
        <Pressable
          onPress={() => startGame('MULTIPLAYER', roomPlayers, targetScore, selectedDeck)}
          disabled={roomPlayers.length < 2}
          className={`rounded-xl py-4 items-center justify-center flex-row gap-2 ${roomPlayers.length >= 2 ? 'bg-amber-400' : 'bg-neutral-900'}`}
        >
          <Text className={`uppercase text-xs tracking-wider font-black ${roomPlayers.length >= 2 ? 'text-black' : 'text-neutral-600'}`}>
            {isBs ? 'POKRENI IGRU ODMAH' : 'START THE GAME'}
          </Text>
        </Pressable>
      );
    }

    if (lobbyView === 'ROOM_JOINED') {
      return (
        <View className="py-4 bg-neutral-900 rounded-xl border border-neutral-800 items-center flex-row gap-2">
          <Loader2 size={16} color="#fbbf24" className="animate-spin" />
          <Text className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">
            {isBs ? 'ČEKA SE DOMAĆIN...' : 'WAITING FOR HOST...'}
          </Text>
        </View>
      );
    }

    if (lobbyView === 'ROOM_JOINING') {
      return (
        <View className="py-4 bg-neutral-900 rounded-xl border border-neutral-800 items-center flex-row gap-2">
          <Loader2 size={16} color="#fbbf24" className="animate-spin" />
          <Text className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">
            {isBs ? 'SINKRONIZACIJA...' : 'CONNECTING...'}
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View className="flex-1 bg-neutral-950">
      {renderTopBar()}
      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
      {renderBottomCTA() && <View className="px-4 pb-4 pt-2 bg-neutral-950">{renderBottomCTA()}</View>}
      <InfoModal />
    </View>
  );
}
