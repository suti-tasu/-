import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ROULETTE_ITEMS, HEX_DIRECTIONS } from './CrashIceGame';
import { CrashIce3DCanvas } from './CrashIce3DCanvas';
import { UnifiedLobby } from './UnifiedLobby';

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
export const TournamentBracketView = ({ tournament, getPlayerName, activeMatchId, onSelectMatch, currentViewedId }) => {
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
          <div key={roundNum} style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '190px' }}>
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
                const isViewed = match.id === currentViewedId;
                const isLive = match.status === 'playing';
                const isFinished = match.status === 'finished';

                return (
                  <div
                    key={match.id}
                    onClick={() => {
                      if (onSelectMatch) onSelectMatch(match.id);
                    }}
                    style={{
                      background: isViewed ? '#fffbeb' : (isLive ? '#f0f9ff' : (isFinished ? '#f8fafc' : '#ffffff')),
                      border: isViewed ? '2px solid #f59e0b' : (isLive ? '2px solid #0284c7' : (isFinished ? '1px solid #cbd5e1' : '1px solid #94a3b8')),
                      borderRadius: '10px',
                      padding: '10px 12px',
                      boxShadow: isViewed ? '0 0 12px rgba(245,158,11,0.5)' : (isLive ? '0 0 10px rgba(2,132,199,0.35)' : '0 2px 6px rgba(0,0,0,0.06)'),
                      transition: 'all 0.2s',
                      cursor: onSelectMatch ? 'pointer' : 'default',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: isLive ? '#0284c7' : (isViewed ? '#b45309' : '#64748b'), fontWeight: 'bold', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{match.name}</span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {isLive && (
                          <span style={{ color: '#0369a1', fontWeight: 'bold', background: '#e0f2fe', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
                            🔴 LIVE
                          </span>
                        )}
                        {isViewed && (
                          <span style={{ color: '#b45309', fontWeight: 'bold', background: '#fef3c7', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
                            👁️ 表示中
                          </span>
                        )}
                        {isFinished && <span style={{ color: '#16a34a', fontSize: '10px' }}>✓ 決着</span>}
                        {match.status === 'waiting' && <span style={{ color: '#94a3b8', fontSize: '10px' }}>⏳ 待機中</span>}
                      </div>
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

                    {onSelectMatch && (
                      <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'right', marginTop: '4px' }}>
                        クリックで盤面表示 ➔
                      </div>
                    )}
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
  const [strikeTrigger, setStrikeTrigger] = useState(null); // { key, power, angle, id }
  const [showRules, setShowRules] = useState(false);
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [needleAngle, setNeedleAngle] = useState(() => (G.rouletteResultIndex ?? 0) * 72 + 36);
  const [fallingBlocks, setFallingBlocks] = useState([]);
  const [isBoardShaking, setIsBoardShaking] = useState(false);
  const [drag2D, setDrag2D] = useState(null); // 2Dモード用ドラッグステート

  // ダイアログ状態管理
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [isGameOverDismissed, setIsGameOverDismissed] = useState(false);

  // トーナメント表示・観戦用ステート
  const [viewedMatchId, setViewedMatchId] = useState(null);
  const [dismissedMatchEndIds, setDismissedMatchEndIds] = useState(() => new Set());

  const isFirstRender = useRef(true);
  const prevLastDroppedRef = useRef([]);

  const isSpectator = playerID === null || playerID === undefined;
  const pid = isSpectator ? '0' : playerID.toString();
  const isTournament = G.gameFormat === 'tournament';

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

  // プレイヤー自身が現在対戦中（playing）のマッチ
  const myTournamentMatch = useMemo(() => {
    if (!isTournament || !G.tournament?.matches) return null;
    return G.tournament.matches.find(m => m.status === 'playing' && (m.p1 === pid || m.p2 === pid)) || null;
  }, [isTournament, G.tournament?.matches, pid]);

  // 新しい対戦（決勝進出など）が始まったら、自動で自身の対戦カードをフォーカス
  const prevMyMatchIdRef = useRef(null);
  useEffect(() => {
    if (myTournamentMatch && myTournamentMatch.id !== prevMyMatchIdRef.current) {
      prevMyMatchIdRef.current = myTournamentMatch.id;
      setViewedMatchId(myTournamentMatch.id);
    }
  }, [myTournamentMatch]);

  // 現在盤面に表示するマッチ（選択中 > 自身の対戦 > 最初の対戦中マッチ > 最初のマッチ）
  const currentViewMatch = useMemo(() => {
    if (!isTournament || !G.tournament?.matches || G.tournament.matches.length === 0) return null;
    if (viewedMatchId !== null) {
      const found = G.tournament.matches.find(m => m.id === viewedMatchId);
      if (found) return found;
    }
    if (myTournamentMatch) return myTournamentMatch;
    const firstPlaying = G.tournament.matches.find(m => m.status === 'playing');
    if (firstPlaying) return firstPlaying;
    const lastFinished = [...G.tournament.matches].reverse().find(m => m.status === 'finished');
    return lastFinished || G.tournament.matches[0];
  }, [isTournament, G.tournament?.matches, viewedMatchId, myTournamentMatch]);

  // 表示中マッチにおける対戦者／観戦者判定
  const isActivePlayer = !isSpectator && ctx.currentPlayer === pid;
  const isCompetitorInView = isSpectator
    ? false
    : isTournament
    ? Boolean(currentViewMatch && (currentViewMatch.p1 === pid || currentViewMatch.p2 === pid))
    : true;
  const isMyTurnInMatch = !isSpectator && (isTournament
    ? Boolean(isCompetitorInView && currentViewMatch?.currentTurnPlayer === pid && currentViewMatch?.status === 'playing')
    : isActivePlayer);
  const isSpectatorInView = isSpectator || (isTournament
    ? (!isCompetitorInView || currentViewMatch?.status !== 'playing')
    : false);

  const canSpin = isTournament
    ? (isMyTurnInMatch && currentViewMatch?.turnStep === 'spin')
    : (isMyTurnInMatch && G.turnStep === 'spin' && !G.winner && G.gameState === 'playing');

  const canInteract = isTournament
    ? (isMyTurnInMatch && currentViewMatch?.turnStep === 'strike')
    : (isMyTurnInMatch && G.turnStep === 'strike' && !G.winner && G.gameState === 'playing');

  // 表示用データ (トーナメント時は表示中マッチの盤面、通常時はグローバルG)
  const displayedBoard = isTournament ? (currentViewMatch?.board || {}) : G.board;
  const displayedPenguinPos = isTournament ? (currentViewMatch?.penguinPos || { q: 0, r: 0 }) : G.penguinPos;
  const displayedPenguinFallen = isTournament ? (currentViewMatch?.penguinFallen || false) : G.penguinFallen;
  const displayedRouletteResult = isTournament ? currentViewMatch?.rouletteResult : G.rouletteResult;
  const displayedRouletteResultIndex = isTournament ? currentViewMatch?.rouletteResultIndex : G.rouletteResultIndex;
  const displayedRemainingStrikes = isTournament ? (currentViewMatch?.remainingStrikes || 0) : G.remainingStrikes;
  const displayedTurnStep = isTournament ? (currentViewMatch?.turnStep || 'spin') : G.turnStep;
  const displayedLogs = isTournament ? (currentViewMatch?.logs || G.logs) : G.logs;
  const displayedLastDroppedKeys = isTournament ? (currentViewMatch?.lastDroppedKeys || []) : G.lastDroppedKeys;
  const displayedLastStrikeEvent = isTournament ? currentViewMatch?.lastStrikeEvent : G.lastStrikeEvent;

  // 自身が直前に終えたマッチ（未確認の決着ダイアログ）
  const myFinishedMatch = useMemo(() => {
    if (!isTournament || !G.tournament?.matches || G.winner) return null;
    return G.tournament.matches.find(m =>
      m.status === 'finished' &&
      (m.p1 === pid || m.p2 === pid) &&
      !dismissedMatchEndIds.has(m.id)
    ) || null;
  }, [isTournament, G.tournament?.matches, pid, dismissedMatchEndIds, G.winner]);

  // 大会制覇・通常決着時：演出を最後まで見届けてから結果ダイアログを表示
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
    if (displayedLastDroppedKeys && displayedLastDroppedKeys.length > 0) {
      if (displayedLastDroppedKeys !== prevLastDroppedRef.current) {
        prevLastDroppedRef.current = displayedLastDroppedKeys;
        setStrikeTrigger({ key: displayedLastDroppedKeys[0], power: 65, id: Date.now() });
        setIsBoardShaking(true);
        const shakeTimer = setTimeout(() => setIsBoardShaking(false), 350);

        const newFalling = displayedLastDroppedKeys.map(k => {
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
  }, [displayedLastDroppedKeys]);

  // 相手の手番または観戦中での打撃アニメーション同期 (弱打撃含む)
  const prevStrikeEventIdRef = useRef(null);
  useEffect(() => {
    if (displayedLastStrikeEvent && displayedLastStrikeEvent.id !== prevStrikeEventIdRef.current) {
      prevStrikeEventIdRef.current = displayedLastStrikeEvent.id;
      if (!isMyTurnInMatch) {
        setStrikeTrigger({
          key: displayedLastStrikeEvent.key,
          power: displayedLastStrikeEvent.power,
          angle: displayedLastStrikeEvent.angle ?? 0,
          id: displayedLastStrikeEvent.id
        });
      }
    }
  }, [displayedLastStrikeEvent, isMyTurnInMatch]);

  // 相手の手番または観戦中でのルーレット回転同期
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (displayedRouletteResultIndex !== undefined && displayedRouletteResultIndex !== null && !isMyTurnInMatch) {
      const targetAngle = displayedRouletteResultIndex * 72 + 36;
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
  }, [displayedRouletteResultIndex, isMyTurnInMatch]);

  // ルーレット回転処理
  const handleSpinRoulette = () => {
    if (isSpinning || !canSpin || G.winner) return;
    setIsSpinning(true);

    const targetIdx = Math.floor(Math.random() * ROULETTE_ITEMS.length);
    const targetAngle = targetIdx * 72 + 36;

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

  // 氷ブロックへの直接打撃処理 (3D & 2D 共通)
  const handleDirectStrike = (key, strikePower, angle = 0) => {
    if (!canInteract || G.winner) return;

    // 叩くアニメーションをトリガー
    setStrikeTrigger({ key, power: strikePower, angle, id: Date.now() });

    // boardgame.io move を呼び出し
    moves.strikeBlock(key, strikePower, angle);
  };

  // 2Dモード用：打点クリック＆ドラッグ処理
  const handle2DPointerDown = (e, key, blockX, blockY) => {
    // 右クリックでキャンセル
    if (e.button === 2) {
      if (drag2D) {
        e.preventDefault();
        setDrag2D(null);
      }
      return;
    }
    if (e.button !== 0 && e.button !== undefined) return;

    e.preventDefault();
    if (!canInteract || G.winner) return;
    const block = displayedBoard[key];
    if (!block) return;
    if (displayedRouletteResult && displayedRouletteResult.targetColor !== 'any' && block.color !== displayedRouletteResult.targetColor) return;
    if (displayedPenguinPos && `${displayedPenguinPos.q},${displayedPenguinPos.r}` === key) return;

    setDrag2D({
      key,
      blockX,
      blockY,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      power: 0,
      angle: 0
    });

    if (e.target.setPointerCapture) {
      try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
    }
  };

  useEffect(() => {
    if (!drag2D) return;

    const handleWindowPointerMove = (e) => {
      const dx = e.clientX - drag2D.startX;
      const dy = e.clientY - drag2D.startY;
      const dist = Math.hypot(dx, dy);
      let power = 0;
      if (dist >= 8) {
        power = Math.min(100, Math.max(1, Math.round(((dist - 8) / 280) * 100)));
      }
      const angle = Math.atan2(dy, dx);
      setDrag2D(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY, power, angle } : null);
    };

    const handleWindowPointerDown = (e) => {
      if (e.button === 2) {
        e.preventDefault();
        setDrag2D(null);
      }
    };

    const handleWindowPointerUp = (e) => {
      if (e.button === 2) {
        setDrag2D(null);
        return;
      }
      const current = drag2D;
      setDrag2D(null);
      if (current && current.power >= 5 && (e.button === 0 || e.button === undefined)) {
        handleDirectStrike(current.key, current.power, current.angle);
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      setDrag2D(null);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointerdown', handleWindowPointerDown);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointerdown', handleWindowPointerDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [drag2D, canInteract, G.winner]);

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
          <li>**並行1対1トーナメント:** 2人〜8人対応！ 全ての試合が**同時並行で一斉に進行**します。早く終わったグループは他の対戦テーブルを自由にリアルタイム観戦できます。決勝戦は全員で見守り王者を決定します！</li>
        </ul>

        <h3 style={{ color: '#00897b' }}>🔨 ゲームの流れ</h3>
        <ol style={{ lineHeight: 1.6 }}>
          <li>自分の番が来たら、まず**「ルーレット」**を回します。</li>
          <li>落としたい氷ブロック（打点）を**直接クリックしてマウスを引っ張り（ドラッグ）**ます。</li>
          <li>引っ張る向きと距離で**叩く角度と強さ（パワー）**が決まります！狙いを定めて離すとハンマーを振り下ろします！</li>
          <li>弱すぎると氷が抜けず（同じブロックを再打撃可能）、強すぎると周囲の氷も巻き込んでペンギンが落ちる危険が高まります！</li>
          <li>ペンギンを落とさずに氷を落とせたら、相手にターンが移ります。</li>
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
          activeMatchId={currentViewMatch?.id}
          currentViewedId={currentViewMatch?.id}
          onSelectMatch={(matchId) => {
            setViewedMatchId(matchId);
            setShowBracketModal(false);
          }}
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <UnifiedLobby
          gameTitle="クラッシュアイス (Crash Ice)"
          gameIcon="🐧"
          gameSubtitle="氷を叩き落としてペンギンを守れ！リアル3D物理対戦アクション"
          themeColor="#0284c7"
          themeGradient={isTournament ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #0284c7, #0369a1)'}
          numPlayers={numPlayers}
          playerIds={orderedPlayerIds}
          pid={isSpectator ? null : pid}
          getPlayerName={getPlayerName}
          isHost={!isSpectator && pid === '0'}
          onStart={() => moves.startGame()}
          startText={isTournament ? '🏆 トーナメントを開幕する！' : '🚀 ゲームを開始する！'}
          onShowRules={() => setShowRules(true)}
          rulesModal={rulesModal}
        >
          {/* ゲームモード切り替えタブ */}
          <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>🎮 対戦モード選択:</div>
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
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>🧊 通常サバイバル対戦</div>
                <div style={{ fontSize: '11px', marginTop: '3px', opacity: 0.9 }}>全員参加・ペンギンを落とした人が即敗北</div>
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
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>🏆 1対1トーナメント</div>
                <div style={{ fontSize: '11px', marginTop: '3px', opacity: 0.9 }}>2人〜8人対応・全卓同時並行の勝ち抜き戦</div>
              </button>
            </div>
          </div>

          {/* トーナメントプレビュー */}
          {isTournament && (
            <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a', margin: '16px 0', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', color: '#92400e', fontSize: '13px' }}>
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
              
              <div style={{ fontSize: '11px', color: '#78350f', marginBottom: '10px', lineHeight: 1.4 }}>
                ※ 試合ごとに2名が1対1で対戦し、他の対戦も同時並行で進行します。勝者が次戦に進出します。
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
        </UnifiedLobby>
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
          {isTournament && (
            <button onClick={() => setShowBracketModal(true)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🏆 トーナメント表
            </button>
          )}
        </div>

        {/* 手番ステータス */}
        <div>
          {isTournament ? (
            myTournamentMatch ? (
              isMyTurnInMatch ? (
                <span style={{ background: '#ffeb3b', color: '#333', padding: '4px 12px', borderRadius: '15px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 0 8px rgba(255,235,59,0.7)' }}>
                  🎯 あなたの手番！（【{myTournamentMatch.name}】）
                </span>
              ) : (
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 12px', borderRadius: '15px', fontSize: '14px' }}>
                  ⏳ 相手の手番待ち（【{myTournamentMatch.name}】）
                </span>
              )
            ) : (
              <span style={{ background: '#0284c7', color: '#fff', padding: '4px 12px', borderRadius: '15px', fontWeight: 'bold', fontSize: '13px' }}>
                👀 リアルタイム観戦中
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

      {/* 自身の次の試合が開始された際の通知バナー */}
      {isTournament && myTournamentMatch && viewedMatchId !== null && viewedMatchId !== myTournamentMatch.id && (
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#fff',
          padding: '8px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #b45309',
          boxShadow: '0 2px 8px rgba(245,158,11,0.4)'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
            🔔 あなたの対戦【{myTournamentMatch.name}】の準備が整いました！（対戦相手: {getPlayerName(myTournamentMatch.p1 === pid ? myTournamentMatch.p2 : myTournamentMatch.p1)}）
          </span>
          <button
            onClick={() => setViewedMatchId(myTournamentMatch.id)}
            style={{
              background: '#fff',
              color: '#92400e',
              border: 'none',
              padding: '4px 14px',
              borderRadius: '16px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
            }}
          >
            ⚔️ 今すぐ対戦へ移動する
          </button>
        </div>
      )}

      {/* SEATING ORDER / MATCH BAR */}
      <div style={{ background: 'rgba(255,255,255,0.95)', padding: '8px 16px', borderBottom: '1px solid #b2ebf2', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', minHeight: '44px', boxSizing: 'border-box' }}>
        {isTournament ? (
          <>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00838f', whiteSpace: 'nowrap' }}>
              🏆 テーブル切替:
            </span>

            {/* 対戦中（playing）のマッチ一覧 */}
            {G.tournament?.matches?.filter(m => m.status === 'playing').map(m => {
              const isMine = m.p1 === pid || m.p2 === pid;
              const isSelected = currentViewMatch?.id === m.id;
              const isMyTurnInThisMatch = isMine && m.currentTurnPlayer === pid;

              return (
                <button
                  key={m.id}
                  onClick={() => setViewedMatchId(m.id)}
                  style={{
                    background: isSelected 
                      ? (isMine ? 'linear-gradient(135deg, #e65100, #f57c00)' : 'linear-gradient(135deg, #0284c7, #0369a1)')
                      : (isMine ? '#fff7ed' : '#f0f9ff'),
                    color: isSelected ? '#fff' : (isMine ? '#c2410c' : '#0369a1'),
                    border: isSelected 
                      ? (isMine ? '2px solid #ea580c' : '2px solid #0284c7')
                      : (isMine ? '1px solid #fdba74' : '1px solid #bae6fd'),
                    borderRadius: '18px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>{isMine ? '⚔️ あなたの試合' : '👁️ 観戦'}</span>
                  <span>【{m.name}】</span>
                  <span style={{ fontSize: '11px', opacity: 0.9 }}>
                    ({getPlayerName(m.p1)} vs {getPlayerName(m.p2)})
                  </span>
                  <span style={{
                    background: isSelected ? 'rgba(255,255,255,0.3)' : (isMine ? '#fed7aa' : '#e0f2fe'),
                    color: isSelected ? '#fff' : (isMine ? '#9a3412' : '#0369a1'),
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '10px'
                  }}>
                    {isMine ? (isMyTurnInThisMatch ? '⚡手番！' : '相手の手番') : '🔴 LIVE'}
                  </span>
                </button>
              );
            })}

            {/* 終了済みマッチ (確認用) */}
            {G.tournament?.matches?.filter(m => m.status === 'finished').map(m => {
              const isSelected = currentViewMatch?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setViewedMatchId(m.id)}
                  style={{
                    background: isSelected ? '#64748b' : '#f8fafc',
                    color: isSelected ? '#fff' : '#64748b',
                    border: isSelected ? '2px solid #475569' : '1px solid #cbd5e1',
                    borderRadius: '18px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ✓ 【{m.name}】勝者: {getPlayerName(m.winner)}
                </button>
              );
            })}

            <button
              onClick={() => setShowBracketModal(true)}
              style={{
                marginLeft: 'auto',
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: '18px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 6px rgba(245,158,11,0.3)'
              }}
            >
              📊 トーナメント表
            </button>
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
              {isTournament && currentViewMatch && (
                <span style={{ color: isSpectatorInView ? '#0284c7' : '#e65100', fontSize: '12px', fontWeight: 'bold' }}>
                  [{isSpectatorInView ? '👀 リアルタイム観戦中' : '🔥 対戦中'}: 【{currentViewMatch.name}】]
                </span>
              )}
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

          {/* トーナメント時の対戦カード詳細バー */}
          {isTournament && currentViewMatch && (
            <div style={{
              width: '100%',
              background: isSpectatorInView ? '#f0f9ff' : '#fff7ed',
              border: isSpectatorInView ? '1px solid #bae6fd' : '1px solid #fed7aa',
              borderRadius: '8px',
              padding: '6px 14px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{
                  background: isSpectatorInView ? '#0284c7' : '#ea580c',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {isSpectatorInView ? '👀 観戦' : '⚔️ 対戦中'}
                </span>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>
                  【{currentViewMatch.name}】
                </span>
                <span style={{ color: '#475569' }}>
                  {getPlayerName(currentViewMatch.p1)} {currentViewMatch.p1 === pid ? '(あなた)' : ''} 🆚 {getPlayerName(currentViewMatch.p2)} {currentViewMatch.p2 === pid ? '(あなた)' : ''}
                </span>
              </div>

              <div>
                {currentViewMatch.status === 'playing' ? (
                  <span style={{
                    background: isMyTurnInMatch ? '#fef08a' : '#f1f5f9',
                    color: isMyTurnInMatch ? '#854d0e' : '#475569',
                    border: isMyTurnInMatch ? '1px solid #eab308' : '1px solid #cbd5e1',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    {isMyTurnInMatch
                      ? '🎯 あなたの手番です！'
                      : `⏳ ${getPlayerName(currentViewMatch.currentTurnPlayer)} の手番`}
                  </span>
                ) : (
                  <span style={{
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    ✓ 決着（勝者: {getPlayerName(currentViewMatch.winner)}）
                  </span>
                )}
              </div>
            </div>
          )}

          {viewMode === '3d' ? (
            <div style={{ width: '100%', height: '100%', flex: 1, minHeight: '520px', position: 'relative', display: 'flex' }}>
              <CrashIce3DCanvas
                board={displayedBoard}
                penguinPos={displayedPenguinFallen ? null : `${displayedPenguinPos.q},${displayedPenguinPos.r}`}
                winner={isTournament ? (currentViewMatch?.winner || null) : G.winner}
                onStrike={handleDirectStrike}
                strikeTarget={strikeTrigger}
                lastDroppedKeys={displayedLastDroppedKeys}
                canInteract={canInteract}
                allowedColor={displayedRouletteResult ? displayedRouletteResult.targetColor : null}
              />
            </div>
          ) : (
            /* FIELD WRAPPER (2D) */
            <div 
              className={isBoardShaking ? 'board-shaking' : ''}
              onContextMenu={(e) => {
                if (drag2D) {
                  e.preventDefault();
                  setDrag2D(null);
                }
              }}
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
              <svg width="460" height="420" viewBox="-230 -210 460 420" style={{ overflow: 'visible', userSelect: 'none' }}>
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
                {Object.entries(displayedBoard).map(([key, block]) => {
                  const { x, y } = hexToPixel(block.q, block.r);
                  const isBeingDragged = drag2D?.key === key;
                  const canSelect = canInteract && (
                    !displayedRouletteResult || displayedRouletteResult.targetColor === 'any' || block.color === displayedRouletteResult.targetColor
                  ) && (!displayedPenguinPos || `${displayedPenguinPos.q},${displayedPenguinPos.r}` !== key);

                  return (
                    <polygon
                      key={key}
                      points={getHexPolygonPoints(x, y, HEX_SIZE - 2)}
                      fill={block.color === 'blue' ? 'url(#blueIce)' : 'url(#whiteIce)'}
                      stroke={isBeingDragged ? '#fbbf24' : (canSelect ? '#00e676' : '#ffffff')}
                      strokeWidth={isBeingDragged ? '3.5' : (canSelect ? '2' : '1')}
                      style={{
                        cursor: canSelect ? (drag2D ? 'grabbing' : 'grab') : 'default',
                        transition: isBeingDragged ? 'none' : 'all 0.15s ease-out'
                      }}
                      onPointerDown={(e) => canSelect && handle2DPointerDown(e, key, x, y)}
                    />
                  );
                })}

                {/* 2Dドラッグ中の軌跡矢印・パワーHUD */}
                {drag2D && drag2D.power >= 5 && (() => {
                  const arrowColor = drag2D.power >= 80 ? '#ef4444' : (drag2D.power >= 55 ? '#fb923c' : (drag2D.power >= 15 ? '#4ade80' : '#38bdf8'));
                  const tipX = drag2D.blockX + (drag2D.currentX - drag2D.startX);
                  const tipY = drag2D.blockY + (drag2D.currentY - drag2D.startY);
                  return (
                    <g pointerEvents="none">
                      {/* 打点リング */}
                      <circle cx={drag2D.blockX} cy={drag2D.blockY} r={HEX_SIZE} fill="none" stroke={arrowColor} strokeWidth="3" strokeDasharray="3 2" />
                      {/* 引っ張りライン */}
                      <line x1={drag2D.blockX} y1={drag2D.blockY} x2={tipX} y2={tipY} stroke={arrowColor} strokeWidth="4" strokeLinecap="round" />
                      {/* 先端ノブ */}
                      <circle cx={tipX} cy={tipY} r="6" fill={arrowColor} stroke="#fff" strokeWidth="1.5" />
                    </g>
                  );
                })()}

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
                {!displayedPenguinFallen && (
                  <g transform={`translate(${hexToPixel(displayedPenguinPos.q, displayedPenguinPos.r).x}, ${hexToPixel(displayedPenguinPos.q, displayedPenguinPos.r).y})`}>
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

                  const isSelected = displayedRouletteResultIndex === i;

                  return (
                    <g key={item.id}>
                      <path
                        d={pathD}
                        fill={item.color}
                        stroke={isSelected ? '#f59e0b' : '#ffffff'}
                        strokeWidth={isSelected ? '4' : '1.5'}
                        style={{
                          filter: isSelected ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.8))' : 'none',
                          transition: 'all 0.2s'
                        }}
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
                disabled={!canSpin || isSpinning}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  background: (!canSpin || isSpinning) ? '#cfd8dc' : 'linear-gradient(135deg, #ff9800, #f57c00)',
                  color: (!canSpin || isSpinning) ? '#78909c' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!canSpin || isSpinning) ? 'not-allowed' : 'pointer',
                  boxShadow: (!canSpin || isSpinning) ? 'none' : '0 4px 10px rgba(255,152,0,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {isSpinning 
                  ? '🎯 回転中...' 
                  : (G.winner || (isTournament && currentViewMatch?.status === 'finished')
                      ? '🏆 試合終了'
                      : (isSpectatorInView 
                          ? '👀 観戦中（対戦者の手番）'
                          : (canSpin 
                              ? '🎲 ルーレットを回す！' 
                              : (displayedTurnStep === 'strike' ? '🔨 氷を叩く手番' : '⏳ 相手の手番待ち'))))}
              </button>
            </div>

            {/* 出目結果バッジ */}
            {displayedRouletteResult ? (
              <div style={{ 
                marginTop: '10px', 
                background: '#fff', 
                padding: '8px 12px', 
                borderRadius: '8px', 
                border: `2px solid ${displayedRouletteResult.color}`, 
                fontWeight: 'bold', 
                fontSize: '13px',
                color: '#333',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>
                <span style={{ fontSize: '15px', marginRight: '6px' }}>{displayedRouletteResult.icon}</span>
                <span style={{ color: displayedRouletteResult.color === '#cfd8dc' || displayedRouletteResult.color === '#b0bec5' ? '#37474f' : displayedRouletteResult.color }}>
                  {displayedRouletteResult.label}
                </span>
                {displayedTurnStep === 'strike' && displayedRemainingStrikes > 0 && (
                  <span style={{ marginLeft: '6px', fontSize: '12px', background: '#e0f2f1', color: '#00796b', padding: '2px 6px', borderRadius: '4px' }}>
                    残り {displayedRemainingStrikes} 個
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
              📜 プレイ履歴 {isTournament && currentViewMatch ? `(【${currentViewMatch.name}】)` : ''}
            </div>
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto', fontSize: '13px', lineHeight: 1.5, color: '#444' }}>
              {displayedLogs.slice().reverse().map((log, i) => (
                <div key={i} style={{ marginBottom: '6px', borderBottom: '1px dashed #eee', paddingBottom: '4px' }}>
                  {log.replace(/Player (\d+)/g, (match, id) => getPlayerName(id))}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>



      {/* 自身のマッチ終了時（勝者勝ち抜け・敗者観戦移行）モーダル */}
      {isTournament && myFinishedMatch && !G.winner && (
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
            background: myFinishedMatch.winner === pid ? '#f0fdf4' : '#fff5f5',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            textAlign: 'center',
            boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
            border: myFinishedMatch.winner === pid ? '3px solid #16a34a' : '3px solid #ef5350'
          }}>
            <div style={{ fontSize: '50px', marginBottom: '8px' }}>
              {myFinishedMatch.winner === pid ? '👑🎉' : '💀🐧💦'}
            </div>

            <h2 style={{ fontSize: '22px', margin: '0 0 10px 0', color: myFinishedMatch.winner === pid ? '#166534' : '#991b1b' }}>
              【{myFinishedMatch.name}】 決着！
            </h2>

            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👑 勝者:</span>
                <span>{getPlayerName(myFinishedMatch.winner)}</span>
                <span style={{ fontSize: '12px', background: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>勝ち抜け！</span>
              </div>
              <div style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '14px' }}>
                💀 敗者（ペンギン落下）: {getPlayerName(myFinishedMatch.loser)}
              </div>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '14px', color: '#4b5563', lineHeight: 1.6 }}>
              {myFinishedMatch.winner === pid ? (
                <span>🎉 見事勝ち抜けました！次の対戦カードが決まるまで、他の試合をリアルタイム観戦できます。</span>
              ) : (
                <span>ペンギンが落下してしまいました…！他のプレイヤーの対戦テーブルをリアルタイム観戦しましょう！</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  setDismissedMatchEndIds(prev => new Set(prev).add(myFinishedMatch.id));
                  const playingMatch = G.tournament?.matches?.find(m => m.status === 'playing' && m.id !== myFinishedMatch.id);
                  if (playingMatch) {
                    setViewedMatchId(playingMatch.id);
                  }
                }}
                style={{
                  width: '100%', padding: '14px', background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(2,132,199,0.35)'
                }}
              >
                👀 進行中の試合を観戦する ➔
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setDismissedMatchEndIds(prev => new Set(prev).add(myFinishedMatch.id));
                  }}
                  style={{
                    flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569',
                    border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '13px'
                  }}
                >
                  👁️ この盤面を確認する
                </button>
                <button
                  onClick={() => {
                    setDismissedMatchEndIds(prev => new Set(prev).add(myFinishedMatch.id));
                    setShowBracketModal(true);
                  }}
                  style={{
                    flex: 1, padding: '10px', background: '#f59e0b', color: '#fff',
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
                  currentViewedId={currentViewMatch?.id}
                  onSelectMatch={(matchId) => {
                    setViewedMatchId(matchId);
                    setIsGameOverDismissed(true);
                  }}
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
