// DeepSeaBoard.jsx - 海底探険 (Deep Sea Adventure) Board UI
import React, { useState } from 'react';
import { UnifiedLobby } from './UnifiedLobby';

const LEVEL_STYLES = {
  1: { name: 'Lv.1 浅海', range: '0〜3点', bg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', border: '#7dd3fc', badge: '#0369a1', shape: '▲' },
  2: { name: 'Lv.2 中層', range: '4〜7点', bg: 'linear-gradient(135deg, #2563eb, #3b82f6)', border: '#93c5fd', badge: '#1d4ed8', shape: '■' },
  3: { name: 'Lv.3 深海', range: '8〜11点', bg: 'linear-gradient(135deg, #4338ca, #6366f1)', border: '#a5b4fc', badge: '#312e81', shape: '⬟' },
  4: { name: 'Lv.4 超深海', range: '12〜15点', bg: 'linear-gradient(135deg, #7e22ce, #a855f7)', border: '#d8b4fe', badge: '#581c87', shape: '⬢' },
};

export const DeepSeaBoard = ({ G, ctx, moves, playerID, matchData }) => {
  const isSpectator = playerID === null || playerID === undefined;
  const pid = isSpectator ? null : playerID.toString();
  const [showRules, setShowRules] = useState(false);

  const getPlayerName = (id) => {
    const numId = parseInt(id, 10);
    const meta = matchData?.find((m) => m.id === numId || m.id?.toString() === id?.toString());
    return meta?.name || `Player ${id}`;
  };

  const myPlayer = pid !== null ? G.players[pid] : null;
  const currentDiver = G.players[G.currentPlayerId];
  const isMyTurn = !isSpectator && G.gameState === 'playing' && G.currentPlayerId === pid;

  // ルール説明モーダル
  const rulesModal = showRules && (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.82)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: '16px'
    }}>
      <div style={{
        background: '#0f172a', border: '2px solid #38bdf8', borderRadius: '20px',
        padding: '26px', maxWidth: '620px', width: '95%', maxHeight: '86vh', overflowY: 'auto',
        color: '#e2e8f0', textAlign: 'left', lineHeight: 1.65, boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
      }}>
        <h2 style={{ margin: '0 0 12px', color: '#38bdf8', borderBottom: '1px solid rgba(56,189,248,0.3)', paddingBottom: '8px' }}>
          🌊 海底探険 (Deep Sea Adventure) ルール
        </h2>
        <p style={{ fontSize: '13px', margin: '0 0 12px', color: '#cbd5e1' }}>
          プレイヤー全員が<strong>1隻の潜水艦の「共有酸素（25）」</strong>を使って深海のお宝を持ち帰る、ギリギリの欲張りチキンレースゲームです（全3ラウンド）。
        </p>

        <h3 style={{ fontSize: '15px', color: '#fde047', margin: '10px 0 6px' }}>🫧 1. ターン開始と酸素の消費</h3>
        <ul style={{ margin: '0 0 10px', paddingLeft: '20px', fontSize: '13px' }}>
          <li>手番の最初、<strong>今持っている未確定の財宝の数</strong>だけ共有酸素が減ります（0個なら減りません）。</li>
          <li>酸素が <strong>0以下</strong> になった瞬間ラウンド終了！潜水艦に戻れなかったダイバーはお宝をすべて海底に落とします。</li>
        </ul>

        <h3 style={{ fontSize: '15px', color: '#fde047', margin: '10px 0 6px' }}>🎲 2. 引き返し宣言 ＆ ダイス移動</h3>
        <ul style={{ margin: '0 0 10px', paddingLeft: '20px', fontSize: '13px' }}>
          <li>ダイスを振る前に<strong>「引き返す（帰路につく）」</strong>宣言ができます（※1ラウンド中1回のみ・再び潜る向きには戻れません）。</li>
          <li><strong>1〜3の目しかない特殊ダイス2個</strong>を振ります（合計2〜6）。</li>
          <li><strong>重荷ペナルティ</strong>：持っている財宝1つにつき<strong>出目から -1</strong> されます！</li>
          <li>他のダイバーが止まっているマスはカウントせず<strong>飛び越えて</strong>進みます。</li>
        </ul>

        <h3 style={{ fontSize: '15px', color: '#fde047', margin: '10px 0 6px' }}>💎 3. 探索アクション（拾う・置く）</h3>
        <ul style={{ margin: '0 0 10px', paddingLeft: '20px', fontSize: '13px' }}>
          <li><strong>財宝マス</strong>：拾う（重荷＋1）か、何もしないか選べます。深海（Lv.1〜4）ほど高得点ですが重くなります。</li>
          <li><strong>空きマス</strong>：拾われて空になったマスでは、身軽になるために手持ちの財宝を1つ置くこともできます。</li>
        </ul>

        <h3 style={{ fontSize: '15px', color: '#fde047', margin: '10px 0 6px' }}>⚓ 4. ラウンド終了と沈殿</h3>
        <ul style={{ margin: '0 0 14px', paddingLeft: '20px', fontSize: '13px' }}>
          <li>潜水艦に帰還した人のお宝は得点確定！裏向きの数字がオープンされます。</li>
          <li>帰還できなかった人の財宝は<strong>最深部に「最大3個で1塊のスタック」として沈殿</strong>します。次のラウンドでは1個分の重さで3個分拾えます！</li>
          <li>空きマスは取り除かれコースが短くなるため、後半ラウンドほど深海に手が届きます！</li>
        </ul>

        <button
          onClick={() => setShowRules(false)}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff',
            fontWeight: 'bold', fontSize: '15px', cursor: 'pointer'
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );

  // 1. ロビー画面
  if (G.gameState === 'lobby') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 20%, #0c4a6e 0%, #082f49 55%, #020617 100%)',
        padding: '20px'
      }}>
        <UnifiedLobby
          gameTitle="海底探険 (Deep Sea Adventure)"
          gameIcon="🌊"
          gameSubtitle="酸素を共有しながらお宝を狙う、究極の欲張りチキンレース！"
          themeColor="#0284c7"
          themeGradient="linear-gradient(135deg, #0ea5e9, #0369a1)"
          numPlayers={ctx.numPlayers}
          playerIds={Object.keys(G.players)}
          pid={pid}
          getPlayerName={getPlayerName}
          isHost={!isSpectator && pid === '0'}
          hostOnlyStart={true}
          onStart={() => moves.startGame()}
          startText="🤿 海底探険を開始する！"
          onShowRules={() => setShowRules(true)}
          rulesModal={rulesModal}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            {!isSpectator && pid === '0' && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => moves.setGameMode('standard')}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
                    border: (G.gameMode || 'standard') === 'standard' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: (G.gameMode || 'standard') === 'standard' ? '#e0f2fe' : '#fff',
                    color: (G.gameMode || 'standard') === 'standard' ? '#0369a1' : '#475569'
                  }}
                >
                  🌊 全3ラウンド（通常ルール）
                </button>
                <button
                  onClick={() => moves.setGameMode('quick')}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
                    border: G.gameMode === 'quick' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: G.gameMode === 'quick' ? '#e0f2fe' : '#fff',
                    color: G.gameMode === 'quick' ? '#0369a1' : '#475569'
                  }}
                >
                  ⚡ 1回戦のみ（サクッと勝負）
                </button>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap',
              fontSize: '12px', color: '#0369a1', fontWeight: 'bold'
            }}>
              <span style={{ background: '#e0f2fe', padding: '4px 12px', borderRadius: '12px' }}>🫧 共有酸素: 25</span>
              <span style={{ background: '#e0f2fe', padding: '4px 12px', borderRadius: '12px' }}>⏳ {(G.maxRounds || 3) === 1 ? '1回戦のみ' : '全3ラウンド'}</span>
              <span style={{ background: '#e0f2fe', padding: '4px 12px', borderRadius: '12px' }}>🎲 特殊ダイス 1〜3×2個</span>
            </div>
          </div>
        </UnifiedLobby>
      </div>
    );
  }

  // 酸素ゲージ計算
  const oxyPct = Math.max(0, Math.min(100, (G.oxygen / G.maxOxygen) * 100));
  const oxyColor = G.oxygen > 12 ? '#38bdf8' : G.oxygen > 6 ? '#f59e0b' : '#ef4444';

  // 潜水艦にいるプレイヤー
  const diversInSub = Object.values(G.players).filter((p) => p.position === -1 || p.returned);

  // 各マスのプレイヤー取得
  const getDiverAt = (idx) => Object.values(G.players).find((p) => !p.returned && p.position === idx);

  // コースを8マスずつの行に分割（スネーク表示）
  const chunkSize = 8;
  const rows = [];
  for (let i = 0; i < G.track.length; i += chunkSize) {
    const slice = G.track.slice(i, i + chunkSize).map((tile, offset) => ({ tile, idx: i + offset }));
    const rowIdx = Math.floor(i / chunkSize);
    rows.push({ rowIdx, items: rowIdx % 2 === 1 ? [...slice].reverse() : slice });
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #082f49 0%, #0f172a 45%, #1e1b4b 85%, #090514 100%)',
      color: '#f8fafc',
      padding: '16px 14px 32px',
      fontFamily: "'Segoe UI', -apple-system, sans-serif",
      boxSizing: 'border-box'
    }}>
      {rulesModal}

      <style>{`
        @keyframes oxyPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 26px rgba(239, 68, 68, 0.95); }
        }
        @keyframes diverFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
      `}</style>

      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* TOP HEADER & SHARED OXYGEN GAUGE */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${G.oxygen <= 6 ? '#ef4444' : 'rgba(56, 189, 248, 0.35)'}`,
          borderRadius: '18px',
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          animation: G.oxygen <= 6 && G.gameState === 'playing' ? 'oxyPulse 1.4s infinite' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '30px' }}>🌊</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>海底探険</span>
                <span style={{
                  background: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: '900',
                  padding: '2px 10px', borderRadius: '10px'
                }}>
                  ROUND {G.round} / {G.maxRounds || 3}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {G.gameState === 'playing'
                  ? `🎯 ${getPlayerName(G.currentPlayerId)} の手番（${G.turnStep === 'roll' ? 'ダイス＆方向決定' : '足元アクション'}）`
                  : G.gameState === 'round_end' ? `⚓ ラウンド ${G.round} 終了！` : '🏆 探険完了！'}
              </div>
            </div>
          </div>

          {/* OXYGEN BAR */}
          <div style={{ flex: '1 1 280px', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1' }}>
                🫧 共有酸素タンク（全員で消費）
              </span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: oxyColor }}>
                {G.oxygen} <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ {G.maxOxygen}</span>
              </span>
            </div>
            <div style={{
              width: '100%', height: '14px', background: 'rgba(255,255,255,0.1)',
              borderRadius: '999px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)'
            }}>
              <div style={{
                width: `${oxyPct}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${oxyColor}, #7dd3fc)`,
                transition: 'width 0.35s ease, background 0.35s ease',
                borderRadius: '999px'
              }} />
            </div>
            {G.oxygen <= 6 && G.gameState === 'playing' && (
              <div style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 'bold', marginTop: '3px' }}>
                ⚠️ 酸素危険水域！0になるとラウンド強制終了・未帰還者は全没収！
              </div>
            )}
          </div>

          <button
            onClick={() => setShowRules(true)}
            style={{
              background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#7dd3fc',
              padding: '7px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'
            }}
          >
            📖 ルール
          </button>
        </div>

        {/* PLAYERS STATUS CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
          gap: '10px'
        }}>
          {Object.values(G.players).map((p) => {
            const isCur = G.gameState === 'playing' && G.currentPlayerId === p.id;
            const isMe = p.id === pid;
            return (
              <div
                key={p.id}
                style={{
                  background: isCur ? 'rgba(14, 165, 233, 0.22)' : 'rgba(15, 23, 42, 0.75)',
                  border: isCur ? `2px solid ${p.color}` : isMe ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  boxShadow: isCur ? `0 0 18px ${p.color}55` : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '12px', height: '12px', borderRadius: '50%', background: p.color,
                      border: '2px solid #fff', display: 'inline-block'
                    }} />
                    <strong style={{ fontSize: '13px', color: isMe ? '#fde047' : '#ffffff' }}>
                      {getPlayerName(p.id)}{isMe ? '(あなた)' : ''}
                    </strong>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#fde047' }}>
                    {p.score}<span style={{ fontSize: '10px', color: '#cbd5e1' }}>点</span>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#cbd5e1' }}>
                  <span>
                    {p.returned ? (
                      <span style={{ color: '#4ade80', fontWeight: 'bold' }}>⚓ 帰還済</span>
                    ) : p.position === -1 ? (
                      <span style={{ color: '#7dd3fc' }}>🚢 潜水艦待機</span>
                    ) : (
                      <span style={{ color: p.direction === 'down' ? '#38bdf8' : '#fbbf24', fontWeight: 'bold' }}>
                        {p.direction === 'down' ? `⬇️ ${p.position + 1}m潜水中` : `⬆️ ${p.position + 1}m帰還中`}
                      </span>
                    )}
                  </span>
                  <span style={{
                    background: p.carried.length > 0 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.08)',
                    border: p.carried.length > 0 ? '1px solid #f59e0b' : '1px solid transparent',
                    padding: '1px 7px', borderRadius: '8px', fontWeight: 'bold',
                    color: p.carried.length > 0 ? '#fde047' : '#94a3b8'
                  }}>
                    💎 重荷:{p.carried.length}
                  </span>
                </div>

                {/* 所持している未確定財宝のチップ一覧（レベル表示のみ） */}
                {p.carried.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '6px' }}>
                    {p.carried.map((item, idx) => {
                      const st = LEVEL_STYLES[item.level] || LEVEL_STYLES[1];
                      return (
                        <span
                          key={idx}
                          title={`${st.name} (${item.count}枚)`}
                          style={{
                            fontSize: '10px', fontWeight: '900', background: st.bg,
                            border: `1px solid ${st.border}`, padding: '1px 5px', borderRadius: '5px', color: '#fff'
                          }}
                        >
                          {st.shape}Lv{item.level}{item.count > 1 ? `×${item.count}` : ''}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ACTION / DICE CONTROL CONSOLE (playing) */}
        {G.gameState === 'playing' && (
          <div style={{
            background: isMyTurn
              ? 'linear-gradient(135deg, rgba(3, 105, 161, 0.92), rgba(15, 23, 42, 0.95))'
              : 'rgba(15, 23, 42, 0.85)',
            border: isMyTurn ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.14)',
            borderRadius: '18px',
            padding: '16px 20px',
            boxShadow: isMyTurn ? '0 10px 30px rgba(2, 132, 199, 0.4)' : 'none'
          }}>
            {G.lastActionBanner && G.turnStep === 'roll' && (
              <div style={{
                marginBottom: '10px', padding: '7px 12px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)', fontSize: '12px', color: '#bae6fd'
              }}>
                {G.lastActionBanner}
              </div>
            )}

            {G.turnStep === 'roll' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: isMyTurn ? '#fde047' : '#e2e8f0' }}>
                      {isMyTurn ? '🎯 あなたのターンです！' : `⏳ ${getPlayerName(G.currentPlayerId)} が操作中...`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                      現在: {currentDiver.position === -1 ? '🚢 潜水艦内' : `${currentDiver.position + 1}マス目（${currentDiver.direction === 'down' ? '⬇️ 潜水中' : '⬆️ 帰還中'}）`}
                      {' • '}重荷ペナルティ: <strong style={{ color: '#fbbf24' }}>-{currentDiver.carried.length}歩</strong>（出目2〜6から減算）
                    </div>
                  </div>
                </div>

                {isMyTurn && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {currentDiver.position === -1 ? (
                      <button
                        onClick={() => moves.rollDice(pid, false)}
                        style={{
                          flex: 1, minWidth: '220px', padding: '14px 20px', borderRadius: '12px', border: 'none',
                          background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#fff',
                          fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.45)'
                        }}
                      >
                        🤿 潜水艦からダイスを振って潜る！
                      </button>
                    ) : currentDiver.direction === 'down' ? (
                      <>
                        <button
                          onClick={() => moves.rollDice(pid, false)}
                          style={{
                            flex: 1, minWidth: '200px', padding: '14px 18px', borderRadius: '12px', border: 'none',
                            background: currentDiver.position >= G.track.length - 1
                              ? 'rgba(100,116,139,0.5)'
                              : 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                            color: '#fff', fontWeight: '900', fontSize: '15px', cursor: 'pointer'
                          }}
                        >
                          ⬇️ そのまま深く潜る（🎲振る）
                          {currentDiver.position >= G.track.length - 1 && ' ※最深部'}
                        </button>
                        <button
                          onClick={() => moves.rollDice(pid, true)}
                          style={{
                            flex: 1, minWidth: '200px', padding: '14px 18px', borderRadius: '12px',
                            border: '2px solid #fde047',
                            background: 'linear-gradient(135deg, #d97706, #b45309)',
                            color: '#fff', fontWeight: '900', fontSize: '15px', cursor: 'pointer',
                            boxShadow: '0 6px 20px rgba(217, 119, 6, 0.4)'
                          }}
                        >
                          ⬆️ 引き返す宣言して戻る！（🎲振る）
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => moves.rollDice(pid, false)}
                        style={{
                          flex: 1, minWidth: '220px', padding: '14px 20px', borderRadius: '12px',
                          border: '2px solid #fbbf24',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer',
                          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.45)'
                        }}
                      >
                        ⬆️ 潜水艦へ向かって泳ぐ（🎲振る）
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {G.turnStep === 'action' && G.lastRoll && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* ダイス結果表示 */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
                  background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '38px', height: '38px', borderRadius: '10px', background: '#fff', color: '#0f172a',
                      fontWeight: '900', fontSize: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                    }}>{G.lastRoll.d1}</span>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>＋</span>
                    <span style={{
                      width: '38px', height: '38px', borderRadius: '10px', background: '#fff', color: '#0f172a',
                      fontWeight: '900', fontSize: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                    }}>{G.lastRoll.d2}</span>
                    {G.lastRoll.weightPenalty > 0 && (
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fbbf24' }}>
                        － 重荷 {G.lastRoll.weightPenalty}
                      </span>
                    )}
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#38bdf8' }}>
                      ＝ {G.lastRoll.steps} 歩移動！
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 'bold' }}>
                    到着マス: {currentDiver.position + 1}マス目
                  </div>
                </div>

                {/* 足元アクション */}
                {isMyTurn ? (() => {
                  const footTile = G.track[myPlayer.position];
                  const hasTreasure = footTile && (footTile.type === 'treasure' || footTile.type === 'stack');
                  const isBlank = footTile && footTile.type === 'blank';

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {hasTreasure ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          <button
                            onClick={() => moves.pickUpTreasure(pid)}
                            style={{
                              flex: 2, minWidth: '220px', padding: '14px 18px', borderRadius: '12px', border: '2px solid #fde047',
                              background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                              fontWeight: '900', fontSize: '15px', cursor: 'pointer'
                            }}
                          >
                            💎 {footTile.type === 'stack' ? `沈殿塊(${footTile.count}枚組 / Lv.${footTile.level})` : `遺跡チップ(Lv.${footTile.level} / ${LEVEL_STYLES[footTile.level]?.range})`} を拾う！
                          </button>
                          <button
                            onClick={() => moves.skipAction(pid)}
                            style={{
                              flex: 1, minWidth: '160px', padding: '14px 18px', borderRadius: '12px',
                              border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)',
                              color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer'
                            }}
                          >
                            ➡️ 拾わずターン終了
                          </button>
                        </div>
                      ) : isBlank && myPlayer.carried.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold' }}>
                            🕳️ 空きマスに止まりました！手持ちの財宝を1つ置いて身軽になりますか？
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {myPlayer.carried.map((item, idx) => (
                              <button
                                key={idx}
                                onClick={() => moves.dropTreasure(pid, idx)}
                                style={{
                                  padding: '10px 14px', borderRadius: '10px', border: '1px solid #fbbf24',
                                  background: 'rgba(245, 158, 11, 0.2)', color: '#fde047',
                                  fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                                }}
                              >
                                🗑️ Lv.{item.level}{item.count > 1 ? `(${item.count}枚塊)` : ''} を置く
                              </button>
                            ))}
                            <button
                              onClick={() => moves.skipAction(pid)}
                              style={{
                                flex: 1, minWidth: '160px', padding: '10px 16px', borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)',
                                color: '#fff', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                              }}
                            >
                              ➡️ 何もせずターン終了
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => moves.skipAction(pid)}
                          style={{
                            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
                            fontWeight: '900', fontSize: '15px', cursor: 'pointer'
                          }}
                        >
                          ➡️ 空きマスのためそのままターン終了
                        </button>
                      )}
                    </div>
                  );
                })() : (
                  <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '6px' }}>
                    ⏳ {getPlayerName(G.currentPlayerId)} が足元の財宝を確認中...
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SUBMARINE & SEABED TRACK */}
        <div style={{
          background: 'rgba(2, 6, 23, 0.55)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '20px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* SUBMARINE DOCK */}
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: '3px solid #fef08a',
            borderRadius: '16px',
            padding: '12px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            color: '#0f172a',
            boxShadow: '0 8px 25px rgba(245, 158, 11, 0.35)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '30px' }}>🚢</span>
              <div>
                <div style={{ fontWeight: '900', fontSize: '16px' }}>探索潜水艦（スタート ＆ 帰還ゴール）</div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.85 }}>
                  お宝を持ってここに戻れば得点確定！
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {diversInSub.map((d) => (
                <div
                  key={d.id}
                  style={{
                    background: '#0f172a', color: '#fff', padding: '4px 10px', borderRadius: '999px',
                    border: `2px solid ${d.color}`, fontSize: '12px', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}
                >
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                  {getPlayerName(d.id)} {d.returned ? '⚓済' : '🤿'}
                </div>
              ))}
            </div>
          </div>

          {/* SEABED RUIN ROWS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rows.map((row) => (
              <div
                key={row.rowIdx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
                  gap: '8px',
                  position: 'relative'
                }}
              >
                {row.items.map(({ tile, idx }) => {
                  const diver = getDiverAt(idx);
                  const isBlank = tile.type === 'blank';
                  const st = LEVEL_STYLES[tile.level] || LEVEL_STYLES[1];
                  const isTurnDiverHere = diver && diver.id === G.currentPlayerId;

                  return (
                    <div
                      key={tile.id || idx}
                      style={{
                        minHeight: '78px',
                        borderRadius: '12px',
                        padding: '6px',
                        background: isBlank ? 'rgba(15, 23, 42, 0.5)' : st.bg,
                        border: isTurnDiverHere
                          ? '3px solid #fde047'
                          : isBlank
                          ? '2px dashed rgba(148, 163, 184, 0.35)'
                          : `2px solid ${st.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'relative',
                        boxShadow: tile.type === 'stack'
                          ? '0 0 16px rgba(250, 204, 21, 0.7)'
                          : isBlank ? 'none' : '0 4px 12px rgba(0,0,0,0.35)',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{
                        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: '10px', fontWeight: 'bold', opacity: 0.9
                      }}>
                        <span>#{idx + 1}</span>
                        {!isBlank && (
                          <span style={{ background: 'rgba(0,0,0,0.35)', padding: '1px 5px', borderRadius: '5px' }}>
                            Lv.{tile.level}
                          </span>
                        )}
                      </div>

                      {isBlank ? (
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>空き</div>
                      ) : tile.type === 'stack' ? (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '16px', fontWeight: '900', color: '#fde047' }}>
                            🪙×{tile.count}塊
                          </div>
                          <div style={{ fontSize: '9px', color: '#fef08a', fontWeight: 'bold' }}>重さ1個分!</div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', lineHeight: 1 }}>{st.shape}</div>
                          <div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.9 }}>{st.range}</div>
                        </div>
                      )}

                      {/* DIVER PAWN OVERLAY */}
                      {diver && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-7px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#0f172a',
                          border: `2.5px solid ${diver.color}`,
                          borderRadius: '999px',
                          padding: '2px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                          zIndex: 5,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.7)',
                          animation: isTurnDiverHere ? 'diverFloat 1.5s infinite' : 'none'
                        }}>
                          <span style={{ fontSize: '12px' }}>
                            {diver.direction === 'down' ? '⬇️' : '⬆️'}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: '900', color: '#fff' }}>
                            {getPlayerName(diver.id).slice(0, 6)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* LOGS */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '14px',
          padding: '10px 14px',
          maxHeight: '130px',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#7dd3fc', marginBottom: '4px' }}>📜 探険ログ</div>
          {G.logs.slice(0, 15).map((log, i) => (
            <div key={i} style={{ fontSize: '12px', color: i === 0 ? '#ffffff' : '#94a3b8', padding: '2px 0' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* ROUND END MODAL */}
      {G.gameState === 'round_end' && G.roundSummary && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1400, padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0f172a, #1e293b)',
            border: '2px solid #38bdf8', borderRadius: '24px',
            padding: '26px', maxWidth: '640px', width: '95%', color: '#fff',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
          }}>
            <h2 style={{ margin: '0 0 6px', textAlign: 'center', color: '#38bdf8', fontSize: '24px', fontWeight: '900' }}>
              {G.roundSummary.reason === 'oxygen_empty' ? '🚨 酸素枯渇！' : '⚓ 全員生還！'} ラウンド {G.roundSummary.round} 結果発表
            </h2>
            <p style={{ margin: '0 0 16px', textAlign: 'center', fontSize: '13px', color: '#cbd5e1' }}>
              持ち帰ったお宝の数字が公開されました！空きマスは取り除かれ、沈んだ財宝は最深部に塊となって沈殿します。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              {G.roundSummary.players.map((sp) => (
                <div
                  key={sp.playerID}
                  style={{
                    padding: '12px 14px', borderRadius: '14px',
                    background: sp.returned ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                    border: sp.returned ? '1px solid #10b981' : '1px solid #ef4444'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '15px' }}>
                      {sp.returned ? '⚓' : '💀'} {getPlayerName(sp.playerID)}
                    </strong>
                    <span style={{ fontWeight: '900', fontSize: '15px', color: sp.returned ? '#4ade80' : '#fca5a5' }}>
                      {sp.returned ? `+${sp.gainedScore}点 獲得！（累計: ${sp.totalScore}点）` : '沈没…お宝全ロスト'}
                    </span>
                  </div>
                  {sp.returned ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {sp.gainedChips.length === 0 ? (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>手ぶらで帰還</span>
                      ) : sp.gainedChips.map((c, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: LEVEL_STYLES[c.level]?.bg || '#38bdf8',
                            padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '900'
                          }}
                        >
                          Lv.{c.level}: {c.value}点
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#fca5a5' }}>
                      落としたお宝 {sp.lostChips.length}個 が海底の最深部へ沈殿しました…
                    </div>
                  )}
                </div>
              ))}
            </div>

            {pid === '0' ? (
              <button
                onClick={() => moves.startNextRound()}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#fff',
                  fontWeight: '900', fontSize: '16px', cursor: 'pointer'
                }}
              >
                🌊 第 {G.round + 1} ラウンドへ潜る！（先攻: {getPlayerName(G.roundSummary.nextStarterId)}）
              </button>
            ) : (
              <div style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', fontWeight: 'bold' }}>
                ⏳ ホストが次のラウンドを開始するのを待っています…
              </div>
            )}
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {G.gameState === 'game_over' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1400, padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0f172a, #1e1b4b)',
            border: '3px solid #fbbf24', borderRadius: '24px',
            padding: '28px', maxWidth: '640px', width: '95%', color: '#fff',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9)', textAlign: 'center'
          }}>
            <div style={{ fontSize: '46px', marginBottom: '6px' }}>🏆</div>
            <h2 style={{ margin: '0 0 8px', color: '#fbbf24', fontSize: '28px', fontWeight: '900' }}>
              {(G.maxRounds || 3) === 1 ? '1回戦終了！最終順位発表！' : `全${G.maxRounds || 3}ラウンド終了！最終順位発表！`}
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#cbd5e1' }}>
              もっとも価値のある海底遺跡を持ち帰ったトレジャーハンターは…
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
              {G.rankings.map((r, idx) => (
                <div
                  key={r.playerID}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 18px', borderRadius: '14px',
                    background: idx === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.08)',
                    border: idx === 0 ? '2px solid #fef08a' : '1px solid rgba(255,255,255,0.15)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                    <span style={{ fontSize: '22px', fontWeight: '900' }}>
                      {idx === 0 ? '🥇 1位' : idx === 1 ? '🥈 2位' : idx === 2 ? '🥉 3位' : `${idx + 1}位`}
                    </span>
                    <div>
                      <div style={{ fontWeight: '900', fontSize: '16px' }}>{getPlayerName(r.playerID)}</div>
                      <div style={{ fontSize: '11px', opacity: 0.9 }}>
                        獲得チップ {r.chipCount}枚（Lv4:{r.lvlCounts[3]} / Lv3:{r.lvlCounts[2]} / Lv2:{r.lvlCounts[1]} / Lv1:{r.lvlCounts[0]}）
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '900' }}>
                    {r.score} <span style={{ fontSize: '13px' }}>点</span>
                  </div>
                </div>
              ))}
            </div>

            {pid === '0' ? (
              <button
                onClick={() => moves.restartGame()}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#fff',
                  fontWeight: '900', fontSize: '16px', cursor: 'pointer'
                }}
              >
                🔄 ロビーに戻って再戦する
              </button>
            ) : (
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>⏳ ホストの操作を待っています...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
