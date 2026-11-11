// NimmtBoard.jsx - 6 Nimmt! (ニムト) Board UI
import React, { useState, useEffect, useRef } from 'react';
import { getBullheads } from './NimmtGame';
import { UnifiedLobby } from './UnifiedLobby';

// カードの牛数に応じたカラースタイル
const getCardStyle = (bullheads) => {
  if (bullheads >= 7) {
    return {
      bg: 'linear-gradient(135deg, #ef4444, #f59e0b)',
      border: '#dc2626',
      text: '#ffffff',
      bullColor: '#fef08a',
      badgeBg: 'rgba(0,0,0,0.3)',
      shadow: '0 4px 14px rgba(239, 68, 68, 0.45)'
    };
  }
  if (bullheads === 5) {
    return {
      bg: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
      border: '#7c3aed',
      text: '#ffffff',
      bullColor: '#fae8ff',
      badgeBg: 'rgba(0,0,0,0.25)',
      shadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
    };
  }
  if (bullheads === 3) {
    return {
      bg: 'linear-gradient(135deg, #f97316, #fbbf24)',
      border: '#ea580c',
      text: '#ffffff',
      bullColor: '#ffedd5',
      badgeBg: 'rgba(0,0,0,0.2)',
      shadow: '0 3px 10px rgba(249, 115, 22, 0.3)'
    };
  }
  if (bullheads === 2) {
    return {
      bg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
      border: '#0284c7',
      text: '#ffffff',
      bullColor: '#e0f2fe',
      badgeBg: 'rgba(0,0,0,0.2)',
      shadow: '0 3px 8px rgba(14, 165, 233, 0.25)'
    };
  }
  // 1牛
  return {
    bg: '#ffffff',
    border: '#cbd5e1',
    text: '#1e293b',
    bullColor: '#64748b',
    badgeBg: '#f1f5f9',
    shadow: '0 2px 6px rgba(0,0,0,0.08)'
  };
};

