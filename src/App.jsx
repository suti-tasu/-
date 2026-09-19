import React, { useState, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { LobbyClient } from 'boardgame.io/client';
import { Splendor } from './Game';
import { SplendorBoard } from './Board';
import { Ito } from './ItoGame';
import { ItoBoard } from './ItoBoard';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'white', color: 'red' }}>
          <h2>画面エラーが発生しました</h2>
          <pre>{this.state.error.toString()}</pre>
          <button onClick={() => { window.localStorage.clear(); window.location.href = '/'; }}>リセットしてトップに戻る</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const server = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
const lobbyClient = new LobbyClient({ server });

const SplendorClient = Client({
  game: Splendor,
  board: SplendorBoard,
  multiplayer: SocketIO({ server }),
  debug: false
});

const ItoClient = Client({
  game: Ito,
  board: ItoBoard,
  multiplayer: SocketIO({ server }),
  debug: false
});

const App = () => {
  const [matchID, setMatchID] = useState(null);
  const [gameType, setGameType] = useState('splendor');
  const [playerID, setPlayerID] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [numPlayers, setNumPlayers] = useState(2);
  const [error, setError] = useState('');

  const [customThemes, setCustomThemes] = useState([]);
  const [newTheme, setNewTheme] = useState('');
  const [showThemeManager, setShowThemeManager] = useState(false);
  const [themeMode, setThemeMode] = useState('random');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ito_custom_themes');
      if (stored) setCustomThemes(JSON.parse(stored));
    } catch(e) {}
  }, []);

  const handleAddTheme = () => {
    if (!newTheme.trim()) return;
    const updated = [...customThemes, newTheme.trim()];
    setCustomThemes(updated);
    localStorage.setItem('ito_custom_themes', JSON.stringify(updated));
    setNewTheme('');
  };

  const handleRemoveTheme = (index) => {
    const updated = customThemes.filter((_, i) => i !== index);
    setCustomThemes(updated);
    localStorage.setItem('ito_custom_themes', JSON.stringify(updated));
  };
  
  // Renderのサーバーがスリープするのを防ぐための定期通信 (Keep-Alive)
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(server + '/games/splendor').catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mID = params.get('match');
    const gType = params.get('game') || 'splendor';
    if (gType) setGameType(gType);
    
    if (mID) {
      setMatchID(mID);
      const saved = localStorage.getItem(gType + '_match_' + mID);
      if (saved) {
        try {
          const { pID, creds, pName } = JSON.parse(saved);
          if (pID && creds) {
            setPlayerID(pID);
            setCredentials(creds);
            setPlayerName(pName || '');
          }
        } catch(e) {}
      }
    }
  }, []);

  const saveCredentials = (gType, mID, pID, creds, pName) => {
    localStorage.setItem(gType + '_match_' + mID, JSON.stringify({ pID, creds, pName }));
  };

  const createAndJoinMatch = async () => {
    if (!playerName) return setError('名前を入力してください');
    setError('');
    try {
      const matchConfig = { numPlayers };
      if (gameType === 'ito') matchConfig.setupData = { customThemes, themeMode };
      const { matchID: newMatchID } = await lobbyClient.createMatch(gameType, matchConfig);
      const { playerID: newPlayerID, playerCredentials } = await lobbyClient.joinMatch(gameType, newMatchID, {
        playerName: playerName
      });
      
      window.history.pushState({}, '', '?game=' + gameType + '&match=' + newMatchID);
      setMatchID(newMatchID);
      setPlayerID(newPlayerID);
      setCredentials(playerCredentials);
      saveCredentials(gameType, newMatchID, newPlayerID, playerCredentials, playerName);
    } catch (e) {
      setError('部屋の作成に失敗しました: ' + e.message);
    }
  };

  const joinExistingMatch = async () => {
    if (!playerName) return setError('名前を入力してください');
    setError('');
    try {
      // 誰が空いているか探してJoinする（簡略化のため0から順に試す）
      const match = await lobbyClient.getMatch(gameType, matchID);
      const availablePlayer = match.players.find(p => !p.name);
      
      if (!availablePlayer) {
        return setError('部屋が満員です');
      }

      const { playerID: newPlayerID, playerCredentials } = await lobbyClient.joinMatch(gameType, matchID, {
        playerID: availablePlayer.id.toString(),
        playerName: playerName
      });

      setPlayerID(newPlayerID);
      setCredentials(playerCredentials);
      saveCredentials(gameType, matchID, newPlayerID, playerCredentials, playerName);
    } catch (e) {
      setError('参加に失敗しました: ' + e.message);
    }
  };

  const leaveMatch = () => {
    if(matchID) localStorage.removeItem(gameType + '_match_' + matchID);
    setPlayerID(null);
    setCredentials(null);
    window.location.href = '/';
  };

  if (playerID !== null && credentials !== null) {
    return (
      <div style={{ padding: '10px' }}>
        <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '5px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            招待URL: <input type="text" readOnly value={window.location.href} style={{ width: '300px', padding: '5px' }} onClick={e => e.target.select()} />
            <span style={{ fontSize: '0.8em', marginLeft: '10px', color: '#555' }}>このURLを友達に送って参加してもらってください</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div>あなたの名前: <strong>{playerName}</strong></div>
            <button onClick={leaveMatch} style={{ background: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>退出・リセット</button>
          </div>
        </div>
        <ErrorBoundary>
          {gameType === 'ito' ? (
            <ItoClient matchID={matchID} playerID={playerID} credentials={credentials} />
          ) : (
            <SplendorClient matchID={matchID} playerID={playerID} credentials={credentials} />
          )}
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#f5f5f5' }}>
      <h1 style={{ fontSize: '3em', color: '#333' }}>Board Game Portal</h1>
      
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '400px' }}>
        {error && <div style={{ color: 'red', marginBottom: '15px', fontWeight: 'bold' }}>{error}</div>}
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>プレイヤー名</label>
          <input 
            type="text" 
            value={playerName} 
            onChange={e => setPlayerName(e.target.value.slice(0, 15))} 
            maxLength={15}
            placeholder="あなたの名前"
            style={{ width: '100%', padding: '10px', fontSize: '1.2em', boxSizing: 'border-box' }}
          />
        </div>

        {!matchID ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>遊ぶゲーム</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setGameType('splendor')} style={{ flex: 1, padding: '15px', background: gameType === 'splendor' ? '#2196F3' : '#e0e0e0', color: gameType === 'splendor' ? 'white' : 'black', border: 'none', borderRadius: '5px', fontSize: '1.1em', cursor: 'pointer', fontWeight: 'bold' }}>💎 宝石の煌き</button>
                <button onClick={() => setGameType('ito')} style={{ flex: 1, padding: '15px', background: gameType === 'ito' ? '#ff9800' : '#e0e0e0', color: gameType === 'ito' ? 'white' : 'black', border: 'none', borderRadius: '5px', fontSize: '1.1em', cursor: 'pointer', fontWeight: 'bold' }}>🧵 ITO</button>
              </div>
            </div>

            {gameType === 'ito' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>お題の出題方法</label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="radio" name="themeMode" value="random" checked={themeMode === 'random'} onChange={() => setThemeMode('random')} style={{ marginRight: '5px' }} />
                    自動出題 (ランダム)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="radio" name="themeMode" value="manual" checked={themeMode === 'manual'} onChange={() => setThemeMode('manual')} style={{ marginRight: '5px' }} />
                    手動入力 (みんなで決める)
                  </label>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>プレイ人数</label>
              <select value={numPlayers} onChange={e => setNumPlayers(Number(e.target.value))} style={{ width: '100%', padding: '10px', fontSize: '1.2em' }}>
                {gameType === 'ito' 
                  ? [2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}人</option>) 
                  : [2,3,4].map(n => <option key={n} value={n}>{n}人</option>)}
              </select>
            </div>
            <button onClick={createAndJoinMatch} style={{ width: '100%', padding: '15px', fontSize: '1.2em', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>
              部屋を作成する
            </button>

            {gameType === 'ito' && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <button onClick={() => setShowThemeManager(!showThemeManager)} style={{ width: '100%', padding: '10px', fontSize: '1em', cursor: 'pointer', background: '#f5f5f5', color: '#333', border: '1px solid #ccc', borderRadius: '5px' }}>
                  {showThemeManager ? '▲ お題の管理を閉じる' : '▼ オリジナルのお題を管理する'}
                </button>
                
                {showThemeManager && (
                  <div style={{ marginTop: '15px', background: '#fafafa', padding: '15px', borderRadius: '5px', border: '1px solid #ddd' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>追加されたオリジナルお題 ({customThemes.length})</h4>
                    
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                      <input 
                        type="text" 
                        value={newTheme} 
                        onChange={e => setNewTheme(e.target.value)} 
                        placeholder="新しいお題を入力" 
                        style={{ flex: 1, padding: '8px', boxSizing: 'border-box' }}
                      />
                      <button onClick={handleAddTheme} style={{ padding: '8px 15px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>追加</button>
                    </div>

                    {customThemes.length === 0 ? (
                      <div style={{ fontSize: '0.9em', color: '#888' }}>追加されたお題はありません。</div>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '150px', overflowY: 'auto' }}>
                        {customThemes.map((t, idx) => (
                          <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #eee' }}>
                            <span style={{ fontSize: '0.9em' }}>{t}</span>
                            <button onClick={() => handleRemoveTheme(idx)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8em' }}>削除</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <button onClick={joinExistingMatch} style={{ width: '100%', padding: '15px', fontSize: '1.2em', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>
            部屋に参加する
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
