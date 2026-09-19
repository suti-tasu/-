import React, { useState } from 'react';
import { canAffordCard, getBonuses, getTotalTokens } from './Game';

const colorsList = ['white', 'blue', 'green', 'red', 'black', 'gold'];
const baseColors = ['white', 'blue', 'green', 'red', 'black'];

const cssColors = {
  white: 'radial-gradient(circle, #ffffff, #d4d4d4)',
  blue: 'radial-gradient(circle, #60a5fa, #1d4ed8)',
  green: 'radial-gradient(circle, #4ade80, #166534)',
  red: 'radial-gradient(circle, #f87171, #991b1b)',
  black: 'radial-gradient(circle, #6b7280, #111827)',
  gold: 'radial-gradient(circle, #fde047, #a16207)'
};

const CardView = ({ card, onClick, affordable, isSelected }) => {
  if (!card) return <div style={{ width: '130px', height: '180px', border: '2px dashed #999', borderRadius: '8px' }}></div>;

  return (
    <div onClick={onClick} style={{ 
      width: '130px', height: '180px', borderRadius: '8px', boxShadow: isSelected ? '0 0 0 4px #FFD700, 0 4px 8px rgba(0,0,0,0.5)' : '0 4px 8px rgba(0,0,0,0.3)', 
      cursor: 'pointer', transition: 'transform 0.1s', position: 'relative', overflow: 'hidden',
      border: affordable ? '2px solid #222' : '2px solid #888', 
      background: 'linear-gradient(to bottom right, #374151, #111827)',
      opacity: affordable || isSelected ? 1 : 0.6,
      transform: isSelected ? 'translateY(-5px)' : 'none'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: 'rgba(255,255,255,0.85)' }}>
        <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#333' }}>{card.points > 0 ? card.points : ''}</span>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: cssColors[card.gem] || cssColors.white, border: '2px solid #333' }} />
      </div>
      <div style={{ position: 'absolute', bottom: '5px', left: '5px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {Object.entries(card.cost).map(([c, amount]) => (
          <div key={c} style={{ width: '22px', height: '22px', borderRadius: '50%', background: cssColors[c], border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: (c==='white'||c==='gold')?'black':'white', fontWeight: 'bold', fontSize: '0.9em', boxShadow: '1px 1px 2px rgba(0,0,0,0.5)', textShadow: (c==='white'||c==='gold') ? 'none' : '0 0 2px black' }}>
            {amount}
          </div>
        ))}
      </div>
    </div>
  );
};

const NobleView = ({ noble }) => {
  if (!noble) return null;
  return (
    <div style={{
      width: '130px', height: '130px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      position: 'relative', overflow: 'hidden', border: '2px solid #d4af37',
      background: 'linear-gradient(135deg, #8b4513, #4a230b)'
    }}>
      <div style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '1.5em', fontWeight: 'bold', color: 'white', textShadow: '2px 2px 4px black' }}>
        {noble.points}
      </div>
      <div style={{ position: 'absolute', bottom: '5px', left: '5px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {Object.entries(noble.cost).map(([c, amount]) => (
          <div key={c} style={{ width: '22px', height: '22px', borderRadius: '50%', background: cssColors[c], border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: (c==='white'||c==='gold')?'black':'white', fontWeight: 'bold', fontSize: '0.9em', boxShadow: '1px 1px 2px rgba(0,0,0,0.5)', textShadow: (c==='white'||c==='gold') ? 'none' : '0 0 2px black' }}>
            {amount}
          </div>
        ))}
      </div>
    </div>
  );
};

