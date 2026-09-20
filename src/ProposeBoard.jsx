import React, { useState } from 'react';
import { LobbyClient } from 'boardgame.io/client';
import { BASIC_CARDS } from './ProposeGame';

export default function ProposeBoard({ G, ctx, moves, playerID, matchData }) {
  const isSpectator = playerID === null;
  const isTarget = playerID === G.targetPlayer;
  const [currentSentence, setCurrentSentence] = useState([]);
  const [showRules, setShowRules] = useState(false);

  const getPlayerName = (id) => {
    const p = matchData?.find(m => m.id === parseInt(id));
    return p ? p.name : `Player ${id}`;
  };

  const handleRematchCreate = async () => {
    try {
      const server = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "");
      const lobbyClient = new LobbyClient({ server });
      const setupData = { expansions: G.selectedExpansions };
      const { matchID: newMatchID } = await lobbyClient.createMatch("propose", { numPlayers: Object.keys(G.players).length, setupData });
      moves.proposeRematch(newMatchID);
    } catch(e) {
      alert("再戦部屋の作成に失敗しました: " + e.message);
    }
  };

  const handleRematchJoin = async () => {
    window.location.href = `/?game=propose&match=${G.nextMatchId}`;
  };

  const addWord = (word, isBasic, originalCardIndex) => {
    setCurrentSentence([...currentSentence, { text: word, id: Math.random().toString(), isBasic, cardIndex: originalCardIndex, offset: 0 }]);
  };

  const removeWord = (index) => {
    const newSentence = [...currentSentence];
    newSentence.splice(index, 1);
    setCurrentSentence(newSentence);
  };

  const updateOffset = (index, value) => {
    const newSentence = [...currentSentence];
    newSentence[index].offset = Number(value);
    setCurrentSentence(newSentence);
  };

  const submitMyProposal = () => {
    if (currentSentence.length === 0) {
      alert("プロポーズの言葉を作ってください！");
      return;
    }
    moves.submitProposal(playerID, currentSentence);
  };

  const renderSentence = (sentenceArray, isInteractive = false) => {
    if (!sentenceArray || sentenceArray.length === 0) return <span style={{ color: "#999" }}>下のカードをクリックして言葉を並べてください...</span>;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", minHeight: "60px", padding: "10px 0", gap: "2px" }}>
        {sentenceArray.map((wordObj, i) => (
          <div key={wordObj.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", marginLeft: wordObj.offset ? `${wordObj.offset}px` : "0px", zIndex: i, position: "relative" }}>
            <div 
              onClick={() => isInteractive && removeWord(i)} 
              style={{ background: wordObj.isBasic ? "#fff" : "#ffeb3b", border: "2px solid #ccc", padding: "10px 15px", borderRadius: "5px", cursor: isInteractive ? "pointer" : "default", fontWeight: "bold", fontSize: "1.4em", boxShadow: "2px 2px 5px rgba(0,0,0,0.2)", whiteSpace: "nowrap", color: "#333" }}
            >
              {wordObj.text}
              {isInteractive && <span style={{ fontSize: "0.6em", color: "#888", verticalAlign: "top", marginLeft: "5px" }}>✖</span>}
            </div>
            {isInteractive && i > 0 && (
              <div style={{ marginTop: "8px", display: "flex", gap: "5px", alignItems: "center", background: "#f5f5f5", padding: "4px 8px", borderRadius: "20px", border: "1px solid #ccc" }}>
                <button 
                  onClick={() => updateOffset(i, (wordObj.offset || 0) - 20)} 
                  style={{ width: "35px", height: "35px", borderRadius: "50%", border: "none", background: "#e91e63", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "1.2em", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                >
                  ◀
                </button>
                <span style={{ fontSize: "0.8em", color: "#333", fontWeight: "bold", padding: "0 5px" }}>重ねる</span>
                <button 
                  onClick={() => updateOffset(i, Math.min(0, (wordObj.offset || 0) + 20))} 
                  style={{ width: "35px", height: "35px", borderRadius: "50%", border: "none", background: "#2196f3", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "1.2em", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const rulesModal = showRules && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, textAlign: 'left' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', fontFamily: 'sans-serif', color: '#333' }}>
        <h2 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>たった今考えたプロポーズの言葉を君に捧ぐよ ルール</h2>
        
        <h3 style={{ color: '#d32f2f' }}>🏆 勝利条件</h3>
        <p>最初に自分の持っている「3つの指輪」をすべて受け取ってもらえた人（3回選ばれた人）が優勝です！</p>

        <h3 style={{ color: '#1976d2' }}>🎮 ゲームの流れ</h3>
        <ol style={{ lineHeight: '1.6' }}>
          <li>毎ラウンド、1人が「親（プロポーズされる人）」になります。</li>
          <li>親以外の人は、配られた6枚のランダムな「単語カード」と、6枚の「基本カード」を組み合わせて、最高のプロポーズを作ります。</li>
          <li>全員が完成したら、順番に親に向けてプロポーズの言葉を読み上げます。</li>
          <li>親は、一番グッときた（または面白かった）プロポーズを1つ選びます。選ばれた人は指輪を1つ渡すことができます（指輪が減ります）。</li>
        </ol>

        <h3 style={{ color: '#ff9800' }}>💡 テクニック：カードを重ねる！</h3>
        <p>カードの下にある<strong>「重ねる ◀▶」ボタン</strong>を押すと、カードを左にスライドさせて<strong>前の言葉の一部を隠す</strong>ことができます。<br/>例：「結婚しよう」の「しよう」を隠して「結婚」＋「筋肉」＝「結婚筋肉」のような不思議な言葉を作るのがこのゲームの醍醐味です！</p>

        <h3 style={{ color: '#388e3c' }}>⚠️ 注意事項</h3>
        <p>配られたランダムな単語カードはすべて使い切らなくてもOKです。基本カードとランダムな手札カードはそれぞれ<strong>1回ずつしか使えません</strong>（文から取り外せば再び使えます）。自由な発想で愛を伝えましょう！</p>

        <button onClick={() => setShowRules(false)} style={{ marginTop: '20px', padding: '10px 20px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontSize: '1.1em', fontWeight: 'bold' }}>
          閉じる
        </button>
      </div>
    </div>
  );

  const ruleButton = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
      <button onClick={() => setShowRules(true)} style={{ background: '#3f51b5', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
        <span>📖</span> ルールブックを開く
      </button>
    </div>
  );

  if (G.gameState === 'lobby') {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto", textAlign: "center", color: "#333" }}>
        {rulesModal}
        {ruleButton}
        <h2>たった今考えたプロポーズの言葉を君に捧ぐよ</h2>
        <p>全員が揃ったら開始してください。（※3人以上を推奨します）</p>
        
        <div style={{ background: "#f5f5f5", padding: "15px", borderRadius: "10px", margin: "20px 0" }}>
          <h3 style={{ marginTop: 0 }}>参加者 ({Object.keys(G.players).length}人)</h3>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            {Object.keys(G.players).map(pid => (
              <div key={pid} style={{ background: "#e0f7fa", padding: "5px 15px", borderRadius: "20px", fontWeight: "bold", border: "1px solid #b2ebf2", color: "#333" }}>
                {getPlayerName(pid)}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff9c4", padding: "15px", borderRadius: "10px", margin: "20px 0", border: "2px solid #fbc02d", textAlign: "left" }}>
          <h3 style={{ marginTop: 0, textAlign: "center" }}>拡張セットを追加（任意）</h3>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0", cursor: "pointer", fontSize: "1.1em" }}>
            <input type="checkbox" checked={G.selectedExpansions.includes('lovers')} onChange={() => moves.toggleExpansion('lovers')} style={{ transform: "scale(1.5)" }} />
            💕 ラバーズピンク（少し大人な恋愛・セクシー）
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0", cursor: "pointer", fontSize: "1.1em" }}>
            <input type="checkbox" checked={G.selectedExpansions.includes('stalker')} onChange={() => moves.toggleExpansion('stalker')} style={{ transform: "scale(1.5)" }} />
            🔪 ストーカーブラック（ヤンデレ・ホラー・重い愛）
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0", cursor: "pointer", fontSize: "1.1em" }}>
            <input type="checkbox" checked={G.selectedExpansions.includes('gesu')} onChange={() => moves.toggleExpansion('gesu')} style={{ transform: "scale(1.5)" }} />
            💰 ゲスゲスゴールド（お金・浮気・クズ）
          </label>
        </div>

        <button 
          onClick={() => moves.startGame()} 
          style={{ padding: "15px 40px", fontSize: "1.5em", background: "#f44336", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px rgba(0,0,0,0.2)", width: "100%" }}
        >
          ゲームを開始する！
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "900px", margin: "0 auto", overflowX: "hidden", color: "#333" }}>
      {rulesModal}
      {ruleButton}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f5f5f5", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, color: "#333" }}>💍 プロポーズ</h2>
          <div style={{ marginTop: "10px", fontSize: "1.2em" }}>
            今回の親 (プロポーズされる人): <span style={{ fontWeight: "bold", color: "#e91e63", fontSize: "1.2em" }}>{getPlayerName(G.targetPlayer)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "400px" }}>
          {Object.keys(G.players).map(pid => (
            <div key={pid} style={{ background: pid === G.targetPlayer ? "#f8bbd0" : "#fff", padding: "5px 10px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "0.9em", color: "#333" }}>
              {getPlayerName(pid)}: 💍x{G.players[pid].rings}
            </div>
          ))}
        </div>
      </div>

      {G.gameState === 'thinking' && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #ccc" }}>
          {isTarget ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <h2 style={{ color: "#e91e63" }}>あなたは親です！</h2>
              <p style={{ fontSize: "1.2em", color: "#333" }}>みんなからの最高のプロポーズを楽しみに待ちましょう。</p>
            </div>
          ) : isSpectator ? (
            <p style={{ color: "#333" }}>観戦モードです。プレイヤーの思考を待っています。</p>
          ) : (
            <div>
              <h3 style={{ marginTop: 0, color: "#d32f2f" }}>愛の言葉を紡ごう</h3>
              
              <div style={{ background: "#fdf8e3", minHeight: "80px", padding: "15px", borderRadius: "8px", border: "2px dashed #e91e63", marginBottom: "20px" }}>
                {renderSentence(currentSentence, true)}
              </div>

              {G.proposals[playerID] ? (
                <div style={{ textAlign: "center", padding: "20px", background: "#e8f5e9", borderRadius: "10px", color: "#2e7d32", fontWeight: "bold", fontSize: "1.2em" }}>
                  プロポーズ完成！他の人を待っています...
                </div>
              ) : (
                <>
                  <button 
                    onClick={submitMyProposal}
                    style={{ width: "100%", padding: "15px", background: "#e91e63", color: "white", fontSize: "1.3em", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", marginBottom: "30px", boxShadow: "0 4px 6px rgba(0,0,0,0.2)" }}
                  >
                    💐 この言葉でプロポーズする！
                  </button>

                  <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, background: "#f5f5f5", padding: "15px", borderRadius: "8px", minWidth: "300px" }}>
                      <h4 style={{ color: "#333", marginTop: 0 }}>手札 (ランダムな単語)</h4>
                      <p style={{ fontSize: "0.8em", color: "#666" }}>※1回だけ使えます</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {G.players[playerID].hand.map((w, i) => {
                          const isUsed = currentSentence.some(word => !word.isBasic && word.cardIndex === i);
                          if (isUsed) {
                            return (
                              <div key={i} style={{ background: "#e0e0e0", border: "1px dashed #aaa", padding: "8px 15px", borderRadius: "5px", color: "#999", fontSize: "1.1em", cursor: "not-allowed" }}>
                                使用中
                              </div>
                            );
                          }
                          return (
                            <button key={i} onClick={() => addWord(w, false, i)} style={{ background: "#ffeb3b", border: "1px solid #fbc02d", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "1.1em", color: "#333" }}>
                              {w}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ flex: 1, background: "#f5f5f5", padding: "15px", borderRadius: "8px", minWidth: "300px" }}>
                      <h4 style={{ color: "#333", marginTop: 0 }}>基本カード (全6枚)</h4>
                      <p style={{ fontSize: "0.8em", color: "#666" }}>※各カード1回だけ使えます</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {BASIC_CARDS.map((cardWords, cardIndex) => {
                          const isUsed = currentSentence.some(word => word.isBasic && word.cardIndex === cardIndex);
                          if (isUsed) {
                            return (
                              <div key={cardIndex} style={{ width: "120px", height: "60px", background: "#e0e0e0", border: "1px dashed #aaa", borderRadius: "5px", color: "#999", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9em" }}>
                                使用中
                              </div>
                            );
                          }
                          return (
                            <div key={cardIndex} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", width: "120px", background: "#aaa", border: "2px solid #888", borderRadius: "5px", overflow: "hidden" }}>
                              {cardWords.map((w, wIdx) => (
                                <button key={wIdx} onClick={() => addWord(w, true, cardIndex)} style={{ background: "#fff", border: "none", padding: "5px 2px", cursor: "pointer", fontSize: "0.9em", color: "#333", fontWeight: "bold", margin: "1px" }}>
                                  {w}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {G.gameState === 'presenting' && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #ccc", textAlign: "center" }}>
          <h2 style={{ color: "#e91e63" }}>プロポーズの発表！</h2>
          <p style={{ color: "#333" }}>順番にプロポーズの言葉を読み上げてください！</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", margin: "20px 0" }}>
            {Object.keys(G.players).map(pid => {
              if (pid === G.targetPlayer) return null;
              const prop = G.proposals[pid];
              return (
                <div key={pid} style={{ background: "#fdf8e3", padding: "20px", borderRadius: "10px", border: "2px solid #ffcc80", textAlign: "left", overflowX: "hidden" }}>
                  <div style={{ fontWeight: "bold", color: "#d84315", marginBottom: "10px" }}>{getPlayerName(pid)} さんのプロポーズ</div>
                  <div style={{ padding: "10px 0", overflow: "visible" }}>
                    {prop ? renderSentence(prop, false) : "（未提出）"}
                  </div>
                  {isTarget && (
                    <div style={{ marginTop: "15px", textAlign: "right" }}>
                      <button 
                        onClick={() => moves.acceptProposal(playerID, pid)}
                        style={{ padding: "10px 20px", background: "#e91e63", color: "white", fontWeight: "bold", border: "none", borderRadius: "5px", cursor: "pointer" }}
                      >
                        💍 このプロポーズを受ける！
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!isTarget && !isSpectator && (
            <div style={{ color: "#888", fontWeight: "bold", marginTop: "20px" }}>
              親（{getPlayerName(G.targetPlayer)}さん）が選ぶのを待っています...
            </div>
          )}
        </div>
      )}

      {G.gameState === 'results' && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #ccc", textAlign: "center" }}>
          <h2 style={{ color: "#4caf50", fontSize: "2em" }}>プロポーズ成功！🎉</h2>
          <div style={{ fontSize: "1.5em", margin: "20px 0", padding: "20px", background: "#f1f8e9", borderRadius: "10px", border: "2px dashed #8bc34a" }}>
            <span style={{ color: "#e91e63", fontWeight: "bold" }}>{getPlayerName(G.targetPlayer)}</span> さんは<br/>
            <span style={{ color: "#2196f3", fontWeight: "bold", fontSize: "1.2em" }}>{getPlayerName(G.roundWinner)}</span> さんのプロポーズを受け入れました！
          </div>
          
          <div style={{ margin: "20px 0", display: "flex", justifyContent: "center", padding: "20px", background: "#fdf8e3", borderRadius: "10px", border: "2px solid #ffcc80", overflow: "visible" }}>
            {renderSentence(G.proposals[G.roundWinner], false)}
          </div>

          <div style={{ marginTop: "30px" }}>
            <button 
              onClick={() => {
                setCurrentSentence([]);
                moves.nextRound();
              }}
              style={{ padding: "15px 40px", fontSize: "1.2em", cursor: "pointer", background: "#ff9800", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}
            >
              次の親へ進む（次ラウンド）
            </button>
          </div>
        </div>
      )}

      {G.gameState === 'game_over' && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #ccc", textAlign: "center" }}>
          <h2 style={{ color: "#d32f2f", fontSize: "2.5em" }}>ゲーム終了！</h2>
          <p style={{ fontSize: "1.5em", color: "#333" }}>
            <span style={{ color: "#e91e63", fontWeight: "bold" }}>{getPlayerName(G.roundWinner)}</span> さんが3つの指輪をすべて渡しきりました！<br/>
            優勝です！おめでとうございます！🎉
          </p>

          <div style={{ marginTop: "40px" }}>
            {G.nextMatchId ? (
              <div style={{ background: "rgba(76, 175, 80, 0.1)", padding: "20px", borderRadius: "10px", textAlign: "center", border: "2px solid #4caf50", width: "100%" }}>
                <h3 style={{ color: "#333" }}>ホストが再戦の準備をしました！</h3>
                <button onClick={handleRematchJoin} style={{ padding: "15px 30px", fontSize: "1.2em", cursor: "pointer", background: "#4caf50", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>新しい部屋に移動する</button>
              </div>
            ) : (
              <button onClick={handleRematchCreate} style={{ padding: "15px 40px", fontSize: "1.2em", cursor: "pointer", background: "#4caf50", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>もう一度遊ぶ（再戦）</button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
