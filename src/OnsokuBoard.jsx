// OnsokuBoard.jsx - 音速飯店 (Onsoku Hanten) Board UI
import React, { useState } from 'react';
import { FINISHING_WORDS } from './OnsokuGame';
import { UnifiedLobby } from './UnifiedLobby';

const MENU_LIST = [
  'ラーメン（ラー＋メン）',
  'タンメン（タン＋メン）',
  'タンタンメン（タン＋タン＋メン）',
  'チャーハン（チャー＋ハン）',
  'チャーシューメン（チャー＋シュー＋メン）',
  'テンシンハン（テン＋シン＋ハン）',
  'エビチリ（エビ＋チリ）',
  'エビチャーハン（エビ＋チャー＋ハン）',
  'エビチャーシューメン（エビ＋チャー＋シュー＋メン）',
  'シオラーメン（シオ＋ラー＋メン）',
  'シオタンメン / シオチャーハン 等',
  'エビシオラーメン / エビシオタンメン',
];

export const OnsokuBoard = ({ G, ctx, moves, playerID, matchData }) => {
  const isSpectator = playerID === null || playerID === undefined;
  const pid = isSpectator ? null : playerID.toString();
  const [showRules, setShowRules] = useState(false);

  const getPlayerName = (id) => {
    const numId = parseInt(id, 10);
    const meta = matchData?.find((m) => m.id === numId || m.id?.toString() === id?.toString());
    return meta?.name || `Player ${id}`;
  };

  const myPlayer = pid !== null ? G.players[pid] : null;
  const rejectNotice = pid !== null ? G.lastRejectNotice?.[pid] : null;

  const rulesModal = showRules && (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 5, 5, 0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500, padding: '16px'
    }}>
      <div style={{
        background: '#1c0d0d', border: '3px solid #f59e0b', borderRadius: '20px',
        padding: '24px', maxWidth: '620px', width: '95%', maxHeight: '86vh', overflowY: 'auto',
        color: '#fef3c7', textAlign: 'left', lineHeight: 1.6, boxShadow: '0 25px 60px rgba(0,0,0,0.9)'
      }}>
        <h2 style={{ margin: '0 0 12px', color: '#fbbf24', borderBottom: '2px solid #b91c1c', paddingBottom: '8px' }}>
          🍜 音速飯店 (Onsoku Hanten) お品書き＆ルール
        </h2>
        <p style={{ fontSize: '13px', margin: '0 0 12px' }}>
          ターン待ちなし！<strong>全員同時・完全リアルタイムのスピード勝負</strong>です。お品書きの通りに具材カードを出して注文を完成させ、誰よりも早く手札を空にしましょう！
        </p>

        <h3 style={{ fontSize: '15px', color: '#fde047', margin: '10px 0 6px' }}>⚡ ルール</h3>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px', fontSize: '13px' }}>
          <li><strong>早い者勝ち！</strong>：今の場につながるカードを持っていれば、いつでも即座にクリックして出せます！</li>
          <li><strong>注文完成（チン！🛎️）</strong>：「メン」「ハン」「チリ」で料理が完成すると場がリセットされ、また新しい注文を始められます。</li>
          <li><strong>❌ とりけし！カード</strong>：注文の途中（場が空でないとき）にいつでも出せます！途中の料理を強制キャンセルして場をリセットできます。</li>
          <li><strong>手札0枚で勝ち抜け！</strong>：早く上がった人ほど高得点を獲得し、最後まで残った1人が最下位（0pt）となります。</li>
        </ul>

        <h3 style={{ fontSize: '15px', color: '#fde047', margin: '10px 0 6px' }}>📜 お品書き（成立メニュー）</h3>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px',
          background: 'rgba(0,0,0,0.35)', padding: '10px', borderRadius: '10px', fontSize: '12px', marginBottom: '16px'
        }}>
          {MENU_LIST.map((m, i) => (
            <div key={i} style={{ color: '#fed7aa' }}>• {m}</div>
          ))}
        </div>

        <button
          onClick={() => setShowRules(false)}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff',
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
        background: 'radial-gradient(circle at 50% 25%, #7f1d1d 0%, #450a0a 55%, #1c0505 100%)',
        padding: '20px'
      }}>
        <UnifiedLobby
          gameTitle="音速飯店 (Onsoku Hanten)"
          gameIcon="🍜"
          gameSubtitle="注文に合わせて音速でカードを出せ！町中華リアルタイム早出しバトル"
          themeColor="#dc2626"
          themeGradient="linear-gradient(135deg, #ef4444, #b91c1c)"
          numPlayers={ctx.numPlayers}
          playerIds={Object.keys(G.players)}
          pid={pid}
          getPlayerName={getPlayerName}
          isHost={!isSpectator && pid === '0'}
          hostOnlyStart={true}
          onStart={() => moves.startGame()}
          startText="🔥 のれんを上げて開店する！"
          onShowRules={() => setShowRules(true)}
          rulesModal={rulesModal}
        >
          {pid === '0' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => moves.setGameMode('tournament3')}
                style={{
                  padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
                  border: G.gameMode === 'tournament3' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                  background: G.gameMode === 'tournament3' ? '#fee2e2' : '#fff',
                  color: G.gameMode === 'tournament3' ? '#991b1b' : '#475569'
                }}
              >
                🏆 3回戦マッチ（総合ポイント制）
              </button>
              <button
                onClick={() => moves.setGameMode('quick')}
                style={{
                  padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
                  border: G.gameMode === 'quick' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                  background: G.gameMode === 'quick' ? '#fee2e2' : '#fff',
                  color: G.gameMode === 'quick' ? '#991b1b' : '#475569'
                }}
              >
                ⚡ クイック1戦勝負
              </button>
            </div>
          )}
        </UnifiedLobby>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 10%, #7f1d1d 0%, #3b0707 50%, #140404 100%)',
      color: '#fffbeb',
      padding: '14px 12px 30px',
      fontFamily: "'Segoe UI', -apple-system, sans-serif",
      boxSizing: 'border-box'
    }}>
      {rulesModal}

      <style>{`
        @keyframes popDish {
          0% { transform: scale(0.86); opacity: 0.4; }
          60% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cardGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(250, 204, 21, 0.55); }
          50% { box-shadow: 0 0 20px rgba(250, 204, 21, 0.95); }
        }
      `}</style>

      <div style={{ maxWidth: '1020px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* TOP BAR */}
        <div style={{
          background: 'rgba(28, 7, 7, 0.85)',
          border: '2px solid #b91c1c',
          borderRadius: '16px',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🍜</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#fde047' }}>音速飯店</span>
                <span style={{
                  background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: '900',
                  padding: '2px 10px', borderRadius: '10px'
                }}>
                  第 {G.round} / {G.maxRounds} 戦
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#fca5a5' }}>
                ⚡ ターン制なし！いつでも最速クリックで注文を完成させろ！
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowRules(true)}
            style={{
              background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#fde047',
              padding: '7px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'
            }}
          >
            📜 お品書き・ルール
          </button>
        </div>

        {/* CHEFS / PLAYERS STATUS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '8px'
        }}>
          {Object.values(G.players).map((p) => {
            const isMe = p.id === pid;
            return (
              <div
                key={p.id}
                style={{
                  background: p.finished ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.45)',
                  border: p.finished ? '2px solid #10b981' : isMe ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '9px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: isMe ? '#fde047' : '#fff' }}>
                    {getPlayerName(p.id)}{isMe ? '(あなた)' : ''}
                  </div>
                  <div style={{ fontSize: '11px', color: '#fcd34d' }}>
                    累計: <strong>{p.score}pt</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {p.finished ? (
                    <span style={{
                      background: '#10b981', color: '#022c22', fontWeight: '900',
                      fontSize: '11px', padding: '3px 8px', borderRadius: '8px'
                    }}>
                      👑 {p.finishRank}位抜け
                    </span>
                  ) : (
                    <div style={{
                      background: p.hand.length <= 2 ? '#ef4444' : 'rgba(255,255,255,0.12)',
                      color: '#fff', fontWeight: '900', fontSize: '13px',
                      padding: '3px 9px', borderRadius: '8px'
                    }}>
                      残 {p.hand.length}枚
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CENTER SERVING TRAY (中華トレイ・早出し場) */}
        <div style={{
          background: 'radial-gradient(circle at 50% 45%, #991b1b 0%, #450a0a 75%)',
          border: '4px solid #f59e0b',
          borderRadius: '26px',
          padding: '22px 18px',
          textAlign: 'center',
          boxShadow: '0 16px 45px rgba(0,0,0,0.7), inset 0 0 30px rgba(251, 191, 36, 0.15)',
          position: 'relative'
        }}>
          {/* 直前に完成した料理のポップアップバナー */}
          {G.lastCompletedDish && (
            <div
              key={G.lastCompletedDish.id}
              style={{
                display: 'inline-block',
                marginBottom: '12px',
                padding: '6px 18px',
                borderRadius: '999px',
                background: G.lastCompletedDish.type === 'dish'
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : G.lastCompletedDish.type === 'cancel'
                  ? 'linear-gradient(135deg, #475569, #334155)'
                  : '#7f1d1d',
                border: '2px solid #fef08a',
                color: '#fff',
                fontWeight: '900',
                fontSize: '15px',
                animation: 'popDish 0.35s ease-out'
              }}
            >
              {G.lastCompletedDish.dishName} （{getPlayerName(G.lastCompletedDish.playerID)}）
            </div>
          )}

          {/* トレイ上のカード列 */}
          <div style={{
            minHeight: '110px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '18px',
            padding: '14px',
            border: '2px dashed rgba(251, 191, 36, 0.35)'
          }}>
            {G.tray.length === 0 ? (
              <div style={{ color: '#fde68a', fontSize: '15px', fontWeight: 'bold' }}>
                🔥 注文待ち！先頭カード（ラー / タン / チャー / エビ / テン / シオ）を出そう！
              </div>
            ) : (
              G.tray.map((c, idx) => (
                <div key={c.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    minWidth: '88px', height: '98px', borderRadius: '14px',
                    background: '#fffbeb', border: `4px solid ${c.color}`,
                    color: '#1c0d0d', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '6px',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.45)'
                  }}>
                    <span style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '1px' }}>{c.word}</span>
                    <span style={{ fontSize: '10px', color: '#78350f', fontWeight: 'bold', marginTop: '4px' }}>
                      {getPlayerName(c.playerID).slice(0, 6)}
                    </span>
                  </div>
                  {idx < G.tray.length - 1 && <span style={{ fontSize: '20px', color: '#fbbf24', fontWeight: '900' }}>➔</span>}
                </div>
              ))
            )}
          </div>

          {rejectNotice && (
            <div style={{
              marginTop: '10px', fontSize: '12px', color: '#fca5a5', fontWeight: 'bold'
            }}>
              💨 {rejectNotice.reason}
            </div>
          )}
        </div>

        {/* MY HAND AREA (スピードタップゾーン) */}
        {isSpectator ? (
          <div style={{
            background: 'rgba(20, 6, 6, 0.85)',
            border: '2px solid #f59e0b',
            borderRadius: '20px',
            padding: '20px',
            textAlign: 'center',
            color: '#fde68a',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            👀 観戦モードで実況観戦中！（手札は非公開・中華トレイと残り枚数がリアルタイム表示されます）
          </div>
        ) : (
        <div style={{
          background: 'rgba(20, 6, 6, 0.85)',
          border: '2px solid #b91c1c',
          borderRadius: '20px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: '900', color: '#fde047' }}>
              ✋ あなたの手札（{myPlayer?.hand.length || 0}枚）
            </span>
            <span style={{ fontSize: '11px', color: '#fca5a5' }}>
              今の注文につながるカードを見極めてクリック！
            </span>
          </div>

          {myPlayer?.finished ? (
            <div style={{
              textAlign: 'center', padding: '24px', borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981',
              color: '#4ade80', fontWeight: '900', fontSize: '18px'
            }}>
              🎉 あなたは {myPlayer.finishRank}位 で勝ち抜けました！他のシェフを応援しましょう！
            </div>
          ) : (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center'
            }}>
              {myPlayer?.hand.map((card) => {
                const isFinisher = FINISHING_WORDS.has(card.word);
                const isCancel = card.word === 'とりけし';

                return (
                  <button
                    key={card.id}
                    onClick={() => moves.playCard(pid, card.id)}
                    style={{
                      minWidth: '82px',
                      height: '104px',
                      borderRadius: '14px',
                      background: isCancel ? 'linear-gradient(135deg, #475569, #334155)' : '#fffbeb',
                      border: `3px solid ${card.color}`,
                      color: isCancel ? '#ffffff' : '#1c0d0d',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 6px',
                      boxShadow: '0 6px 14px rgba(0,0,0,0.4)',
                      transition: 'transform 0.08s ease',
                      boxSizing: 'border-box'
                    }}
                  >
                    <span style={{
                      fontSize: '9px', fontWeight: '900',
                      color: isCancel ? '#cbd5e1' : isFinisher ? '#059669' : '#b45309'
                    }}>
                      {isCancel ? 'リセット' : isFinisher ? '🛎️ 仕上げ' : '具材'}
                    </span>
                    <span style={{
                      fontSize: card.word.length >= 4 ? '16px' : '21px',
                      fontWeight: '900',
                      letterSpacing: '-0.5px'
                    }}>
                      {card.word}
                    </span>
                    <span style={{
                      width: '80%', height: '5px', borderRadius: '3px',
                      background: card.color
                    }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* COMPACT MENU + LOGS */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px'
        }}>
          <div style={{
            background: 'rgba(20, 6, 6, 0.75)', border: '1px solid rgba(251, 191, 36, 0.25)',
            borderRadius: '14px', padding: '10px 14px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '4px' }}>
              📜 早見表（主なお品書き）
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', fontSize: '11px', color: '#fed7aa' }}>
              <span>ラーメン</span>
              <span>タンメン</span>
              <span>タンタンメン</span>
              <span>チャーハン</span>
              <span>チャーシューメン</span>
              <span>テンシンハン</span>
              <span>エビチリ</span>
              <span>エビチャーハン</span>
              <span>シオラーメン</span>
              <span>シオタンメン</span>
              <span>エビシオラーメン</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(20, 6, 6, 0.75)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '14px', padding: '10px 14px', maxHeight: '100px', overflowY: 'auto'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fca5a5', marginBottom: '4px' }}>🗣️ 厨房の声</div>
            {G.logs.slice(0, 10).map((log, i) => (
              <div key={i} style={{ fontSize: '11px', color: i === 0 ? '#fff' : '#cbd5e1', padding: '1px 0' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROUND END MODAL */}
      {G.gameState === 'round_end' && G.roundResult && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 4, 4, 0.88)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1400, padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #450a0a, #1c0d0d)',
            border: '3px solid #fbbf24', borderRadius: '24px',
            padding: '26px', maxWidth: '560px', width: '95%', color: '#fff',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9)', textAlign: 'center'
          }}>
            <h2 style={{ margin: '0 0 8px', color: '#fbbf24', fontSize: '24px', fontWeight: '900' }}>
              🔔 第 {G.roundResult.round} 戦 結果発表！
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0 20px' }}>
              {G.roundResult.rows.map((r) => (
                <div
                  key={r.playerID}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: '12px',
                    background: r.rank === 1 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.08)',
                    border: r.rank === 1 ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.12)'
                  }}
                >
                  <div style={{ fontWeight: '900', fontSize: '15px' }}>
                    {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `${r.rank}位`} {getPlayerName(r.playerID)}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fde047' }}>
                    +{r.gainedPts}pt（累計: {r.totalScore}pt）
                  </div>
                </div>
              ))}
            </div>

            {pid === '0' ? (
              <button
                onClick={() => moves.startNextRound()}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff',
                  fontWeight: '900', fontSize: '16px', cursor: 'pointer'
                }}
              >
                🔥 第 {G.round + 1} 戦を開始する！
              </button>
            ) : (
              <div style={{ fontSize: '13px', color: '#fca5a5' }}>⏳ ホストが次の勝負を始めるのを待っています…</div>
            )}
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {G.gameState === 'game_over' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 4, 4, 0.92)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1400, padding: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #450a0a, #1c0d0d)',
            border: '3px solid #fde047', borderRadius: '24px',
            padding: '28px', maxWidth: '580px', width: '95%', color: '#fff',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9)', textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '6px' }}>🏆</div>
            <h2 style={{ margin: '0 0 8px', color: '#fde047', fontSize: '28px', fontWeight: '900' }}>
              🍜 音速飯店 閉店＆総合優勝発表！
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '18px 0 22px' }}>
              {G.rankings.map((r, idx) => (
                <div
                  key={r.playerID}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderRadius: '14px',
                    background: idx === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.08)',
                    border: idx === 0 ? '2px solid #fef08a' : '1px solid rgba(255,255,255,0.15)'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '900', fontSize: '16px' }}>
                      {idx === 0 ? '🥇 1位' : idx === 1 ? '🥈 2位' : idx === 2 ? '🥉 3位' : `${idx + 1}位`} {getPlayerName(r.playerID)}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.9 }}>仕上げた料理数: {r.ordersCompleted}皿</div>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '900' }}>{r.score} pt</div>
                </div>
              ))}
            </div>

            {pid === '0' ? (
              <button
                onClick={() => moves.restartGame()}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff',
                  fontWeight: '900', fontSize: '16px', cursor: 'pointer'
                }}
              >
                🔄 ロビーに戻って再営業する
              </button>
            ) : (
              <div style={{ fontSize: '13px', color: '#fca5a5' }}>⏳ ホストの操作を待っています...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
