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
      const setupData = { maxRounds: G.maxRounds };
      const { matchID: newMatchID } = await lobbyClient.createMatch("haa", { numPlayers: Object.keys(G.players).length, setupData });
      moves.proposeRematch(newMatchID);
    } catch(e) {
      alert("再戦部屋の作成に失敗しました: " + e.message);
    }
  };

  const handleRematchJoin = async () => {
    window.location.href = `/?game=haa&match=${G.nextMatchId}`;
  };

  const [showRules, setShowRules] = React.useState(false);

  const rulesModal = showRules && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, textAlign: 'left' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', fontFamily: 'sans-serif', color: '#333' }}>
        <h2 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px', marginTop: 0 }}>はぁって言うゲーム ルール</h2>
        
        <h3 style={{ color: '#d32f2f' }}>🏆 勝利条件</h3>
        <p>指定したラウンド数をプレイし、最終的な累計スコアが一番高い人の勝利です！</p>

        <h3 style={{ color: '#1976d2' }}>🎮 ゲームの流れ</h3>
        <ol style={{ lineHeight: '1.6' }}>
          <li>ランダムにお題（例：「はぁ」）が発表され、各プレイヤーにシチュエーション（A〜H）がこっそり割り当てられます。</li>
          <li>順番に、割り当てられたシチュエーションを<strong>声と表情だけ</strong>で演技します。</li>
          <li>他の人は、その人がA〜Hのどれを演じているか予想して投票します。</li>
          <li>全員の投票が終わると結果発表です！</li>
        </ol>

        <h3 style={{ color: '#ff9800' }}>💯 得点の仕組み</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li><strong>当てたポイント:</strong> 他の人の演技を1つ正解するごとに +1点</li>
          <li><strong>当ててもらったポイント:</strong> 自分の演技を誰かが正解してくれるごとに +1点（たくさん当ててもらうほど高得点！）</li>
        </ul>

        <h3 style={{ color: '#388e3c' }}>⚠️ 注意事項</h3>
        <p><strong>身振り手振りは禁止です！</strong> 首から上だけの表情と声のトーンだけで表現してください。</p>

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
          <h2>はぁって言うゲーム - 待機ルーム</h2>
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

        <div style={{ background: "#fff9c4", padding: "15px", borderRadius: "10px", margin: "20px 0", border: "2px solid #fbc02d" }}>
          <h3 style={{ margin: "0 0 10px 0" }}>遊ぶラウンド数</h3>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px" }}>
            <button onClick={() => moves.setMaxRounds(Math.max(1, G.maxRounds - 1))} style={{ padding: "5px 20px", fontSize: "1.5em", cursor: "pointer", borderRadius: "5px", border: "1px solid #ccc" }}>-</button>
            <span style={{ fontSize: "1.8em", fontWeight: "bold", minWidth: "60px" }}>{G.maxRounds} 回</span>
            <button onClick={() => moves.setMaxRounds(G.maxRounds + 1)} style={{ padding: "5px 20px", fontSize: "1.5em", cursor: "pointer", borderRadius: "5px", border: "1px solid #ccc" }}>+</button>
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
          <h2 style={{ margin: 0, color: "#333" }}>はぁって言うゲーム <span style={{ fontSize: "0.6em", color: "#666" }}>- ラウンド {G.currentRound} / {G.maxRounds}</span></h2>
          <div style={{ fontSize: "1.2em", marginTop: "10px" }}>
            お題: <span style={{ fontSize: "1.5em", fontWeight: "bold", color: "#d32f2f" }}>{G.theme?.word}</span>
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

            {G.currentRound < G.maxRounds ? (
              <button onClick={() => moves.nextRound()} style={{ padding: "15px 40px", fontSize: "1.2em", cursor: "pointer", background: "#ff9800", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>
                次のラウンドへ ({G.currentRound + 1} / {G.maxRounds})
              </button>
            ) : (
              <button onClick={() => moves.showFinalResults()} style={{ padding: "15px 40px", fontSize: "1.2em", cursor: "pointer", background: "#e91e63", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>
                最終結果発表へ！
              </button>
            )}
          </div>
        </div>
      )}

      {/* Final Results Section */}
      {G.gameState === 'final_results' && (
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #ccc", textAlign: "center" }}>
          <h2 style={{ color: "#d32f2f", fontSize: "2em" }}>最終結果発表！</h2>
          <p>全 {G.maxRounds} ラウンドが終了しました。</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "30px 0" }}>
            {Object.keys(G.players)
              .map(id => ({ id, score: G.players[id].score }))
              .sort((a, b) => b.score - a.score)
              .map((p, idx) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", fontSize: "1.5em", background: idx === 0 ? "#fff9c4" : "#f5f5f5", padding: "15px", borderRadius: "10px", border: idx === 0 ? "2px solid #fbc02d" : "1px solid #eee", fontWeight: idx === 0 ? "bold" : "normal" }}>
                  <div style={{ width: "50px", color: idx === 0 ? "#fbc02d" : "#888" }}>{idx + 1}位</div>
                  <div style={{ width: "200px", textAlign: "left" }}>{getPlayerName(p.id)}</div>
                  <div style={{ color: "#d32f2f", fontWeight: "bold" }}>{p.score} pt</div>
                </div>
              ))}
          </div>

          {G.nextMatchId ? (
            <div style={{ background: "rgba(76, 175, 80, 0.1)", padding: "20px", borderRadius: "10px", textAlign: "center", border: "2px solid #4caf50", width: "100%" }}>
              <h3>ホストが再戦の準備をしました！</h3>
              <button onClick={handleRematchJoin} style={{ padding: "15px 30px", fontSize: "1.2em", cursor: "pointer", background: "#4caf50", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>新しい部屋に移動する</button>
            </div>
          ) : (
            <button onClick={handleRematchCreate} style={{ padding: "15px 40px", fontSize: "1.2em", cursor: "pointer", background: "#4caf50", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>もう一度最初から遊ぶ（再戦）</button>
          )}
        </div>
      )}

    </div>
  );
}
