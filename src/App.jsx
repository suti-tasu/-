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
import { JinseiGame } from './JinseiGame';
import { JinseiBoard } from './JinseiBoard';
import { DeepSeaGame } from './DeepSeaGame';
import { DeepSeaBoard } from './DeepSeaBoard';
import { OnsokuGame } from './OnsokuGame';
import { OnsokuBoard } from './OnsokuBoard';

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
const JinseiClient = Client({ game: JinseiGame, board: JinseiBoard, multiplayer: SocketIO({ server }), debug: false });
const DeepSeaClient = Client({ game: DeepSeaGame, board: DeepSeaBoard, multiplayer: SocketIO({ server }), debug: false });
const OnsokuClient = Client({ game: OnsokuGame, board: OnsokuBoard, multiplayer: SocketIO({ server }), debug: false });

const GAMES_CATALOG = [
  {
    id: 'splendor',
    title: '宝石の煌き',
    subtitle: 'Splendor',
    enTitle: 'SPLENDOR',
    icon: '💎',
    badge: '拡大再生産',
    tagline: 'ルネサンスの豪商たちの名声争奪戦',
    players: '2〜4人',
    time: '約30分',
    color: '#d97706',
    boxBg: 'linear-gradient(155deg, #1e1b4b 0%, #0f172a 45%, #2e1065 100%)',
    spineBg: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)',
    topBg: '#2e1065',
    boxBorder: '#f59e0b',
    accentColor: '#fbbf24',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    desc: 'ルネサンスの宝石商となり、鉱山開発や職人を雇って威信ポイント15点を目指す世界的ボードゲームの金字塔。',
    minPlayers: 2,
    maxPlayers: 4
  },
  {
    id: 'ito',
    title: 'ITO (イト)',
    subtitle: 'Cooperative Numbers',
    enTitle: 'ITO',
    icon: '🧵',
    badge: '協力・価値観',
    tagline: '数字を言葉で例える感覚すり合わせ',
    players: '2〜8人',
    time: '約15分',
    color: '#ea580c',
    boxBg: 'linear-gradient(155deg, #7c2d12 0%, #c2410c 45%, #ea580c 100%)',
    spineBg: 'linear-gradient(180deg, #7c2d12 0%, #9a3412 100%)',
    topBg: '#ea580c',
    boxBorder: '#fb923c',
    accentColor: '#fed7aa',
    gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
    desc: '1〜100の数字をお題の言葉で表現！「それどのくらい？」と感覚をすり合わせ全員のカードを昇順に並べよう。',
    minPlayers: 2,
    maxPlayers: 8
  },
  {
    id: 'haa',
    title: 'はぁって言うゲーム',
    subtitle: 'Acting Party Game',
    enTitle: 'HAA!',
    icon: '🗣️',
    badge: '表現・演技',
    tagline: '声と表情だけで伝える演技力',
    players: '2〜8人',
    time: '約15分',
    color: '#e11d48',
    boxBg: 'linear-gradient(155deg, #881337 0%, #be123c 45%, #e11d48 100%)',
    spineBg: 'linear-gradient(180deg, #881337 0%, #4c0519 100%)',
    topBg: '#be123c',
    boxBorder: '#f43f5e',
    accentColor: '#fecdd3',
    gradient: 'linear-gradient(135deg, #f43f5e, #be123c)',
    desc: '「感心の はぁ」「怒りの はぁ」「失恋の はぁ」。声と表情だけで演じ分け、当て合う大爆笑パーティー！',
    minPlayers: 2,
    maxPlayers: 8
  },
  {
    id: 'propose',
    title: 'プロポーズの言葉を君に',
    subtitle: 'たった今考えたプロポーズの言葉を君に捧ぐよ',
    enTitle: 'PROPOSE',
    icon: '💍',
    badge: 'ワード・大喜利',
    tagline: '即興で紡ぐロマンチック大喜利',
    players: '3〜8人',
    time: '約20分',
    color: '#9333ea',
    boxBg: 'linear-gradient(155deg, #3b0764 0%, #581c87 45%, #7e22ce 100%)',
    spineBg: 'linear-gradient(180deg, #3b0764 0%, #2e1065 100%)',
    topBg: '#581c87',
    boxBorder: '#c084fc',
    accentColor: '#f3e8ff',
    gradient: 'linear-gradient(135deg, #a855f7, #7e22ce)',
    desc: '配られた単語カードを組み合わせて指輪と共にプロポーズ！即興の胸キュンや珍文が飛び出すロマンチック大喜利。',
    minPlayers: 3,
    maxPlayers: 8
  },
  {
    id: 'hannin',
    title: '犯人は踊る',
    subtitle: 'Mystery & Deduction',
    enTitle: 'HANNIN',
    icon: '🕵️',
    badge: '心理戦・推理',
    tagline: '誰が犯人？手札移動のサスペンス',
    players: '3〜8人',
    time: '約10分',
    color: '#475569',
    boxBg: 'linear-gradient(155deg, #1c1917 0%, #292524 45%, #44403c 100%)',
    spineBg: 'linear-gradient(180deg, #1c1917 0%, #0c0a09 100%)',
    topBg: '#292524',
    boxBorder: '#78716c',
    accentColor: '#f87171',
    gradient: 'linear-gradient(135deg, #64748b, #334155)',
    desc: '犯人カードは手札間をぐるぐる移動！最後まで誰の手元にあるか分からない、騙し合いと推理のスリリングカードゲーム。',
    minPlayers: 3,
    maxPlayers: 8
  },
  {
    id: 'crashice',
    title: 'クラッシュアイス',
    subtitle: 'Crash Ice Action 3D',
    enTitle: 'CRASH ICE',
    icon: '🐧',
    badge: '3D物理アクション',
    tagline: '氷を叩け！リアル3D物理対戦',
    players: '2〜8人',
    time: '約10分',
    color: '#0284c7',
    boxBg: 'linear-gradient(155deg, #0c4a6e 0%, #0369a1 45%, #0284c7 100%)',
    spineBg: 'linear-gradient(180deg, #082f49 0%, #0369a1 100%)',
    topBg: '#0284c7',
    boxBorder: '#38bdf8',
    accentColor: '#e0f2fe',
    gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    desc: 'リアル3D物理エンジン搭載！ドラッグでハンマーを振り下ろし、ペンギンを落とさないよう狙いを定めて氷を叩け！',
    minPlayers: 2,
    maxPlayers: 8
  },
  {
    id: 'nimmt',
    title: '6 Nimmt! (ニムト)',
    subtitle: 'Take 6! Classic Game',
    enTitle: '6 NIMMT!',
    icon: '🐂',
    badge: '数字・心理戦',
    tagline: '6枚目でドボン！牛を引き取るな',
    players: '2〜10人',
    time: '約20分',
    color: '#dc2626',
    boxBg: 'linear-gradient(155deg, #7f1d1d 0%, #991b1b 45%, #dc2626 100%)',
    spineBg: 'linear-gradient(180deg, #450a0a 0%, #7f1d1d 100%)',
    topBg: '#dc2626',
    boxBorder: '#ef4444',
    accentColor: '#fef08a',
    gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    desc: '1〜104のカードを一斉オープン！列の6枚目を置いてしまったら牛（失点）を丸ごと引き取り。心理戦の名作！',
    minPlayers: 2,
    maxPlayers: 10
  },
  {
    id: 'indigo',
    title: 'インディゴ (Indigo)',
    subtitle: 'Knizia Hex Routes',
    enTitle: 'INDIGO',
    icon: '🌊',
    badge: 'ルート構築名作',
    tagline: 'タイルを繋ぎ宝石を門へ導く',
    players: '2〜4人',
    time: '約25分',
    color: '#0891b2',
    boxBg: 'linear-gradient(155deg, #164e63 0%, #0e7490 45%, #0891b2 100%)',
    spineBg: 'linear-gradient(180deg, #083344 0%, #164e63 100%)',
    topBg: '#0e7490',
    boxBorder: '#22d3ee',
    accentColor: '#a5f3fc',
    gradient: 'linear-gradient(135deg, #06b6d4, #0e7490)',
    desc: '巨匠ライナー・クニツィアの六角タイル配置ゲーム。線路のようにルートを繋ぎ、宝石を自分の門へ導き入れよう！',
    minPlayers: 2,
    maxPlayers: 4
  },
  {
    id: 'jinsei',
    title: '47都道府県 人生ゲーム',
    subtitle: 'Japan Regional Life Game',
    enTitle: 'JINSEI 47',
    icon: '🚗',
    badge: '47都道府県対応',
    tagline: '故郷の絆を胸に億万長者を目指すライフすごろく',
    players: '2〜4人',
    time: '約25分',
    color: '#10b981',
    boxBg: 'linear-gradient(155deg, #064e3b 0%, #065f46 45%, #047857 100%)',
    spineBg: 'linear-gradient(180deg, #022c22 0%, #064e3b 100%)',
    topBg: '#059669',
    boxBorder: '#34d399',
    accentColor: '#fde047',
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    desc: '日本全国47都道府県から出身地を選んでスタート！各県独自のパッシブスキル、特産品、帰省仕送りイベントで大盛り上がりの人生ゲーム！',
    minPlayers: 2,
    maxPlayers: 4
  },
  {
    id: 'deepsea',
    title: '海底探険',
    subtitle: 'Deep Sea Adventure',
    enTitle: 'DEEP SEA',
    icon: '🌊',
    badge: 'チキンレース名作',
    tagline: '共有酸素25を奪い合う欲張りダイブ！',
    players: '2〜6人',
    time: '約20分',
    color: '#0284c7',
    boxBg: 'linear-gradient(155deg, #082f49 0%, #0369a1 45%, #0ea5e9 100%)',
    spineBg: 'linear-gradient(180deg, #020617 0%, #082f49 100%)',
    topBg: '#0284c7',
    boxBorder: '#38bdf8',
    accentColor: '#bae6fd',
    gradient: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
    desc: '1隻の潜水艦の酸素を全員で共有！お宝を拾うほど重く息が苦しくなる中、誰よりも深く潜り無事に生還せよ！',
    minPlayers: 2,
    maxPlayers: 6
  },
  {
    id: 'onsoku',
    title: '音速飯店',
    subtitle: 'Onsoku Hanten',
    enTitle: 'ONSOKU',
    icon: '🍜',
    badge: 'リアルタイム早出し',
    tagline: '中華メニューを音速で作り上げろ！',
    players: '2〜6人',
    time: '約10分',
    color: '#dc2626',
    boxBg: 'linear-gradient(155deg, #450a0a 0%, #991b1b 45%, #dc2626 100%)',
    spineBg: 'linear-gradient(180deg, #1c0505 0%, #7f1d1d 100%)',
    topBg: '#b91c1c',
    boxBorder: '#fbbf24',
    accentColor: '#fde047',
    gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    desc: 'ターン待ち一切なし！「ラー」「メン」「チャー」「ハン」と具材カードを音速で繋げて料理を完成させる白熱バトル！',
    minPlayers: 2,
    maxPlayers: 6
  }
];

