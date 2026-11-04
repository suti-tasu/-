import React, { useState, useEffect } from 'react';
import { CARD_TYPES } from './HanninGame';
import { UnifiedLobby } from './UnifiedLobby';

export const HanninBoard = ({ G, ctx, moves, playerID, events, matchData }) => {
  const [selectedInfoCardIdx, setSelectedInfoCardIdx] = useState(null);
  const [selectedTradeCardIdx, setSelectedTradeCardIdx] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null); // { type: 'play' | 'info' | 'trade', cardIdx: number, card: string }
  const [alertMessage, setAlertMessage] = useState(null);

  const pid = playerID || '0';
  const activeStage = ctx.activePlayers && ctx.activePlayers[pid];
  const isTradeSelect = activeStage === 'tradeSelect';
  const isInfoSelect = activeStage === 'infoSelect';

  useEffect(() => {
    if (!isInfoSelect) setSelectedInfoCardIdx(null);
  }, [isInfoSelect]);

  useEffect(() => {
    if (!isTradeSelect) setSelectedTradeCardIdx(null);
  }, [isTradeSelect]);

  const getPlayerName = (id) => {
    const p = matchData?.find(m => m.id == id);
    return p && p.name ? p.name : `Player ${id}`;
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <UnifiedLobby
          gameTitle="犯人は踊る"
          gameIcon="🕵️"
          gameSubtitle="手札を回し犯人を追い詰めろ！最後まで誰が犯人かわからない推理・心理戦"
          themeColor="#334155"
          themeGradient="linear-gradient(135deg, #334155, #0f172a)"
          numPlayers={Object.keys(G.players).length}
          playerIds={Object.keys(G.players)}
          pid={pid}
          getPlayerName={getPlayerName}
          isHost={pid === '0'}
          hostOnlyStart={true}
          onStart={() => moves.startGame()}
          onShowRules={() => setShowRules(true)}
          rulesModal={rulesModal}
        />
      </div>
    );
  }

  const player = G.players[pid];
  const isActivePlayer = ctx.currentPlayer === pid;
  
  const numPlayers = ctx.numPlayers;
  const myIdx = parseInt(pid, 10);
  const leftId = ((myIdx + 1) % numPlayers).toString();
  const rightId = ((myIdx - 1 + numPlayers) % numPlayers).toString();

  // 自分を起点とした時計回りのプレイヤー順
  const orderedPlayerIds = [];
  for (let i = 0; i < numPlayers; i++) {
    const targetIdx = (myIdx + i) % numPlayers;
    orderedPlayerIds.push(targetIdx.toString());
  }

  const hasSubmittedInfo = isInfoSelect && G.pendingInfo?.selections?.[pid] !== undefined;
  const isTradeInitiator = pid === G.pendingTrade?.initiator;
  const isTradeTarget = pid === G.pendingTrade?.target;
  const hasSubmittedTrade = isTradeSelect && (
    (isTradeInitiator && G.pendingTrade?.initiatorCard !== null && G.pendingTrade?.initiatorCard !== undefined) ||
    (isTradeTarget && G.pendingTrade?.targetCard !== null && G.pendingTrade?.targetCard !== undefined)
  );

  const handleCardClick = (idx) => {
    const card = player.hand[idx];

    if (isTradeSelect) {
      if (hasSubmittedTrade) return;
      setConfirmDialog({ type: 'trade', cardIdx: idx, card });
      return;
    }
    if (isInfoSelect) {
      if (hasSubmittedInfo) return;
      setConfirmDialog({ type: 'info', cardIdx: idx, card });
      return;
    }

    if (!isActivePlayer) return;

    // First turn rule
    if (G.discardPile.length === 0 && card !== 'first_discoverer') {
      setAlertMessage('最初のターンは「第一発見者」を出さなければなりません。');
      return;
    }

    // Criminal rule
    if (card === 'criminal' && player.hand.length > 1) {
      setAlertMessage('「犯人」は最後の一枚になるまで出せません。');
      return;
    }

    // Detective rule (cannot be played in the first round)
    if (card === 'detective' && G.discardPile.length < ctx.numPlayers) {
      setAlertMessage('「探偵」は2周目になるまで（全員に1回手番が回るまで）使えません。');
      return;
    }

    setConfirmDialog({ type: 'play', cardIdx: idx, card });
  };

  if (G.winner) {
    const isPlayerCriminal = (id) => {
      const p = G.players[id];
      return p.hand.includes('criminal') || G.discardPile.some(d => d.card === 'criminal' && d.pid === id);
    };

    const criminalTeam = [];
    const townTeam = [];
    Object.keys(G.players).forEach(id => {
      const p = G.players[id];
      if (isPlayerCriminal(id) || p.isAccomplice) {
        criminalTeam.push(id);
      } else {
        townTeam.push(id);
      }
    });

    const winners = G.winner === 'criminal' ? criminalTeam : townTeam;
    const losers = G.winner === 'criminal' ? townTeam : criminalTeam;

    return (
      <div style={{ textAlign: 'center', padding: '50px', background: G.winner === 'town' ? '#d4edda' : '#f8d7da', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '3em', margin: '0 0 10px 0', color: G.winner === 'town' ? '#2e7d32' : '#c62828' }}>
          {G.winner === 'town' ? '🏙️ 探偵側（町）の勝利！' : '👺 犯人の勝利（逃げ切り）！'}
        </h1>
        <p style={{ fontSize: '1.3em', fontWeight: 'bold' }}>{G.winnerDetails}</p>

        <div style={{ display: 'flex', gap: '40px', margin: '30px 0', background: 'white', padding: '40px 60px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <div style={{ minWidth: '150px' }}>
            <h2 style={{ margin: '0 0 15px 0', color: '#ff9800', borderBottom: '3px solid #ff9800', paddingBottom: '10px' }}>👑 勝者</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '1.2em', textAlign: 'left' }}>
              {winners.map(id => (
                <li key={id} style={{ margin: '10px 0', fontWeight: 'bold' }}>
                  {getPlayerName(id)}
                  <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '5px' }}>
                    {isPlayerCriminal(id) ? '(犯人)' : G.players[id].isAccomplice ? '(たくらみ)' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ borderLeft: '2px dashed #ccc' }}></div>
          <div style={{ minWidth: '150px' }}>
            <h2 style={{ margin: '0 0 15px 0', color: '#757575', borderBottom: '3px solid #757575', paddingBottom: '10px' }}>💀 敗者</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '1.2em', textAlign: 'left' }}>
              {losers.map(id => (
                <li key={id} style={{ margin: '10px 0', color: '#555' }}>
                  {getPlayerName(id)}
                  <span style={{ fontSize: '0.8em', color: '#888', marginLeft: '5px' }}>
                    {isPlayerCriminal(id) ? '(犯人)' : G.players[id].isAccomplice ? '(たくらみ)' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <button onClick={() => window.location.href = window.location.pathname} style={{ padding: '15px 30px', fontSize: '18px', background: '#f44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🚪 ロビーに戻る</button>
          <button onClick={() => moves.rematchGame()} style={{ padding: '15px 30px', fontSize: '18px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 もう一度遊ぶ（再戦）</button>
        </div>
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
          {isInfoSelect && G.pendingInfo?.selections?.[pid] === undefined && <span style={{ color: '#ffeb3b', fontWeight: 'bold' }}>左隣（{getPlayerName(leftId)}）に渡すカードを選んでください</span>}
          {isInfoSelect && G.pendingInfo?.selections?.[pid] !== undefined && <span style={{ color: '#4caf50', fontWeight: 'bold' }}>カードを選択しました。他の人を待っています...</span>}
          {!isActivePlayer && !activeStage && <span>{getPlayerName(ctx.currentPlayer)} のターンを待っています...</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* MAIN BOARD */}
        <div style={{ flex: 2, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          
          {/* SEATING ORDER & PLAYERS */}
          <div style={{ background: '#fff', padding: '15px 20px', borderRadius: '10px', border: '1px solid #ccc', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔄 席順（時計回り / 手番順）</span>
              </span>
              <span style={{ fontSize: '11px', color: '#555', background: '#f5f5f5', padding: '3px 8px', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                👈 左隣へ「情報操作」で渡す / 👉 右隣から「うわさ」で引く
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
              {orderedPlayerIds.map((id, index) => {
                const isMe = id === pid;
                const isCurrent = ctx.currentPlayer === id;
                const isLeft = id === leftId;
                const isRight = id === rightId;
                const p = G.players[id];

                let relationBadge = null;
                if (isMe) {
                  relationBadge = <span style={{ background: '#4caf50', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>👤 あなた</span>;
                } else if (isLeft && isRight) {
                  relationBadge = <span style={{ background: '#9c27b0', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>左右の相手</span>;
                } else if (isLeft) {
                  relationBadge = <span style={{ background: '#1976d2', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>👈 左隣（渡す先）</span>;
                } else if (isRight) {
                  relationBadge = <span style={{ background: '#f57c00', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>👉 右隣（引く元）</span>;
                } else {
                  relationBadge = <span style={{ background: '#757575', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>向かい側</span>;
                }

                return (
                  <React.Fragment key={id}>
                    {index > 0 && (
                      <div style={{ color: '#bbb', fontSize: '18px', fontWeight: 'bold', userSelect: 'none', padding: '0 2px' }}>➔</div>
                    )}
                    <div style={{ 
                      background: isCurrent ? '#fff8e1' : (isMe ? '#f1f8e9' : '#fafafa'), 
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      minWidth: '115px', 
                      textAlign: 'center', 
                      border: isCurrent ? '3px solid #ff5722' : (isMe ? '2px solid #81c784' : '1px solid #ccc'),
                      boxShadow: isCurrent ? '0 0 10px rgba(255,87,34,0.35)' : 'none',
                      position: 'relative',
                      flexShrink: 0
                    }}>
                      {isCurrent && (
                        <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#ff5722', color: '#fff', fontSize: '10px', padding: '1px 8px', borderRadius: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          手番中
                        </div>
                      )}
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                        {getPlayerName(id)}
                      </div>
                      <div style={{ fontSize: '18px', margin: '6px 0', fontWeight: 'bold', color: '#333' }}>
                        🃏 x {p.hand.length}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        {relationBadge}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
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
              {G.logs.map((log, i) => <li key={i} style={{ marginBottom: '5px' }}>{log.replace(/Player (\d+)/g, (match, id) => getPlayerName(id))}</li>)}
            </ul>
          </div>
          
          {player.privateKnowledge && player.privateKnowledge.length > 0 && (
            <div style={{ height: '30%', background: '#e3f2fd', padding: '20px', overflowY: 'auto', borderTop: '2px solid #2196f3' }}>
              <h3 style={{ color: '#1565c0', marginTop: 0 }}>自分だけが見た情報</h3>
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '14px' }}>
                {player.privateKnowledge.map((k, i) => {
                  if (k.card === 'boy') {
                    return <li key={i}>少年の効果：犯人は {getPlayerName(k.result.criminalOwner)} です！</li>;
                  }
                  if (k.card === 'dog') {
                    return <li key={i}>いぬの効果：{getPlayerName(k.target)} のカードは {CARD_TYPES[k.result.card.toUpperCase()].name} でした。</li>;
                  }
                  if (k.card === 'witness') {
                    return (
                      <li key={i}>
                        目撃者の効果：{getPlayerName(k.target)} の手札 → {k.result.hand.map(c => CARD_TYPES[c.toUpperCase()].name).join(', ')}
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

      {/* MY HAND CONTAINER */}
      <div style={{ 
        background: isActivePlayer && !activeStage ? '#f1f8e9' : (isInfoSelect ? '#ede7f6' : (isTradeSelect ? '#fff8e1' : '#f0f0f0')), 
        padding: '20px', 
        borderTop: isActivePlayer && !activeStage ? '4px solid #4caf50' : (isInfoSelect ? '4px solid #5c6bc0' : (isTradeSelect ? '4px solid #ffa726' : '2px solid #ccc')),
        transition: 'background 0.3s, border-top 0.3s'
      }}>
        
        {/* PHASE STATUS BANNER */}
        <div style={{ 
          background: '#fff', 
          padding: '12px 20px', 
          borderRadius: '8px', 
          marginBottom: '15px', 
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          border: '1px solid #e0e0e0',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* 左側：状態メッセージ */}
          <div>
            {isActivePlayer && !activeStage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🎯</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2e7d32' }}>
                    あなたのターンです！
                  </div>
                  <div style={{ fontSize: '13px', color: '#555' }}>
                    手札から場に出すカードを1枚クリックしてください
                  </div>
                </div>
              </div>
            )}

            {isInfoSelect && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🔀</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#3949ab' }}>
                    【情報操作】発動中！（全員同時にカードを回します）
                  </div>
                  <div style={{ fontSize: '13px', color: '#555' }}>
                    左隣（<strong style={{ color: '#1976d2' }}>{getPlayerName(leftId)}</strong> さん）に渡すカードを選んでください
                  </div>
                </div>
              </div>
            )}

            {isTradeSelect && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🤝</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#e65100' }}>
                    【取り引き】実行中！
                  </div>
                  <div style={{ fontSize: '13px', color: '#555' }}>
                    相手と交換する手札を1枚選んでください
                  </div>
                </div>
              </div>
            )}

            {!isActivePlayer && !activeStage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>⏳</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#666' }}>
                    手番待ち
                  </div>
                  <div style={{ fontSize: '13px', color: '#777' }}>
                    <strong>{getPlayerName(ctx.currentPlayer)}</strong> さんのターンを待っています...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右側：情報操作・取り引きの確定・キャンセル操作パネル */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* 情報操作：提出完了（待機中） */}
            {isInfoSelect && hasSubmittedInfo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#e8f5e9', padding: '6px 12px', borderRadius: '6px', border: '1px solid #c8e6c9' }}>
                <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '13px' }}>
                  ✅ 送信完了（他の人を待っています...）
                </span>
                <button 
                  onClick={() => { moves.unselectCardForInfo(); setSelectedInfoCardIdx(null); }}
                  style={{ background: '#f44336', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  🔄 選び直す（キャンセル）
                </button>
              </div>
            )}

            {/* 情報操作：仮選択中 */}
            {isInfoSelect && !hasSubmittedInfo && selectedInfoCardIdx !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#e8eaf6', padding: '6px 12px', borderRadius: '6px', border: '1px solid #c5cae9' }}>
                <span style={{ fontSize: '13px', color: '#283593' }}>
                  渡すカード: <strong>{CARD_TYPES[player.hand[selectedInfoCardIdx]?.toUpperCase()]?.name}</strong>
                </span>
                <button 
                  onClick={() => moves.selectCardForInfo(selectedInfoCardIdx)}
                  style={{ background: '#3f51b5', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  ✅ これを渡す（確定）
                </button>
                <button 
                  onClick={() => setSelectedInfoCardIdx(null)}
                  style={{ background: '#9e9e9e', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✖ 取消
                </button>
              </div>
            )}

            {/* 取り引き：提出完了（待機中） */}
            {isTradeSelect && hasSubmittedTrade && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#e8f5e9', padding: '6px 12px', borderRadius: '6px', border: '1px solid #c8e6c9' }}>
                <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '13px' }}>
                  ✅ 送信完了（相手を待っています...）
                </span>
                <button 
                  onClick={() => { moves.unselectCardForTrade(); setSelectedTradeCardIdx(null); }}
                  style={{ background: '#f44336', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  🔄 選び直す（キャンセル）
                </button>
              </div>
            )}

            {/* 取り引き：仮選択中 */}
            {isTradeSelect && !hasSubmittedTrade && selectedTradeCardIdx !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff3e0', padding: '6px 12px', borderRadius: '6px', border: '1px solid #ffe0b2' }}>
                <span style={{ fontSize: '13px', color: '#e65100' }}>
                  交換カード: <strong>{CARD_TYPES[player.hand[selectedTradeCardIdx]?.toUpperCase()]?.name}</strong>
                </span>
                <button 
                  onClick={() => moves.selectCardForTrade(selectedTradeCardIdx)}
                  style={{ background: '#ff9800', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  ✅ 交換に出す（確定）
                </button>
                <button 
                  onClick={() => setSelectedTradeCardIdx(null)}
                  style={{ background: '#9e9e9e', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✖ 取消
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 手札カードリスト */}
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
          {player.hand.map((card, idx) => {
            const cardInfo = CARD_TYPES[card.toUpperCase()];
            
            // Determine if playable
            let playable = false;
            let isSelected = false;
            let isSubmitted = false;

            if (isTradeSelect) {
              playable = !hasSubmittedTrade;
              isSelected = selectedTradeCardIdx === idx;
              isSubmitted = hasSubmittedTrade && (
                (isTradeInitiator && G.pendingTrade?.initiatorCard === idx) ||
                (isTradeTarget && G.pendingTrade?.targetCard === idx)
              );
            } else if (isInfoSelect) {
              playable = !hasSubmittedInfo;
              isSelected = selectedInfoCardIdx === idx;
              isSubmitted = hasSubmittedInfo && G.pendingInfo?.selections?.[pid] === idx;
            } else if (isActivePlayer && !activeStage) {
              if (G.discardPile.length === 0) {
                playable = card === 'first_discoverer';
              } else if (card === 'criminal') {
                playable = player.hand.length === 1;
              } else if (card === 'detective') {
                playable = G.discardPile.length >= ctx.numPlayers;
              } else {
                playable = true;
              }
            }

            let borderColor = '#aaa';
            let cardBg = '#fff';
            if (isSubmitted) {
              borderColor = '#4caf50';
              cardBg = '#f1f8e9';
            } else if (isSelected) {
              borderColor = isInfoSelect ? '#3949ab' : '#e65100';
              cardBg = isInfoSelect ? '#ede7f6' : '#fff3e0';
            } else if (playable) {
              borderColor = isInfoSelect ? '#5c6bc0' : (isTradeSelect ? '#ffa726' : '#4caf50');
            }

            return (
              <div 
                key={idx} 
                onClick={() => playable && handleCardClick(idx)}
                style={{ 
                  position: 'relative',
                  background: cardBg,
                  border: `3px solid ${borderColor}`, 
                  borderRadius: '10px', 
                  padding: '15px', 
                  minWidth: '140px', 
                  cursor: playable ? 'pointer' : (isSubmitted ? 'default' : 'not-allowed'),
                  opacity: (playable || isSubmitted || isSelected) ? 1 : 0.6,
                  boxShadow: isSelected ? '0 0 12px rgba(63,81,181,0.5)' : (playable ? '0 4px 8px rgba(0,0,0,0.15)' : 'none'),
                  transform: isSelected ? 'translateY(-6px)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {isSubmitted && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(76, 175, 80, 0.25)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <span style={{ fontSize: '3em' }}>✅</span>
                    <span style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '13px', background: '#fff', padding: '2px 8px', borderRadius: '10px', marginTop: '4px' }}>提出済み</span>
                  </div>
                )}
                {isSelected && !isSubmitted && (
                  <div style={{ position: 'absolute', top: '-10px', right: '10px', background: isInfoSelect ? '#3949ab' : '#e65100', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', zIndex: 5 }}>
                    選択中
                  </div>
                )}
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center', color: '#333' }}>
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

      {/* CONFIRM DIALOG */}
      {confirmDialog && (() => {
        const { type, cardIdx, card } = confirmDialog;
        const cardInfo = CARD_TYPES[card.toUpperCase()];
        const needsTarget = type === 'play' && ['detective', 'dog', 'witness', 'trade'].includes(card);

        let dialogTitle = '';
        let dialogSubtitle = '';
        let headerBg = '#333';

        if (type === 'play') {
          dialogTitle = '🎯【自分のターン】カードを使用します';
          dialogSubtitle = needsTarget ? '対象のプレイヤーを選んでください' : 'このカードを場に出しますか？';
          headerBg = '#2e7d32';
        } else if (type === 'info') {
          dialogTitle = '🔀【情報操作】カードを渡します';
          dialogSubtitle = `左隣（${getPlayerName(leftId)} さん）に渡すカードの確認`;
          headerBg = '#3949ab';
        } else if (type === 'trade') {
          dialogTitle = '🤝【取り引き】カードを交換します';
          dialogSubtitle = '交換に出すカードの確認';
          headerBg = '#e65100';
        }

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{ 
              background: '#fff', borderRadius: '12px', maxWidth: '420px', width: '100%', 
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)', overflow: 'hidden', textAlign: 'center'
            }}>
              {/* ダイアログヘッダー */}
              <div style={{ background: headerBg, color: '#fff', padding: '16px 20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>{dialogTitle}</h3>
                <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>{dialogSubtitle}</div>
              </div>

              {/* ダイアログ本文（カード表示） */}
              <div style={{ padding: '20px' }}>
                <div style={{ 
                  background: '#f9f9f9', border: '2px solid #ddd', borderRadius: '10px', 
                  padding: '15px', margin: '0 auto 15px auto', maxWidth: '260px' 
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                    {cardInfo.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.4 }}>
                    {cardInfo.desc}
                  </div>
                </div>

                {/* 対象選択が必要な場合（探偵・いぬ・目撃者・取り引き） */}
                {needsTarget ? (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#444', marginBottom: '10px' }}>
                      対象プレイヤーを選択してください：
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                      {Object.keys(G.players).map(id => {
                        if (id === pid) return null;
                        const p = G.players[id];
                        const canSelect = p.hand.length > 0;
                        const isLeft = id === leftId;
                        const isRight = id === rightId;
                        let relText = '';
                        if (isLeft && isRight) relText = '（左右）';
                        else if (isLeft) relText = '（👈 左隣）';
                        else if (isRight) relText = '（👉 右隣）';

                        return (
                          <button 
                            key={id} 
                            onClick={() => {
                              moves.playCard(cardIdx, id);
                              setConfirmDialog(null);
                            }}
                            disabled={!canSelect}
                            style={{ 
                              padding: '10px 14px', fontSize: '14px', cursor: canSelect ? 'pointer' : 'not-allowed',
                              background: canSelect ? (isLeft ? '#1976d2' : isRight ? '#f57c00' : '#455a64') : '#ccc',
                              color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '120px'
                            }}
                          >
                            <span>{getPlayerName(id)} {relText}</span>
                            <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.9 }}>
                              {canSelect ? `手札 ${p.hand.length}枚` : '(手札なし)'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* 対象選択が不要な場合（決定ボタン表示） */
                  <div>
                    {type === 'play' && (
                      <button 
                        onClick={() => {
                          moves.playCard(cardIdx, null);
                          setConfirmDialog(null);
                        }}
                        style={{ 
                          width: '100%', padding: '14px', fontSize: '16px', background: '#2e7d32', color: '#fff', 
                          border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                          marginBottom: '10px', boxShadow: '0 4px 6px rgba(46,125,50,0.3)'
                        }}
                      >
                        ✅ このカードを場に出す
                      </button>
                    )}
                    {type === 'info' && (
                      <button 
                        onClick={() => {
                          moves.selectCardForInfo(cardIdx);
                          setSelectedInfoCardIdx(cardIdx);
                          setConfirmDialog(null);
                        }}
                        style={{ 
                          width: '100%', padding: '14px', fontSize: '16px', background: '#3949ab', color: '#fff', 
                          border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                          marginBottom: '10px', boxShadow: '0 4px 6px rgba(57,73,171,0.3)'
                        }}
                      >
                        ✅ このカードを渡す（確定）
                      </button>
                    )}
                    {type === 'trade' && (
                      <button 
                        onClick={() => {
                          moves.selectCardForTrade(cardIdx);
                          setSelectedTradeCardIdx(cardIdx);
                          setConfirmDialog(null);
                        }}
                        style={{ 
                          width: '100%', padding: '14px', fontSize: '16px', background: '#e65100', color: '#fff', 
                          border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                          marginBottom: '10px', boxShadow: '0 4px 6px rgba(230,81,0,0.3)'
                        }}
                      >
                        ✅ このカードを交換に出す
                      </button>
                    )}
                  </div>
                )}

                {/* キャンセルボタン */}
                <button 
                  onClick={() => setConfirmDialog(null)}
                  style={{ 
                    width: '100%', padding: '10px', fontSize: '14px', background: '#f5f5f5', color: '#666', 
                    border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', marginTop: needsTarget ? '15px' : '0' 
                  }}
                >
                  ✖ キャンセル（手札に戻る）
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ALERT DIALOG */}
      {alertMessage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{ 
            background: '#fff', borderRadius: '12px', maxWidth: '360px', width: '100%', 
            padding: '25px 20px', textAlign: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.25)' 
          }}>
            <div style={{ fontSize: '38px', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontSize: '15px', color: '#333', lineHeight: 1.5, marginBottom: '20px', fontWeight: 'bold' }}>
              {alertMessage}
            </div>
            <button 
              onClick={() => setAlertMessage(null)}
              style={{ 
                padding: '10px 35px', fontSize: '15px', background: '#2196f3', color: '#fff', 
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
