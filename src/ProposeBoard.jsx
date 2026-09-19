import React, { useState } from 'react';
import { LobbyClient } from 'boardgame.io/client';
import { BASIC_WORDS } from './ProposeGame';

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
      const { matchID: newMatchID } = await lobbyClient.createMatch("propose", { numPlayers: Object.keys(G.players).length });
      moves.proposeRematch(newMatchID);
    } catch(e) {
      alert("再戦部屋の作成に失敗しました: " + e.message);
    }
  };

  const handleRematchJoin = async () => {
    window.location.href = `/?game=propose&match=${G.nextMatchId}`;
  };

  const addWord = (word, isBasic) => {
    setCurrentSentence([...currentSentence, { text: word, id: Math.random().toString(), isBasic }]);
  };

  const removeWord = (index) => {
    const newSentence = [...currentSentence];
    newSentence.splice(index, 1);
    setCurrentSentence(newSentence);
  };

  const submitMyProposal = () => {
    if (currentSentence.length === 0) {
      alert("プロポーズの言葉を作ってください！");
      return;
    }
    moves.submitProposal(playerID, currentSentence.map(w => w.text));
  };

  // Render Rules
  const rulesModal = showRules && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, textAlign: 'left' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', fontFamily: 'sans-serif', color: '#333' }}>
        <h2 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>たった今考えたプロポーズの言葉を君に捧ぐよ ルール</h2>
        
        <h3 style={{ color: '#d32f2f' }}>🏆 勝利条件</h3>
        <p>最初に自分の持っている「3つの指輪」をすべて受け取ってもらえた人（3回選ばれた人）が優勝です！</p>

        <h3 style={{ color: '#1976d2' }}>🎮 ゲームの流れ</h3>
        <ol style={{ lineHeight: '1.6' }}>
          <li>毎ラウンド、1人が「親（プロポーズされる人）」になります。</li>
          <li>親以外の人は、配られた6枚のランダムな「単語カード」と、いつでも使える「基本カード」を組み合わせて、最高のプロポーズを作ります。</li>
          <li>全員が完成したら、順番に親に向けてプロポーズの言葉を読み上げます。</li>
          <li>親は、一番グッときた（または面白かった）プロポーズを1つ選びます。選ばれた人は指輪を1つ渡すことができます（指輪が減ります）。</li>
        </ol>

        <h3 style={{ color: '#388e3c' }}>⚠️ 注意事項</h3>
        <p>配られたランダムな単語カードはすべて使い切らなくてもOKです。自由な発想で愛を伝えましょう！</p>

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
      <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        {rulesModal}
        {ruleButton}
        <h2>たった今考えたプロポーズの言葉を君に捧ぐよ</h2>
        <p>全員が揃ったら開始してください。</p>
        
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
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "900px", margin: "0 auto" }}>
      {rulesModal}
      {ruleButton}

      {/* Header Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f5f5f5", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, color: "#333" }}>💍 プロポーズ</h2>
          <div style={{ marginTop: "10px", fontSize: "1.2em" }}>
            今回の親 (プロポーズされる人): <span style={{ fontWeight: "bold", color: "#e91e63", fontSize: "1.2em" }}>{getPlayerName(G.targetPlayer)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "400px" }}>
          {Object.keys(G.players).map(pid => (
            <div key={pid} style={{ background: pid === G.targetPlayer ? "#f8bbd0" : "#fff", padding: "5px 10px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "0.9em" }}>
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
              <p style={{ fontSize: "1.2em" }}>みんなからの最高のプロポーズを楽しみに待ちましょう。</p>
            </div>
          ) : isSpectator ? (
            <p>観戦モードです。プレイヤーの思考を待っています。</p>
          ) : (
            <div>
              <h3 style={{ marginTop: 0, color: "#d32f2f" }}>愛の言葉を紡ごう</h3>
              
              {/* Sentence Builder */}
              <div style={{ background: "#fdf8e3", minHeight: "80px", padding: "15px", borderRadius: "8px", border: "2px dashed #e91e63", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                {currentSentence.length === 0 && <span style={{ color: "#999" }}>下のカードをクリックして言葉を並べてください...</span>}
                {currentSentence.map((wordObj, i) => (
                  <div key={wordObj.id} onClick={() => removeWord(i)} style={{ background: wordObj.isBasic ? "#fff" : "#ffeb3b", border: "1px solid #ccc", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "1.2em", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                    {wordObj.text} <span style={{ fontSize: "0.6em", color: "#888", verticalAlign: "top" }}>✖</span>
                  </div>
                ))}
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

                  <div style={{ display: "flex", gap: "20px" }}>
                    <div style={{ flex: 1, background: "#f5f5f5", padding: "15px", borderRadius: "8px" }}>
                      <h4>手札 (ランダムな単語)</h4>
                      <p style={{ fontSize: "0.8em", color: "#666" }}>何度でも使えます</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {G.players[playerID].hand.map((w, i) => (
                          <button key={i} onClick={() => addWord(w, false)} style={{ background: "#ffeb3b", border: "1px solid #fbc02d", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "1.1em" }}>
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ flex: 1, background: "#f5f5f5", padding: "15px", borderRadius: "8px" }}>
                      <h4>基本カード</h4>
                      <p style={{ fontSize: "0.8em", color: "#666" }}>いつでも使えます</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {BASIC_WORDS.map((w, i) => (
                          <button key={i} onClick={() => addWord(w, true)} style={{ background: "#fff", border: "1px solid #ccc", padding: "6px 12px", borderRadius: "5px", cursor: "pointer", fontSize: "1em" }}>
                            {w}
                          </button>
                        ))}
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
          <p>順番にプロポーズの言葉を読み上げてください！</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", margin: "20px 0" }}>
            {Object.keys(G.players).map(pid => {
              if (pid === G.targetPlayer) return null;
              const prop = G.proposals[pid];
              return (
                <div key={pid} style={{ background: "#fdf8e3", padding: "20px", borderRadius: "10px", border: "2px solid #ffcc80", textAlign: "left" }}>
                  <div style={{ fontWeight: "bold", color: "#d84315", marginBottom: "10px" }}>{getPlayerName(pid)} さんのプロポーズ</div>
                  <div style={{ fontSize: "1.5em", fontWeight: "bold", lineHeight: "1.5" }}>
                    {prop ? prop.join("") : "（未提出）"}
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
          
          <div style={{ fontSize: "1.5em", fontWeight: "bold", margin: "20px 0", lineHeight: "1.5" }}>
            「{G.proposals[G.roundWinner].join("")}」
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
          <p style={{ fontSize: "1.5em" }}>
            <span style={{ color: "#e91e63", fontWeight: "bold" }}>{getPlayerName(G.roundWinner)}</span> さんが3つの指輪をすべて渡しきりました！<br/>
            優勝です！おめでとうございます！🎉
          </p>

          <div style={{ marginTop: "40px" }}>
            {G.nextMatchId ? (
              <div style={{ background: "rgba(76, 175, 80, 0.1)", padding: "20px", borderRadius: "10px", textAlign: "center", border: "2px solid #4caf50", width: "100%" }}>
                <h3>ホストが再戦の準備をしました！</h3>
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
