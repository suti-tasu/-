import React from "react";
import { LobbyClient } from "boardgame.io/client";
import { UnifiedLobby } from "./UnifiedLobby";

export function ItoBoard({ G, ctx, moves, events, playerID, matchData }) {
  const [manualTheme, setManualTheme] = React.useState("");
  const isSpectator = playerID === null;

  const getPlayerName = (id) => {
    if (!matchData) return `Player ${id}`;
    const p = matchData.find(m => m.id === Number(id));
    return p ? p.name : `Player ${id}`;
  };

  const handleRematchCreate = async () => {
    try {
      const server = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "");
      const lobbyClient = new LobbyClient({ server });
      const setupData = { themeMode: G.themeMode, customThemes: G.customThemes };
      const { matchID: newMatchID } = await lobbyClient.createMatch("ito", { numPlayers: Object.keys(G.players).length, setupData });
      moves.proposeRematch(newMatchID);
    } catch(e) {
      alert("再戦部屋の作成に失敗しました: " + e.message);
    }
  };

  const handleRematchJoin = async () => {
    try {
      const server = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "");
      const lobbyClient = new LobbyClient({ server });
      const myName = getPlayerName(playerID);
      const { playerID: newPlayerID, playerCredentials } = await lobbyClient.joinMatch("ito", G.nextMatchId, { playerName: myName });
      const oldMatchID = new URLSearchParams(window.location.search).get("match");
      if (oldMatchID) window.localStorage.removeItem("ito_match_" + oldMatchID);
      window.localStorage.setItem("ito_match_" + G.nextMatchId, JSON.stringify({ pID: newPlayerID, creds: playerCredentials, pName: myName }));
      window.location.href = "/?game=ito&match=" + G.nextMatchId;
    } catch(e) {
      alert("参加に失敗しました: " + e.message);
    }
  };

  const [showRules, setShowRules] = React.useState(false);

  const renderCard = (num, color = "#fff", isHidden = false) => (
    <div style={{
      width: "60px", height: "85px", borderRadius: "8px",
      background: isHidden ? "#1976d2" : color,
      border: "2px solid #333",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "1.8em", fontWeight: "bold",
      boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
      color: isHidden ? "white" : "#333",
      cursor: (color === "#fff" && !isHidden && G.gameState === "playing") ? "pointer" : "default"
    }}>
      {isHidden ? "?" : num}
    </div>
  );

  const rulesModal = showRules && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, textAlign: 'left' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', fontFamily: 'sans-serif', color: '#333' }}>
        <h2 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>ITO (イトー) ルール</h2>
        
        <h3 style={{ color: '#d32f2f' }}>🏆 勝利条件</h3>
        <p>全3ラウンドを全員で協力してクリアすること！誰かが順番を間違えてカードを出した時、まだ出されていないカードの中にそれより小さい数字があると、その人数分だけライフが減ります。ライフが0になるとゲームオーバーです。</p>

        <h3 style={{ color: '#1976d2' }}>🎮 ゲームの流れ</h3>
        <ol style={{ lineHeight: '1.6' }}>
          <li>全員に秘密の「数字カード（1〜100）」が配られます。（1R目は1枚、2R目は2枚…）</li>
          <li>ランダムなお題（例：「人気の食べ物」）が発表されます。</li>
          <li>自分の数字の大きさを、<strong>お題に沿った言葉</strong>で表現して皆に伝えます。<br/>※数字を直接言うのはNG！</li>
          <li>話し合いながら、「数字が小さいと思う人」から順番にカードを出していきます。</li>
        </ol>

        <h3 style={{ color: '#388e3c' }}>⚠️ ポイント</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li>誰がいつカードを出しても構いません。「私のが一番小さそう！」と思った人から出してください。</li>
          <li>他の人の表現を聞いて、自分の数字がどのあたりに位置するかを推理するのがコツです！</li>
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
          gameTitle="イト (ITO)"
          gameIcon="🧵"
          gameSubtitle="数字を言葉で表現し合って完全昇順を目指せ！協力型会話ゲームの傑作"
          themeColor="#ea580c"
          themeGradient="linear-gradient(135deg, #f97316, #ea580c)"
          numPlayers={Object.keys(G.players).length}
          playerIds={Object.keys(G.players)}
          pid={playerID}
          getPlayerName={getPlayerName}
          isHost={playerID === '0'}
          onStart={() => moves.startGame()}
          onShowRules={() => setShowRules(true)}
          rulesModal={rulesModal}
        >
          {G.themeMode === 'manual' && (
            <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '14px', marginBottom: '12px', border: '1px solid #fde68a', textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '8px', fontSize: '14px' }}>
                💡 みんなでお題を出し合おう！
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input 
                  type="text" 
                  value={manualTheme} 
                  onChange={e => setManualTheme(e.target.value)} 
                  placeholder="やりたいお題を入力..." 
                  style={{ flex: 1, padding: '10px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                />
                <button 
                  onClick={() => { if(manualTheme) { moves.submitTheme(manualTheme); setManualTheme(''); } }} 
                  style={{ padding: '10px 18px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  追加
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {G.submittedThemes.map((t, i) => (
                  <div key={i} style={{ background: '#1e293b', color: '#f8fafc', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', letterSpacing: '2px' }}>
                    ? ? ? (秘密のお題 #{i + 1})
                  </div>
                ))}
                {G.submittedThemes.length === 0 && (
                  <div style={{ color: '#94a3b8', textAlign: 'center', fontSize: '12px', padding: '8px 0' }}>
                    まだお題がありません。自由に提案してください！
                  </div>
                )}
              </div>
            </div>
          )}
        </UnifiedLobby>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      {rulesModal}
      
      {/* Top Bar with Rules Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button onClick={() => setShowRules(true)} style={{ background: '#3f51b5', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          <span>📖</span> ルールブックを開く
        </button>
      </div>

      {/* Header Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f5f5f5", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, color: "#333" }}>ITO - ラウンド {G.round} / 3</h2>
          <div style={{ fontSize: "1.5em", marginTop: "10px" }}>
            ライフ: {"❤️".repeat(G.lives)}{"🖤".repeat(3 - G.lives)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.2em", fontWeight: "bold", color: "#d32f2f" }}>お題</div>
          <div style={{ fontSize: "1.5em", fontWeight: "bold", background: "#fff9c4", padding: "10px 20px", borderRadius: "5px", border: "2px solid #fbc02d" }}>
            {G.theme ? G.theme : (
              <div style={{ display: "flex", gap: "5px" }}>
                <input 
                  type="text" 
                  value={manualTheme} 
                  onChange={e => setManualTheme(e.target.value)} 
                  placeholder="お題を入力..." 
                  style={{ padding: "5px", fontSize: "0.8em", width: "200px" }} 
                />
                <button 
                  onClick={() => moves.setTheme(manualTheme)} 
                  style={{ padding: "5px 10px", background: "#4caf50", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}
                >
                  決定
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Other Players */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "30px", flexWrap: "wrap" }}>
        {Object.keys(G.players).map(pid => {
          if (pid === playerID) return null;
          const p = G.players[pid];
          return (
            <div key={pid} style={{ background: "#e0f7fa", padding: "10px", borderRadius: "8px", minWidth: "100px", textAlign: "center" }}>
              <div style={{ fontWeight: "bold", marginBottom: "10px" }}>{getPlayerName(pid)}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: "5px", flexWrap: "wrap" }}>
                {p.hand.map((_, i) => (
                  <div key={i} style={{ width: "30px", height: "42px", background: "#1976d2", borderRadius: "4px", border: "1px solid #0d47a1" }} />
                ))}
                {p.hand.length === 0 && <span style={{ color: "#888" }}>手札なし</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Played Cards Area */}
      <div style={{ background: "#e8f5e9", padding: "20px", borderRadius: "10px", minHeight: "150px", marginBottom: "30px", border: "2px dashed #4caf50" }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#2e7d32" }}>場に出たカード（小さい順）</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {G.playedCards.map((c, i) => (
            <div key={i} style={{ position: "relative" }}>
              {renderCard(c, "#c8e6c9")}
            </div>
          ))}
          {G.discardedCards.map((c, i) => (
            <div key={`d-${i}`} style={{ opacity: 0.5 }}>
              {renderCard(c, "#ffcdd2")}
            </div>
          ))}
          {G.playedCards.length === 0 && G.discardedCards.length === 0 && (
            <div style={{ color: "#888", fontStyle: "italic", paddingTop: "20px" }}>まだ誰もカードを出していません</div>
          )}
        </div>
      </div>

      {/* My Hand Area */}
      {!isSpectator && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
          <h3 style={{ margin: "0 0 15px 0" }}>あなたの手札</h3>
          <div style={{ display: "flex", gap: "15px" }}>
            {[...G.players[playerID].hand].sort((a,b)=>a-b).map(c => (
              <div key={c} onClick={() => moves.playCard(playerID, c)} style={{ transition: "transform 0.1s", cursor: "pointer" }}>
                {renderCard(c)}
              </div>
            ))}
            {G.players[playerID].hand.length === 0 && (
              <div style={{ color: "#888", fontSize: "1.2em", padding: "20px" }}>手札をすべて出し切りました！</div>
            )}
          </div>
        </div>
      )}

      {/* Modals for Game State */}
      {G.gameState !== "playing" && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1000, color: "white" }}>
          {G.gameState === "round_clear" && (
            <>
              <h1 style={{ fontSize: "4em", color: "#4caf50" }}>ラウンド {G.round} クリア！</h1>
              {G.players[playerID]?.hand.length === 0 ? (
                 <button onClick={() => moves.nextRound()} style={{ padding: "15px 30px", fontSize: "1.2em", cursor: "pointer", background: "#3f51b5", color: "white", border: "none", borderRadius: "8px" }}>次のラウンドへ</button>
              ) : <div>ホストが次へ進むのを待っています...</div>}
            </>
          )}
          {G.gameState === "game_over" && (
            <>
              <h1 style={{ fontSize: "4em", color: "#f44336" }}>Game Over...</h1>
              <p style={{ fontSize: "1.5em" }}>ライフが0になりました。</p>
            </>
          )}
          {G.gameState === "game_clear" && (
            <>
              <h1 style={{ fontSize: "4em", color: "#ffeb3b" }}>完全クリア！！🎉</h1>
              <p style={{ fontSize: "1.5em" }}>3ラウンドすべて突破しました！</p>
            </>
          )}

          {(G.gameState === "game_over" || G.gameState === "game_clear") && (
            <div style={{ marginTop: "30px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {G.themeMode === 'manual' && G.submittedThemes.length > 0 && (
                <div style={{ background: "rgba(255,255,255,0.15)", padding: "20px", borderRadius: "10px", width: "100%", maxWidth: "500px", marginBottom: "30px" }}>
                  <h3 style={{ margin: "0 0 15px 0", color: "#fff", textAlign: "center" }}>みんなが提出したお題一覧</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "200px", overflowY: "auto" }}>
                    {G.submittedThemes.map((t, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.9)", color: "#333", padding: "8px", borderRadius: "5px", fontSize: "1.1em", display: "flex", justifyContent: "space-between" }}>
                        <span>{t}</span>
                        {G.theme === t && <span style={{ color: "#d32f2f", fontWeight: "bold" }}>出題済み✨</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {G.nextMatchId ? (
                <div style={{ background: "rgba(76, 175, 80, 0.9)", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
                  <h3>ホストが再戦の準備をしました！</h3>
                  <button onClick={handleRematchJoin} style={{ padding: "15px 30px", fontSize: "1.2em", cursor: "pointer", background: "#fff", color: "#2e7d32", border: "none", borderRadius: "8px", fontWeight: "bold" }}>新しい部屋に移動する</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "20px" }}>
                  <button onClick={handleRematchCreate} style={{ padding: "15px 30px", fontSize: "1.2em", cursor: "pointer", background: "#4caf50", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>再戦する</button>
                  <button onClick={() => {
                    const mID = new URLSearchParams(window.location.search).get('match');
                    if (mID) window.localStorage.removeItem('ito_match_' + mID);
                    window.location.href = "/";
                  }} style={{ padding: "15px 30px", fontSize: "1.2em", cursor: "pointer", background: "#333", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>ポータルサイトに戻る</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
