import React, { useState, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { LobbyClient } from 'boardgame.io/client';
import { Splendor } from './Game';
import { SplendorBoard } from './Board';
import { Ito } from './ItoGame';
import { ItoBoard } from './ItoBoard';
import { Haa } from './HaaGame';
import HaaBoard from './HaaBoard';
import { Propose } from './ProposeGame';
import ProposeBoard from './ProposeBoard';
import { HanninGame } from './HanninGame';
import { HanninBoard } from './HanninBoard';
import { CrashIceGame } from './CrashIceGame';
import { CrashIceBoard } from './CrashIceBoard';
import { NimmtGame } from './NimmtGame';
import { NimmtBoard } from './NimmtBoard';
import { IndigoGame } from './IndigoGame';
import { IndigoBoard } from './IndigoBoard';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', background: '#fff', color: '#b91c1c', maxWidth: '600px', margin: '40px auto', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', fontFamily: 'sans-serif' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>⚠️ 画面エラーが発生しました</h2>
          <pre style={{ background: '#fef2f2', padding: '15px', borderRadius: '8px', overflowX: 'auto', fontSize: '13px' }}>{this.state.error?.toString()}</pre>
          <button 
            onClick={() => { window.localStorage.clear(); window.location.href = '/'; }}
            style={{ marginTop: '16px', padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            キャッシュをリセットしてトップに戻る
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const server = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
const lobbyClient = new LobbyClient({ server });

const SplendorClient = Client({ game: Splendor, board: SplendorBoard, multiplayer: SocketIO({ server }), debug: false });
const ItoClient = Client({ game: Ito, board: ItoBoard, multiplayer: SocketIO({ server }), debug: false });
const HaaClient = Client({ game: Haa, board: HaaBoard, multiplayer: SocketIO({ server }), debug: false });
const HanninClient = Client({ game: HanninGame, board: HanninBoard, multiplayer: SocketIO({ server }), debug: false });
const ProposeClient = Client({ game: Propose, board: ProposeBoard, multiplayer: SocketIO({ server }), debug: false });
const CrashIceClient = Client({ game: CrashIceGame, board: CrashIceBoard, multiplayer: SocketIO({ server }), debug: false });
const NimmtClient = Client({ game: NimmtGame, board: NimmtBoard, multiplayer: SocketIO({ server }), debug: false });
const IndigoClient = Client({ game: IndigoGame, board: IndigoBoard, multiplayer: SocketIO({ server }), debug: false });

const GAMES_CATALOG = [
  {
    id: 'splendor',
    title: '宝石の煌き',
    subtitle: 'Splendor',
    icon: '💎',
    badge: '名作拡大再生産',
    players: '2〜4人',
    time: '約30分',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    desc: 'ルネサンスの宝石商となり、鉱山開発や職人を雇って威信ポイント15点を目指す世界的ボードゲームの金字塔。',
    minPlayers: 2,
    maxPlayers: 4
  },
  {
    id: 'ito',
    title: 'ITO (イト)',
    subtitle: 'Cooperative Numbers',
    icon: '🧵',
    badge: '協力・価値観',
    players: '2〜8人',
    time: '約15分',
    color: '#ea580c',
    gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
    desc: '1〜100の数字をお題の言葉で表現！「それどのくらい？」と感覚をすり合わせ全員のカードを昇順に並べよう。',
    minPlayers: 2,
    maxPlayers: 8
  },
  {
    id: 'haa',
    title: 'はぁって言うゲーム',
    subtitle: 'Acting Party Game',
    icon: '🗣️',
    badge: '表現・演技',
    players: '2〜8人',
    time: '約15分',
    color: '#e11d48',
    gradient: 'linear-gradient(135deg, #f43f5e, #be123c)',
    desc: '「感心の はぁ」「怒りの はぁ」「失恋の はぁ」。声と表情だけで演じ分け、当て合う大爆笑パーティー！',
    minPlayers: 2,
    maxPlayers: 8
  },
  {
    id: 'propose',
    title: 'プロポーズの言葉を君に',
    subtitle: 'たった今考えたプロポーズの言葉を君に捧ぐよ',
    icon: '💍',
    badge: 'ワード・大喜利',
    players: '3〜8人',
    time: '約20分',
    color: '#9333ea',
    gradient: 'linear-gradient(135deg, #a855f7, #7e22ce)',
    desc: '配られた単語カードを組み合わせて指輪と共にプロポーズ！即興の胸キュンや珍文が飛び出すロマンチック大喜利。',
    minPlayers: 3,
    maxPlayers: 8
  },
  {
    id: 'hannin',
    title: '犯人は踊る',
    subtitle: 'Mystery & Deduction',
    icon: '🕵️',
    badge: '心理戦・推理',
    players: '3〜8人',
    time: '約10分',
    color: '#475569',
    gradient: 'linear-gradient(135deg, #64748b, #334155)',
    desc: '犯人カードは手札間をぐるぐる移動！最後まで誰の手元にあるか分からない、騙し合いと推理のスリリングカードゲーム。',
    minPlayers: 3,
    maxPlayers: 8
  },
  {
    id: 'crashice',
    title: 'クラッシュアイス',
    subtitle: 'Crash Ice Action 3D',
    icon: '🐧',
    badge: '3D物理アクション',
    players: '2〜8人',
    time: '約10分',
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    desc: 'リアル3D物理エンジン搭載！ドラッグでハンマーを振り下ろし、ペンギンを落とさないよう狙いを定めて氷を叩け！',
    minPlayers: 2,
    maxPlayers: 8
  },
  {
    id: 'nimmt',
    title: '6 Nimmt! (ニムト)',
    subtitle: 'Take 6! Classic Game',
    icon: '🐂',
    badge: '数字・心理戦',
    players: '2〜10人',
    time: '約20分',
    color: '#dc2626',
    gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    desc: '1〜104のカードを一斉オープン！列の6枚目を置いてしまったら牛（失点）を丸ごと引き取り。心理戦の名作！',
    minPlayers: 2,
    maxPlayers: 10
  },
  {
    id: 'indigo',
    title: 'インディゴ (Indigo)',
    subtitle: 'Knizia Hex Routes',
    icon: '🌊',
    badge: 'ルート構築名作',
    players: '2〜4人',
    time: '約25分',
    color: '#0891b2',
    gradient: 'linear-gradient(135deg, #06b6d4, #0e7490)',
    desc: '巨匠ライナー・クニツィアの六角タイル配置ゲーム。線路のようにルートを繋ぎ、宝石を自分の門へ導き入れよう！',
    minPlayers: 2,
    maxPlayers: 4
  }
];

const AVATAR_LIST = ['🐱', '🦊', '🐼', '🦁', '🐧', '🐺', '🦉', '🤖', '👑', '💎', '🚀', '🔥'];

const App = () => {
  const [matchID, setMatchID] = useState(null);
  const [gameType, setGameType] = useState('splendor');
  const [playerID, setPlayerID] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('bg_portal_player_name') || '';
  });
  const [playerAvatar, setPlayerAvatar] = useState(() => {
    return localStorage.getItem('bg_portal_player_avatar') || '🐱';
  });
  const [numPlayers, setNumPlayers] = useState(4);
  const [error, setError] = useState('');

  const [customThemes, setCustomThemes] = useState([]);
  const [newTheme, setNewTheme] = useState('');
  const [showThemeManager, setShowThemeManager] = useState(false);
  const [themeMode, setThemeMode] = useState('random');
  const [joinCode, setJoinCode] = useState('');
  const [copiedBottomCode, setCopiedBottomCode] = useState(false);
  const [copiedBottomUrl, setCopiedBottomUrl] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ito_custom_themes');
      if (stored) setCustomThemes(JSON.parse(stored));
    } catch(e) {}
  }, []);

  const handleAddTheme = () => {
    if (!newTheme.trim()) return;
    const updated = [...customThemes, newTheme.trim()];
    setCustomThemes(updated);
    localStorage.setItem('ito_custom_themes', JSON.stringify(updated));
    setNewTheme('');
  };

  const handleRemoveTheme = (index) => {
    const updated = customThemes.filter((_, i) => i !== index);
    setCustomThemes(updated);
    localStorage.setItem('ito_custom_themes', JSON.stringify(updated));
  };
  
  // Renderのサーバーがスリープするのを防ぐための定期通信 (Keep-Alive)
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(server + '/games/splendor').catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mID = params.get('match');
    const gType = params.get('game') || 'splendor';
    if (gType) {
      setGameType(gType);
      const conf = GAMES_CATALOG.find(g => g.id === gType);
      if (conf) {
        setNumPlayers(Math.min(Math.max(4, conf.minPlayers), conf.maxPlayers));
      }
    }
    
    if (mID) {
      setMatchID(mID);
      const saved = localStorage.getItem(gType + '_match_' + mID);
      if (saved) {
        try {
          const { pID, creds, pName } = JSON.parse(saved);
          if (pID && creds) {
            setPlayerID(pID);
            setCredentials(creds);
            if (pName) setPlayerName(pName);
          }
        } catch(e) {}
      }
    }
  }, []);

  const handleNameChange = (val) => {
    const trimmed = val.slice(0, 15);
    setPlayerName(trimmed);
    localStorage.setItem('bg_portal_player_name', trimmed);
  };

  const handleAvatarChange = (avatar) => {
    setPlayerAvatar(avatar);
    localStorage.setItem('bg_portal_player_avatar', avatar);
  };

  const saveCredentials = (gType, mID, pID, creds, pName) => {
    localStorage.setItem(gType + '_match_' + mID, JSON.stringify({ pID, creds, pName }));
  };

  const handleGameTypeChange = (type) => {
    setGameType(type);
    const conf = GAMES_CATALOG.find(g => g.id === type);
    if (conf) {
      if (numPlayers < conf.minPlayers) setNumPlayers(conf.minPlayers);
      if (numPlayers > conf.maxPlayers) setNumPlayers(conf.maxPlayers);
    }
  };

  const createAndJoinMatch = async () => {
    const cleanName = playerName.trim();
    if (!cleanName) return setError('プレイヤー名を入力してください');
    setError('');
    try {
      const conf = GAMES_CATALOG.find(g => g.id === gameType) || { minPlayers: 2, maxPlayers: 4 };
      let finalNumPlayers = Math.max(conf.minPlayers, Math.min(numPlayers, conf.maxPlayers));
      
      const matchConfig = { numPlayers: finalNumPlayers };
      if (gameType === 'ito') matchConfig.setupData = { customThemes, themeMode };
      const { matchID: newMatchID } = await lobbyClient.createMatch(gameType, matchConfig);
      const { playerID: newPlayerID, playerCredentials } = await lobbyClient.joinMatch(gameType, newMatchID, {
        playerName: cleanName
      });
      
      window.history.pushState({}, '', '?game=' + gameType + '&match=' + newMatchID);
      setMatchID(newMatchID);
      setPlayerID(newPlayerID);
      setCredentials(playerCredentials);
      saveCredentials(gameType, newMatchID, newPlayerID, playerCredentials, cleanName);
    } catch (e) {
      setError('部屋の作成に失敗しました: ' + e.message);
    }
  };

  const joinExistingMatch = async (tGameType = gameType, tMatchID = matchID) => {
    const cleanName = playerName.trim();
    if (!cleanName) return setError('プレイヤー名を入力してください');
    setError('');
    try {
      let match = null;
      let finalGameType = tGameType;
      const allGames = ['splendor', 'ito', 'haa', 'propose', 'hannin', 'crashice', 'nimmt', 'indigo'];

      try {
        match = await lobbyClient.getMatch(tGameType, tMatchID);
      } catch (e) {
        for (const g of allGames) {
          if (g === tGameType) continue;
          try {
            match = await lobbyClient.getMatch(g, tMatchID);
            if (match) {
              finalGameType = g;
              break;
            }
          } catch (e2) {}
        }
      }

      if (!match) {
        return setError('部屋が見つかりませんでした。コードをご確認ください。');
      }

      if (match.gameName) {
        finalGameType = match.gameName;
      }
      
      const availablePlayer = match.players.find(p => !p.name);
      
      if (!availablePlayer) {
        return setError('この部屋はすでに満員です');
      }

      const { playerID: newPlayerID, playerCredentials } = await lobbyClient.joinMatch(finalGameType, tMatchID, {
        playerID: availablePlayer.id.toString(),
        playerName: cleanName
      });

      window.history.pushState({}, '', '?game=' + finalGameType + '&match=' + tMatchID);
      setGameType(finalGameType);
      setMatchID(tMatchID);
      setPlayerID(newPlayerID);
      setCredentials(playerCredentials);
      saveCredentials(finalGameType, tMatchID, newPlayerID, playerCredentials, cleanName);
    } catch (e) {
      setError('参加に失敗しました: ' + e.message);
    }
  };

  const handleJoinByCode = () => {
    if (!joinCode.trim()) return;
    let code = joinCode.trim();
    let g = gameType;
    let m = code;
    try {
      if (code.includes('?')) {
        const url = new URL(code.startsWith('http') ? code : 'http://localhost/' + code);
        const urlG = url.searchParams.get('game');
        const urlM = url.searchParams.get('match');
        if (urlG) g = urlG;
        if (urlM) m = urlM;
      }
    } catch(e) {}
    joinExistingMatch(g, m);
  };

  const leaveMatch = () => {
    if (matchID) localStorage.removeItem(gameType + '_match_' + matchID);
    setPlayerID(null);
    setCredentials(null);
    window.location.href = '/';
  };

  // ----------------------------------------------------
  // 対戦・待機中 画面（ゲームクライアント表示）
  // ----------------------------------------------------
  if (playerID !== null && credentials !== null) {
    const currentGameMeta = GAMES_CATALOG.find(g => g.id === gameType) || { title: gameType, icon: '🎲' };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0f172a', boxSizing: 'border-box' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ErrorBoundary>
            {gameType === 'ito' ? (
              <ItoClient matchID={matchID} playerID={playerID} credentials={credentials} />
            ) : gameType === 'haa' ? (
              <HaaClient matchID={matchID} playerID={playerID} credentials={credentials} />
            ) : gameType === 'propose' ? (
              <ProposeClient matchID={matchID} playerID={playerID} credentials={credentials} />
            ) : gameType === 'hannin' ? (
              <HanninClient matchID={matchID} playerID={playerID} credentials={credentials} />
            ) : gameType === 'crashice' ? (
              <CrashIceClient matchID={matchID} playerID={playerID} credentials={credentials} />
            ) : gameType === 'nimmt' ? (
              <NimmtClient matchID={matchID} playerID={playerID} credentials={credentials} />
            ) : gameType === 'indigo' ? (
              <IndigoClient matchID={matchID} playerID={playerID} credentials={credentials} />
            ) : (
              <SplendorClient matchID={matchID} playerID={playerID} credentials={credentials} />
            )}
          </ErrorBoundary>
        </div>

        {/* 下部固定・統合コントロールバー */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          color: '#ffffff',
          fontFamily: "'Segoe UI', -apple-system, sans-serif"
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{currentGameMeta.icon}</span>
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#f8fafc' }}>{currentGameMeta.title}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.08)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>部屋コード:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px', color: '#38bdf8' }}>{matchID}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(matchID);
                  setCopiedBottomCode(true);
                  setTimeout(() => setCopiedBottomCode(false), 2000);
                }}
                style={{
                  background: copiedBottomCode ? '#22c55e' : 'rgba(255,255,255,0.15)',
                  color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                {copiedBottomCode ? '✓ コピー済' : 'コピー'}
              </button>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopiedBottomUrl(true);
                setTimeout(() => setCopiedBottomUrl(false), 2000);
              }}
              style={{
                background: copiedBottomUrl ? '#22c55e' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
              }}
            >
              {copiedBottomUrl ? '✓ 招待リンクをコピーしました！' : '🔗 招待リンクをコピー'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ fontSize: '18px' }}>{playerAvatar}</span>
              <span style={{ color: '#cbd5e1' }}>プレイヤー: <strong style={{ color: '#ffffff' }}>{playerName}</strong></span>
            </div>
            <button
              onClick={leaveMatch}
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
              }}
            >
              🚪 部屋を退出
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ポータル トップ画面（ゲーム選択・部屋作成・参加）
  // ----------------------------------------------------
  const selectedGame = GAMES_CATALOG.find(g => g.id === gameType) || GAMES_CATALOG[0];
  const allowedPlayerCounts = [];
  for (let i = selectedGame.minPlayers; i <= selectedGame.maxPlayers; i++) {
    allowedPlayerCounts.push(i);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
      color: '#f8fafc',
      padding: '40px 20px 60px',
      boxSizing: 'border-box',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <style>{`
        @keyframes floatGlow {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.35; }
          50% { transform: translate(30px, -20px) scale(1.15); opacity: 0.5; }
        }
        @keyframes subtlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .game-card-hover {
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .game-card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
        }
      `}</style>

      {/* 背景の光彩デコレーション */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25), transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none', animation: 'floatGlow 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', animation: 'floatGlow 10s ease-in-out infinite reverse' }} />

      <div style={{ maxWidth: '1120px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* HERO HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '6px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '14px', backdropFilter: 'blur(8px)' }}>
            <span>🎲</span> ONLINE BOARD GAME ARENA
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: '900',
            letterSpacing: '-1px',
            margin: '0 0 14px',
            background: 'linear-gradient(135deg, #ffffff 30%, #38bdf8 70%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            BOARD GAME PORTAL
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#94a3b8',
            maxWidth: '650px',
            margin: '0 auto 20px',
            lineHeight: 1.6
          }}>
            インストール不要！ ブラウザを開くだけですぐに友達とオンライン対戦できるボードゲームプラットフォーム。全8タイトル収録！
          </p>

          {/* 特徴バッジ列 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
              ⚡ 高速リアルタイム同期
            </span>
            <span style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
              👥 最大10人マルチプレイ
            </span>
            <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#86efac', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
              📱 スマホ・PC両対応
            </span>
            <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fde68a', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
              🎉 完全無料・登録不要
            </span>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div style={{
            maxWidth: '640px',
            margin: '0 auto 24px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '12px 18px',
            borderRadius: '12px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* プレイヤー設定バー (アバター & 名前) */}
        <div style={{
          maxWidth: '780px',
          margin: '0 auto 36px',
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '20px 24px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>👤</span> あなたのプレイヤープロフィール
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
              flexShrink: 0
            }}>
              {playerAvatar}
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                value={playerName}
                onChange={e => handleNameChange(e.target.value)}
                maxLength={15}
                placeholder="名前を入力してください (最大15文字)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* アバター選択ピッカー */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {AVATAR_LIST.map(av => (
                <button
                  key={av}
                  type="button"
                  onClick={() => handleAvatarChange(av)}
                  style={{
                    background: playerAvatar === av ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                    border: playerAvatar === av ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DIRECT INVITE CARD (URLにmatchIDがある場合) */}
        {matchID && (
          <div style={{
            maxWidth: '640px',
            margin: '0 auto 36px',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(99, 102, 241, 0.25))',
            border: '2px solid #38bdf8',
            borderRadius: '20px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(56, 189, 248, 0.25)'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>💌</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', color: '#ffffff' }}>招待された部屋が見つかりました！</h2>
            <p style={{ color: '#bae6fd', fontSize: '14px', margin: '0 0 16px' }}>
              部屋コード: <strong style={{ fontFamily: 'monospace', fontSize: '16px' }}>{matchID}</strong>
            </p>
            <button
              onClick={() => joinExistingMatch()}
              style={{
                padding: '14px 40px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              🚀 この部屋に参加する！
            </button>
          </div>
        )}

        {/* GAME SELECTION SHOWCASE (8 GAMES GRID) */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎮</span> ゲームを選択
            </h2>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>全8タイトル</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            {GAMES_CATALOG.map(game => {
              const isSelected = gameType === game.id;

              return (
                <div
                  key={game.id}
                  onClick={() => handleGameTypeChange(game.id)}
                  className="game-card-hover"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))'
                      : 'rgba(30, 41, 59, 0.6)',
                    border: isSelected ? `2px solid ${game.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    padding: '20px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 25px ${game.color}40, 0 8px 20px rgba(0,0,0,0.3)` : '0 4px 15px rgba(0,0,0,0.15)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  {/* SELECTED BADGE */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: game.gradient,
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}>
                      ✓ 選択中
                    </div>
                  )}

                  <div>
                    {/* ICON & BADGE */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{
                        fontSize: '36px',
                        width: '50px',
                        height: '50px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {game.icon}
                      </div>
                      <div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: game.color,
                          background: `${game.color}20`,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: `1px solid ${game.color}40`
                        }}>
                          {game.badge}
                        </span>
                      </div>
                    </div>

                    {/* TITLES */}
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                      {game.title}
                    </h3>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
                      {game.subtitle}
                    </div>

                    {/* DESCRIPTION */}
                    <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 16px' }}>
                      {game.desc}
                    </p>
                  </div>

                  {/* FOOTER SPECS */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '11px',
                    color: '#94a3b8'
                  }}>
                    <span>👥 {game.players}</span>
                    <span>⏱️ {game.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROOM CREATION & CONFIG DRAWER */}
        {!matchID && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(16px)',
            border: `2px solid ${selectedGame.color}`,
            borderRadius: '24px',
            padding: '28px 32px',
            marginBottom: '40px',
            boxShadow: `0 12px 40px ${selectedGame.color}25`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '40px' }}>{selectedGame.icon}</span>
                <div>
                  <div style={{ fontSize: '12px', color: selectedGame.color, fontWeight: 'bold' }}>部屋作成設定</div>
                  <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
                    『{selectedGame.title}』を遊ぶ
                  </h3>
                </div>
              </div>

              {/* プレイ人数セレクター (ピルボタン) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>参加人数:</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {allowedPlayerCounts.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumPlayers(n)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: numPlayers === n ? `2px solid ${selectedGame.color}` : '1px solid rgba(255, 255, 255, 0.15)',
                        background: numPlayers === n ? selectedGame.gradient : 'rgba(15, 23, 42, 0.6)',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: numPlayers === n ? `0 4px 12px ${selectedGame.color}50` : 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      {n}人
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ITO 固有オプション (お題設定) */}
            {gameType === 'ito' && (
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fdba74', marginBottom: '8px' }}>
                  🧵 ITO お題出題モード
                </div>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="radio" name="themeMode" value="random" checked={themeMode === 'random'} onChange={() => setThemeMode('random')} />
                    <span>🎲 自動出題（ランダム）</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="radio" name="themeMode" value="manual" checked={themeMode === 'manual'} onChange={() => setThemeMode('manual')} />
                    <span>✏️ 手動入力（待機中にみんなで投稿）</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setShowThemeManager(!showThemeManager)}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {showThemeManager ? '▲ オリジナルお題管理を閉じる' : `▼ オリジナルお題を管理する (${customThemes.length}件)`}
                </button>

                {showThemeManager && (
                  <div style={{ marginTop: '12px', padding: '14px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        value={newTheme}
                        onChange={e => setNewTheme(e.target.value)}
                        placeholder="新しいお題を入力 (例: カッコいい必殺技)"
                        style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '13px' }}
                      />
                      <button onClick={handleAddTheme} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>追加</button>
                    </div>
                    {customThemes.length > 0 && (
                      <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {customThemes.map((t, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '12px' }}>
                            <span>{t}</span>
                            <button onClick={() => handleRemoveTheme(idx)} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* CREATE ROOM ACTION BUTTON */}
            <button
              onClick={createAndJoinMatch}
              style={{
                width: '100%',
                padding: '18px 36px',
                fontSize: '20px',
                fontWeight: '900',
                background: selectedGame.gradient,
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: `0 8px 25px ${selectedGame.color}60`,
                transition: 'all 0.2s',
                letterSpacing: '0.5px'
              }}
            >
              🚀 部屋を作成してロビーへ進む！ ({numPlayers}人部屋)
            </button>
          </div>
        )}

        {/* JOIN BY CODE OR URL SECTION */}
        <div style={{
          maxWidth: '680px',
          margin: '0 auto',
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '24px 28px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>🔑</span> 既存の部屋に参加する
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="部屋コード または 招待URLを貼り付け"
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '12px 16px',
                fontSize: '14px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={handleJoinByCode}
              style={{
                padding: '12px 28px',
                fontSize: '15px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.15s'
              }}
            >
              参加する
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
            ※ 友達から共有された招待URLまたは部屋コードを入力すれば、どのゲームの部屋でも直接参加できます
          </div>
        </div>

        {/* FOOTER CREDITS */}
        <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '12px', color: '#64748b' }}>
          Board Game Portal © 2026 • Splendor / Ito / Haa / Propose / Hannin / Crash Ice / Nimmt / Indigo
        </div>

      </div>
    </div>
  );
};

export default App;