export function SplendorBoard({ G, ctx, moves, events, playerID, matchData }) {
  const activePlayerId = ctx.currentPlayer;
  const isMyTurn = activePlayerId === playerID;
  const myPlayer = G.players[playerID];
  const activePlayer = G.players[activePlayerId];
  const isDiscardStage = ctx.activePlayers?.[activePlayerId] === 'discard';
  const isMyDiscard = isDiscardStage && isMyTurn;

  const [pendingTokens, setPendingTokens] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [discardTokens, setDiscardTokens] = useState([]);
  const [showRules, setShowRules] = useState(false);

  const getPlayerName = (pid) => {
    if (!matchData) return 'Player ' + pid;
    const player = matchData.find(p => p.id.toString() === pid.toString());
    return player?.name || 'Player ' + pid;
  };

  const getPlayerStatus = (pid) => {
    if (!matchData) return '';
    const player = matchData.find(p => p.id.toString() === pid.toString());
    if (player && player.name && !player.isConnected) return '(通信切断)';
    return '';
  };

  const handleBankTokenClick = (color) => {
    if (!isMyTurn || isDiscardStage) return;
    if (color === 'gold') {
      alert("黄金トークンは直接取れません（カード予約時のみ獲得）");
      return;
    }
    
    let newPending = [...pendingTokens];
    if (newPending.length >= 3) return;

    if (newPending.length === 2 && newPending[0] === newPending[1]) return;

    if (newPending.includes(color)) {
      if (newPending.length > 1) {
        alert("同じ色を2枚取る場合は、他の色を混ぜることはできません");
        return;
      }
      if (G.tokens[color] < 4) {
        alert("同じ色を2枚取るには、その色が場に4枚以上残っている必要があります");
        return;
      }
    }
    
    if (G.tokens[color] - newPending.filter(c => c === color).length > 0) {
      setPendingTokens([...newPending, color]);
      setSelectedCard(null);
    }
  };

  const confirmTokens = () => {
    if (!isMyTurn) return;
    const futureTotal = getTotalTokens(myPlayer) + pendingTokens.length;
    if (futureTotal > 10) {
      if (!window.confirm(`【警告】取得後のトークンが ${futureTotal} 枚になり、10枚を超えます！\n\nルールにより、取得した直後に余分なトークンを捨てる（返却する）必要がありますが、よろしいですか？`)) {
        return;
      }
    }
    moves.takeTokens(pendingTokens);
    setPendingTokens([]);
  };

  const handleCardClick = (level, index, source) => {
    if (!isMyTurn || isDiscardStage) return;
    setPendingTokens([]);
    setSelectedCard({ level, index, source });
  };

  const handleDeckClick = (level) => {
    if (!isMyTurn || isDiscardStage) return;
    if (myPlayer.reserved.length >= 3) {
      alert("予約できるのは3枚までです");
      return;
    }
    moves.reserveCardFromDeck(level);
  };

  const handlePlayerTokenClick = (color) => {
    if (!isMyDiscard) return;
    const currentCount = myPlayer.tokens[color] - discardTokens.filter(c => c === color).length;
    if (currentCount > 0) {
      setDiscardTokens([...discardTokens, color]);
    }
  };

  const confirmDiscard = () => {
    if (!isMyDiscard) return;
    moves.discardTokens(discardTokens);
    setDiscardTokens([]);
  };

  if (matchData && matchData.some(p => !p.name)) {
    const joinedCount = matchData.filter(p => p.name).length;
    const totalCount = matchData.length;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#f5f5f5' }}>
        <h2 style={{ fontSize: '2.5em', color: '#333' }}>参加者を待っています... ({joinedCount} / {totalCount})</h2>
        
        <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginTop: '20px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '1.2em' }}>招待URL</p>
          <input type="text" readOnly value={window.location.href} style={{ width: '400px', padding: '10px', fontSize: '1.1em', textAlign: 'center', border: '1px solid #ccc', borderRadius: '5px' }} onClick={e => e.target.select()} />
          <p style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>このURLを共有して全員の参加を待ってください</p>
          
          <div style={{ marginTop: '30px', textAlign: 'left' }}>
            <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>参加状況</h3>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.2em' }}>
              {matchData.map(p => (
                <li key={p.id} style={{ margin: '15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {p.name ? <span style={{ color: '#4CAF50', fontSize: '1.5em' }}>✅</span> : <span style={{ color: '#999', fontSize: '1.5em' }}>⏳</span>}
                  <span>Player {p.id}: {p.name ? <strong>{p.name}</strong> : <span style={{ color: '#999' }}>参加待ち...</span>}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (ctx.gameover) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'rgba(0,0,0,0.8)', color: 'white' }}>
        <h1 style={{ fontSize: '4em', color: '#FFD700' }}>Game Over</h1>
        <h2 style={{ fontSize: '2.5em' }}>{getPlayerName(ctx.gameover.winner)} 勝利！</h2>
        <div style={{ fontSize: '1.5em', marginTop: '20px' }}>
          {Object.keys(G.players).map(pid => (
            <div key={pid} style={{ margin: '10px 0' }}>{getPlayerName(pid)}: {G.players[pid].score} 点 (カード: {G.players[pid].cards.length}枚)</div>
          ))}
        </div>
        <div style={{ marginTop: '40px' }}>
          <button 
            onClick={() => {
              const mID = new URLSearchParams(window.location.search).get('match');
              if (mID) window.localStorage.removeItem('splendor_match_' + mID);
              window.location.href = '/';
            }}
            style={{ padding: '15px 30px', fontSize: '1.2em', cursor: 'pointer', background: '#3f51b5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
          >
            トップ画面に戻って新しい部屋を作る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: 'sans-serif' }}>
      
      {!isMyTurn && (
        <div style={{ background: '#f44336', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2em' }}>
          相手のターンです（現在: {getPlayerName(activePlayerId)} の手番）
        </div>
      )}

      {isDiscardStage && !isMyTurn && (
        <div style={{ background: '#ff9800', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
          {getPlayerName(activePlayerId)} がトークンを捨てています...
        </div>
      )}

      {isMyDiscard && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '5px', border: '1px solid #f5c6cb', fontWeight: 'bold' }}>
          トークンが10枚を超えています。（現在: {getTotalTokens(myPlayer)}枚）<br/>
          手元に残るトークンが10枚になるように、自分の手持ちトークンをクリックして返却してください。
          <div style={{ marginTop: '10px' }}>
            返却予定: {discardTokens.map((c, i) => <span key={i} style={{ display: 'inline-block', width: '20px', height: '20px', background: cssColors[c], borderRadius: '50%', border: '1px solid #000', margin: '0 2px' }}></span>)}
            {getTotalTokens(myPlayer) - discardTokens.length === 10 && (
               <button onClick={confirmDiscard} style={{ marginLeft: '15px', padding: '5px 15px', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}>確定</button>
            )}
            <button onClick={() => setDiscardTokens([])} style={{ marginLeft: '10px', padding: '5px 15px', cursor: 'pointer' }}>リセット</button>
          </div>
        </div>
      )}

      {!isDiscardStage && pendingTokens.length > 0 && isMyTurn && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '5px', border: '1px solid #c3e6cb', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <strong>選択中のトークン:</strong>
          {pendingTokens.map((c, i) => <span key={i} style={{ display: 'inline-block', width: '30px', height: '30px', background: cssColors[c], borderRadius: '50%', border: '1px solid #000' }}></span>)}
          
          {(pendingTokens.length === 3 || (pendingTokens.length === 2 && pendingTokens[0] === pendingTokens[1])) && (
            <button onClick={confirmTokens} style={{ padding: '8px 20px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>このトークンを取る</button>
          )}
          <button onClick={() => setPendingTokens([])} style={{ padding: '8px 20px', cursor: 'pointer' }}>キャンセル</button>
        </div>
      )}

      {!isDiscardStage && selectedCard && isMyTurn && (
        <div style={{ background: '#e2e3e5', color: '#383d41', padding: '15px', borderRadius: '5px', border: '1px solid #d6d8db', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <strong>カード選択中:</strong>
          {(() => {
            const card = selectedCard.source === 'board' ? G.board[selectedCard.level][selectedCard.index] : myPlayer.reserved[selectedCard.index];
            const afford = canAffordCard(myPlayer, card);
            return (
              <>
                {afford ? (
                  <button onClick={() => {
                    selectedCard.source === 'board' ? moves.buyCard(selectedCard.level, selectedCard.index) : moves.buyReservedCard(selectedCard.index);
                    setSelectedCard(null);
                  }} style={{ padding: '8px 20px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>購入する</button>
                ) : <span style={{ color: 'red' }}>コストが足りません</span>}

                {selectedCard.source === 'board' && (
                  <button onClick={() => {
                    if (myPlayer.reserved.length >= 3) { alert("予約上限(3枚)です"); return; }
                    moves.reserveCard(selectedCard.level, selectedCard.index);
                    setSelectedCard(null);
                  }} style={{ padding: '8px 20px', cursor: 'pointer', background: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>予約する (黄金+1)</button>
                )}
              </>
            );
          })()}
          <button onClick={() => setSelectedCard(null)} style={{ padding: '8px 20px', cursor: 'pointer' }}>キャンセル</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <button onClick={() => setShowRules(true)} style={{ background: '#3f51b5', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          <span>📖</span> ルールブックを開く
        </button>
        {G.isLastRound && <div style={{ color: 'red', fontWeight: 'bold', fontSize: '1.2em', background: '#ffebee', padding: '5px 10px', borderRadius: '5px' }}>🚨 最終ラウンド 🚨</div>}
      </div>

      <div style={{ display: 'flex', gap: '20px', opacity: isMyTurn ? 1 : 0.6, pointerEvents: isMyTurn ? 'auto' : 'none' }}>
        {/* Board Area */}
        <div style={{ flex: 2, background: '#f5f5f5', padding: '15px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0 }}>共有ボード</h2>
          </div>

          <div style={{ display: 'flex', gap: '40px', marginBottom: '20px' }}>
            <div>
              <h3>銀行のトークン</h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                {colorsList.map(c => {
                  const remaining = G.tokens[c] - pendingTokens.filter(p => p === c).length;
                  return (
                    <div key={c} onClick={() => handleBankTokenClick(c)} style={{ width: '60px', height: '60px', borderRadius: '50%', background: cssColors[c], display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #333', fontSize: '1.8em', fontWeight: 'bold', color: 'white', textShadow: '2px 2px 4px black', opacity: remaining > 0 ? 1 : 0.2 }}>
                      {remaining}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3>貴族タイル</h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                {G.nobles.map((noble, idx) => (
                  <NobleView key={noble.id} noble={noble} />
                ))}
              </div>
            </div>
          </div>

          <h3>場札</h3>
          {[3, 2, 1].map(level => {
            const boardRow = G.board?.[level] || [];
            return (
              <div key={level} style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div onClick={() => handleDeckClick(level)} style={{ width: '80px', height: '180px', background: '#455a64', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontWeight: 'bold', color: 'white', cursor: 'pointer', border: '2px solid #263238' }}>
                  山札 L{level}<br/>({G.decks[level].length})<br/><br/>予約
                </div>
                {boardRow.map((card, idx) => {
                  const affordable = canAffordCard(myPlayer, card);
                  const isSelected = selectedCard?.source === 'board' && selectedCard.level === level && selectedCard.index === idx;
                  return <CardView key={card ? card.id : idx} card={card} affordable={isMyTurn && affordable} isSelected={isSelected} onClick={() => card && handleCardClick(level, idx, 'board')} />
                })}
              </div>
            );
          })}
        </div>

        {/* Players Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {Object.keys(G.players).map(pid => {
            const isCurrentTurn = pid === activePlayerId;
            const isMe = pid === playerID;
            const p = G.players[pid];
            const pBonuses = getBonuses(p);
            const status = getPlayerStatus(pid);
            
            return (
              <div key={pid} style={{ background: isMe ? '#e3f2fd' : (isCurrentTurn ? '#fff9c4' : '#f0f0f0'), padding: '10px 15px', borderRadius: '8px', border: isMe ? '2px solid #2196F3' : (isCurrentTurn ? '2px solid #fbc02d' : '1px solid #ccc'), opacity: status ? 0.5 : 1 }}>
                
                {/* Name and Score Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1em', color: isMe ? '#1565c0' : '#333' }}>
                    {getPlayerName(pid)} {isMe && "(あなた)"} {isCurrentTurn && "✨手番"}
                    <span style={{ color: 'red', fontSize: '0.8em', marginLeft: '5px' }}>{status}</span>
                  </h3>
                  <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#d32f2f' }}>得点: {p.score}</div>
                </div>

                {/* Info Row */}
                <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '8px' }}>
                  所持カード: {p.cards.length}枚 | 獲得貴族: {p.nobles.length}人
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Tokens Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.8em', fontWeight: 'bold', whiteSpace: 'nowrap' }}>手持ち({getTotalTokens(p)}):</span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {colorsList.map(c => {
                        let displayCount = p.tokens[c];
                        if (isMe && isMyDiscard) displayCount -= discardTokens.filter(d => d === c).length;
                        return displayCount > 0 ? (
                          <div key={c} onClick={() => isMe && handlePlayerTokenClick(c)} style={{ width: '22px', height: '22px', borderRadius: '50%', background: cssColors[c], display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isMyDiscard && isMe ? 'pointer' : 'default', border: '1px solid #333', fontWeight: 'bold', fontSize: '0.8em', color: 'white', textShadow: '1px 1px 2px black' }}>
                            {displayCount}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {/* Bonuses Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.8em', fontWeight: 'bold', whiteSpace: 'nowrap' }}>割引:</span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {baseColors.map(c => pBonuses[c] > 0 && (
                        <div key={c} style={{ width: '20px', height: '20px', borderRadius: '4px', background: cssColors[c], display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #555', fontSize: '0.8em', fontWeight: 'bold', color: 'white', textShadow: '1px 1px 2px black' }}>
                          {pBonuses[c]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reserved Cards */}
                {p.reserved.length > 0 && (
                  <div style={{ marginTop: '8px', padding: '6px', background: isMe ? '#ffe0b2' : '#ddd', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ fontSize: '0.9em' }}>予約({p.reserved.length}):</strong>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {p.reserved.map((card, idx) => {
                        if (!isMe) {
                          return <div key={idx} style={{ width: '30px', height: '42px', background: '#455a64', borderRadius: '3px', border: '1px solid #263238' }}></div>;
                        }
                        const afford = canAffordCard(myPlayer, card);
                        const isSelected = selectedCard?.source === 'reserved' && selectedCard.index === idx;
                        return (
                          <div key={idx} style={{ position: 'relative', width: '46px', height: '63px' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, transform: 'scale(0.35)', transformOrigin: 'top left' }}>
                              <CardView card={card} affordable={isMyTurn && afford} isSelected={isSelected} onClick={() => { if(isMyTurn) handleCardClick(null, idx, 'reserved'); }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '10px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', fontFamily: 'sans-serif' }}>
            <h2 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>宝石の煌き (Splendor) ルール</h2>
            
            <h3 style={{ color: '#d32f2f' }}>🏆 勝利条件</h3>
            <p>誰かが<strong>15点</strong>に到達したら、そのラウンドの最後まで（全員が同じターン数になるまで）プレイし、一番得点が高い人が勝利です。同点の場合は、購入したカードの枚数が少ない方が勝ちます。</p>

            <h3 style={{ color: '#1976d2' }}>🎮 自分の手番でできること（どれか1つ）</h3>
            <ol style={{ lineHeight: '1.6' }}>
              <li><strong>違う色の宝石を3枚取る</strong></li>
              <li><strong>同じ色の宝石を2枚取る</strong>（※その色が銀行に4枚以上ある場合のみ）</li>
              <li><strong>カードを予約する</strong>（場札か山札から1枚確保し、<strong>黄金トークンを1枚もらう</strong>。予約は最大3枚まで）</li>
              <li><strong>カードを購入する</strong>（必要なコストを支払い、カードを獲得する）</li>
            </ol>

            <h3 style={{ color: '#388e3c' }}>⚠️ その他のルール</h3>
            <ul style={{ lineHeight: '1.6' }}>
              <li><strong>10枚制限:</strong> ターン終了時にトークンを11枚以上持っている場合は、10枚になるように返却しなければなりません。</li>
              <li><strong>割引ボーナス:</strong> 購入したカードの右上に書かれた宝石は、次からの購入時にその色のコストを1つ分減らしてくれます（永久ボーナス）。</li>
              <li><strong>黄金トークン:</strong> 予約した時だけもらえるジョーカーです。どの色の代わりとしても使えます。</li>
              <li><strong>貴族の訪問:</strong> 自分の持っているカードの「割引ボーナス」が貴族タイルの条件を満たすと、ターン終了時に自動で貴族が訪問し、得点（3点）を獲得できます。</li>
            </ul>

            <button onClick={() => setShowRules(false)} style={{ marginTop: '20px', padding: '10px 20px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontSize: '1.1em', fontWeight: 'bold' }}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
