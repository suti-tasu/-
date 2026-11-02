import React, { useState, useEffect, useRef } from 'react';
import { ROULETTE_ITEMS, HEX_DIRECTIONS, getPowerThresholds } from './CrashIceGame';
import { CrashIce3DCanvas } from './CrashIce3DCanvas';

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
  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'
  const [strikeTrigger, setStrikeTrigger] = useState(null); // { key, power, id }
  const [selectedBlockKey, setSelectedBlockKey] = useState(null);
  const [power, setPower] = useState(50);
  const [isPowerRunning, setIsPowerRunning] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [needleAngle, setNeedleAngle] = useState(() => (G.rouletteResultIndex ?? 0) * 72);
  const [fallingBlocks, setFallingBlocks] = useState([]);
  const [isBoardShaking, setIsBoardShaking] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [isGameOverDismissed, setIsGameOverDismissed] = useState(false);
  const isFirstRender = useRef(true);
  const prevLastDroppedRef = useRef([]);

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

  // 決着時：演出（崩落・ペンギン転落）を最後まで見届けてから結果ダイアログを表示
  useEffect(() => {
    if (G.winner) {
      const timer = setTimeout(() => {
        setShowGameOverModal(true);
      }, 1600);
      return () => clearTimeout(timer);
    } else {
      setShowGameOverModal(false);
      setIsGameOverDismissed(false);
    }
  }, [G.winner]);

  // 落下ブロックの物理アニメーション & 盤面揺れ演出
  useEffect(() => {
    if (G.lastDroppedKeys && G.lastDroppedKeys.length > 0) {
      if (G.lastDroppedKeys !== prevLastDroppedRef.current) {
        prevLastDroppedRef.current = G.lastDroppedKeys;
        setStrikeTrigger({ key: G.lastDroppedKeys[0], power: 65, id: Date.now() });
        setIsBoardShaking(true);
        const shakeTimer = setTimeout(() => setIsBoardShaking(false), 350);

        const newFalling = G.lastDroppedKeys.map(k => {
          const [q, r] = k.split(',').map(Number);
          return { key: k, q, r, id: `${k}-${Date.now()}` };
        });

        setFallingBlocks(prev => [...prev, ...newFalling]);

        const cleanupTimer = setTimeout(() => {
          setFallingBlocks(prev => prev.filter(b => !newFalling.some(nf => nf.id === b.id)));
        }, 750);

        return () => {
          clearTimeout(shakeTimer);
          clearTimeout(cleanupTimer);
        };
      }
    }
  }, [G.lastDroppedKeys]);

  // 相手の手番でのルーレット回転同期
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (G.rouletteResultIndex !== undefined && G.rouletteResultIndex !== null && !isActivePlayer) {
      const targetAngle = G.rouletteResultIndex * 72;
      setNeedleAngle(prev => {
        const fullRotations = 720;
        const currentMod = ((prev % 360) + 360) % 360;
        let diff = targetAngle - currentMod;
        if (diff < 0) diff += 360;
        return prev + fullRotations + diff;
      });
      setIsSpinning(true);
      const timer = setTimeout(() => setIsSpinning(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [G.rouletteResultIndex, isActivePlayer]);

  // 動くパワーゲージのアニメーションループ
  useEffect(() => {
    if (selectedBlockKey && isPowerRunning) {
      let currentVal = 50;
      let dir = 1;
      const speed = 4.8; // ゲージの移動速度 (2倍速)

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

    const targetIdx = Math.floor(Math.random() * ROULETTE_ITEMS.length);
    const targetAngle = targetIdx * 72;

    setNeedleAngle(prev => {
      const fullRotations = 1440; // 4周回転
      const currentMod = ((prev % 360) + 360) % 360;
      let diff = targetAngle - currentMod;
      if (diff < 0) diff += 360;
      return prev + fullRotations + diff;
    });

    setTimeout(() => {
      moves.spinRoulette(targetIdx);
      setIsSpinning(false);
    }, 1400);
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

    setStrikeTrigger({ key: targetKey, power: strikePower, id: Date.now() });
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
          <li><strong>方式A（構造力学アーチモード）:</strong> 六角形の氷同士が摩擦力とアーチ圧縮で耐え合っています。支持点が3点以下（対面2点、一つ空き3点、孤立点など）になると自立できず、ドサドサッと連鎖崩落します！</li>
          <li><strong>方式B（衝撃波物理シミュレーションモード）:</strong> 打撃の衝撃波が周囲の氷に伝播し、強打で隣接ブロックが直接弾き飛ばされた後、構造力学シミュレーションによって大規模な連鎖崩落が誘発されます。</li>
        </ul>

        <button onClick={() => setShowRules(false)} style={{ width: '100%', padding: '12px', background: '#00bcd4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '15px' }}>
          閉じる
        </button>
      </div>
    </div>
  );

  const missCount = G.missCount || 0;
  const thresholds = getPowerThresholds(missCount);

  // パワーの色判定
  const getPowerColor = (val) => {
    if (val <= thresholds.missMax) return '#fbc02d'; // 弱すぎ (黄)
    if (val <= thresholds.safeMax) return '#4caf50'; // 安全 (緑)
    if (val <= thresholds.strongMax) return '#ff9800'; // 強打 (オレンジ)
    return '#f44336'; // 超強打 (赤)
  };

  const getPowerLabel = (val) => {
    if (val <= thresholds.missMax) return '弱すぎ！ (不発の恐れ)';
    if (val <= thresholds.safeMax) return '安全ゾーン (1個だけ落とす)';
    if (val <= thresholds.strongMax) return '強打！ (周囲に衝撃)';
    return '💥 超強打！ (大崩落の危険)';
  };

  const isLoser = G.winner && G.loser === pid;

  // 待機ルーム（Lobby）
  if (G.gameState === 'lobby') {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '40px auto', textAlign: 'center', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        {rulesModal}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00bcd4', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, color: '#00838f' }}>🐧 クラッシュアイス - 待機ルーム</h2>
          <button onClick={() => setShowRules(true)} style={{ background: '#00838f', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em' }}>
            📖 ルール
          </button>
        </div>
        <p style={{ color: '#666', marginTop: '15px' }}>通話やチャットで準備を確認し、全員が揃ったら開始してください。</p>
        
        {/* モード選択 */}
        <div style={{ background: '#e0f7fa', padding: '15px', borderRadius: '10px', margin: '20px 0', border: '1px solid #80deea' }}>
          <div style={{ fontWeight: 'bold', color: '#006064', marginBottom: '8px' }}>ゲームモード設定</div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={() => moves.switchMode('structural')}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                background: G.mode === 'structural' ? '#00838f' : '#fff',
                color: G.mode === 'structural' ? '#fff' : '#00838f',
                border: '2px solid #00838f'
              }}
            >
              方式A：構造力学モード<br/>
              <span style={{ fontSize: '11px', fontWeight: 'normal' }}>（支持3点以下・対面2点や一つ空き3点が崩落）</span>
            </button>
            <button 
              onClick={() => moves.switchMode('physics')}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                background: G.mode === 'physics' ? '#00838f' : '#fff',
                color: G.mode === 'physics' ? '#fff' : '#00838f',
                border: '2px solid #00838f'
              }}
            >
              方式B：衝撃波物理演算モード<br/>
              <span style={{ fontSize: '11px', fontWeight: 'normal' }}>（打撃の衝撃が周囲に波及＋構造連鎖崩落）</span>
            </button>
          </div>
        </div>

        {/* 参加者リスト */}
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '10px', margin: '20px 0' }}>
          <h3 style={{ marginTop: 0, fontSize: '15px', color: '#555' }}>参加者 ({numPlayers}人)</h3>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {orderedPlayerIds.map(id => (
              <div key={id} style={{ background: id === pid ? '#b2dfdb' : '#e0f7fa', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', border: '1px solid #80deea', color: '#006064' }}>
                {getPlayerName(id)} {id === pid ? '(あなた)' : ''}
              </div>
            ))}
          </div>
        </div>

        {pid === '0' ? (
          <button 
            onClick={() => moves.startGame()} 
            style={{ padding: '16px 40px', fontSize: '1.4em', background: '#e65100', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(230,81,0,0.3)', width: '100%' }}
          >
            🚀 ゲームを開始する！
          </button>
        ) : (
          <div style={{ padding: '15px', background: '#fff9c4', borderRadius: '10px', fontWeight: 'bold', border: '2px solid #fbc02d', color: '#f57f17' }}>
            ホスト（{getPlayerName('0')}）が開始するのを待っています...
          </div>
        )}
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
          
          {/* VIEW SWITCH & TITLE BAR */}
          <div style={{ width: '100%', maxWidth: '540px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#006064', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🧊 盤面エリア {viewMode === '3d' ? '(3D物理シミュレーション)' : '(2Dフラット表示)'}
            </span>
            <button
              onClick={() => setViewMode(prev => prev === '3d' ? '2d' : '3d')}
              style={{
                background: viewMode === '3d' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#f8fafc',
                color: viewMode === '3d' ? '#fff' : '#475569',
                border: '1px solid #0284c7',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: viewMode === '3d' ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {viewMode === '3d' ? '🎮 3D物理ビュー (ON)' : '📐 2Dフラット表示'} (切替)
            </button>
          </div>

          {viewMode === '3d' ? (
            <div style={{ width: '100%', maxWidth: '540px', position: 'relative' }}>
              <CrashIce3DCanvas
                board={G.board}
                penguinPos={G.penguinFallen ? null : `${G.penguinPos.q},${G.penguinPos.r}`}
                winner={G.winner}
                selectedBlockKey={selectedBlockKey}
                onSelectBlock={handleBlockClick}
                strikeTarget={strikeTrigger}
                lastDroppedKeys={G.lastDroppedKeys}
                canInteract={isActivePlayer && G.turnStep === 'strike' && !G.winner}
                allowedColor={G.rouletteResult ? G.rouletteResult.targetColor : null}
              />
            </div>
          ) : (
            /* FIELD WRAPPER (2D) */
            <div 
              className={isBoardShaking ? 'board-shaking' : ''}
              style={{ 
                background: 'radial-gradient(circle, #ffffff 0%, #b2ebf2 70%, #80deea 100%)', 
                borderRadius: '50%', padding: '25px', boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.15), 0 10px 25px rgba(0,96,100,0.25)',
                border: '8px solid #00838f', position: 'relative'
              }}
            >
              <style>{`
                @keyframes iceFallAnim {
                  0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0.9; }
                  50% { opacity: 0.7; }
                  100% { transform: translateY(140px) scale(0.2) rotate(45deg); opacity: 0; }
                }
                @keyframes penguinFallAnim {
                  0% { transform: translateY(0) scale(1) rotate(0deg); }
                  50% { transform: translateY(60px) scale(0.8) rotate(90deg); }
                  100% { transform: translateY(180px) scale(0.1) rotate(270deg); opacity: 0; }
                }
                @keyframes boardShakeAnim {
                  0% { transform: translate(0, 0); }
                  20% { transform: translate(-5px, 3px); }
                  40% { transform: translate(5px, -3px); }
                  60% { transform: translate(-3px, -2px); }
                  80% { transform: translate(3px, 2px); }
                  100% { transform: translate(0, 0); }
                }
                .ice-falling-block {
                  animation: iceFallAnim 0.75s ease-in forwards;
                  pointer-events: none;
                }
                .penguin-tumbling {
                  animation: penguinFallAnim 1.2s ease-in forwards;
                  pointer-events: none;
                }
                .board-shaking {
                  animation: boardShakeAnim 0.35s ease-in-out;
                }
              `}</style>
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

                {/* 落下中の氷ブロック (物理落下アニメーション) */}
                {fallingBlocks.map(fb => {
                  const { x, y } = hexToPixel(fb.q, fb.r);
                  const points = getHexPolygonPoints(x, y, HEX_SIZE - 2);
                  return (
                    <g key={fb.id} className="ice-falling-block">
                      <polygon
                        points={points}
                        fill="url(#blueIce)"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        filter="url(#iceShadow)"
                      />
                    </g>
                  );
                })}

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
                        stroke={isSelected ? '#ffeb3b' : (b.isEdge ? '#006064' : '#ffffff')}
                        strokeWidth={isSelected ? 4 : 1.5}
                        filter="url(#iceShadow)"
                        style={{
                          transition: 'stroke 0.2s, stroke-width 0.2s',
                          opacity: canStrikeThis ? 1 : 0.85
                        }}
                      />
                    </g>
                  );
                })}

                {/* 中央のペンギン */}
                {(() => {
                  const { x, y } = hexToPixel(G.penguinPos.q, G.penguinPos.r);
                  return (
                    <g 
                      transform={`translate(${x}, ${y})`} 
                      className={G.penguinFallen ? 'penguin-tumbling' : ''}
                      style={{ pointerEvents: 'none' }}
                    >
                      <circle cx="0" cy="5" r="14" fill="rgba(0,0,0,0.2)" />
                      <text x="0" y="8" fontSize="28" textAnchor="middle" dominantBaseline="middle" style={{ userSelect: 'none' }}>
                        🐧
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          )}

          {/* TURN INSTRUCTION BANNER */}
          <div style={{ 
            marginTop: '12px', 
            background: G.winner ? '#ffebee' : (missCount > 0 ? '#fff3e0' : '#fff'), 
            border: G.winner ? '2px solid #ef5350' : (missCount > 0 ? '2px solid #ff9800' : 'none'),
            padding: '8px 24px', 
            borderRadius: '20px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            color: G.winner ? '#c62828' : (missCount > 0 ? '#e65100' : '#006064') 
          }}>
            {G.winner && (
              <span>🐧 決着！{getPlayerName(G.loser)} がペンギンを落としました！</span>
            )}
            {!G.winner && G.turnStep === 'spin' && (isActivePlayer ? '🎲 右側のルーレットを回してください！' : `${getPlayerName(ctx.currentPlayer)} がルーレットを回しています...`)}
            {!G.winner && G.turnStep === 'strike' && (
              isActivePlayer 
                ? (missCount > 0 
                    ? `⚠️ 力が弱すぎました！（連続ミス ${missCount} 回目）強打ゾーンが拡大中！氷を選び直して叩いてください！` 
                    : `🔨 叩く氷（${G.rouletteResult?.label}）をクリックしてください！`)
                : `${getPlayerName(ctx.currentPlayer)} が氷を狙っています...`
            )}
          </div>
        </div>

        {/* RIGHT: CONTROL PANEL & ROULETTE & LOGS */}
        <div style={{ flex: 1.6, background: '#fff', borderLeft: '2px solid #b2ebf2', display: 'flex', flexDirection: 'column', padding: '15px', gap: '15px' }}>
          
          {/* ROULETTE SECTION */}
          <div style={{ background: '#e0f7fa', padding: '15px', borderRadius: '12px', border: '1px solid #80deea', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#006064' }}>🎯 ルーレット</h3>
            
            {/* ルーレット盤面 ＋ 中央の回転針 */}
            <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto' }}>
              {/* 盤面 SVG */}
              <svg width="180" height="180" viewBox="0 0 180 180" style={{ display: 'block', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
                {/* 外枠 */}
                <circle cx="90" cy="90" r="88" fill="#fff" stroke="#00838f" strokeWidth="4" />

                {/* 5分割の扇形 (ROULETTE_ITEMS) */}
                {ROULETTE_ITEMS.map((item, i) => {
                  const startDeg = -126 + i * 72;
                  const endDeg = -54 + i * 72;
                  const centerDeg = -90 + i * 72;

                  const r = 86;
                  const x1 = 90 + r * Math.cos((startDeg * Math.PI) / 180);
                  const y1 = 90 + r * Math.sin((startDeg * Math.PI) / 180);
                  const x2 = 90 + r * Math.cos((endDeg * Math.PI) / 180);
                  const y2 = 90 + r * Math.sin((endDeg * Math.PI) / 180);

                  const pathD = `M 90 90 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

                  const isSelected = G.rouletteResult?.id === item.id;

                  // ラベル位置 (半径54px)
                  const labelR = 54;
                  const tx = 90 + labelR * Math.cos((centerDeg * Math.PI) / 180);
                  const ty = 90 + labelR * Math.sin((centerDeg * Math.PI) / 180);

                  return (
                    <g key={item.id}>
                      <path
                        d={pathD}
                        fill={item.color}
                        stroke={isSelected ? '#ffd54f' : '#ffffff'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                      />
                      {/* アイコン */}
                      <text
                        x={tx}
                        y={ty - 6}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="13"
                        style={{ userSelect: 'none' }}
                      >
                        {item.icon}
                      </text>
                      {/* テキスト短縮名 */}
                      <text
                        x={tx}
                        y={ty + 9}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                        fontWeight="bold"
                        fill={item.textColor}
                        style={{ userSelect: 'none' }}
                      >
                        {item.shortLabel}
                      </text>
                    </g>
                  );
                })}

                {/* 外枠内側の細い境界線 */}
                <circle cx="90" cy="90" r="86" fill="none" stroke="#ffffff" strokeWidth="1.5" />
              </svg>

              {/* 回転する針（ポインター）オーバーレイ */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '180px',
                height: '180px',
                pointerEvents: 'none',
                transform: `rotate(${needleAngle}deg)`,
                transformOrigin: '90px 90px',
                transition: isSpinning ? 'transform 1.4s cubic-bezier(0.12, 0.8, 0.32, 1)' : 'none',
              }}>
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <defs>
                    <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.4)" />
                    </filter>
                  </defs>

                  <g filter="url(#needleShadow)">
                    {/* 針の矢印本体（先端 y=10、真上0度を指す） */}
                    <polygon points="90,10 83,78 97,78" fill="#d32f2f" />
                    <polygon points="90,10 83,78 90,78" fill="#b71c1c" />
                    <polygon points="90,10 90,78 97,78" fill="#ef5350" />
                    <polygon points="85,78 95,78 94,90 86,90" fill="#d32f2f" />

                    {/* 矢印の反対側のテール（オモリ） */}
                    <polygon points="90,112 85,90 95,90" fill="#c62828" />

                    {/* 矢印先端の黄色いハイライト */}
                    <polygon points="90,6 87,13 93,13" fill="#ffd54f" stroke="#e65100" strokeWidth="0.5" />
                  </g>

                  {/* 中央の回転軸ピン */}
                  <circle cx="90" cy="90" r="10" fill="#37474f" stroke="#ffffff" strokeWidth="2.5" />
                  <circle cx="90" cy="90" r="6" fill="#ffd54f" />
                  <circle cx="90" cy="90" r="2.5" fill="#ffe082" />
                </svg>
              </div>
            </div>

            {/* 回すボタン */}
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={handleSpinRoulette}
                disabled={!isActivePlayer || G.turnStep !== 'spin' || isSpinning}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  background: (!isActivePlayer || G.turnStep !== 'spin' || isSpinning) ? '#cfd8dc' : 'linear-gradient(135deg, #ff9800, #f57c00)',
                  color: (!isActivePlayer || G.turnStep !== 'spin' || isSpinning) ? '#78909c' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!isActivePlayer || G.turnStep !== 'spin' || isSpinning) ? 'not-allowed' : 'pointer',
                  boxShadow: (!isActivePlayer || G.turnStep !== 'spin' || isSpinning) ? 'none' : '0 4px 10px rgba(255,152,0,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {isSpinning 
                  ? '🎯 回転中...' 
                  : (G.winner 
                      ? '🏆 ゲーム終了（決着）'
                      : (isActivePlayer && G.turnStep === 'spin' 
                          ? '🎲 ルーレットを回す！' 
                          : (G.turnStep === 'strike' ? '🔨 氷を叩く手番' : '⏳ 相手の手番待ち')))}
              </button>
            </div>

            {/* 決着時の再戦・盤面確認ボタン */}
            {G.winner && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setIsGameOverDismissed(false)}
                  style={{
                    flex: 1, padding: '10px 8px', background: '#00838f', color: '#fff',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                    boxShadow: '0 2px 6px rgba(0,131,143,0.3)'
                  }}
                >
                  📊 結果を表示
                </button>
                <button
                  onClick={() => moves.rematchGame()}
                  style={{
                    flex: 1, padding: '10px 8px', background: 'linear-gradient(135deg, #e65100, #f57c00)', color: '#fff',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                    boxShadow: '0 2px 6px rgba(230,81,0,0.3)'
                  }}
                >
                  🔄 もう一度遊ぶ
                </button>
              </div>
            )}

            {/* 出目結果バッジ */}
            {G.rouletteResult ? (
              <div style={{ 
                marginTop: '10px', 
                background: '#fff', 
                padding: '8px 12px', 
                borderRadius: '8px', 
                border: `2px solid ${G.rouletteResult.color}`, 
                fontWeight: 'bold', 
                fontSize: '13px',
                color: '#333',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>
                <span style={{ fontSize: '15px', marginRight: '6px' }}>{G.rouletteResult.icon}</span>
                <span style={{ color: G.rouletteResult.color === '#cfd8dc' || G.rouletteResult.color === '#b0bec5' ? '#37474f' : G.rouletteResult.color }}>
                  {G.rouletteResult.label}
                </span>
                {G.turnStep === 'strike' && G.remainingStrikes > 0 && (
                  <span style={{ marginLeft: '6px', fontSize: '12px', background: '#e0f2f1', color: '#00796b', padding: '2px 6px', borderRadius: '4px' }}>
                    残り {G.remainingStrikes} 個
                  </span>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '10px', color: '#78909c', fontSize: '12px' }}>
                ルーレットを回して落とす氷を決定！
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
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666' }}>
              ゲージが動いています！タイミングよく【叩く！】を押してください。
            </p>

            {missCount > 0 && (
              <div style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>
                ⚠️ 弱すぎペナルティ中！強打ゾーンが拡大しています！（連続ミス {missCount} 回目）
              </div>
            )}

            {/* パワーゲージ本体 */}
            <div style={{ background: '#eee', borderRadius: '12px', height: '30px', position: 'relative', overflow: 'hidden', border: '2px solid #ccc', marginBottom: '10px' }}>
              {/* ゾーン背景色分け */}
              <div style={{ position: 'absolute', left: '0%', width: `${thresholds.missMax}%`, height: '100%', background: 'rgba(251, 192, 45, 0.4)' }} title={`弱すぎ (0-${thresholds.missMax}%)`}></div>
              <div style={{ position: 'absolute', left: `${thresholds.missMax}%`, width: `${thresholds.safeMax - thresholds.missMax}%`, height: '100%', background: 'rgba(76, 175, 80, 0.4)' }} title={`安全ゾーン (${thresholds.missMax + 1}-${thresholds.safeMax}%)`}></div>
              <div style={{ position: 'absolute', left: `${thresholds.safeMax}%`, width: `${thresholds.strongMax - thresholds.safeMax}%`, height: '100%', background: 'rgba(255, 152, 0, 0.4)' }} title={`強打 (${thresholds.safeMax + 1}-${thresholds.strongMax}%)`}></div>
              <div style={{ position: 'absolute', left: `${thresholds.strongMax}%`, width: `${100 - thresholds.strongMax}%`, height: '100%', background: 'rgba(244, 67, 54, 0.4)' }} title={`超強打 (${thresholds.strongMax + 1}-100%)`}></div>

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
              🟡 0-{thresholds.missMax}%: 弱すぎ / 🟢 {thresholds.missMax + 1}-{thresholds.safeMax}%: 安全 / 🟠 {thresholds.safeMax + 1}-{thresholds.strongMax}%: 強打 / 🔴 {thresholds.strongMax + 1}-100%: 超強打
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

      {/* 盤面確認中の上部フローティングバー */}
      {G.winner && isGameOverDismissed && (
        <div style={{
          position: 'fixed',
          top: '55px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '10px 22px',
          borderRadius: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          zIndex: 1100,
          border: '2px solid #00838f'
        }}>
          <span style={{ fontWeight: 'bold', color: '#006064', fontSize: '14px' }}>
            🐧 盤面を確認中（敗者: {getPlayerName(G.loser)}）
          </span>
          <button
            onClick={() => setIsGameOverDismissed(false)}
            style={{
              padding: '6px 14px', background: '#00838f', color: '#fff',
              border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
            }}
          >
            📊 結果発表を表示
          </button>
          <button
            onClick={() => moves.rematchGame()}
            style={{
              padding: '6px 14px', background: '#e65100', color: '#fff',
              border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
            }}
          >
            🔄 再戦
          </button>
        </div>
      )}

      {/* GAME OVER MODAL (決着時の中央ダイアログ) */}
      {showGameOverModal && !isGameOverDismissed && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '20px'
        }}>
          <div style={{
            background: isLoser ? '#fff5f5' : '#f0fdf4',
            borderRadius: '20px',
            maxWidth: '460px',
            width: '100%',
            padding: '30px',
            textAlign: 'center',
            boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
            border: isLoser ? '3px solid #ef5350' : '3px solid #4caf50'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '10px' }}>
              {isLoser ? '💀🐧💦' : '🎉👑🐧'}
            </div>
            
            <h2 style={{ fontSize: '24px', margin: '0 0 10px 0', color: isLoser ? '#c62828' : '#2e7d32' }}>
              {isLoser ? 'ペンギン落下！あなたの敗北…！' : 'ペンギン生存！あなたの勝利！'}
            </h2>

            <p style={{ fontSize: '15px', color: '#555', marginBottom: '20px', fontWeight: 'bold' }}>
              {G.winnerDetails}
            </p>

            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#777', borderBottom: '1px solid #eee', paddingBottom: '6px', marginBottom: '10px' }}>
                最終リザルト
              </div>
              <div style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '16px', marginBottom: '6px' }}>
                💀 敗者: {getPlayerName(G.loser)}
              </div>
              <div style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '15px' }}>
                👑 勝者: 生き残ったプレイヤー全員
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsGameOverDismissed(true)}
                  style={{
                    flex: 1, padding: '12px', background: '#eceff1', color: '#37474f',
                    border: '1px solid #cfd8dc', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '14px'
                  }}
                >
                  👁️ 盤面を確認する
                </button>
                <button
                  onClick={() => moves.rematchGame()}
                  style={{
                    flex: 1.4, padding: '12px', background: 'linear-gradient(135deg, #00acc1, #00838f)',
                    color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 10px rgba(0,131,143,0.3)'
                  }}
                >
                  🔄 もう一度遊ぶ（再戦）
                </button>
              </div>

              <button
                onClick={() => window.location.href = window.location.pathname}
                style={{
                  padding: '10px', background: 'transparent', color: '#78909c',
                  border: 'none', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline'
                }}
              >
                🚪 ロビー（部屋選択）に戻る
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