const AVATAR_LIST = ['🐱', '🦊', '🐼', '🦁', '🐧', '🐺', '🦉', '🤖', '👑', '💎', '🚀', '🔥'];

// ラック上の個別ボードゲーム箱コンポーネント (リアル3D立体パッケージ)
const BoardGameBox = ({ game, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`box-3d ${isSelected ? 'is-active' : ''}`}
      style={{
        width: '162px',
        height: '242px',
        flexShrink: 0,
        cursor: 'pointer',
        position: 'relative',
        marginRight: '18px',
        userSelect: 'none'
      }}
    >
      {/* 3D Top Lid (上フタ) */}
      <div
        className="top-3d"
        style={{
          background: game.topBg,
          borderRadius: '4px 4px 0 0',
          borderTop: '1px solid rgba(255,255,255,0.35)'
        }}
      />

      {/* 3D Side Spine (背表紙 / 側面の厚み) */}
      <div
        className="spine-3d"
        style={{
          background: game.spineBg,
          borderRadius: '0 6px 6px 0',
          borderRight: '1px solid rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          boxSizing: 'border-box'
        }}
      >
        <span style={{
          fontSize: '10px',
          fontWeight: '900',
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: '1.5px',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}>
          {game.enTitle || game.subtitle}
        </span>
        <span style={{ fontSize: '13px' }}>{game.icon}</span>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>{game.players}</span>
      </div>

      {/* 3D Front Face (箱の正面) */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px 0 0 12px',
          padding: '12px 10px',
          boxSizing: 'border-box',
          background: game.boxBg,
          border: isSelected ? '3px solid #fde047' : `2px solid ${game.boxBorder}`,
          boxShadow: isSelected
            ? `0 24px 35px -4px rgba(0,0,0,0.85), 0 0 25px ${game.accentColor}99, inset 0 1px 2px rgba(255,255,255,0.4)`
            : `0 14px 20px -3px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.4)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* 箱表面の光沢レイヤー */}
        <div className="box-sheen" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

        {/* 選択中リボンバッジ */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: '900',
            padding: '2px 7px',
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            zIndex: 10
          }}>
            ✓ 机へ配置中
          </div>
        )}

        {/* 箱上部：ジャンルバッジ & 人数 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
          <span style={{
            fontSize: '9.5px',
            fontWeight: 'bold',
            color: game.accentColor,
            background: 'rgba(0,0,0,0.45)',
            padding: '2px 6px',
            borderRadius: '5px',
            border: `1px solid ${game.boxBorder}66`
          }}>
            {game.badge}
          </span>
          <span style={{ fontSize: '9.5px', color: '#e2e8f0', fontWeight: 'bold', background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: '4px' }}>
            👥 {game.players}
          </span>
        </div>

        {/* 箱中央：カバーアート & タイトル */}
        <div style={{ textAlign: 'center', margin: 'auto 0', zIndex: 2 }}>
          <div style={{
            fontSize: '36px',
            lineHeight: 1,
            marginBottom: '4px',
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))'
          }}>
            {game.icon}
          </div>
          <h3 style={{
            margin: '0 0 2px',
            fontSize: '15px',
            fontWeight: '900',
            color: '#ffffff',
            letterSpacing: '-0.3px',
            textShadow: '0 2px 6px rgba(0,0,0,0.7)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {game.title}
          </h3>
          <div style={{
            fontSize: '9.5px',
            color: '#94a3b8',
            fontWeight: 'bold',
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {game.enTitle || game.subtitle}
          </div>
          <div style={{
            fontSize: '9px',
            color: game.accentColor,
            background: 'rgba(0,0,0,0.4)',
            padding: '2px 6px',
            borderRadius: '5px',
            display: 'inline-block',
            fontWeight: 'bold',
            border: '1px dashed rgba(255,255,255,0.2)',
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            boxSizing: 'border-box'
          }}>
            {game.tagline}
          </div>
        </div>

        {/* 箱下部：プレイ時間 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '5px',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          fontSize: '9.5px',
          color: '#cbd5e1',
          fontWeight: 'bold',
          zIndex: 2
        }}>
          <span>⏱️ {game.time}</span>
          <span style={{ color: isSelected ? '#fde047' : '#94a3b8' }}>
            {isSelected ? '★ 選択中' : '棚から選ぶ'}
          </span>
        </div>
      </div>
    </div>
  );
};

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
  const [isOpeningBox, setIsOpeningBox] = useState(false);

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
    setIsOpeningBox(true); // 箱を開けるアニメーション演出を開始！
    try {
      const conf = GAMES_CATALOG.find(g => g.id === gameType) || { minPlayers: 2, maxPlayers: 4 };
      let finalNumPlayers = Math.max(conf.minPlayers, Math.min(numPlayers, conf.maxPlayers));
      
      const matchConfig = { numPlayers: finalNumPlayers };
      if (gameType === 'ito') matchConfig.setupData = { customThemes, themeMode };
      
      const [{ matchID: newMatchID }] = await Promise.all([
        lobbyClient.createMatch(gameType, matchConfig),
        new Promise(res => setTimeout(res, 950)) // 開封演出時間
      ]);

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
    } finally {
      setIsOpeningBox(false);
    }
  };

  const joinExistingMatch = async (tGameType = gameType, tMatchID = matchID) => {
    const cleanName = playerName.trim();
    if (!cleanName) return setError('プレイヤー名を入力してください');
    setError('');
    try {
      let match = null;
      let finalGameType = tGameType;
      const allGames = ['splendor', 'ito', 'haa', 'propose', 'hannin', 'crashice', 'nimmt', 'indigo', 'jinsei', 'deepsea', 'onsoku'];

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
            ) : gameType === 'jinsei' ? (
              <JinseiClient matchID={matchID} playerID={playerID} credentials={credentials} />
            ) : gameType === 'deepsea' ? (
              <DeepSeaClient matchID={matchID} playerID={playerID} credentials={credentials} />
            ) : gameType === 'onsoku' ? (
              <OnsokuClient matchID={matchID} playerID={playerID} credentials={credentials} />
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
  // ポータル トップ画面（ボードゲームラックから選択）
  // ----------------------------------------------------
  const selectedGame = GAMES_CATALOG.find(g => g.id === gameType) || GAMES_CATALOG[0];
  const allowedPlayerCounts = [];
  for (let i = selectedGame.minPlayers; i <= selectedGame.maxPlayers; i++) {
    allowedPlayerCounts.push(i);
  }

  // 上段・下段の棚に分ける
  const shelfTier1 = GAMES_CATALOG.slice(0, 5);
  const shelfTier2 = GAMES_CATALOG.slice(5);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 15%, #1e140d 0%, #120b06 50%, #070402 100%)',
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
      color: '#f8fafc',
      padding: '30px 16px 60px',
      boxSizing: 'border-box',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <style>{`
        .perspective-shelf {
          perspective: 900px;
          display: flex;
          align-items: flex-end;
          gap: 16px;
          padding: 26px 14px 4px;
          min-height: 280px;
          overflow-x: auto;
          overflow-y: visible;
          box-sizing: border-box;
          scrollbar-width: thin;
        }
        .perspective-shelf::before,
        .perspective-shelf::after {
          content: '';
          margin: auto;
          flex-shrink: 0;
          width: 0;
          height: 1px;
          pointer-events: none;
        }
        .box-3d {
          transform-style: preserve-3d;
          transform: rotateY(-20deg) rotateX(3deg);
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .box-3d:hover {
          transform: rotateY(-3deg) rotateX(0deg) translateY(-18px) scale(1.04) !important;
          filter: drop-shadow(0 22px 25px rgba(0, 0, 0, 0.85)) !important;
        }
        .box-3d.is-active {
          transform: rotateY(0deg) rotateX(0deg) translateY(-26px) scale(1.07) !important;
          filter: drop-shadow(0 26px 35px rgba(245, 158, 11, 0.55)) !important;
        }
        .spine-3d {
          position: absolute;
          top: 0;
          right: -26px;
          width: 26px;
          height: 100%;
          transform-origin: left center;
          transform: rotateY(90deg);
          box-shadow: inset 1px 0 2px rgba(255,255,255,0.25);
        }
        .top-3d {
          position: absolute;
          top: -20px;
          left: 0;
          width: 100%;
          height: 20px;
          transform-origin: bottom center;
          transform: rotateX(90deg);
          background: linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%);
        }
        .box-sheen {
          background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.03) 45%, rgba(0,0,0,0.3) 100%);
        }
        .shelf-boxes-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .shelf-boxes-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
          border-radius: 4px;
        }
        .shelf-boxes-scroll::-webkit-scrollbar-thumb {
          background: #78350f;
          border-radius: 4px;
        }
      `}</style>

      {/* 暖色系の天井間接照明グロー */}
      <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: '300px', background: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1140px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* 3D BOX OPENING OVERLAY MODAL (部屋立て時の開封アニメーション) */}
        {isOpeningBox && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 6, 3, 0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            userSelect: 'none'
          }}>
            <style>{`
              @keyframes liftBoxLid {
                0% { transform: translateY(0) rotateX(0deg) scale(1); opacity: 1; }
                45% { transform: translateY(-45px) rotateX(15deg) scale(1.03); opacity: 1; }
                100% { transform: translateY(-145px) rotateX(34deg) rotateZ(-3deg) scale(0.9); opacity: 0.8; }
              }
              @keyframes boxBurstGlow {
                0% { opacity: 0; transform: scale(0.5); }
                60% { opacity: 0.95; transform: scale(1.2); }
                100% { opacity: 1; transform: scale(1); }
              }
              @keyframes meeplePopUp {
                0% { transform: translateY(30px) scale(0); opacity: 0; }
                60% { transform: translateY(-15px) scale(1.25); opacity: 1; }
                100% { transform: translateY(0) scale(1); opacity: 1; }
              }
            `}</style>

            <div style={{ perspective: '800px', width: '210px', height: '280px', position: 'relative' }}>
              {/* Bottom Inner Box (下箱・内トレイ) */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: selectedGame.boxBg,
                borderRadius: '16px',
                border: `4px solid ${selectedGame.boxBorder}`,
                boxShadow: '0 30px 60px rgba(0,0,0,0.95), inset 0 10px 30px rgba(0,0,0,0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                boxSizing: 'border-box'
              }}>
                {/* 内部からの光の放出 */}
                <div style={{
                  position: 'absolute',
                  inset: '-40px',
                  background: `radial-gradient(circle, ${selectedGame.accentColor}99 0%, transparent 70%)`,
                  animation: 'boxBurstGlow 0.8s ease-out forwards',
                  pointerEvents: 'none'
                }} />

                {/* 飛び出すゲームアイコン */}
                <div style={{
                  fontSize: '56px',
                  animation: 'meeplePopUp 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  zIndex: 2,
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))'
                }}>
                  {selectedGame.icon}
                </div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '900',
                  color: '#ffffff',
                  marginTop: '10px',
                  zIndex: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.7)'
                }}>
                  {selectedGame.title}
                </div>
              </div>

              {/* 上に持ち上がって外れるフタ (Box Lid) */}
              <div style={{
                position: 'absolute',
                inset: '-2px',
                background: selectedGame.boxBg,
                borderRadius: '16px',
                border: `3px solid ${selectedGame.boxBorder}`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.85)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                animation: 'liftBoxLid 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                transformOrigin: 'bottom center',
                pointerEvents: 'none',
                zIndex: 5
              }}>
                <div style={{ fontSize: '44px' }}>{selectedGame.icon}</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff', marginTop: '4px' }}>
                  {selectedGame.title}
                </div>
                <div style={{ fontSize: '10px', color: '#fde047', fontWeight: 'bold', marginTop: '6px', letterSpacing: '1px' }}>
                  OPENING BOX...
                </div>
              </div>
            </div>

            <div style={{ marginTop: '36px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#fde68a', margin: '0 0 6px', letterSpacing: '1px' }}>
                📦 箱を開けています...
              </h3>
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0 }}>
                コンポーネントを取り出して待機ロビーを準備中
              </p>
            </div>
          </div>
        )}

        {/* HERO TITLE */}
        <div style={{ textAlign: 'center', margin: '10px 0 24px', padding: '0 10px' }}>
          <h1 style={{
            fontSize: 'clamp(2.1rem, 5vw, 3.4rem)',
            fontWeight: '900',
            letterSpacing: '2px',
            lineHeight: 1.3,
            margin: 0,
            padding: '6px 0',
            background: 'linear-gradient(135deg, #ffffff 40%, #fbbf24 85%, #d97706 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            BOARD GAME PORTAL
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#d4af37', fontWeight: 'bold', letterSpacing: '1px' }}>
            棚から好きなゲームの箱を選んで、テーブルに広げよう！
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div style={{
            maxWidth: '640px',
            margin: '0 auto 20px',
            background: 'rgba(239, 68, 68, 0.2)',
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
          maxWidth: '740px',
          margin: '0 auto 28px',
          background: 'rgba(40, 24, 15, 0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '16px',
          padding: '14px 20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fcd34d', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>👤</span> あなたのプレイヤー名（棚の前で遊ぶ人）
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.35)',
              flexShrink: 0
            }}>
              {playerAvatar}
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                value={playerName}
                onChange={e => handleNameChange(e.target.value)}
                maxLength={15}
                placeholder="名前を入力してください"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  background: 'rgba(15, 10, 6, 0.85)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* アバター選択ピッカー */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
              {AVATAR_LIST.map(av => (
                <button
                  key={av}
                  type="button"
                  onClick={() => handleAvatarChange(av)}
                  style={{
                    background: playerAvatar === av ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                    border: playerAvatar === av ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    width: '30px',
                    height: '30px',
                    fontSize: '16px',
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
            margin: '0 auto 28px',
            background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.3), rgba(180, 83, 9, 0.3))',
            border: '2px solid #fbbf24',
            borderRadius: '18px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 8px 25px rgba(245, 158, 11, 0.25)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '6px' }}>💌</div>
            <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: '#ffffff' }}>招待された部屋が見つかりました！</h2>
            <p style={{ color: '#fef3c7', fontSize: '13px', margin: '0 0 14px' }}>
              部屋コード: <strong style={{ fontFamily: 'monospace', fontSize: '16px', color: '#fbbf24' }}>{matchID}</strong>
            </p>
            <button
              onClick={() => joinExistingMatch()}
              style={{
                padding: '12px 36px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              🚀 この部屋に参加する！
            </button>
          </div>
        )}

        {/* ========================================================
            BOARD GAME RACK / SHELF (木製ボードゲーム棚)
           ======================================================== */}
        <div style={{
          background: 'linear-gradient(180deg, #2b180d 0%, #1a0e07 100%)',
          borderRadius: '20px',
          border: '4px solid #451a03',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85), inset 0 0 80px rgba(0,0,0,0.7)',
          padding: '24px 20px 10px',
          marginBottom: '36px',
          position: 'relative'
        }}>
          {/* ラック上部の金属ネームプレート風ヘッダー */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '14px',
            borderBottom: '2px solid #572506',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🪵</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fde68a', letterSpacing: '1px' }}>
                BOARD GAME RACK (全11作品)
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 'bold' }}>
              箱をクリックして選ぶ ⤵
            </div>
          </div>

          {/* SHELF TIER 1 (上段ラック: 4作品) */}
          <div style={{ position: 'relative', marginBottom: '28px' }}>
            <div
              className="shelf-boxes-scroll perspective-shelf"
              style={{
                position: 'relative',
                zIndex: 2
              }}
            >
              {shelfTier1.map(game => (
                <BoardGameBox
                  key={game.id}
                  game={game}
                  isSelected={gameType === game.id}
                  onClick={() => handleGameTypeChange(game.id)}
                />
              ))}
            </div>

            {/* 上段の木製シェルフ板 (Plank) */}
            <div style={{
              height: '20px',
              background: 'linear-gradient(180deg, #92400e 0%, #78350f 25%, #451a03 70%, #291002 100%)',
              borderRadius: '4px',
              borderTop: '2px solid #b45309',
              boxShadow: '0 14px 20px rgba(0,0,0,0.75), inset 0 1px 2px rgba(255,255,255,0.25)',
              position: 'relative',
              zIndex: 1
            }} />
          </div>

          {/* SHELF TIER 2 (下段ラック: 5作品) */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <div
              className="shelf-boxes-scroll perspective-shelf"
              style={{
                position: 'relative',
                zIndex: 2
              }}
            >
              {shelfTier2.map(game => (
                <BoardGameBox
                  key={game.id}
                  game={game}
                  isSelected={gameType === game.id}
                  onClick={() => handleGameTypeChange(game.id)}
                />
              ))}
            </div>

            {/* 下段の木製シェルフ板 (Plank) */}
            <div style={{
              height: '20px',
              background: 'linear-gradient(180deg, #92400e 0%, #78350f 25%, #451a03 70%, #291002 100%)',
              borderRadius: '4px',
              borderTop: '2px solid #b45309',
              boxShadow: '0 14px 20px rgba(0,0,0,0.75), inset 0 1px 2px rgba(255,255,255,0.25)',
              position: 'relative',
              zIndex: 1
            }} />
          </div>
        </div>

        {/* ========================================================
            GAMING TABLE (棚から選んだゲームを広げて準備するエリア)
           ======================================================== */}
        {!matchID && (
          <div style={{
            background: 'linear-gradient(145deg, #162a22 0%, #0d1e18 50%, #081410 100%)',
            border: `3px solid ${selectedGame.color}`,
            borderRadius: '24px',
            padding: '26px 30px',
            marginBottom: '36px',
            boxShadow: `0 14px 45px rgba(0,0,0,0.65), 0 0 30px ${selectedGame.color}35`,
            position: 'relative'
          }}>
            {/* テーブル上のフェルトマット風ヘッダー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  fontSize: '40px',
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: 'rgba(0,0,0,0.3)',
                  border: `2px solid ${selectedGame.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 14px ${selectedGame.color}40`
                }}>
                  {selectedGame.icon}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: selectedGame.color, fontWeight: 'bold' }}>
                    🛋️ プレイテーブルに広げたゲーム
                  </div>
                  <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
                    {selectedGame.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#a7f3d0' }}>
                    {selectedGame.tagline} • {selectedGame.badge}
                  </div>
                </div>
              </div>

              {/* プレイ人数セレクター (ピルボタン) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#d1fae5' }}>参加人数:</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {allowedPlayerCounts.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumPlayers(n)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: numPlayers === n ? `2px solid #fde047` : '1px solid rgba(255, 255, 255, 0.15)',
                        background: numPlayers === n ? selectedGame.gradient : 'rgba(0, 0, 0, 0.4)',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: numPlayers === n ? `0 4px 12px ${selectedGame.color}70` : 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      {n}人
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ゲーム詳細の概要 */}
            <p style={{ fontSize: '13px', color: '#d1fae5', margin: '0 0 20px', lineHeight: 1.6, background: 'rgba(0,0,0,0.25)', padding: '12px 16px', borderRadius: '10px', borderLeft: `4px solid ${selectedGame.color}` }}>
              📖 {selectedGame.desc}
            </p>

            {/* ITO 固有オプション (お題設定) */}
            {gameType === 'ito' && (
              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fdba74', marginBottom: '8px' }}>
                  🧵 ITO お題出題モード
                </div>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
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
                boxShadow: `0 8px 25px ${selectedGame.color}70`,
                transition: 'all 0.2s',
                letterSpacing: '0.5px'
              }}
            >
              🚀 箱を開けて部屋を作成！ ({numPlayers}人部屋)
            </button>
          </div>
        )}

        {/* JOIN BY CODE OR URL SECTION */}
        <div style={{
          maxWidth: '680px',
          margin: '0 auto',
          background: 'rgba(40, 24, 15, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '18px',
          padding: '22px 26px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fde68a', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>🔑</span> 友達の部屋に参加する（部屋コード または 招待URL）
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
                background: 'rgba(15, 10, 6, 0.85)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
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
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
                transition: 'all 0.15s'
              }}
            >
              参加する
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#a8a29e', marginTop: '8px' }}>
            ※ 共有された招待URLまたは部屋コードを入力すれば、どのゲームの部屋でも直接参加できます
          </div>
        </div>

        {/* FOOTER CREDITS */}
        <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '12px', color: '#78716c' }}>
          Board Game Portal © 2026 • Splendor / Ito / Haa / Propose / Hannin / Crash Ice / Nimmt / Indigo / Jinsei 47 / Deep Sea / Onsoku Hanten
        </div>

      </div>
    </div>
  );
};

export default App;
