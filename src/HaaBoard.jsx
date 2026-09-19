import React from 'react';
import { LobbyClient } from 'boardgame.io/client';

export default function HaaBoard({ G, ctx, moves, playerID, matchData }) {
  const isSpectator = playerID === null;

  const getPlayerName = (id) => {
    const p = matchData?.find(m => m.id === parseInt(id));
    return p ? p.name : `Player ${id}`;
  };

  const handleRematchCreate = async () => {
    try {
      const server = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "");
      const lobbyClient = new LobbyClient({ server });
      // Haa doesn't have setupData right now, just numPlayers
      const { matchID: newMatchID } = await lobbyClient.createMatch("haa", { numPlayers: Object.keys(G.players).length });
      moves.proposeRematch(newMatchID);
    } catch(e) {
      alert("再戦部屋の作成に失敗しました: " + e.message);
    }
  };

  const handleRematchJoin = async () => {
    window.location.href = `/?game=haa&match=${G.nextMatchId}`;
  };

  if (G.gameState === 'lobby') {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h2>はぁって言うゲーム - 待機ルーム</h2>
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
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f5f5f5", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, color: "#333" }}>はぁって言うゲーム</h2>
          <div style={{ fontSize: "1.2em", marginTop: "10px" }}>
            お題: <span style={{ fontSize: "1.5em", fontWeight: "bold", color: "#d32f2f" }}>{G.theme.word}</span>
          </div>
        </div>
      </div>

      {G.gameState === 'voting' && !isSpectator && (
        <div style={{ background: "#e3f2fd", padding: "20px", borderRadius: "10px", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#1565c0" }}>あなたのアクト（お題）</h3>
          <div style={{ fontSize: "2em", fontWeight: "bold", background: "white", padding: "15px", borderRadius: "8px", textAlign: "center", border: "2px solid #2196f3" }}>
            {G.assignments[playerID]}: {G.theme.situations.find(s => s.letter === G.assignments[playerID])?.text}
          </div>
          <p style={{ textAlign: "center", margin: "10px 0 0 0" }}>声と表情だけで演技してください（身振り手振りは禁止！）</p>
        </div>
      )}

      {/* Situations List */}
      <div style={{ background: "white", padding: "15px", borderRadius: "10px", border: "1px solid #ddd", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {G.theme.situations.map((sit) => (
          <div key={sit.letter} style={{ padding: "10px", background: "#f9f9f9", borderRadius: "5px", borderLeft: "4px solid #ff9800", fontWeight: "bold" }}>
            <span style={{ color: "#ff9800", marginRight: "10px", fontSize: "1.2em" }}>{sit.letter}</span>
            {sit.text}
          </div>
        ))}
      </div>

      {/* Voting Section */}
      {G.gameState === 'voting' && !isSpectator && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #ccc" }}>
          <h3 style={{ marginTop: 0 }}>みんなの演技を予想しよう！</h3>
          <p>他のプレイヤーの演技を見て、A〜Hのどれを演じたか予想してください。</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {Object.keys(G.players).map(pid => {
              if (pid === playerID) return null; // Can't vote for self
              return (
                <div key={pid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa", padding: "10px", borderRadius: "5px", border: "1px solid #eee" }}>
                  <span style={{ fontWeight: "bold", fontSize: "1.1em" }}>{getPlayerName(pid)} さん</span>
                  <select 
                    value={G.votes[playerID]?.[pid] || ""} 
                    onChange={(e) => moves.submitVote(pid, e.target.value)}
                    disabled={G.players[playerID].isReady}
                    style={{ padding: "10px", fontSize: "1.1em", borderRadius: "5px", border: "1px solid #ccc", minWidth: "150px" }}
                  >
                    <option value="">予想する...</option>
                    {G.theme.situations.map(sit => (
                      <option key={sit.letter} value={sit.letter}>{sit.letter}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button 
              onClick={() => moves.toggleReady(playerID)}
              style={{
                padding: "15px 40px", fontSize: "1.2em", cursor: "pointer", fontWeight: "bold", border: "none", borderRadius: "8px",
                background: G.players[playerID].isReady ? "#9e9e9e" : "#4caf50",
                color: "white"
              }}
            >
              {G.players[playerID].isReady ? "予想を修正する" : "投票完了！"}
            </button>
            {G.players[playerID].isReady && <p style={{ color: "#d32f2f", fontWeight: "bold", marginTop: "10px" }}>他の人の完了を待っています...</p>}
          </div>
        </div>
      )}

      {/* Results Section */}
      {G.gameState === 'results' && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #ccc" }}>
          <h2 style={{ color: "#d32f2f", textAlign: "center" }}>結果発表！</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {Object.keys(G.players).map(pid => {
              const res = G.results[pid];
              const sitText = G.theme.situations.find(s => s.letter === res.actual)?.text;
              return (
                <div key={pid} style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", borderLeft: "5px solid #2196f3" }}>
                  <div style={{ fontSize: "1.2em", fontWeight: "bold", marginBottom: "5px" }}>
                    {getPlayerName(pid)} さんの正解は… <span style={{ color: "#d32f2f", fontSize: "1.5em" }}>{res.actual}</span> ({sitText})
                  </div>
                  <div style={{ fontSize: "0.95em", color: "#555" }}>
                    正解した人: {res.guessedBy.length > 0 ? res.guessedBy.map(id => getPlayerName(id)).join("、") : "なし..."}
                  </div>
                  <div style={{ marginTop: "10px", fontWeight: "bold", color: "#4caf50" }}>
                    獲得ポイント: {res.pointsEarned + (res.pointsFromGuessing || 0)} pt
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 style={{ margin: "0 0 15px 0" }}>累計スコア</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginBottom: "30px" }}>
              {Object.keys(G.players).map(pid => (
                <div key={pid} style={{ background: "#333", color: "white", padding: "10px 20px", borderRadius: "20px", fontWeight: "bold" }}>
                  {getPlayerName(pid)}: {G.players[pid].score} pt
                </div>
              ))}
            </div>

            {G.nextMatchId ? (
              <div style={{ background: "rgba(76, 175, 80, 0.1)", padding: "20px", borderRadius: "10px", textAlign: "center", border: "2px solid #4caf50", width: "100%" }}>
                <h3>ホストが次のゲームを準備しました！</h3>
                <button onClick={handleRematchJoin} style={{ padding: "15px 30px", fontSize: "1.2em", cursor: "pointer", background: "#4caf50", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>新しい部屋に移動する</button>
              </div>
            ) : (
              <button onClick={() => moves.startGame()} style={{ padding: "15px 40px", fontSize: "1.2em", cursor: "pointer", background: "#ff9800", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>次のテーマで遊ぶ（再戦）</button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
