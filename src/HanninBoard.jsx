import React, { useState } from 'react';
import { CARD_TYPES } from './HanninGame';

export const HanninBoard = ({ G, ctx, moves, playerID, events }) => {
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [targetModalOpen, setTargetModalOpen] = useState(false);

  const pid = playerID || '0';
  const player = G.players[pid];
  const isActivePlayer = ctx.currentPlayer === pid;
  
  // Check if this player is in an active stage (tradeSelect or infoSelect)
  const activeStage = ctx.activePlayers && ctx.activePlayers[pid];
  const isTradeSelect = activeStage === 'tradeSelect';
  const isInfoSelect = activeStage === 'infoSelect';

  const handleCardClick = (idx) => {
    if (isTradeSelect) {
      moves.selectCardForTrade(idx);
      return;
    }
    if (isInfoSelect) {
      moves.selectCardForInfo(idx);
      return;
    }

    if (!isActivePlayer) return;

    const card = player.hand[idx];
    
    // First turn rule
    if (G.discardPile.length === 0 && card !== 'first_discoverer') {
      alert('最初のターンは「第一発見者」を出さなければなりません。');
      return;
    }

    // Criminal rule
    if (card === 'criminal' && player.hand.length > 1) {
      alert('「犯人」は最後の一枚になるまで出せません。');
      return;
    }

    const needsTarget = ['detective', 'dog', 'witness', 'trade'].includes(card);
    if (needsTarget) {
      setSelectedCardIdx(idx);
      setTargetModalOpen(true);
    } else {
      moves.playCard(idx, null);
    }
  };

  const handleTargetSelect = (targetId) => {
    moves.playCard(selectedCardIdx, targetId);
    setTargetModalOpen(false);
    setSelectedCardIdx(null);
  };

  if (G.winner) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', background: G.winner === 'town' ? '#d4edda' : '#f8d7da' }}>
        <h2>ゲーム終了！</h2>
        <h3>{G.winner === 'town' ? '探偵側（町）の勝利！' : '犯人の勝利（逃げ切り）！'}</h3>
        <p>{G.winnerDetails}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', fontSize: '16px' }}>ロビーに戻る</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif', background: '#f5f5f5' }}>
      {/* HEADER */}
      <div style={{ background: '#333', color: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'space-between' }}>
        <div>犯人は踊る - プレイヤー {pid}</div>
        <div>
          {isActivePlayer && !activeStage && <span style={{ color: '#ffeb3b', fontWeight: 'bold' }}>あなたのターンです</span>}
          {isTradeSelect && <span style={{ color: '#ffeb3b', fontWeight: 'bold' }}>取り引きするカードを選んでください</span>}
          {isInfoSelect && <span style={{ color: '#ffeb3b', fontWeight: 'bold' }}>左隣に渡すカードを選んでください</span>}
          {!isActivePlayer && !activeStage && <span>プレイヤー {ctx.currentPlayer} のターンを待っています...</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* MAIN BOARD */}
        <div style={{ flex: 2, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          
          {/* OTHER PLAYERS */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
            {Object.keys(G.players).map(id => {
              if (id === pid) return null;
              const p = G.players[id];
              return (
                <div key={id} style={{ 
                  background: '#fff', padding: '10px', borderRadius: '8px', 
                  minWidth: '100px', textAlign: 'center', border: ctx.currentPlayer === id ? '3px solid #f44336' : '1px solid #ccc'
                }}>
                  <div style={{ fontWeight: 'bold' }}>Player {id}</div>
                  <div style={{ fontSize: '24px', margin: '10px 0' }}>🃏 x {p.hand.length}</div>
                </div>
              );
            })}
          </div>

          {/* DISCARD PILE */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', flex: 1, border: '1px solid #ccc' }}>
            <h3>プレイ履歴（場札）</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {G.discardPile.map((play, idx) => (
                <div key={idx} style={{ 
                  background: '#eee', padding: '10px', borderRadius: '5px', border: '1px solid #999', width: '120px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>P{play.pid}</div>
                  <div style={{ fontWeight: 'bold', margin: '5px 0' }}>{CARD_TYPES[play.card.toUpperCase()].name}</div>
                  {play.target && <div style={{ fontSize: '12px', color: '#d32f2f' }}>→ P{play.target}</div>}
                </div>
              ))}
              {G.discardPile.length === 0 && <div style={{ color: '#999' }}>まだカードは出されていません。</div>}
            </div>
          </div>

        </div>

        {/* LOGS & PRIVATE INFO */}
        <div style={{ flex: 1, background: '#fff', borderLeft: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            <h3>システムログ</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', color: '#444' }}>
              {G.logs.map((log, i) => <li key={i} style={{ marginBottom: '5px' }}>{log}</li>)}
            </ul>
          </div>
          
          {player.privateKnowledge && player.privateKnowledge.length > 0 && (
            <div style={{ height: '30%', background: '#e3f2fd', padding: '20px', overflowY: 'auto', borderTop: '2px solid #2196f3' }}>
              <h3 style={{ color: '#1565c0', marginTop: 0 }}>自分だけが見た情報</h3>
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '14px' }}>
                {player.privateKnowledge.map((k, i) => {
                  if (k.card === 'boy') {
                    return <li key={i}>少年の効果：犯人は Player {k.result.criminalOwner} です！</li>;
                  }
                  if (k.card === 'dog') {
                    return <li key={i}>いぬの効果：Player {k.target} のカードは {CARD_TYPES[k.result.card.toUpperCase()].name} でした。</li>;
                  }
                  if (k.card === 'witness') {
                    return (
                      <li key={i}>
                        目撃者の効果：Player {k.target} の手札 → {k.result.hand.map(c => CARD_TYPES[c.toUpperCase()].name).join(', ')}
                      </li>
                    );
                  }
                  return <li key={i}>特別な情報を得ました。</li>;
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* MY HAND */}
      <div style={{ background: '#e0e0e0', padding: '20px', borderTop: '2px solid #ccc' }}>
        <h3 style={{ marginTop: 0 }}>自分の手札 {player.isAccomplice && <span style={{ color: 'red', fontSize: '14px' }}>（あなたはたくらみを使用済み：犯人陣営）</span>}</h3>
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto' }}>
          {player.hand.map((card, idx) => {
            const cardInfo = CARD_TYPES[card.toUpperCase()];
            // Determine if playable
            let playable = false;
            if (isTradeSelect || isInfoSelect) {
              playable = true;
            } else if (isActivePlayer && !activeStage) {
              if (G.discardPile.length === 0) {
                playable = card === 'first_discoverer';
              } else if (card === 'criminal') {
                playable = player.hand.length === 1;
              } else {
                playable = true;
              }
            }

            return (
              <div 
                key={idx} 
                onClick={() => playable && handleCardClick(idx)}
                style={{ 
                  background: '#fff', border: `3px solid ${playable ? '#4caf50' : '#aaa'}`, 
                  borderRadius: '10px', padding: '15px', minWidth: '140px', cursor: playable ? 'pointer' : 'not-allowed',
                  opacity: playable ? 1 : 0.6,
                  boxShadow: playable ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
                  transition: 'transform 0.1s'
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
                  {cardInfo.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.4 }}>
                  {cardInfo.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TARGET SELECTION MODAL */}
      {targetModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', minWidth: '300px', textAlign: 'center' }}>
            <h3>対象プレイヤーを選んでください</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '20px' }}>
              {Object.keys(G.players).map(id => {
                if (id === pid) return null;
                const p = G.players[id];
                const canSelect = p.hand.length > 0;
                return (
                  <button 
                    key={id} 
                    onClick={() => handleTargetSelect(id)}
                    disabled={!canSelect}
                    style={{ 
                      padding: '10px 20px', fontSize: '16px', cursor: canSelect ? 'pointer' : 'not-allowed',
                      background: canSelect ? '#2196f3' : '#ccc', color: '#fff', border: 'none', borderRadius: '5px'
                    }}
                  >
                    Player {id} {canSelect ? '' : '(手札なし)'}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setTargetModalOpen(false)} style={{ marginTop: '20px', padding: '10px', width: '100%' }}>
              キャンセル
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
