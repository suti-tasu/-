import React, { useState } from 'react';
import { CARD_TYPES } from './HanninGame';

export const HanninBoard = ({ G, ctx, moves, playerID, events, matchData }) => {
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const getPlayerName = (id) => {
    const p = matchData?.find(m => m.id === parseInt(id));
    return p ? p.name : `Player ${id}`;
  };

  const rulesModal = showRules && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, textAlign: 'left' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', fontFamily: 'sans-serif', color: '#333' }}>
        <h2 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>犯人は踊る ルール</h2>
        
        <h3 style={{ color: '#d32f2f' }}>🏆 勝利条件</h3>
        <p>「犯人」カードを持っている人を「探偵」や「いぬ」で当てるか、自分が「犯人」カードを最後まで持ち切って出すことができれば勝利です。</p>

        <h3 style={{ color: '#1976d2' }}>🎮 ゲームの流れ</h3>
        <ol style={{ lineHeight: '1.6' }}>
          <li>全員に4枚ずつカードが配られます。</li>
          <li>「第一発見者」を持っている人からゲームスタート。最初は必ず「第一発見者」を出します。</li>
          <li>時計回りに順番に、手札から1枚ずつカードを出してその効果を発動します。</li>
          <li>カードの中には、手札を交換したり回したりする効果のものがあります。「犯人」カードもどんどん移動します！</li>
        </ol>

        <h3 style={{ color: '#ff9800' }}>⚠️ 重要なカード</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li><strong>犯人:</strong> 手札がこの1枚だけになった時のみ出せます。出せれば逃げ切り勝利！</li>
          <li><strong>探偵:</strong> 誰か1人を指名して「あなたが犯人ですね？」と聞けます。当たれば勝利！</li>
          <li><strong>アリバイ:</strong> 探偵に当てられても、アリバイを『持っていれば』「違います」と嘘をつけます。</li>
          <li><strong>たくらみ:</strong> 出すと犯人側の味方になります。犯人が勝てば一緒に勝利！</li>
        </ul>

        <button onClick={() => setShowRules(false)} style={{ marginTop: '20px', padding: '10px 20px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontSize: '1.1em', fontWeight: 'bold' }}>
          閉じる
        </button>
      </div>
    </div>
  );

  if (G.gameState === 'lobby') {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        {rulesModal}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>犯人は踊る - 待機ルーム</h2>
          <button onClick={() => setShowRules(true)} style={{ background: '#3f51b5', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            <span>📖</span> ルールブックを開く
          </button>
        </div>
        <p>Discordなどで通話をつなぎ、全員が揃ったら開始してください。</p>
        
        <div style={{ background: "#f5f5f5", padding: "15px", borderRadius: "10px", margin: "20px 0" }}>
          <h3 style={{ marginTop: 0 }}>参加者 ({Object.keys(G.players).length}人)</h3>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            {Object.keys(G.players).map(pid => (
              <div key={pid} style={{ background: "#e0f7fa", padding: "5px 15px", borderRadius: "20px", fontWeight: "bold", border: "1px solid #b2ebf2" }}>
                {getPlayerName(pid)}
              </div>
            ))}
          </div>
        </div>

        {playerID === '0' ? (
          <button onClick={() => moves.startGame()} style={{ padding: "15px 40px", fontSize: "1.5em", background: "#f44336", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px rgba(0,0,0,0.2)", width: "100%" }}>
            ゲームを開始する！
          </button>
        ) : (
          <div style={{ padding: "15px", background: "#fff9c4", borderRadius: "10px", fontWeight: "bold", border: "2px solid #fbc02d", color: "#f57f17" }}>
            ホスト（{getPlayerName('0')}）が開始するのを待っています...
          </div>
        )}
      </div>
    );
  }

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
      {rulesModal}
      {/* HEADER */}
      <div style={{ background: '#333', color: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>犯人は踊る - {getPlayerName(pid)}</span>
          <button onClick={() => setShowRules(true)} style={{ background: '#4caf50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>📖</span> ルール
          </button>
        </div>
        <div>
          {isActivePlayer && !activeStage && <span style={{ color: '#ffeb3b', fontWeight: 'bold' }}>あなたのターンです</span>}
          {isTradeSelect && !((pid === G.pendingTrade?.initiator && G.pendingTrade?.initiatorCard !== null) || (pid === G.pendingTrade?.target && G.pendingTrade?.targetCard !== null)) && <span style={{ color: '#ffeb3b', fontWeight: 'bold' }}>取り引きするカードを選んでください</span>}
          {isTradeSelect && ((pid === G.pendingTrade?.initiator && G.pendingTrade?.initiatorCard !== null) || (pid === G.pendingTrade?.target && G.pendingTrade?.targetCard !== null)) && <span style={{ color: '#4caf50', fontWeight: 'bold' }}>カードを選択しました。相手を待っています...</span>}
          {isInfoSelect && G.pendingInfo?.selections?.[pid] === undefined && <span style={{ color: '#ffeb3b', fontWeight: 'bold' }}>左隣に渡すカードを選んでください</span>}
          {isInfoSelect && G.pendingInfo?.selections?.[pid] !== undefined && <span style={{ color: '#4caf50', fontWeight: 'bold' }}>カードを選択しました。他の人を待っています...</span>}
          {!isActivePlayer && !activeStage && <span>{getPlayerName(ctx.currentPlayer)} のターンを待っています...</span>}
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
              {G.discardPile.map((play, idx) => {
                const cardInfo = CARD_TYPES[play.card.toUpperCase()];
                return (
                  <div key={idx} style={{ 
                    background: '#eee', padding: '10px', borderRadius: '5px', border: '1px solid #999', width: '160px', textAlign: 'center', display: 'flex', flexDirection: 'column'
                  }}>
                    <div style={{ fontSize: '12px', color: '#666', borderBottom: '1px solid #ccc', paddingBottom: '3px', marginBottom: '5px' }}>
                      {getPlayerName(play.pid)} が使用
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333', margin: '2px 0' }}>
                      {cardInfo.name}
                    </div>
                    {play.target && (
                      <div style={{ fontSize: '12px', color: '#d32f2f', fontWeight: 'bold', margin: '3px 0' }}>
                        対象: {getPlayerName(play.target)}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '5px', paddingTop: '5px', borderTop: '1px dashed #ccc', lineHeight: '1.3', textAlign: 'left', flex: 1 }}>
                      {cardInfo.desc}
                    </div>
                  </div>
                );
              })}
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
            if (isTradeSelect) {
              const isInitiator = pid === G.pendingTrade?.initiator;
              const isTarget = pid === G.pendingTrade?.target;
              if (isInitiator) {
                playable = G.pendingTrade?.initiatorCard === null;
              } else if (isTarget) {
                playable = G.pendingTrade?.targetCard === null;
              } else {
                playable = false;
              }
            } else if (isInfoSelect) {
              playable = G.pendingInfo?.selections?.[pid] === undefined;
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
                  position: 'relative',
                  background: '#fff', border: `3px solid ${playable ? '#4caf50' : '#aaa'}`, 
                  borderRadius: '10px', padding: '15px', minWidth: '140px', cursor: playable ? 'pointer' : 'not-allowed',
                  opacity: playable ? 1 : 0.6,
                  boxShadow: playable ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
                  transition: 'transform 0.1s'
                }}
              >
                {(
                  (isInfoSelect && G.pendingInfo?.selections?.[pid] === idx) ||
                  (isTradeSelect && pid === G.pendingTrade?.initiator && G.pendingTrade?.initiatorCard === idx) ||
                  (isTradeSelect && pid === G.pendingTrade?.target && G.pendingTrade?.targetCard === idx)
                ) && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(76, 175, 80, 0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4em', zIndex: 10 }}>✅</div>
                )}
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