// 単体カードコンポーネント
const NimmtCard = ({
  number,
  bullheads = getBullheads(number),
  playedBy = null,
  isSelected = false,
  isSmall = false,
  isClickable = false,
  onClick = null,
  getPlayerName = null,
  targetHint = null
}) => {
  const style = getCardStyle(bullheads);
  const width = isSmall ? '54px' : '72px';
  const height = isSmall ? '76px' : '102px';
  const numFontSize = isSmall ? '16px' : '23px';

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      style={{
        width,
        height,
        minWidth: width,
        background: style.bg,
        border: isSelected ? '3px solid #3b82f6' : `2px solid ${style.border}`,
        borderRadius: '10px',
        color: style.text,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isSmall ? '4px' : '6px',
        boxSizing: 'border-box',
        cursor: isClickable ? 'pointer' : 'default',
        transform: isSelected ? 'translateY(-10px) scale(1.06)' : 'none',
        boxShadow: isSelected ? '0 12px 24px rgba(59, 130, 246, 0.45)' : style.shadow,
        transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* 上部：牛マーク一覧 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1px' }}>
        {Array.from({ length: Math.min(bullheads, 7) }).map((_, i) => (
          <span key={i} style={{ fontSize: isSmall ? '8px' : '10px', lineHeight: 1 }}>🐂</span>
        ))}
        {bullheads > 1 && (
          <span style={{ fontSize: isSmall ? '9px' : '11px', fontWeight: 'bold', marginLeft: '2px', color: style.bullColor }}>
            ×{bullheads}
          </span>
        )}
      </div>

      {/* 中央：大きなカード番号 */}
      <div style={{
        textAlign: 'center',
        fontWeight: '900',
        fontSize: numFontSize,
        letterSpacing: '-0.5px',
        lineHeight: 1
      }}>
        {number}
      </div>

      {/* 下部：配置者名またはターゲットヒント */}
      <div style={{ textAlign: 'center', fontSize: isSmall ? '8px' : '10px', minHeight: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {playedBy !== null && getPlayerName ? (
          <span style={{ background: style.badgeBg, padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>
            {getPlayerName(playedBy)}
          </span>
        ) : targetHint ? (
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold', fontSize: '9px' }}>
            {targetHint}
          </span>
        ) : (
          <span style={{ opacity: 0.7 }}>{number}</span>
        )}
      </div>
    </div>
  );
};

export const NimmtBoard = ({ G, ctx, moves, playerID, matchData }) => {
  const [selectedNum, setSelectedNum] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [burstAnim, setBurstAnim] = useState(null); // { event, phase: 'placed' | 'collecting' }
  const lastBustNoticeIdRef = useRef(null);

  const isSpectator = playerID === null || playerID === undefined;
  const pid = isSpectator ? null : playerID.toString();
  const myPlayer = pid !== null ? (G.players[pid] || { hand: [], totalPenalty: 0, roundPenalty: 0, penaltyCards: [] }) : { hand: [], totalPenalty: 0, roundPenalty: 0, penaltyCards: [] };

  const getPlayerName = (id) => {
    if (id === null || id === undefined) return '？？？';
    const p = matchData?.find(m => m.id == id);
    return p && p.name ? p.name : `Player ${id}`;
  };

  // バーストイベントの演出制御（「置いてから回収する」2段階アニメーション）
  useEffect(() => {
    const bustEvent = G.recentBustEvent;
    if (bustEvent && bustEvent.id && bustEvent.id !== lastBustNoticeIdRef.current) {
      lastBustNoticeIdRef.current = bustEvent.id;

      // 1段階目: 6枚目（または全滅引取カード）がその列に置かれた状態を明示表示
      setBurstAnim({ event: bustEvent, phase: 'placed' });

      // 2段階目: 1.8秒後に回収演出へ移行（対象カードがフェードアウト）
      const collectTimer = setTimeout(() => {
        setBurstAnim(prev => (prev && prev.event.id === bustEvent.id ? { ...prev, phase: 'collecting' } : null));
      }, 1800);

      // 3段階目: 2.7秒後に通常表示（回収完了）へ移行
      const doneTimer = setTimeout(() => {
        setBurstAnim(prev => (prev && prev.event.id === bustEvent.id ? null : prev));
      }, 2700);

      return () => {
        clearTimeout(collectTimer);
        clearTimeout(doneTimer);
      };
    } else if (!bustEvent) {
      setBurstAnim(null);
    }
  }, [G.recentBustEvent?.id]);

  // 手札カードの配置予測ヒントを計算
  const getCardTargetHint = (cardNum) => {
    if (G.turnStep !== 'select') return null;
    const diffs = G.rows.map((row, idx) => ({
      idx,
      diff: cardNum - row[row.length - 1].number
    }));
    const valid = diffs.filter(d => d.diff > 0);
    if (valid.length === 0) {
      return '⚠️全滅(引取)';
    }
    valid.sort((a, b) => a.diff - b.diff);
    const best = valid[0];
    const rowLen = G.rows[best.idx].length;
    if (rowLen === 5) {
      return `💥列${best.idx + 1}(6枚目!)`;
    }
    return `列${best.idx + 1} (+${best.diff})`;
  };

  // 選択カードの決定送信
  const handleConfirmSelection = () => {
    if (selectedNum === null) return;
    moves.selectCard(pid, selectedNum);
    setSelectedNum(null);
  };

  // ルールモーダル
  const rulesModal = showRules && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
      <div style={{ background: '#fff', padding: '28px', borderRadius: '16px', maxWidth: '600px', width: '95%', maxHeight: '85vh', overflowY: 'auto', textAlign: 'left', lineHeight: 1.6, color: '#334155' }}>
        <h2 style={{ marginTop: 0, color: '#dc2626', borderBottom: '2px solid #fecaca', paddingBottom: '8px' }}>
          🐂 ニムト (6 Nimmt!) 公式ルール
        </h2>
        
        <h3 style={{ color: '#b91c1c', marginBottom: '6px' }}>🎯 目的</h3>
        <p style={{ margin: '0 0 12px' }}>
          カードに書かれた**牛マーク（失点ペナルティ）を引き取らないようにする**ゲームです！最終的に失点がもっとも少ないプレイヤーが勝利します。
        </p>

        <h3 style={{ color: '#b91c1c', marginBottom: '6px' }}>🃏 カードと牛マーク（失点）</h3>
        <p style={{ margin: '0 0 8px' }}>1〜104のカードがあり、数字によって牛の数が異なります：</p>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li><strong style={{ color: '#dc2626' }}>55番</strong>: <strong>7牛</strong> （一番ヤバいカード！）</li>
          <li><strong style={{ color: '#7c3aed' }}>ゾロ目 (11, 22, 33...99)</strong>: <strong>5牛</strong></li>
          <li><strong style={{ color: '#ea580c' }}>10の倍数 (10, 20, 30...100)</strong>: <strong>3牛</strong></li>
          <li><strong style={{ color: '#0284c7' }}>5の倍数 (5, 15, 25...95)</strong>: <strong>2牛</strong></li>
          <li>その他の数字: <strong>1牛</strong></li>
        </ul>

        <h3 style={{ color: '#b91c1c', marginBottom: '6px' }}>🔨 ゲームの流れ</h3>
        <ol style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li>全員に手札が<strong>10枚</strong>配られ、場に<strong>4枚の列</strong>が作られます。</li>
          <li>全員が手札から<strong>1枚を同時に選び</strong>、一斉にオープンします。</li>
          <li><strong>数字が小さい人から順に</strong>、以下のルールで場の4列に配置していきます：
            <ul style={{ marginTop: '4px' }}>
              <li><strong>「そのカードより小さく、もっとも数字が近い列」</strong>の末尾に置く。</li>
            </ul>
          </li>
          <li><strong style={{ color: '#dc2626' }}>💥 6枚目の恐怖（ニムト！）:</strong>
            列の<strong>6枚目</strong>を置いてしまった人は、<strong>その列の5枚をすべて引き取り（失点！）</strong>、自分のカードが新たな1枚目になります。
          </li>
          <li><strong style={{ color: '#b45309' }}>⚡ どの列よりも小さい数字を出した場合:</strong>
            場の4列のいずれの末尾よりも小さいカードを出した人は、<strong>好きな列を1つ選んで全カードを引き取り</strong>、自分のカードを1枚目として置きます。
          </li>
        </ol>

        <h3 style={{ color: '#b91c1c', marginBottom: '6px' }}>🏆 勝敗</h3>
        <p style={{ margin: '0 0 16px' }}>
          10ターン（手札10枚）で1ラウンド終了。累計失点が<strong>66牛</strong>に達したプレイヤーが出たらゲーム終了となり、最少失点者の勝利となります！
        </p>

        <button
          onClick={() => setShowRules(false)}
          style={{
            width: '100%',
            padding: '12px',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );

  // 1. 待機ロビー画面
  if (G.gameState === 'lobby') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <UnifiedLobby
          gameTitle="6 Nimmt! (ニムト)"
          gameIcon="🐂"
          gameSubtitle="1〜104のカードで心理戦！ 6枚目を置いたらアウトの名作パーティーゲーム"
          themeColor="#dc2626"
          themeGradient="linear-gradient(135deg, #dc2626, #991b1b)"
          numPlayers={ctx.numPlayers}
          playerIds={Object.keys(G.players)}
          pid={pid}
          getPlayerName={getPlayerName}
          isHost={!isSpectator && pid === '0'}
          onStart={() => moves.startGame()}
          onShowRules={() => setShowRules(true)}
          rulesModal={rulesModal}
        >
          {/* ゲームモード設定 */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '8px', textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>🎮 ゲーム方式:</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => moves.setGameMode('standard')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                  background: G.gameMode === 'standard' ? '#dc2626' : '#fff',
                  color: G.gameMode === 'standard' ? '#fff' : '#475569',
                  border: G.gameMode === 'standard' ? '2px solid #b91c1c' : '1px solid #cbd5e1',
                  boxShadow: G.gameMode === 'standard' ? '0 4px 10px rgba(220, 38, 38, 0.3)' : 'none',
                  fontWeight: 'bold', fontSize: '13px', transition: 'all 0.15s'
                }}
              >
                <div>🔥 通常マッチ (66牛先取)</div>
                <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>誰かが66失点に達するまで連戦</div>
              </button>
              <button
                onClick={() => moves.setGameMode('quick')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                  background: G.gameMode === 'quick' ? '#dc2626' : '#fff',
                  color: G.gameMode === 'quick' ? '#fff' : '#475569',
                  border: G.gameMode === 'quick' ? '2px solid #b91c1c' : '1px solid #cbd5e1',
                  boxShadow: G.gameMode === 'quick' ? '0 4px 10px rgba(220, 38, 38, 0.3)' : 'none',
                  fontWeight: 'bold', fontSize: '13px', transition: 'all 0.15s'
                }}
              >
                <div>⚡ 1ラウンド勝負</div>
                <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>10ターン1戦のみで即決着</div>
              </button>
            </div>
          </div>
        </UnifiedLobby>
      </div>
    );
  }

  // 2. プレイ中・ラウンド終了・ゲームオーバー画面
  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '12px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.6) translateY(-15px); opacity: 0; }
          60% { transform: scale(1.08) translateY(2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
      {rulesModal}

      {/* バースト発生トースト通知（置いてから回収する2段階通知） */}
      {burstAnim && (
        <div
          onClick={() => setBurstAnim(null)}
          title="クリックして閉じる"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: burstAnim.phase === 'placed'
              ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
              : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '30px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
            zIndex: 1100,
            fontWeight: 'bold',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '2px solid #fff',
            animation: 'bounceIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '24px' }}>
            {burstAnim.phase === 'placed' ? '💥' : '🐂'}
          </span>
          <span>
            {burstAnim.phase === 'placed' ? (
              burstAnim.event.isManualTake ? (
                <>
                  ⚡<strong>【列 {burstAnim.event.rowIdx + 1}】</strong> に <strong>{getPlayerName(burstAnim.event.playerID)}</strong> が全滅カード [<strong>{burstAnim.event.placedCard.number}</strong>] を配置！
                </>
              ) : (
                <>
                  💥<strong>【列 {burstAnim.event.rowIdx + 1}】</strong> に <strong>{getPlayerName(burstAnim.event.playerID)}</strong> が [<strong>{burstAnim.event.placedCard.number}</strong>] を配置！（<strong>6枚目バースト！</strong>）
                </>
              )
            ) : (
              <>
                🐂 <strong>{getPlayerName(burstAnim.event.playerID)}</strong> が列 {burstAnim.event.rowIdx + 1} のカードを回収しました！（+{burstAnim.event.penaltyPoints}牛）
              </>
            )}
          </span>
          <span style={{ marginLeft: '10px', fontSize: '13px', opacity: 0.8 }}>✕</span>
        </div>
      )}

      {/* TOP HEADER: タイトル・ラウンド情報・ルール */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '12px 18px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🐂</span>
          <div>
            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#dc2626' }}>6 Nimmt!</span>
            <span style={{ marginLeft: '10px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
              ラウンド {G.round} - ターン {G.turn} / 10
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowRules(true)}
            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
          >
            📖 ルール
          </button>
        </div>
      </div>

      {/* PLAYERS STATUS BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ctx.numPlayers}, 1fr)`, gap: '8px', marginBottom: '14px' }}>
        {Object.keys(G.players).map(id => {
          const p = G.players[id];
          const isMe = id === pid;
          const isWaitingThis = G.turnStep === 'choose_row' && G.waitingForPlayer === id;
          return (
            <div
              key={id}
              style={{
                background: isWaitingThis ? '#fffbeb' : (isMe ? '#f0fdf4' : '#ffffff'),
                border: isWaitingThis ? '2px solid #f59e0b' : (isMe ? '2px solid #86efac' : '1px solid #e2e8f0'),
                borderRadius: '10px',
                padding: '8px 10px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: isMe ? '#166534' : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {getPlayerName(id)} {isMe ? '(自分)' : ''}
              </div>
              <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                  🐂 {p.totalPenalty + p.roundPenalty}牛
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  (今ラウンド: +{p.roundPenalty}牛)
                </span>
              </div>
              <div style={{ marginTop: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                {G.turnStep === 'select' ? (
                  p.isReady ? (
                    <span style={{ color: '#16a34a' }}>✓ 選択完了</span>
                  ) : (
                    <span style={{ color: '#ea580c' }}>⏳ 選択中...</span>
                  )
                ) : isWaitingThis ? (
                  <span style={{ color: '#b45309' }}>⚡ 列を選択中！</span>
                ) : (
                  <span style={{ color: '#64748b' }}>手札: {p.hand.length}枚</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN GAME BOARD: 4 ROWS */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '18px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2)', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
          <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>場の4列</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>（6枚目を置くとその列の5枚を引き取り！）</span>
          </div>

          {/* 列引き取りが必要な場合の案内 */}
          {G.turnStep === 'choose_row' && G.waitingForPlayer === pid && (
            <div style={{ background: '#fef08a', color: '#854d0e', padding: '4px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', animation: 'pulse 1.5s infinite' }}>
              ⚡ 引き取る列をクリックして選択してください！
            </div>
          )}
        </div>

        {/* 4列のレンダリング */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {G.rows.map((row, rowIdx) => {
            const isThisRowBursting = burstAnim && burstAnim.event.rowIdx === rowIdx;
            const burstEvent = isThisRowBursting ? burstAnim.event : null;
            const burstPhase = isThisRowBursting ? burstAnim.phase : null;

            const isRowFull = row.length === 5;
            const totalBullheadsInRow = row.reduce((sum, c) => sum + c.bullheads, 0);
            const canChooseThisRow = G.turnStep === 'choose_row' && G.waitingForPlayer === pid;

            return (
              <div
                key={rowIdx}
                onClick={() => canChooseThisRow && moves.chooseRow(pid, rowIdx)}
                style={{
                  background: isThisRowBursting
                    ? (burstPhase === 'placed' ? 'rgba(239, 68, 68, 0.22)' : 'rgba(245, 158, 11, 0.18)')
                    : (canChooseThisRow ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.65)'),
                  border: isThisRowBursting
                    ? (burstPhase === 'placed' ? '2px solid #ef4444' : '2px solid #f59e0b')
                    : (canChooseThisRow ? '2px dashed #f59e0b' : '1px solid #334155'),
                  boxShadow: isThisRowBursting
                    ? (burstPhase === 'placed' ? '0 0 25px rgba(239, 68, 68, 0.6)' : '0 0 20px rgba(245, 158, 11, 0.4)')
                    : 'none',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: canChooseThisRow ? 'pointer' : 'default',
                  transition: 'all 0.25s ease',
                  position: 'relative'
                }}
              >
                {/* 行番号 & 失点情報バッジ */}
                <div style={{ minWidth: '85px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>列 {rowIdx + 1}</span>
                  {isThisRowBursting ? (
                    <span style={{ color: burstPhase === 'placed' ? '#ef4444' : '#f59e0b', fontSize: '11px', fontWeight: 'bold' }}>
                      {burstPhase === 'placed' ? '💥 バースト！' : '🐂 回収中...'}
                    </span>
                  ) : (
                    <>
                      <span style={{ color: '#f87171', fontSize: '12px', fontWeight: 'bold' }}>
                        🐂 {totalBullheadsInRow}牛
                      </span>
                      <span style={{ color: isRowFull ? '#ef4444' : '#38bdf8', fontSize: '11px', fontWeight: isRowFull ? 'bold' : 'normal' }}>
                        {row.length} / 5枚
                      </span>
                    </>
                  )}
                </div>

                {/* カード一覧 */}
                {isThisRowBursting ? (
                  /* バーストアニメーション表示：まず置いてから回収 */
                  <div style={{ display: 'flex', gap: '8px', flex: 1, overflowX: 'auto', alignItems: 'center' }}>
                    {/* 回収対象カード（5枚） */}
                    {burstEvent.takenCards.map((card, cIdx) => (
                      <div
                        key={`burst-taken-${cIdx}-${card.number}`}
                        style={{
                          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          opacity: burstPhase === 'collecting' ? 0 : 1,
                          transform: burstPhase === 'collecting' ? 'scale(0.6) translateY(-30px)' : 'none',
                          filter: burstPhase === 'collecting' ? 'blur(2px)' : 'none',
                          pointerEvents: 'none'
                        }}
                      >
                        <NimmtCard
                          number={card.number}
                          bullheads={card.bullheads}
                          playedBy={card.playedBy}
                          getPlayerName={getPlayerName}
                          isSmall={false}
                        />
                      </div>
                    ))}

                    {/* 配置された6枚目カード */}
                    <div
                      style={{
                        position: 'relative',
                        animation: 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transform: burstPhase === 'collecting' ? 'scale(1.05)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: burstEvent.isManualTake ? '#d97706' : '#dc2626',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: '900',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        zIndex: 5,
                        border: '1px solid #fff'
                      }}>
                        {burstEvent.isManualTake ? '⚡ 引取配置' : '💥 6枚目！'}
                      </div>

                      <NimmtCard
                        number={burstEvent.placedCard.number}
                        bullheads={burstEvent.placedCard.bullheads}
                        playedBy={burstEvent.playerID}
                        getPlayerName={getPlayerName}
                        isSelected={true}
                        isSmall={false}
                      />
                    </div>
                  </div>
                ) : (
                  /* 通常の行カード表示 */
                  <div style={{ display: 'flex', gap: '8px', flex: 1, overflowX: 'auto', alignItems: 'center' }}>
                    {row.map((card, cIdx) => (
                      <NimmtCard
                        key={`${rowIdx}-${cIdx}-${card.number}`}
                        number={card.number}
                        bullheads={card.bullheads}
                        playedBy={card.playedBy}
                        getPlayerName={getPlayerName}
                        isSmall={false}
                      />
                    ))}

                    {/* 危険な6枚目スロット（警告表示） */}
                    {row.length === 5 ? (
                      <div style={{
                        width: '72px',
                        height: '102px',
                        borderRadius: '10px',
                        border: '2px dashed #ef4444',
                        background: 'rgba(239, 68, 68, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f87171',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        textAlign: 'center',
                        padding: '4px',
                        boxSizing: 'border-box',
                        animation: 'pulse 1.2s infinite'
                      }}>
                        <span style={{ fontSize: '18px' }}>💥</span>
                        <span>6枚目</span>
                        <span style={{ fontSize: '9px' }}>バースト!</span>
                      </div>
                    ) : (
                      /* 空きスロット枠 */
                      Array.from({ length: 5 - row.length }).map((_, emptyIdx) => (
                        <div
                          key={emptyIdx}
                          style={{
                            width: '72px',
                            height: '102px',
                            borderRadius: '10px',
                            border: '1px dashed #334155',
                            background: 'rgba(255, 255, 255, 0.02)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#475569',
                            fontSize: '12px'
                          }}
                        >
                          {row.length + emptyIdx + 1}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 引き取り選択ボタン（引き取り時のみ表示） */}
                {canChooseThisRow && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moves.chooseRow(pid, rowIdx);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    この列を引き取る (+{totalBullheadsInRow}牛)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RESOLUTION REVEAL DISPLAY (全員のカードが公開されたとき) */}
      {G.lastRevealedCards && G.lastRevealedCards.length > 0 && G.turnStep !== 'select' && (
        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
            🃏 全員の公開カード (小さい順に配置中):
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {G.lastRevealedCards.map((item, idx) => {
              const isCurrentlyPlacing = G.currentResolving?.card?.number === item.card.number;
              return (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: item.playerID === pid ? '#16a34a' : '#64748b', marginBottom: '4px' }}>
                    {getPlayerName(item.playerID)} {item.playerID === pid ? '(自分)' : ''}
                  </div>
                  <NimmtCard
                    number={item.card.number}
                    bullheads={item.card.bullheads}
                    isSelected={isCurrentlyPlacing}
                    isSmall={true}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PLAYER HAND & CARD SELECTION (手札操作エリア) */}
      {isSpectator ? (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', border: '2px solid #38bdf8', marginBottom: '14px', textAlign: 'center', color: '#0369a1', fontWeight: 'bold', fontSize: '14px' }}>
          👀 観戦モード中！（プレイヤーの手札は非公開・場の列と公開カードをリアルタイム観戦しています）
        </div>
      ) : (
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>
            🖐️ あなたの手札 ({myPlayer.hand.length}枚)
          </div>

          {/* 選択決定ボタン */}
          {G.turnStep === 'select' && !myPlayer.isReady && (
            <button
              onClick={handleConfirmSelection}
              disabled={selectedNum === null}
              style={{
                background: selectedNum === null ? '#cbd5e1' : 'linear-gradient(135deg, #16a34a, #15803d)',
                color: selectedNum === null ? '#64748b' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 20px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: selectedNum === null ? 'not-allowed' : 'pointer',
                boxShadow: selectedNum === null ? 'none' : '0 4px 12px rgba(22, 163, 74, 0.35)',
                transition: 'all 0.15s'
              }}
            >
              {selectedNum === null ? 'カードを選んでください' : `[${selectedNum}] を決定して出す！`}
            </button>
          )}

          {/* 選択済み待ち表示 */}
          {G.turnStep === 'select' && myPlayer.isReady && (
            <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✓ 選択完了！</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>他のプレイヤーを待っています...</span>
            </div>
          )}
        </div>

        {/* 手札カード一覧 */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '12px 4px 8px', alignItems: 'center' }}>
          {myPlayer.hand.length > 0 ? (
            myPlayer.hand.map((card) => {
              const isSelected = selectedNum === card.number;
              const hint = getCardTargetHint(card.number);
              return (
                <NimmtCard
                  key={card.number}
                  number={card.number}
                  bullheads={card.bullheads}
                  isSelected={isSelected}
                  isClickable={G.turnStep === 'select' && !myPlayer.isReady}
                  onClick={() => setSelectedNum(card.number)}
                  targetHint={hint}
                />
              );
            })
          ) : (
            <div style={{ color: '#94a3b8', fontSize: '14px', padding: '20px', textAlign: 'center', width: '100%' }}>
              手札はありません（ラウンド終了）
            </div>
          )}
        </div>
      </div>
      )}

      {/* GAME LOGS */}
      <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>
          📜 プレイログ
        </div>
        <div style={{ maxHeight: '110px', overflowY: 'auto', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
          {G.logs && G.logs.length > 0 ? (
            G.logs.slice(0, 15).map((log, i) => (
              <div key={i} style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '3px', marginBottom: '3px' }}>
                {log.replace(/Player (\d+)/g, (_, id) => getPlayerName(id))}
              </div>
            ))
          ) : (
            <div style={{ color: '#94a3b8' }}>まだログはありません。</div>
          )}
        </div>
      </div>

      {/* ROUND END MODAL (ラウンド結果) */}
      {G.gameState === 'round_end' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '480px', width: '90%', padding: '24px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h2 style={{ color: '#ea580c', margin: '0 0 10px' }}>🏁 ラウンド {G.round} 終了！</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px' }}>
              手札の10枚をすべてプレイしました。各プレイヤーの失点結果です：
            </p>

            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', marginBottom: '20px' }}>
              {Object.keys(G.players).map(id => {
                const p = G.players[id];
                return (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
                    <span style={{ fontWeight: 'bold' }}>{getPlayerName(id)}</span>
                    <span>今ラウンド: <strong>+{p.roundPenalty}牛</strong> / 累計: <strong style={{ color: '#dc2626' }}>{p.totalPenalty}牛</strong></span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => moves.startNextRound()}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #ea580c, #c2410c)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              次のラウンドへ進む ➔
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL (勝者決定) */}
      {G.gameState === 'game_over' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', maxWidth: '520px', width: '90%', padding: '28px', textAlign: 'center', boxShadow: '0 15px 40px rgba(0,0,0,0.4)', border: '3px solid #f59e0b' }}>
            <div style={{ fontSize: '50px', marginBottom: '8px' }}>🏆</div>
            <h2 style={{ color: '#b45309', margin: '0 0 6px', fontSize: '24px' }}>ゲーム終了！</h2>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a', marginBottom: '20px' }}>
              👑 勝者: {getPlayerName(G.winner)}（最少失点！）
            </div>

            {/* ランキング一覧 */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>最終順位:</div>
              {G.rankings?.map((r, rankIdx) => (
                <div
                  key={r.playerID}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    background: rankIdx === 0 ? '#fef08a' : (rankIdx === G.rankings.length - 1 ? '#fee2e2' : '#ffffff'),
                    border: rankIdx === 0 ? '1px solid #eab308' : '1px solid #e2e8f0',
                    fontWeight: rankIdx === 0 ? 'bold' : 'normal',
                    fontSize: '14px'
                  }}
                >
                  <span>
                    {rankIdx === 0 ? '🥇 1位' : (rankIdx === 1 ? '🥈 2位' : (rankIdx === 2 ? '🥉 3位' : `${rankIdx + 1}位`))}: {getPlayerName(r.playerID)}
                  </span>
                  <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                    {r.totalPenalty}牛
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => moves.restartGame()}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)'
              }}
            >
              🔄 もう一度遊ぶ（ロビーに戻る）
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
