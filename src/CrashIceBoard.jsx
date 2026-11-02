import React, { useState, useEffect, useRef } from 'react';
import { ROULETTE_ITEMS, HEX_DIRECTIONS } from './CrashIceGame';

// 六角形の描画計算用ヘルパー
const HEX_SIZE = 34; // 六角形の半径 (px)

const hexToPixel = (q, r) => {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * ((3 / 2) * r);
  return { x, y };
};

// 六角形のSVGパス生成 (尖った頭 Pointy-topped)
const getHexPolygonPoints = (cx, cy, r) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i + 30);
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  return points.join(' ');
};

export const CrashIceBoard = ({ G, ctx, moves, playerID, matchData }) => {
  const [selectedBlockKey, setSelectedBlockKey] = useState(null);
  const [power, setPower] = useState(50);
  const [isPowerRunning, setIsPowerRunning] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteAngle, setRouletteAngle] = useState(0);

  const powerAnimRef = useRef(null);
  const powerDirectionRef = useRef(1); // 1 = 増加, -1 = 減少

  const pid = playerID || '0';
  const isActivePlayer = ctx.currentPlayer === pid;

  const getPlayerName = (id) => {
    const p = matchData?.find(m => m.id == id);
    return p && p.name ? p.name : `Player ${id}`;
  };

  // 時計回りの席順
  const numPlayers = ctx.numPlayers;
  const myIdx = parseInt(pid, 10);
  const orderedPlayerIds = [];
  for (let i = 0; i < numPlayers; i++) {
    const targetIdx = (myIdx + i) % numPlayers;
    orderedPlayerIds.push(targetIdx.toString());
  }

  // 動くパワーゲージのアニメーションループ
  useEffect(() => {
    if (selectedBlockKey && isPowerRunning) {
      let currentVal = 50;
      let dir = 1;
      const speed = 2.4; // ゲージの移動速度

      const loop = () => {
        currentVal += dir * speed;
        if (currentVal >= 100) {
          currentVal = 100;
          dir = -1;
        } else if (currentVal <= 0) {
          currentVal = 0;
          dir = 1;
        }
        setPower(Math.round(currentVal));
        powerAnimRef.current = requestAnimationFrame(loop);
      };

      powerAnimRef.current = requestAnimationFrame(loop);

      return () => {
        if (powerAnimRef.current) cancelAnimationFrame(powerAnimRef.current);
      };
    }
  }, [selectedBlockKey, isPowerRunning]);

  // ルーレット回転処理
  const handleSpinRoulette = () => {
    if (isSpinning || !isActivePlayer || G.turnStep !== 'spin' || G.winner) return;
    setIsSpinning(true);
    const addedAngle = 1080 + Math.floor(Math.random() * 360);
    setRouletteAngle(prev => prev + addedAngle);

    setTimeout(() => {
      moves.spinRoulette();
      setIsSpinning(false);
    }, 1200);
  };

  // 氷クリック
  const handleBlockClick = (key) => {
    if (!isActivePlayer || G.turnStep !== 'strike' || G.winner) return;
    const block = G.board[key];
    if (!block) return;

    // 色指定チェック
    if (G.rouletteResult && G.rouletteResult.targetColor !== 'any') {
      if (block.color !== G.rouletteResult.targetColor) {
        return;
      }
    }

    setSelectedBlockKey(key);
    setIsPowerRunning(true);
  };

  // 叩く実行（パワー確定）
  const handleStrike = () => {
    if (!selectedBlockKey) return;
    setIsPowerRunning(false);
    if (powerAnimRef.current) cancelAnimationFrame(powerAnimRef.current);

    const targetKey = selectedBlockKey;
    const strikePower = power;
    setSelectedBlockKey(null);

    moves.strikeBlock(targetKey, strikePower);
  };

  // ルールモーダル
  const rulesModal = showRules && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '550px', width: '90%', maxHeight: '80vh', overflowY: 'auto', textAlign: 'left' }}>
        <h2 style={{ marginTop: 0, borderBottom: '2px solid #00bcd4', paddingBottom: '10px', color: '#00838f' }}>🐧 クラッシュアイスゲーム ルール</h2>
        
        <h3 style={{ color: '#0277bd' }}>🎯 目的</h3>
        <p>氷ブロックを叩き落としていき、**中央のペンギンを下に落としてしまったプレイヤーが負け**です！</p>

        <h3 style={{ color: '#00897b' }}>🔨 ゲームの流れ</h3>
        <ol style={{ lineHeight: 1.6 }}>
          <li>自分の番が来たら、まず**「ルーレット」**を回します。</li>
          <li>ルーレットで指定された色（青、白、好きな色、2個）の氷ブロックをクリックします。</li>
          <li>**動くパワーゲージ**がスタートします！タイミングよく**「叩く！」**ボタンを押して強さを決定します。</li>
          <li>弱すぎると氷が落ちず、強すぎると周囲の氷も崩れてペンギンが落ちる危険が高まります！</li>
          <li>ペンギンが落ちずに氷を落とせたら、次のプレイヤーにターンが移ります。</li>
        </ol>

        <h3 style={{ color: '#e65100' }}>🔄 2つのゲームモード</h3>
        <ul>
          <li><strong>方式A（構造連結モード）:</strong> 外枠と繋がっている氷だけが残り、支えを失った氷の塊が一気にドサドサッと連鎖落下します。</li>
          <li><strong>方式B（物理演算モード）:</strong> 打撃の衝撃波が周囲の氷に伝わり、ヒビが入ったり耐えきれなくなった氷が崩れます。</li>
        </ul>

        <button onClick={() => setShowRules(false)} style={{ width: '100%', padding: '12px', background: '#00bcd4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '15px' }}>
          閉じる
        </button>
      </div>
    </div>
  );

  // パワーの色判定
  const getPowerColor = (val) => {
    if (val < 25) return '#fbc02d'; // 弱すぎ (黄)
    if (val <= 60) return '#4caf50'; // 安全 (緑)
    if (val <= 84) return '#ff9800'; // 強打 (オレンジ)
    return '#f44336'; // 超強打 (赤)
  };

  const getPowerLabel = (val) => {
    if (val < 25) return '弱すぎ！ (不発の恐れ)';
    if (val <= 60) return '安全ゾーン (1個だけ落とす)';
    if (val <= 84) return '強打！ (周囲に衝撃)';
    return '💥 超強打！ (大崩落の危険)';
  };

  // 勝敗画面
  if (G.winner) {
    const isLoser = G.loser === pid;
    return (
      <div style={{ minHeight: '100vh', background: isLoser ? '#ffebee' : '#e8f5e9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '70px', marginBottom: '10px', animation: 'bounce 1s infinite' }}>
          {isLoser ? '💀🐧💦' : '🎉👑🐧'}
        </div>
        <h1 style={{ fontSize: '2.5em', color: isLoser ? '#c62828' : '#2e7d32', margin: '0 0 10px 0' }}>
          {isLoser ? 'あなたがペンギンを落としました！敗北！' : 'ペンギン生存！あなたの勝利！'}
        </h1>
        <p style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#555', marginBottom: '25px' }}>
          {G.winnerDetails}
        </p>

        <div style={{ background: '#fff', padding: '25px 40px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', marginBottom: '30px', maxWidth: '400px', width: '100%' }}>
          <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #ddd', paddingBottom: '8px' }}>結果発表</h3>
          <div style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '18px', margin: '8px 0' }}>
            💀 敗者: {getPlayerName(G.loser)}
          </div>
          <div style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '16px', margin: '8px 0' }}>
            👑 勝者: 生き残ったプレイヤー全員
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => window.location.href = window.location.pathname} style={{ padding: '14px 28px', fontSize: '16px', background: '#757575', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            🚪 ロビーに戻る
          </button>
          <button onClick={() => moves.rematchGame()} style={{ padding: '14px 28px', fontSize: '16px', background: '#00bcd4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            🔄 もう一度遊ぶ（再戦）
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'linear-gradient(135deg, #e0f7fa 0%, #bbdefb 100%)', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {rulesModal}

      {/* TOP HEADER */}
      <div style={{ background: '#006064', color: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>🐧 クラッシュアイス - {getPlayerName(pid)}</span>
          <button onClick={() => setShowRules(true)} style={{ background: '#00838f', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            📖 ルール
          </button>
        </div>

        {/* MODE SWITCHER */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '20px', gap: '5px' }}>
          <span style={{ fontSize: '12px' }}>モード:</span>
          <button 
            onClick={() => moves.switchMode('structural')}
            style={{ 
              background: G.mode === 'structural' ? '#fff' : 'transparent', 
              color: G.mode === 'structural' ? '#006064' : '#fff', 
              border: 'none', padding: '4px 10px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'
            }}
          >
            方式A: 構造連結
          </button>
          <button 
            onClick={() => moves.switchMode('physics')}
            style={{ 
              background: G.mode === 'physics' ? '#fff' : 'transparent', 
              color: G.mode === 'physics' ? '#006064' : '#fff', 
              border: 'none', padding: '4px 10px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'
            }}
          >
            方式B: 物理演算
          </button>
        </div>

        <div>
          {isActivePlayer ? (
            <span style={{ background: '#ffeb3b', color: '#333', padding: '4px 10px', borderRadius: '15px', fontWeight: 'bold', fontSize: '14px' }}>
              🎯 あなたのターン
            </span>
          ) : (
            <span style={{ fontSize: '14px' }}>{getPlayerName(ctx.currentPlayer)} の手番待ち...</span>
          )}
        </div>
      </div>

      {/* SEATING ORDER BAR */}
      <div style={{ background: 'rgba(255,255,255,0.85)', padding: '8px 20px', borderBottom: '1px solid #b2ebf2', display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00838f', whiteSpace: 'nowrap' }}>🔄 順番（時計回り）:</span>
        {orderedPlayerIds.map((id, index) => {
          const isMe = id === pid;
          const isCurrent = ctx.currentPlayer === id;
          return (
            <React.Fragment key={id}>
              {index > 0 && <span style={{ color: '#999' }}>➔</span>}
              <div style={{ 
                background: isCurrent ? '#ff9800' : (isMe ? '#b2dfdb' : '#fff'), 
                color: isCurrent ? '#fff' : '#333',
                padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold',
                border: isCurrent ? '2px solid #e65100' : '1px solid #ccc',
                boxShadow: isCurrent ? '0 0 6px rgba(255,152,0,0.6)' : 'none',
                whiteSpace: 'nowrap'
              }}>
                {getPlayerName(id)} {isMe ? '(あなた)' : ''} {isCurrent ? '⚡手番' : ''}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* LEFT / CENTER: ICE FIELD */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '10px' }}>
          
          {/* FIELD WRAPPER */}
          <div style={{ 
            background: 'radial-gradient(circle, #ffffff 0%, #b2ebf2 70%, #80deea 100%)', 
            borderRadius: '50%', padding: '25px', boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.15), 0 10px 25px rgba(0,96,100,0.25)',
            border: '8px solid #00838f', position: 'relative'
          }}>
            <svg width="460" height="420" viewBox="-230 -210 460 420" style={{ overflow: 'visible' }}>
              <defs>
                {/* 氷ブロックのグラデーション */}
                <radialGradient id="blueIce" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#80d8ff" />
                  <stop offset="50%" stopColor="#29b6f6" />
                  <stop offset="100%" stopColor="#0288d1" />
                </radialGradient>
                <radialGradient id="whiteIce" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#eceff1" />
                  <stop offset="100%" stopColor="#b0bec5" />
                </radialGradient>
                <filter id="iceShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="1" dy="3" stdDeviation="2" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* 外枠 */}
              <circle cx="0" cy="0" r="195" fill="none" stroke="#004d40" strokeWidth="4" strokeDasharray="6,4" opacity="0.4" />

              {/* 氷ブロック一覧 */}
              {Object.keys(G.board).map(key => {
                const b = G.board[key];
                const { x, y } = hexToPixel(b.q, b.r);
                const isSelected = selectedBlockKey === key;
                const points = getHexPolygonPoints(x, y, HEX_SIZE - 2);

                const isTargetColor = !G.rouletteResult || G.rouletteResult.targetColor === 'any' || G.rouletteResult.targetColor === b.color;
                const canStrikeThis = isActivePlayer && G.turnStep === 'strike' && isTargetColor;

                return (
                  <g 
                    key={key} 
                    onClick={() => canStrikeThis && handleBlockClick(key)}
                    style={{ cursor: canStrikeThis ? 'pointer' : 'default', transition: 'transform 0.1s' }}
                  >
                    <polygon
                      points={points}
                      fill={b.color === 'blue' ? 'url(#blueIce)' : 'url(#whiteIce)'}
                      stroke={isSelected ? '#ffeb3b' : (b.cracked ? '#e53935' : (b.isEdge ? '#006064' : '#ffffff'))}
                      strokeWidth={isSelected ? 4 : (b.cracked ? 2.5 : 1.5)}
                      filter="url(#iceShadow)"
                      style={{
                        transition: 'stroke 0.2s, stroke-width 0.2s',
                        opacity: canStrikeThis ? 1 : 0.85
                      }}
                    />
                    {/* ヒビのエフェクト */}
                    {b.cracked && (
                      <path
                        d={`M ${x-10} ${y-10} L ${x+2} ${y+2} L ${x-4} ${y+12} M ${x+2} ${y+2} L ${x+12} ${y-4}`}
                        stroke="#b71c1c"
                        strokeWidth="2"
                        fill="none"
                      />
                    )}
                  </g>
                );
              })}

              {/* 中央のペンギン */}
              {!G.penguinFallen && (() => {
                const { x, y } = hexToPixel(G.penguinPos.q, G.penguinPos.r);
                return (
                  <g transform={`translate(${x}, ${y})`} style={{ pointerEvents: 'none' }}>
                    <circle cx="0" cy="5" r="14" fill="rgba(0,0,0,0.2)" />
                    <text x="0" y="8" fontSize="28" textAnchor="middle" dominantBaseline="middle" style={{ userSelect: 'none' }}>
                      🐧
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>

          {/* TURN INSTRUCTION BANNER */}
          <div style={{ marginTop: '12px', background: '#fff', padding: '8px 24px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '14px', fontWeight: 'bold', color: '#006064' }}>
            {G.turnStep === 'spin' && (isActivePlayer ? '🎲 右側のルーレットを回してください！' : `${getPlayerName(ctx.currentPlayer)} がルーレットを回しています...`)}
            {G.turnStep === 'strike' && (isActivePlayer ? `🔨 叩く氷（${G.rouletteResult?.label}）をクリックしてください！` : `${getPlayerName(ctx.currentPlayer)} が氷を狙っています...`)}
          </div>
        </div>

        {/* RIGHT: CONTROL PANEL & ROULETTE & LOGS */}
        <div style={{ flex: 1.6, background: '#fff', borderLeft: '2px solid #b2ebf2', display: 'flex', flexDirection: 'column', padding: '15px', gap: '15px' }}>
          
          {/* ROULETTE SECTION */}
          <div style={{ background: '#e0f7fa', padding: '15px', borderRadius: '10px', border: '1px solid #80deea', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#006064' }}>🎯 ルーレット</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              {/* ルーレット盤 */}
              <div style={{ 
                width: '100px', height: '100px', borderRadius: '50%', border: '4px solid #00838f',
                position: 'relative', overflow: 'hidden', boxShadow: '0 3px 6px rgba(0,0,0,0.2)',
                transform: `rotate(${rouletteAngle}deg)`, transition: isSpinning ? 'transform 1.2s cubic-bezier(0.2, 0.8, 0.3, 1)' : 'none'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '50%', background: '#29b6f6' }}></div>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '50%', background: '#cfd8dc' }}></div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '50%', height: '50%', background: '#4caf50' }}></div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', background: '#ff9800' }}></div>
              </div>

              <div>
                <button
                  onClick={handleSpinRoulette}
                  disabled={!isActivePlayer || G.turnStep !== 'spin' || isSpinning}
                  style={{
                    padding: '12px 20px', fontSize: '15px', fontWeight: 'bold',
                    background: (!isActivePlayer || G.turnStep !== 'spin' || isSpinning) ? '#ccc' : '#ff9800',
                    color: '#fff', border: 'none', borderRadius: '8px', cursor: (!isActivePlayer || G.turnStep !== 'spin' || isSpinning) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.15)'
                  }}
                >
                  {isSpinning ? '回転中...' : '🎲 ルーレットを回す'}
                </button>
              </div>
            </div>

            {G.rouletteResult && (
              <div style={{ marginTop: '12px', background: '#fff', padding: '8px', borderRadius: '6px', border: `2px solid ${G.rouletteResult.color}`, fontWeight: 'bold', color: G.rouletteResult.color, fontSize: '14px' }}>
                出目: {G.rouletteResult.label} {G.remainingStrikes > 0 ? `(残り${G.remainingStrikes}個)` : ''}
              </div>
            )}
          </div>

          {/* SYSTEM LOGS */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', borderRadius: '8px', border: '1px solid #ddd', overflow: 'hidden' }}>
            <div style={{ background: '#f0f0f0', padding: '8px 12px', fontWeight: 'bold', fontSize: '13px', color: '#555' }}>
              📜 プレイ履歴
            </div>
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto', fontSize: '13px', lineHeight: 1.5, color: '#444' }}>
              {G.logs.slice().reverse().map((log, i) => (
                <div key={i} style={{ marginBottom: '6px', borderBottom: '1px dashed #eee', paddingBottom: '4px' }}>
                  {log.replace(/Player (\d+)/g, (match, id) => getPlayerName(id))}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* STRIKE POWER GAUGE MODAL (氷を選択したときに画面中央に表示) */}
      {selectedBlockKey && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '15px', maxWidth: '420px', width: '100%', padding: '25px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#00838f' }}>🔨 ハンマーで叩く強さを決定！</h3>
            <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#666' }}>
              ゲージが動いています！タイミングよく【叩く！】を押してください。
            </p>

            {/* パワーゲージ本体 */}
            <div style={{ background: '#eee', borderRadius: '12px', height: '30px', position: 'relative', overflow: 'hidden', border: '2px solid #ccc', marginBottom: '10px' }}>
              {/* ゾーン背景色分け */}
              <div style={{ position: 'absolute', left: '0%', width: '25%', height: '100%', background: 'rgba(251, 192, 45, 0.4)' }} title="弱すぎ (0-24%)"></div>
              <div style={{ position: 'absolute', left: '25%', width: '35%', height: '100%', background: 'rgba(76, 175, 80, 0.4)' }} title="安全ゾーン (25-60%)"></div>
              <div style={{ position: 'absolute', left: '60%', width: '24%', height: '100%', background: 'rgba(255, 152, 0, 0.4)' }} title="強打 (61-84%)"></div>
              <div style={{ position: 'absolute', left: '84%', width: '16%', height: '100%', background: 'rgba(244, 67, 54, 0.4)' }} title="超強打 (85-100%)"></div>

              {/* 移動するインジケーター針 */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${power}%`,
                width: '6px',
                background: '#000',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 4px #fff'
              }}></div>
            </div>

            {/* パワー値表示 */}
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: getPowerColor(power), marginBottom: '5px' }}>
              {power}% - {getPowerLabel(power)}
            </div>

            <div style={{ fontSize: '11px', color: '#888', marginBottom: '20px' }}>
              🟡 0-24%: 弱すぎ / 🟢 25-60%: 安全 / 🟠 61-84%: 強打 / 🔴 85-100%: 超強打
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setSelectedBlockKey(null)}
                style={{ flex: 1, padding: '12px', background: '#eee', color: '#555', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
              >
                キャンセル
              </button>
              <button 
                onClick={handleStrike}
                style={{ 
                  flex: 2, padding: '12px', background: '#e65100', color: '#fff', 
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px',
                  boxShadow: '0 4px 10px rgba(230,81,0,0.3)'
                }}
              >
                🔨 叩く！（HIT）
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
