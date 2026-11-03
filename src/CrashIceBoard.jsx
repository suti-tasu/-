import React, { useState, useEffect, useRef } from 'react';
import { ROULETTE_ITEMS, HEX_DIRECTIONS } from './CrashIceGame';
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

// ==========================================
// トーナメント表描画コンポーネント (Bracket Tree)
// ==========================================
export const TournamentBracketView = ({ tournament, getPlayerName, activeMatchId }) => {
  if (!tournament || !tournament.matches || tournament.matches.length === 0) {
    return (
      <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>
        参加者が2名以上になるとトーナメント表が生成されます
      </div>
    );
  }

  // ラウンドごとにマッチをグルーピング
  const rounds = {};
  tournament.matches.forEach(m => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: '20px',
      overflowX: 'auto',
      padding: '16px 10px',
      alignItems: 'stretch',
      justifyContent: 'center',
      minHeight: '220px'
    }}>
      {roundNumbers.map(roundNum => {
        const matchesInRound = rounds[roundNum];
        const roundTitle = matchesInRound[0]?.roundName || `Round ${roundNum}`;

        return (
          <div key={roundNum} style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '180px' }}>
            <div style={{
              background: '#00838f',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {roundTitle}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'space-around', flex: 1 }}>
              {matchesInRound.map(match => {
                const isActive = match.id === activeMatchId;
                const isFinished = match.winner !== null;

                return (
                  <div
                    key={match.id}
                    style={{
                      background: isActive ? '#fffde7' : (isFinished ? '#f8fafc' : '#ffffff'),
                      border: isActive ? '2px solid #ff9800' : (isFinished ? '1px solid #cbd5e1' : '1px solid #94a3b8'),
                      borderRadius: '10px',
                      padding: '10px 12px',
                      boxShadow: isActive ? '0 0 12px rgba(255,152,0,0.45)' : '0 2px 6px rgba(0,0,0,0.06)',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: isActive ? '#e65100' : '#64748b', fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{match.name}</span>
                      {isActive && <span style={{ color: '#e65100', fontWeight: 'bold' }}>⚡ 試合中</span>}
                      {isFinished && <span style={{ color: '#16a34a' }}>✓ 決着</span>}
                    </div>

                    {/* Slot 1 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      background: match.winner === match.p1 && match.p1 !== null ? '#dcfce7' : (match.loser === match.p1 ? '#f1f5f9' : '#ffffff'),
                      border: match.winner === match.p1 ? '1px solid #86efac' : '1px solid #e2e8f0',
                      marginBottom: '4px',
                      fontSize: '13px',
                      fontWeight: match.winner === match.p1 ? 'bold' : 'normal',
                      color: match.loser === match.p1 ? '#94a3b8' : '#1e293b'
                    }}>
                      <span>{match.p1 !== null ? getPlayerName(match.p1) : '勝者枠'}</span>
                      {match.winner === match.p1 && match.p1 !== null && <span style={{ color: '#16a34a', fontSize: '12px' }}>👑 勝</span>}
                    </div>

                    {/* Slot 2 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      background: match.winner === match.p2 && match.p2 !== null ? '#dcfce7' : (match.loser === match.p2 ? '#f1f5f9' : '#ffffff'),
                      border: match.winner === match.p2 ? '1px solid #86efac' : '1px solid #e2e8f0',
                      fontSize: '13px',
                      fontWeight: match.winner === match.p2 ? 'bold' : 'normal',
                      color: match.loser === match.p2 ? '#94a3b8' : '#1e293b'
                    }}>
                      <span>{match.p2 !== null ? getPlayerName(match.p2) : '勝者枠'}</span>
                      {match.winner === match.p2 && match.p2 !== null && <span style={{ color: '#16a34a', fontSize: '12px' }}>👑 勝</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 🏆 チャンピオン枠 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '150px', padding: '10px' }}>
        <div style={{ fontSize: '38px', marginBottom: '6px' }}>🏆</div>
        <div style={{ fontWeight: 'bold', color: '#b45309', fontSize: '14px' }}>トーナメント王者</div>
        <div style={{
          marginTop: '8px',
          background: tournament.champion ? 'linear-gradient(135deg, #fef08a, #fde047)' : '#f1f5f9',
          color: tournament.champion ? '#854d0e' : '#94a3b8',
          border: tournament.champion ? '2px solid #eab308' : '1px dashed #cbd5e1',
          padding: '8px 16px',
          borderRadius: '20px',
          fontWeight: 'bold',
          fontSize: '14px',
          textAlign: 'center',
          boxShadow: tournament.champion ? '0 4px 12px rgba(234,179,8,0.35)' : 'none'
        }}>
          {tournament.champion ? getPlayerName(tournament.champion) : '？？？'}
        </div>
      </div>
    </div>
  );
};

export const CrashIceBoard = ({ G, ctx, moves, playerID, matchData }) => {
  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'
  const [strikeTrigger, setStrikeTrigger] = useState(null); // { key, power, id }
  const [selectedBlockKey, setSelectedBlockKey] = useState(null);
  const [power, setPower] = useState(50);
  const [isDraggingPower, setIsDraggingPower] = useState(false);
  const [isStrikingAnim, setIsStrikingAnim] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [needleAngle, setNeedleAngle] = useState(() => (G.rouletteResultIndex ?? 0) * 72);
  const [fallingBlocks, setFallingBlocks] = useState([]);
  const [isBoardShaking, setIsBoardShaking] = useState(false);

  // ダイアログ状態管理
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [isGameOverDismissed, setIsGameOverDismissed] = useState(false);
  const [showIntermissionModal, setShowIntermissionModal] = useState(false);
  const [isIntermissionDismissed, setIsIntermissionDismissed] = useState(false);

  const isFirstRender = useRef(true);
  const prevLastDroppedRef = useRef([]);

  const powerBarRef = useRef(null);

  const pid = playerID || '0';
  const isActivePlayer = ctx.currentPlayer === pid;

  const getPlayerName = (id) => {
    if (id === null || id === undefined) return '未定';
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

  // トーナメント中のアクティブ対戦者判定
  const activeMatch = G.gameFormat === 'tournament' ? G.tournament?.activeMatch : null;
  const isCompetitor = G.gameFormat !== 'tournament' || !activeMatch || (activeMatch.p1 === pid || activeMatch.p2 === pid);
  const isSpectator = G.gameFormat === 'tournament' && activeMatch && !isCompetitor;

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

  // トーナメント戦：各試合終了後のインターミッションダイアログ
  useEffect(() => {
    if (G.gameState === 'intermission' && G.gameFormat === 'tournament') {
      const timer = setTimeout(() => {
        setShowIntermissionModal(true);
      }, 1600);
      return () => clearTimeout(timer);
    } else {
      setShowIntermissionModal(false);
      setIsIntermissionDismissed(false);
    }
  }, [G.gameState, G.gameFormat]);

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

  // 相手の手番での打撃アニメーション同期 (弱打撃含む)
  const prevStrikeEventIdRef = useRef(null);
  useEffect(() => {
    if (G.lastStrikeEvent && G.lastStrikeEvent.id !== prevStrikeEventIdRef.current) {
      prevStrikeEventIdRef.current = G.lastStrikeEvent.id;
      if (!isActivePlayer) {
        setStrikeTrigger({
          key: G.lastStrikeEvent.key,
          power: G.lastStrikeEvent.power,
          id: G.lastStrikeEvent.id
        });
      }
    }
  }, [G.lastStrikeEvent, isActivePlayer]);

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

  // パワーゲージのマウスドラッグ操作処理 (動くゲージではなくドラッグで強さを決定)
  const updatePowerFromPointer = useCallback((clientX) => {
    if (!powerBarRef.current) return;
    const rect = powerBarRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const rawRatio = (clientX - rect.left) / rect.width;
    const clampedRatio = Math.max(0, Math.min(1, rawRatio));
    const newPower = Math.round(clampedRatio * 100);
    setPower(newPower);
  }, []);

  const handlePowerPointerDown = (e) => {
    e.preventDefault();
    setIsDraggingPower(true);
    updatePowerFromPointer(e.clientX);
    if (e.target.setPointerCapture) {
      try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
    }
  };

  useEffect(() => {
    if (!isDraggingPower) return;

    const handleWindowPointerMove = (e) => {
      updatePowerFromPointer(e.clientX);
    };

    const handleWindowPointerUp = (e) => {
      setIsDraggingPower(false);
      updatePowerFromPointer(e.clientX);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [isDraggingPower, updatePowerFromPointer]);

  // ルーレット回転処理
  const handleSpinRoulette = () => {
    if (isSpinning || !isActivePlayer || G.turnStep !== 'spin' || G.winner || isSpectator) return;
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
    if (!isActivePlayer || G.turnStep !== 'strike' || G.winner || isSpectator) return;
    const block = G.board[key];
    if (!block) return;

    // 色指定チェック
    if (G.rouletteResult && G.rouletteResult.targetColor !== 'any') {
      if (block.color !== G.rouletteResult.targetColor) {
        return;
      }
    }

    setSelectedBlockKey(key);
    // 初期パワーを安全な位置（50%）にセット
    setPower(50);
  };

  // 叩く実行（パワー確定）
  const handleStrike = () => {
    if (!selectedBlockKey || isStrikingAnim || !isActivePlayer || isSpectator) return;
    setIsDraggingPower(false);

    const targetKey = selectedBlockKey;
    const strikePower = power;

    // 叩くアニメーションをトリガー
    setStrikeTrigger({ key: targetKey, power: strikePower, id: Date.now() });

    if (strikePower < 15) {
      // 力が弱すぎた場合: 一時的に演出を見せ、同じブロックで再開
      setIsStrikingAnim(true);
      moves.strikeBlock(targetKey, strikePower);

      setTimeout(() => {
        setIsStrikingAnim(false);
      }, 420);
    } else {
      // 充分な力がある場合: ブロックが落ちて選択解除
      setSelectedBlockKey(null);
      moves.strikeBlock(targetKey, strikePower);
    }
  };

  // ルールモーダル
  const rulesModal = showRules && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '550px', width: '90%', maxHeight: '80vh', overflowY: 'auto', textAlign: 'left' }}>
        <h2 style={{ marginTop: 0, borderBottom: '2px solid #00bcd4', paddingBottom: '10px', color: '#00838f' }}>🐧 クラッシュアイスゲーム ルール</h2>
        
        <h3 style={{ color: '#0277bd' }}>🎯 目的</h3>
        <p>氷ブロックを叩き落としていき、**中央のペンギンを下に落としてしまったプレイヤーが負け**です！</p>

        <h3 style={{ color: '#00897b' }}>🏆 2つの対戦モード</h3>
        <ul style={{ lineHeight: 1.6 }}>
          <li>**通常サバイバル対戦:** 参加者全員で1つの氷盤面を囲み、ペンギンを落とした1名が即敗北、生き残った全員が勝利となります。</li>
          <li>**1対1トーナメント:** 2人〜8人対応の本格トーナメント戦！ 各試合2名が対戦し、他のプレイヤーはリアルタイムに3D盤面を観戦。勝ち抜いた勝者が決勝へ進出し王者を決定します。</li>
        </ul>

        <h3 style={{ color: '#00897b' }}>🔨 ゲームの流れ</h3>
        <ol style={{ lineHeight: 1.6 }}>
          <li>自分の番が来たら、まず**「ルーレット」**を回します。</li>
          <li>ルーレットで指定された色（青、白、好きな色、2個）の氷ブロックをクリックします。</li>
          <li>**動くパワーゲージ**がスタートします！タイミングよく**「叩く！」**ボタンを押して強さを決定します。</li>
          <li>弱すぎると氷が抜けず（同じブロックを再打撃）、強すぎると周囲の氷も崩れてペンギンが落ちる危険が高まります！</li>
          <li>ペンギンが落ちずに氷を落とせたら、相手にターンが移ります。</li>
        </ol>

        <button onClick={() => setShowRules(false)} style={{ width: '100%', padding: '12px', background: '#00bcd4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '15px' }}>
          閉じる
        </button>
      </div>
    </div>
  );

  // トーナメント表モーダル (対戦中いつでも確認可能)
  const bracketModal = showBracketModal && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1150, padding: '20px' }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '850px', width: '95%', maxHeight: '85vh', overflowY: 'auto', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00838f', paddingBottom: '12px', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, color: '#00838f', fontSize: '20px' }}>🏆 1対1トーナメント表</h2>
          <button onClick={() => setShowBracketModal(false)} style={{ background: '#eceff1', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            ✕
          </button>
        </div>

        <TournamentBracketView
          tournament={G.tournament}
          getPlayerName={getPlayerName}
          activeMatchId={G.tournament?.activeMatchId}
        />

        <button onClick={() => setShowBracketModal(false)} style={{ width: '100%', padding: '12px', background: '#00838f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '16px' }}>
          盤面に戻る
        </button>
      </div>
    </div>
  );

  // 待機ルーム（Lobby）
  if (G.gameState === 'lobby') {
    const isTournament = G.gameFormat === 'tournament';

    return (
      <div style={{ padding: '24px 20px', fontFamily: 'sans-serif', maxWidth: '680px', margin: '30px auto', textAlign: 'center', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        {rulesModal}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00bcd4', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, color: '#00838f', fontSize: '22px' }}>🐧 クラッシュアイス - 待機ルーム</h2>
          <button onClick={() => setShowRules(true)} style={{ background: '#00838f', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em' }}>
            📖 ルール
          </button>
        </div>

        {/* ゲームモード切り替えタブ */}
        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>🎮 対戦モード選択:</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => moves.setGameFormat('standard')}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                background: !isTournament ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#f8fafc',
                color: !isTournament ? '#fff' : '#475569',
                border: !isTournament ? '2px solid #0284c7' : '1px solid #cbd5e1',
                boxShadow: !isTournament ? '0 4px 12px rgba(2, 132, 199, 0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 'bold' }}>🧊 通常サバイバル対戦</div>
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>全員参加・ペンギンを落とした人が即敗北</div>
            </button>

            <button
              onClick={() => moves.setGameFormat('tournament')}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                background: isTournament ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#f8fafc',
                color: isTournament ? '#fff' : '#475569',
                border: isTournament ? '2px solid #d97706' : '1px solid #cbd5e1',
                boxShadow: isTournament ? '0 4px 12px rgba(217, 119, 6, 0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 'bold' }}>🏆 1対1トーナメント</div>
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>2人〜8人対応の本格勝ち抜き戦</div>
            </button>
          </div>
        </div>

        {/* トーナメントプレビュー */}
        {isTournament && (
          <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a', margin: '20px 0', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', color: '#92400e', fontSize: '14px' }}>
                🏆 トーナメント組み合わせプレビュー
              </div>
              <button
                onClick={() => moves.shuffleTournamentSeeds()}
                style={{
                  background: '#f59e0b', color: '#fff', border: 'none', padding: '5px 12px',
                  borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                }}
              >
                🎲 組み合わせシャッフル
              </button>
            </div>
            
            <div style={{ fontSize: '12px', color: '#78350f', marginBottom: '12px', lineHeight: 1.5 }}>
              ※ 試合ごとに2名が1対1で対戦し、他のプレイヤーはリアルタイムに3D盤面を観戦します。勝者が次戦に進出します。
            </div>

            <div style={{ background: '#ffffff', borderRadius: '10px', padding: '10px', border: '1px solid #fef3c7', overflowX: 'auto' }}>
              <TournamentBracketView
                tournament={G.tournament?.matches?.length > 0 ? G.tournament : { matches: G.tournament?.matches || [] }}
                getPlayerName={getPlayerName}
                activeMatchId={null}
              />
            </div>
          </div>
        )}

        {/* 参加者リスト */}
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '10px', margin: '20px 0' }}>
          <h3 style={{ marginTop: 0, fontSize: '14px', color: '#555' }}>参加者 ({numPlayers}人)</h3>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {orderedPlayerIds.map(id => (
              <div key={id} style={{ background: id === pid ? '#b2dfdb' : '#e0f7fa', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', border: '1px solid #80deea', color: '#006064' }}>
                {getPlayerName(id)} {id === pid ? '(あなた)' : ''}
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => moves.startGame()} 
          style={{
            padding: '16px 40px', fontSize: '1.3em',
            background: isTournament ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #e65100, #f57c00)',
            color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold',
            boxShadow: isTournament ? '0 4px 15px rgba(217,119,6,0.35)' : '0 4px 15px rgba(230,81,0,0.35)',
            width: '100%', transition: 'all 0.2s'
          }}
        >
          {isTournament ? '🏆 トーナメントを開幕する！' : '🚀 ゲームを開始する！'}
        </button>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          ホスト（{getPlayerName('0')}）または参加者のどなたでも開始できます
        </div>
      </div>
    );
  }

  // 対戦中画面
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: '640px', background: 'linear-gradient(135deg, #e0f7fa 0%, #bbdefb 100%)', fontFamily: 'sans-serif', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      {rulesModal}
      {bracketModal}

      {/* TOP HEADER */}
      <div style={{ background: '#006064', color: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '17px', fontWeight: 'bold' }}>🐧 クラッシュアイス - {getPlayerName(pid)}</span>
          <button onClick={() => setShowRules(true)} style={{ background: '#00838f', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            📖 ルール
          </button>
          {G.gameFormat === 'tournament' && (
            <button onClick={() => setShowBracketModal(true)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🏆 トーナメント表
            </button>
          )}
        </div>

        {/* 手番ステータス */}
        <div>
          {G.gameFormat === 'tournament' && activeMatch ? (
            isCompetitor ? (
              isActivePlayer ? (
                <span style={{ background: '#ffeb3b', color: '#333', padding: '4px 12px', borderRadius: '15px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 0 8px rgba(255,235,59,0.7)' }}>
                  🎯 あなたの手番！（vs {getPlayerName(activeMatch.p1 === pid ? activeMatch.p2 : activeMatch.p1)}）
                </span>
              ) : (
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 10px', borderRadius: '15px', fontSize: '14px' }}>
                  ⏳ 相手の手番待ち（vs {getPlayerName(activeMatch.p1 === pid ? activeMatch.p2 : activeMatch.p1)}）
                </span>
              )
            ) : (
              <span style={{ background: '#0284c7', color: '#fff', padding: '4px 12px', borderRadius: '15px', fontWeight: 'bold', fontSize: '13px' }}>
                👀 観戦中: {getPlayerName(activeMatch.p1)} vs {getPlayerName(activeMatch.p2)}
              </span>
            )
          ) : (
            isActivePlayer ? (
              <span style={{ background: '#ffeb3b', color: '#333', padding: '4px 10px', borderRadius: '15px', fontWeight: 'bold', fontSize: '14px' }}>
                🎯 あなたのターン
              </span>
            ) : (
              <span style={{ fontSize: '14px' }}>{getPlayerName(ctx.currentPlayer)} の手番待ち...</span>
            )
          )}
        </div>
      </div>

      {/* SEATING ORDER / MATCH BAR */}
      <div style={{ background: 'rgba(255,255,255,0.9)', padding: '8px 20px', borderBottom: '1px solid #b2ebf2', display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto' }}>
        {G.gameFormat === 'tournament' && activeMatch ? (
          <>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309', whiteSpace: 'nowrap' }}>
              🏆 【{activeMatch.name}】:
            </span>
            <div style={{
              background: ctx.currentPlayer === activeMatch.p1 ? '#ff9800' : '#e0f2fe',
              color: ctx.currentPlayer === activeMatch.p1 ? '#fff' : '#0369a1',
              padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold',
              border: ctx.currentPlayer === activeMatch.p1 ? '2px solid #e65100' : '1px solid #bae6fd',
              whiteSpace: 'nowrap'
            }}>
              {getPlayerName(activeMatch.p1)} {activeMatch.p1 === pid ? '(あなた)' : ''} {ctx.currentPlayer === activeMatch.p1 ? '⚡手番' : ''}
            </div>
            <span style={{ fontWeight: 'bold', color: '#64748b' }}>VS</span>
            <div style={{
              background: ctx.currentPlayer === activeMatch.p2 ? '#ff9800' : '#e0f2fe',
              color: ctx.currentPlayer === activeMatch.p2 ? '#fff' : '#0369a1',
              padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold',
              border: ctx.currentPlayer === activeMatch.p2 ? '2px solid #e65100' : '1px solid #bae6fd',
              whiteSpace: 'nowrap'
            }}>
              {getPlayerName(activeMatch.p2)} {activeMatch.p2 === pid ? '(あなた)' : ''} {ctx.currentPlayer === activeMatch.p2 ? '⚡手番' : ''}
            </div>
            {isSpectator && (
              <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: '12px', marginLeft: 'auto', fontWeight: 'bold' }}>
                👀 あなたは観戦中です
              </span>
            )}
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* LEFT / CENTER: ICE FIELD */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', padding: '10px 14px', height: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          
          {/* VIEW SWITCH & TITLE BAR */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#006064', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🧊 盤面エリア {viewMode === '3d' ? '(3D物理シミュレーション)' : '(2Dフラット表示)'}
              {isSpectator && <span style={{ color: '#0284c7', fontSize: '12px', fontWeight: 'normal' }}>[リアルタイム観戦中]</span>}
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
            <div style={{ width: '100%', height: '100%', flex: 1, minHeight: '520px', position: 'relative', display: 'flex' }}>
              <CrashIce3DCanvas
                board={G.board}
                penguinPos={G.penguinFallen ? null : `${G.penguinPos.q},${G.penguinPos.r}`}
                winner={G.winner}
                selectedBlockKey={selectedBlockKey}
                onSelectBlock={handleBlockClick}
                strikeTarget={strikeTrigger}
                lastDroppedKeys={G.lastDroppedKeys}
                canInteract={isCompetitor && isActivePlayer && G.turnStep === 'strike' && !G.winner && G.gameState === 'playing'}
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
                  <radialGradient id="blueIce" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#81d4fa" />
                    <stop offset="50%" stopColor="#29b6f6" />
                    <stop offset="100%" stopColor="#0288d1" />
                  </radialGradient>
                  <radialGradient id="whiteIce" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="60%" stopColor="#e0f7fa" />
                    <stop offset="100%" stopColor="#b2ebf2" />
                  </radialGradient>
                </defs>

                {/* 氷ブロック描画 */}
                {Object.entries(G.board).map(([key, block]) => {
                  const { x, y } = hexToPixel(block.q, block.r);
                  const isSelected = selectedBlockKey === key;
                  const canSelect = isCompetitor && isActivePlayer && G.turnStep === 'strike' && !G.winner && G.gameState === 'playing' && (
                    !G.rouletteResult || G.rouletteResult.targetColor === 'any' || block.color === G.rouletteResult.targetColor
                  );

                  return (
                    <polygon
                      key={key}
                      points={getHexPolygonPoints(x, y, HEX_SIZE - 2)}
                      fill={block.color === 'blue' ? 'url(#blueIce)' : 'url(#whiteIce)'}
                      stroke={isSelected ? '#ffd600' : (canSelect ? '#00e676' : '#ffffff')}
                      strokeWidth={isSelected ? '4' : (canSelect ? '2' : '1')}
                      style={{
                        cursor: canSelect ? 'pointer' : 'default',
                        transition: 'all 0.15s ease-out'
                      }}
                      onClick={() => canSelect && handleBlockClick(key)}
                    />
                  );
                })}

                {/* 落下中ブロック */}
                {fallingBlocks.map(b => {
                  const { x, y } = hexToPixel(b.q, b.r);
                  return (
                    <polygon
                      key={b.id}
                      className="ice-falling-block"
                      points={getHexPolygonPoints(x, y, HEX_SIZE - 2)}
                      fill="url(#blueIce)"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* ペンギン */}
                {!G.penguinFallen && (
                  <g transform={`translate(${hexToPixel(G.penguinPos.q, G.penguinPos.r).x}, ${hexToPixel(G.penguinPos.q, G.penguinPos.r).y})`}>
                    <text textAnchor="middle" dominantBaseline="central" fontSize="36" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                      🐧
                    </text>
                  </g>
                )}
              </svg>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: ROULETTE & LOGS (Fixed 320px width) */}
        <div style={{ width: '320px', minWidth: '320px', maxWidth: '320px', background: 'rgba(255,255,255,0.95)', borderLeft: '1px solid #b2ebf2', display: 'flex', flexDirection: 'column', padding: '16px', gap: '14px', boxSizing: 'border-box' }}>
          
          {/* ROULETTE SECTION */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00838f', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span>🎲 ルーレット</span>
              <span style={{ fontSize: '11px', color: '#78909c' }}>(落とす氷を決定)</span>
            </div>

            {/* ルーレット本体 */}
            <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto' }}>
              <svg width="180" height="180" viewBox="0 0 180 180">
                <defs>
                  <filter id="rouletteShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.18)" />
                  </filter>
                </defs>

                {/* 背景円盤 */}
                <circle cx="90" cy="90" r="88" fill="#ffffff" stroke="#00838f" strokeWidth="4" filter="url(#rouletteShadow)" />

                {/* 5分割の扇形セクター */}
                {ROULETTE_ITEMS.map((item, i) => {
                  const startAngle = (i * 72 - 90) * (Math.PI / 180);
                  const endAngle = ((i + 1) * 72 - 90) * (Math.PI / 180);
                  const x1 = 90 + 86 * Math.cos(startAngle);
                  const y1 = 90 + 86 * Math.sin(startAngle);
                  const x2 = 90 + 86 * Math.cos(endAngle);
                  const y2 = 90 + 86 * Math.sin(endAngle);
                  const pathD = `M 90 90 L ${x1} ${y1} A 86 86 0 0 1 ${x2} ${y2} Z`;

                  const midAngle = (i * 72 + 36 - 90) * (Math.PI / 180);
                  const tx = 90 + 54 * Math.cos(midAngle);
                  const ty = 90 + 54 * Math.sin(midAngle);

                  const isSelected = G.rouletteResultIndex === i;

                  return (
                    <g key={item.id}>
                      <path
                        d={pathD}
                        fill={item.color}
                        stroke={isSelected ? '#ffd54f' : '#ffffff'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                      />
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

                <circle cx="90" cy="90" r="86" fill="none" stroke="#ffffff" strokeWidth="1.5" />
              </svg>

              {/* 回転する針オーバーレイ */}
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
                    <polygon points="90,10 83,78 97,78" fill="#d32f2f" />
                    <polygon points="90,10 83,78 90,78" fill="#b71c1c" />
                    <polygon points="90,10 90,78 97,78" fill="#ef5350" />
                    <polygon points="85,78 95,78 94,90 86,90" fill="#d32f2f" />
                    <polygon points="90,112 85,90 95,90" fill="#c62828" />
                    <polygon points="90,6 87,13 93,13" fill="#ffd54f" stroke="#e65100" strokeWidth="0.5" />
                  </g>

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
                disabled={!isActivePlayer || G.turnStep !== 'spin' || isSpinning || isSpectator || G.winner}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  background: (!isActivePlayer || G.turnStep !== 'spin' || isSpinning || isSpectator || G.winner) ? '#cfd8dc' : 'linear-gradient(135deg, #ff9800, #f57c00)',
                  color: (!isActivePlayer || G.turnStep !== 'spin' || isSpinning || isSpectator || G.winner) ? '#78909c' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!isActivePlayer || G.turnStep !== 'spin' || isSpinning || isSpectator || G.winner) ? 'not-allowed' : 'pointer',
                  boxShadow: (!isActivePlayer || G.turnStep !== 'spin' || isSpinning || isSpectator || G.winner) ? 'none' : '0 4px 10px rgba(255,152,0,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {isSpinning 
                  ? '🎯 回転中...' 
                  : (G.winner 
                      ? '🏆 ゲーム終了'
                      : (isSpectator 
                          ? '👀 観戦中（対戦者の手番）'
                          : (isActivePlayer && G.turnStep === 'spin' 
                              ? '🎲 ルーレットを回す！' 
                              : (G.turnStep === 'strike' ? '🔨 氷を叩く手番' : '⏳ 相手の手番待ち'))))}
              </button>
            </div>

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

      {/* POWER GAUGE MODAL (カラーバーのみで決定) */}
      {selectedBlockKey && !isStrikingAnim && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.5)', 
            backdropFilter: 'blur(3px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000, 
            padding: '20px' 
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDraggingPower) setSelectedBlockKey(null);
          }}
        >
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '20px', 
            maxWidth: '380px', 
            width: '100%', 
            padding: '28px 20px 20px', 
            textAlign: 'center', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.35)', 
            border: '1px solid #cbd5e1',
            userSelect: 'none'
          }}>
            {/* パワーゲージ本体（ドラッグで引っ張るカラーバー） */}
            <div 
              ref={powerBarRef}
              onPointerDown={handlePowerPointerDown}
              style={{
                background: 'linear-gradient(to right, #38bdf8 0%, #4ade80 25%, #facc15 55%, #fb923c 80%, #ef4444 100%)',
                borderRadius: '20px',
                height: '40px',
                position: 'relative',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.1)',
                border: '2px solid #94a3b8',
                cursor: isDraggingPower ? 'grabbing' : 'grab',
                marginBottom: '22px',
                touchAction: 'none'
              }}
            >
              {/* 未チャージ部分の暗めオーバーレイ（現在パワー以降を少し暗くしてチャージ量を際立たせる） */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                left: `${power}%`,
                background: 'rgba(15, 23, 42, 0.42)',
                borderRadius: '0 18px 18px 0',
                pointerEvents: 'none',
                transition: isDraggingPower ? 'none' : 'left 0.1s ease-out'
              }} />

              {/* 移動するインジケーター針 & ドラッグ可能なハンマーハンドル */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                bottom: '-10px',
                left: `${power}%`,
                width: '8px',
                background: '#0f172a',
                borderRadius: '4px',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 12px rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.5)',
                border: '1.5px solid #ffffff',
                pointerEvents: 'none',
                transition: isDraggingPower ? 'none' : 'left 0.1s ease-out'
              }}>
                {/* ハンマーアイコン（ドラッグ中に少し傾いて力を溜める演出） */}
                <div style={{
                  position: 'absolute',
                  top: '-26px',
                  left: '50%',
                  transform: `translateX(-50%) scale(${isDraggingPower ? 1.25 : 1.1}) rotate(${isDraggingPower ? -18 : -5}deg)`,
                  fontSize: '22px',
                  transition: 'transform 0.15s ease-out',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
                }}>
                  🔨
                </div>

                {/* 針の上の三角マーク */}
                <div style={{
                  position: 'absolute',
                  top: '-7px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '8px solid #0f172a'
                }} />
                {/* 針の下の三角マーク */}
                <div style={{
                  position: 'absolute',
                  bottom: '-7px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: '8px solid #0f172a'
                }} />
              </div>
            </div>

            {/* アクションボタン */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setSelectedBlockKey(null)}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  background: '#f1f5f9', 
                  color: '#475569', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '10px', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  fontWeight: 'bold' 
                }}
              >
                キャンセル
              </button>
              <button 
                onClick={handleStrike}
                style={{ 
                  flex: 2, 
                  padding: '12px', 
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '10px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: '18px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px'
                }}
              >
                🔨 叩く
              </button>
            </div>
          </div>
        </div>
      )}

      {/* インターミッション中のフローティングバー（最小化時） */}
      {G.gameState === 'intermission' && isIntermissionDismissed && (
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
          border: '2px solid #f59e0b'
        }}>
          <span style={{ fontWeight: 'bold', color: '#92400e', fontSize: '14px' }}>
            ⚔️ 【{G.tournament?.lastMatchResult?.matchName}】 勝者: {getPlayerName(G.tournament?.lastMatchResult?.winner)}
          </span>
          <button
            onClick={() => moves.startNextTournamentMatch()}
            style={{
              padding: '6px 14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
              border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
            }}
          >
            ⚔️ 次の試合を開始する
          </button>
          <button
            onClick={() => setIsIntermissionDismissed(false)}
            style={{
              padding: '6px 14px', background: '#00838f', color: '#fff',
              border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
            }}
          >
            📊 結果ダイアログを表示
          </button>
        </div>
      )}

      {/* TOURNAMENT INTERMISSION MODAL (各試合終了後のインターミッション) */}
      {showIntermissionModal && !isIntermissionDismissed && (
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
            background: '#fffbeb',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            textAlign: 'center',
            boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
            border: '3px solid #f59e0b'
          }}>
            <div style={{ fontSize: '50px', marginBottom: '8px' }}>
              ⚔️🐧💥
            </div>

            <h2 style={{ fontSize: '22px', margin: '0 0 10px 0', color: '#92400e' }}>
              【{G.tournament?.lastMatchResult?.matchName}】 決着！
            </h2>

            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👑 勝者:</span>
                <span>{getPlayerName(G.tournament?.lastMatchResult?.winner)}</span>
                <span style={{ fontSize: '12px', background: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>勝ち抜け！</span>
              </div>
              <div style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '14px' }}>
                💀 敗者（ペンギン落下）: {getPlayerName(G.tournament?.lastMatchResult?.loser)}
              </div>
            </div>

            {/* 次の試合プレビュー */}
            {(() => {
              const nextM = G.tournament?.matches?.find(m => m.winner === null && m.p1 !== null && m.p2 !== null);
              if (nextM) {
                return (
                  <div style={{ background: '#fef3c7', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fde68a', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold', color: '#78350f' }}>
                    次戦 ➔ 【{nextM.name}】 {getPlayerName(nextM.p1)} 🆚 {getPlayerName(nextM.p2)}
                  </div>
                );
              }
              return null;
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => moves.startNextTournamentMatch()}
                style={{
                  width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(217,119,6,0.35)'
                }}
              >
                ⚔️ 次の試合へ進む ➔
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsIntermissionDismissed(true)}
                  style={{
                    flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569',
                    border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '13px'
                  }}
                >
                  👁️ 盤面を確認する
                </button>
                <button
                  onClick={() => setShowBracketModal(true)}
                  style={{
                    flex: 1, padding: '10px', background: '#00838f', color: '#fff',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '13px'
                  }}
                >
                  🏆 トーナメント表
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL (大会制覇 or 通常対戦決着) */}
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
            background: G.gameFormat === 'tournament' ? '#fffbeb' : (G.loser === pid ? '#fff5f5' : '#f0fdf4'),
            borderRadius: '20px',
            maxWidth: G.gameFormat === 'tournament' ? '650px' : '460px',
            width: '100%',
            padding: '28px',
            textAlign: 'center',
            boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
            border: G.gameFormat === 'tournament' ? '3px solid #f59e0b' : (G.loser === pid ? '3px solid #ef5350' : '3px solid #4caf50'),
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '10px' }}>
              {G.gameFormat === 'tournament' ? '🏆👑🎉' : (G.loser === pid ? '💀🐧💦' : '🎉👑🐧')}
            </div>
            
            <h2 style={{ fontSize: '24px', margin: '0 0 10px 0', color: G.gameFormat === 'tournament' ? '#b45309' : (G.loser === pid ? '#c62828' : '#2e7d32') }}>
              {G.gameFormat === 'tournament'
                ? (G.tournament?.champion === pid ? '🏆🎉 祝・全勝優勝！！ あなたがトーナメント王者です！' : `🏆 大会終了！ 王者: ${getPlayerName(G.tournament?.champion)}`)
                : (G.loser === pid ? 'ペンギン落下！あなたの敗北…！' : 'ペンギン生存！あなたの勝利！')}
            </h2>

            <p style={{ fontSize: '15px', color: '#555', marginBottom: '20px', fontWeight: 'bold' }}>
              {G.winnerDetails}
            </p>

            {/* トーナメント最終結果表 */}
            {G.gameFormat === 'tournament' && (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', border: '1px solid #fde68a', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#92400e', marginBottom: '8px' }}>
                  🏆 最終トーナメント結果
                </div>
                <TournamentBracketView
                  tournament={G.tournament}
                  getPlayerName={getPlayerName}
                  activeMatchId={null}
                />
              </div>
            )}

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
                    flex: 1.4, padding: '12px',
                    background: G.gameFormat === 'tournament' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #00acc1, #00838f)',
                    color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '15px',
                    boxShadow: G.gameFormat === 'tournament' ? '0 4px 10px rgba(217,119,6,0.3)' : '0 4px 10px rgba(0,131,143,0.3)'
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
