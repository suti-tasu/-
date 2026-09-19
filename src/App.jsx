import React, { useState, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { LobbyClient } from 'boardgame.io/client';
import { Splendor } from './Game';
import { SplendorBoard } from './Board';

const server = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
const lobbyClient = new LobbyClient({ server });

const SplendorClient = Client({
  game: Splendor,
  board: SplendorBoard,
  multiplayer: SocketIO({ server }),
  debug: false
});

const App = () => {
  const [matchID, setMatchID] = useState(null);
  const [playerID, setPlayerID] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [numPlayers, setNumPlayers] = useState(2);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mID = params.get('match');
    if (mID) {
      setMatchID(mID);
      const saved = localStorage.getItem('splendor_match_' + mID);
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

  const saveCredentials = (mID, pID, creds, pName) => {
    localStorage.setItem('splendor_match_' + mID, JSON.stringify({ pID, creds, pName }));
  };

  const createAndJoinMatch = async () => {
    if (!playerName) return setError('名前を入力してください');
    setError('');
    try {
      const { matchID: newMatchID } = await lobbyClient.createMatch('splendor', { numPlayers });
      const { playerID: newPlayerID, playerCredentials } = await lobbyClient.joinMatch('splendor', newMatchID, {
        playerName: playerName
      });
      
      window.history.pushState({}, '', '?match=' + newMatchID);
      setMatchID(newMatchID);
      setPlayerID(newPlayerID);
      setCredentials(playerCredentials);
      saveCredentials(newMatchID, newPlayerID, playerCredentials, playerName);
    } catch (e) {
      setError('部屋の作成に失敗しました: ' + e.message);
    }
  };

  const joinExistingMatch = async () => {
    if (!playerName) return setError('名前を入力してください');
    setError('');
    try {
      // 誰が空いているか探してJoinする（簡略化のため0から順に試す）
      const match = await lobbyClient.getMatch('splendor', matchID);
      const availablePlayer = match.players.find(p => !p.name);
      
      if (!availablePlayer) {
        return setError('部屋が満員です');
      }

      const { playerID: newPlayerID, playerCredentials } = await lobbyClient.joinMatch('splendor', matchID, {
        playerID: availablePlayer.id.toString(),
        playerName: playerName
      });

      setPlayerID(newPlayerID);
      setCredentials(playerCredentials);
      saveCredentials(matchID, newPlayerID, playerCredentials, playerName);
    } catch (e) {
      setError('参加に失敗しました: ' + e.message);
    }
  };

  const leaveMatch = () => {
    if(matchID) localStorage.removeItem('splendor_match_' + matchID);
    setPlayerID(null);
    setCredentials(null);
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
        <SplendorClient matchID={matchID} playerID={playerID} credentials={credentials} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#f5f5f5' }}>
      <h1 style={{ fontSize: '3em', color: '#333' }}>Splendor Online</h1>
      
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '400px' }}>
        {error && <div style={{ color: 'red', marginBottom: '15px', fontWeight: 'bold' }}>{error}</div>}
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>プレイヤー名</label>
          <input 
            type="text" 
            value={playerName} 
            onChange={e => setPlayerName(e.target.value)} 
            placeholder="あなたの名前"
            style={{ width: '100%', padding: '10px', fontSize: '1.2em', boxSizing: 'border-box' }}
          />
        </div>

        {!matchID ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>プレイ人数</label>
              <select value={numPlayers} onChange={e => setNumPlayers(Number(e.target.value))} style={{ width: '100%', padding: '10px', fontSize: '1.2em' }}>
                <option value={2}>2人</option>
                <option value={3}>3人</option>
                <option value={4}>4人</option>
              </select>
            </div>
            <button onClick={createAndJoinMatch} style={{ width: '100%', padding: '15px', fontSize: '1.2em', cursor: 'pointer', background: '#2196F3', color: 'white', border: 'none', borderRadius: '5px' }}>
              部屋を作成する
            </button>
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
