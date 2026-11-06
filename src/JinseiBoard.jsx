// JinseiBoard.jsx - 47都道府県 ご当地人生ゲームの盤面コンポーネント
// 通常モード ＋ 隠しリアルハードモード（親ガチャ・偏差値・学歴フィルター）対応
import React, { useState } from 'react';
import { UnifiedLobby } from './UnifiedLobby';
import { PREFECTURES, REGIONS } from './data/prefecturesData';
import { BOARD_SPACES, HOUSES, OCCUPATIONS } from './JinseiGame';

export const JinseiBoard = ({ G, ctx, moves, playerID, matchData }) => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isSpinningLocal, setIsSpinningLocal] = useState(false);
  const [spinDegree, setSpinDegree] = useState(0);

  const pid = playerID || '0';
  const myPlayer = G.players[pid] || G.players['0'];
  const isMyTurn = ctx.currentPlayer === pid;

  // プレイヤー名取得
  const getPlayerName = (id) => {
    const p = matchData?.find((m) => m.id == id);
    return p && p.name ? p.name : `Player ${id}`;
  };

  // ルーレット回転アニメーション
  const handleSpinRoulette = () => {
    if (!isMyTurn || G.turnStep !== 'spin' || isSpinningLocal || myPlayer.isGoal) return;
    setIsSpinningLocal(true);

    const randomDegrees = 1440 + Math.floor(Math.random() * 360);
    setSpinDegree((prev) => prev + randomDegrees);

    setTimeout(() => {
      moves.spinRoulette(pid);
      setIsSpinningLocal(false);
    }, 1200);
  };

  // ==========================================
  // 1. 待機ロビー (部屋作成時〜開始前)
  // ==========================================
  const numPlayers = ctx.numPlayers;
  const playerIds = Object.keys(G.players);

  const isLobbyWaiting = ctx.phase === 'lobby' || (G.gameState === 'lobby');
  if (isLobbyWaiting) {
    return (
      <UnifiedLobby
        gameTitle="47都道府県 ご当地人生ゲーム"
        gameIcon="🚗"
        gameSubtitle="生まれ故郷の絆を胸に、億万長者を目指す日本列島ライフすごろく！"
        themeColor={G.isHardMode ? '#dc2626' : '#10b981'}
        themeGradient={G.isHardMode ? 'linear-gradient(135deg, #7f1d1d, #b91c1c)' : 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'}
        numPlayers={numPlayers}
        playerIds={playerIds}
        pid={pid}
        getPlayerName={getPlayerName}
        isHost={pid === '0'}
        hostOnlyStart={true}
        onStart={() => moves.restartGame()}
        startText={G.isHardMode ? '💀 ハードモードで人生をスタート！' : '🚀 人生をスタートする！'}
      >
        <div style={{ margin: '14px 0', textAlign: 'center' }}>
          <button
            onClick={() => moves.toggleHardMode()}
            style={{
              padding: '10px 22px',
              borderRadius: '20px',
              border: G.isHardMode ? '2px solid #f87171' : '1px solid rgba(255,255,255,0.25)',
              background: G.isHardMode ? 'linear-gradient(135deg, #991b1b, #7f1d1d)' : 'rgba(0,0,0,0.3)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: G.isHardMode ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {G.isHardMode ? (
              <>
                <span>💀</span>
                <span>【隠しモード】リアル格差社会ハードモード稼働中（親ガチャ・学歴）</span>
                <span style={{ fontSize: '10px', background: '#dc2626', padding: '2px 6px', borderRadius: '4px' }}>ON</span>
              </>
            ) : (
              <>
                <span>🌱</span>
                <span>通常モード（クリックで 💀 リアル格差ハードモード に切替）</span>
              </>
            )}
          </button>
        </div>
      </UnifiedLobby>
    );
  }

  // ==========================================
  // 2. 出身都道府県選択フェーズ
  // ==========================================
  if (G.gameState === 'select_prefecture') {
    const filteredPrefectures = selectedRegion === 'all'
      ? PREFECTURES
      : PREFECTURES.filter((p) => p.region === selectedRegion);

    return (
      <div style={{
        maxWidth: '940px',
        margin: '20px auto',
        padding: '24px 20px',
        background: G.isHardMode
          ? 'linear-gradient(145deg, #450a0a 0%, #7f1d1d 50%, #2e0808 100%)'
          : 'linear-gradient(145deg, #064e3b 0%, #065f46 50%, #022c22 100%)',
        borderRadius: '24px',
        color: '#ffffff',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        border: G.isHardMode ? '3px solid #ef4444' : '3px solid #10b981',
        fontFamily: "'Segoe UI', sans-serif"
      }}>
        {/* モード切替トグルスイッチ */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <button
            onClick={() => moves.toggleHardMode()}
            style={{
              padding: '8px 22px',
              borderRadius: '20px',
              border: G.isHardMode ? '2px solid #f87171' : '1px solid rgba(255,255,255,0.25)',
              background: G.isHardMode ? 'linear-gradient(135deg, #991b1b, #7f1d1d)' : 'rgba(0,0,0,0.4)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: G.isHardMode ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {G.isHardMode ? (
              <>
                <span>💀</span>
                <span>【隠しモード】リアル格差社会ハードモード（親ガチャ・学歴フィルター発動！）</span>
                <span style={{ fontSize: '10px', background: '#dc2626', padding: '2px 6px', borderRadius: '4px' }}>ON</span>
              </>
            ) : (
              <>
                <span>🌱</span>
                <span>通常モード（クリックで 💀 リアル格差ハードモード に切替）</span>
              </>
            )}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: G.isHardMode ? '#fca5a5' : '#6ee7b7', letterSpacing: '1.5px' }}>
            🗾 JINSEI GAME 47 • BIRTHPLACE SELECTION
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '6px 0', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            出身都道府県を選択してください！
          </h2>
          <p style={{ fontSize: '14px', color: G.isHardMode ? '#fecaca' : '#a7f3d0', margin: 0 }}>
            {G.isHardMode
              ? '【ハードモード】親の年収（親ガチャ）がルーレットで決まり、偏差値に応じて応募できる職業が制限されます！'
              : '各県独自の「パッシブスキル」「ご当地特産品」「帰省イベント」があなたの人生を左右します！'}
          </p>
        </div>

        {/* 地方フィルタータブ */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => setSelectedRegion('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: selectedRegion === 'all' ? '2px solid #fde047' : '1px solid rgba(255,255,255,0.2)',
              background: selectedRegion === 'all' ? (G.isHardMode ? '#dc2626' : '#10b981') : 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            🗾 全て (47)
          </button>
          {REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRegion(r.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: selectedRegion === r.id ? '2px solid #fde047' : '1px solid rgba(255,255,255,0.2)',
                background: selectedRegion === r.id ? r.color : 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {r.name}
            </button>
          ))}
        </div>

        {/* 都道府県カード一覧グリッド */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '14px',
          maxHeight: '460px',
          overflowY: 'auto',
          padding: '8px'
        }}>
          {filteredPrefectures.map((p) => {
            const isSelectedByMe = myPlayer.prefecture?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => moves.choosePrefecture(pid, p.id)}
                style={{
                  background: isSelectedByMe ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.08)',
                  border: isSelectedByMe ? '2px solid #fde047' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelectedByMe ? '0 8px 24px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{p.emoji}</span>
                    <strong style={{ fontSize: '17px', color: '#ffffff' }}>{p.name}</strong>
                  </div>
                  <span style={{ fontSize: '11px', background: p.color, padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {p.regionName}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#fde047', fontWeight: 'bold', marginBottom: '4px' }}>
                  ✨ 【{p.traitName}】
                </div>
                <div style={{ fontSize: '11px', color: '#d1fae5', lineHeight: 1.4, marginBottom: '8px' }}>
                  {p.traitDesc}
                </div>

                <div style={{ fontSize: '11px', color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                  🎁 初期特産品: <strong>{p.souvenir.name}</strong> ({p.souvenir.value}万円相当)
                </div>
              </div>
            );
          })}
        </div>

        {/* プレイヤーの選択状況 */}
        <div style={{ marginTop: '20px', padding: '14px 20px', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#6ee7b7' }}>各プレイヤーの状況:</span>
            {Object.values(G.players).map((p) => (
              <span key={p.id} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                {getPlayerName(p.id)}: <strong>{p.prefecture ? `${p.prefecture.emoji} ${p.prefecture.name}` : '選考中...'}</strong>
                {G.isHardMode && p.parentIncome && ` (親年収${p.parentIncome.income}万/偏差値${p.hensachi})`}
              </span>
            ))}
          </div>
          {myPlayer.prefecture && (
            <div style={{ color: '#fde047', fontSize: '13px', fontWeight: 'bold' }}>
              ✓ あなたは【{myPlayer.prefecture.name}】を選択済み
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. ゲームオーバー＆最終決算画面
  // ==========================================
  if (G.gameState === 'game_over') {
    return (
      <div style={{
        maxWidth: '880px',
        margin: '20px auto',
        padding: '30px 24px',
        background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 60%, #1e1b4b 100%)',
        borderRadius: '24px',
        color: '#ffffff',
        border: '3px solid #fbbf24',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        textAlign: 'center',
        fontFamily: "'Segoe UI', sans-serif"
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏆</div>
        <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 10px', color: '#fbbf24' }}>
          🎉 全員ゴール！ 最終決算発表！
        </h2>
        <p style={{ color: '#c7d2fe', fontSize: '15px', marginBottom: '28px' }}>
          現金・不動産売却益・家族ピン・全国特産品コレクションを合算した最終総資産No.1が決定！
        </p>

        {/* 決算ランキング表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '30px' }}>
          {G.ranking?.map((p, idx) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderRadius: '16px',
                background: idx === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.08)',
                border: idx === 0 ? '2px solid #fef08a' : '1px solid rgba(255,255,255,0.15)',
                color: idx === 0 ? '#ffffff' : '#e0e7ff',
                boxShadow: idx === 0 ? '0 10px 30px rgba(245, 158, 11, 0.4)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '26px', fontWeight: '900' }}>
                  {idx === 0 ? '🥇 1位' : idx === 1 ? '🥈 2位' : idx === 2 ? '🥉 3位' : `${idx + 1}位`}
                </span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '18px', fontWeight: '900' }}>
                    {getPlayerName(p.id)} ({p.prefecture?.emoji} {p.prefecture?.name})
                  </div>
                  {G.isHardMode && p.parentIncome && (
                    <div style={{ fontSize: '11px', color: '#fde047', fontWeight: 'bold', margin: '2px 0' }}>
                      親年収: {p.parentIncome.income}万円 ({p.parentIncome.title}) ➔ 偏差値【{p.hensachi}】
                      {p.parentIncome.roll <= 3 && idx === 0 && ' 🔥【下剋上キング賞獲得！】'}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', opacity: 0.85 }}>
                    現金: {p.money}万 • 不動産: {p.house ? p.house.name : 'なし'} • 家族: {p.car.spouse ? '配偶者あり' : '独身'} (子供{p.car.kids}人)
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>最終総資産</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: idx === 0 ? '#ffffff' : '#fbbf24' }}>
                  {p.finalAsset?.toLocaleString()} 万円
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => moves.restartGame()}
          style={{
            padding: '16px 40px',
            fontSize: '18px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
          }}
        >
          🔄 もう一度人生をやり直す（リスタート）
        </button>
      </div>
    );
  }

  // ==========================================
  // 4. メインすごろく盤面
  // ==========================================
  return (
    <div style={{
      maxWidth: '1060px',
      margin: '16px auto',
      padding: '0 12px',
      fontFamily: "'Segoe UI', -apple-system, sans-serif"
    }}>
      <style>{`
        @keyframes roulettePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes carBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>

      {/* ハードモードバナー（発動時） */}
      {G.isHardMode && (
        <div style={{
          background: 'linear-gradient(90deg, #7f1d1d, #991b1b, #7f1d1d)',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '6px 16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fee2e2',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 2px 10px rgba(220, 38, 38, 0.3)'
        }}>
          <span>💀 【隠しモード】リアル格差社会ハードモード稼働中（親ガチャ ➔ 偏差値 ➔ 学歴フィルター）</span>
          <span style={{ fontSize: '11px', color: '#fde047' }}>下剋上で親ガチャの壁を打ち破れ！</span>
        </div>
      )}

      {/* DASHBOARD: 各プレイヤーのステータスパネル */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Object.keys(G.players).length}, 1fr)`,
        gap: '12px',
        marginBottom: '16px'
      }}>
        {Object.values(G.players).map((p) => {
          const isCurrent = ctx.currentPlayer === p.id;
          return (
            <div
              key={p.id}
              style={{
                background: isCurrent ? 'linear-gradient(135deg, #065f46, #047857)' : 'rgba(15, 23, 42, 0.85)',
                border: isCurrent ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '16px',
                padding: '12px 14px',
                color: '#ffffff',
                boxShadow: isCurrent ? '0 8px 20px rgba(52, 211, 153, 0.3)' : 'none',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: p.color }}>
                  {getPlayerName(p.id)} {isCurrent && '🎯'}
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                  {p.prefecture?.emoji} {p.prefecture?.shortName}
                </span>
              </div>

              {/* 所持金 */}
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#fde047', marginBottom: '4px' }}>
                {p.money.toLocaleString()} <span style={{ fontSize: '12px', color: '#fff' }}>万円</span>
              </div>

              {/* ハードモード情報（親の年収・偏差値） */}
              {G.isHardMode && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  color: '#fca5a5',
                  marginBottom: '6px',
                  lineHeight: 1.4
                }}>
                  <div>👨‍👩‍👦 実家年収: <strong>{p.parentIncome ? `${p.parentIncome.income}万` : '未定'}</strong></div>
                  <div>🎓 偏差値: <strong style={{ color: '#fde047', fontSize: '11px' }}>【{p.hensachi || 50}】</strong></div>
                </div>
              )}

              {/* 職業＆マイホーム */}
              <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                <div>💼 {p.occupation ? p.occupation.title : '無職（求職中）'}</div>
                <div>🏡 {p.house ? p.house.name : '賃貸住まい'}</div>
              </div>

              {/* 車とピンのビジュアル */}
              <div style={{
                marginTop: '8px',
                padding: '4px 8px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px'
              }}>
                <span>🚗 コマ:</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span title="ドライバー（本人）">🔵</span>
                  {p.car.spouse ? <span title="配偶者ピン">🔴</span> : <span style={{ opacity: 0.3 }}>⚪</span>}
                  {Array.from({ length: p.car.kids }).map((_, i) => (
                    <span key={i} title="子供ピン">👶</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ROULETTE & CONTROLS SECTION */}
      <div style={{
        background: 'linear-gradient(145deg, #111827 0%, #1f2937 100%)',
        borderRadius: '20px',
        padding: '20px',
        border: '2px solid rgba(255,255,255,0.1)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        {/* ルーレット本体 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative', width: '110px', height: '110px' }}>
            {/* ルーレットの盤面円盤 */}
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'conic-gradient(#ef4444 0% 10%, #f97316 10% 20%, #f59e0b 20% 30%, #10b981 30% 40%, #06b6d4 40% 50%, #3b82f6 50% 60%, #6366f1 60% 70%, #8b5cf6 70% 80%, #ec4899 80% 90%, #f43f5e 90% 100%)',
              border: '5px solid #ffffff',
              boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
              transform: `rotate(${spinDegree}deg)`,
              transition: isSpinningLocal ? 'transform 1.2s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '18px',
                color: '#1f2937'
              }}>
                {G.rouletteValue !== null ? G.rouletteValue : '🎡'}
              </div>
            </div>
            {/* ルーレットの針（ポインター） */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '18px solid #fbbf24',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
            }} />
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold' }}>
              CURRENT TURN (現在の手番)
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>
              {getPlayerName(ctx.currentPlayer)} のターン
            </div>
            <div style={{ fontSize: '13px', color: '#34d399' }}>
              {isMyTurn ? '👉 あなたの番です！ルーレットを回してください！' : '⏳ 相手の行動を待っています...'}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isMyTurn && G.turnStep === 'spin' && (
            <button
              onClick={handleSpinRoulette}
              disabled={isSpinningLocal || myPlayer.isGoal}
              style={{
                padding: '16px 36px',
                fontSize: '18px',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                transition: 'all 0.15s'
              }}
            >
              🎡 ルーレットを回す！
            </button>
          )}

          {isMyTurn && G.turnStep === 'resolve_space' && !G.currentSpaceModal && (
            <button
              onClick={() => moves.endTurn()}
              style={{
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer'
              }}
            >
              次へ進む（ターン終了）
            </button>
          )}
        </div>
      </div>

      {/* EVENT MODALS: 分岐選択・マイホーム購入・職業選択モーダル */}
      {isMyTurn && G.currentSpaceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            border: G.isHardMode ? '2px solid #ef4444' : '2px solid #38bdf8',
            borderRadius: '24px',
            padding: '26px',
            maxWidth: '580px',
            width: '100%',
            color: '#ffffff',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <h3 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 10px', color: G.isHardMode ? '#f87171' : '#38bdf8' }}>
              📍 {G.currentSpaceModal.title}
            </h3>
            <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '20px' }}>
              {G.currentSpaceModal.desc}
            </p>

            {/* 職業選択（通常モード または ハードモード学歴フィルター） */}
            {G.currentSpaceModal.type === 'choose_job' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                {OCCUPATIONS.map((occ) => {
                  const myHensachi = myPlayer.hensachi || 50;
                  const isQualified = !G.isHardMode || myHensachi >= occ.minHensachi;

                  return (
                    <div
                      key={occ.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isQualified ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.4)',
                        border: isQualified ? '1px solid rgba(255,255,255,0.2)' : '1px dashed #64748b',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>{occ.icon}</span>
                          <strong style={{ fontSize: '15px', color: isQualified ? '#ffffff' : '#94a3b8' }}>
                            {occ.title}
                          </strong>
                          {G.isHardMode && occ.minHensachi > 0 && (
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: isQualified ? '#15803d' : '#991b1b',
                              color: '#fff',
                              fontWeight: 'bold'
                            }}>
                              要偏差値: {occ.minHensachi}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          給料: {occ.baseSalary}万円 • {occ.tierDesc}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {isQualified ? (
                          <button
                            onClick={() => moves.chooseJob(pid, occ.id, false)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#fff',
                              border: 'none',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            応募する（内定）
                          </button>
                        ) : (
                          <button
                            onClick={() => moves.chooseJob(pid, occ.id, true)}
                            title="ルーレット出目9以上で奇跡のコネ採用！失敗すると浪人費用-40万円"
                            style={{
                              padding: '8px 12px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                              color: '#fff',
                              border: 'none',
                              fontWeight: 'bold',
                              fontSize: '11px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)'
                            }}
                          >
                            🔥 逆転面接に挑む！
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 進路分岐選択 */}
            {G.currentSpaceModal.type === 'branch_career' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => moves.chooseRoute(pid, 'tokyo')}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  🏙️ 大都会コースに進む（高収入・高支出・IT起業）
                </button>
                <button
                  onClick={() => moves.chooseRoute(pid, 'local')}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  🌾 地元就職コースに進む（公務員・伝統・生活費節約）
                </button>
              </div>
            )}

            {/* マイホーム購入選択 */}
            {G.currentSpaceModal.type === 'buy_house' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {HOUSES.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => moves.chooseHouse(pid, h.id)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{h.icon} {h.name}</span>
                    <strong style={{ color: '#fde047' }}>{h.price}万円</strong>
                  </button>
                ))}
                <button
                  onClick={() => moves.chooseHouse(pid, null)}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #475569',
                    cursor: 'pointer',
                    marginTop: '6px'
                  }}
                >
                  今は購入しない（パス）
                </button>
              </div>
            )}

            {/* 通常マス情報 */}
            {!['branch_career', 'buy_house', 'choose_job'].includes(G.currentSpaceModal.type) && (
              <button
                onClick={() => moves.endTurn()}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                了解（手番を終了する）
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3D BOARD GAME MAP (人生すごろくコースマップ) */}
      <div style={{
        background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '24px',
        padding: '24px',
        border: '2px solid rgba(255,255,255,0.15)',
        boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
          <span>🗺️ 人生すごろくコースマップ（全45マス）</span>
          <span>🟢 幼少期 ➔ 🏙️ 就職 ➔ 💍 結婚・家族 ➔ 📦 帰省・ミドル ➔ 🏁 ゴール</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '10px'
        }}>
          {BOARD_SPACES.map((space) => {
            const playersHere = Object.values(G.players).filter((p) => p.position === space.id);

            let bgColor = 'rgba(255,255,255,0.06)';
            let borderColor = 'rgba(255,255,255,0.15)';
            if (space.id <= 6) {
              borderColor = '#10b981';
            } else if (space.route === 'tokyo') {
              borderColor = '#3b82f6';
            } else if (space.route === 'local') {
              borderColor = '#059669';
            } else if (space.id >= 21 && space.id <= 28) {
              borderColor = '#ec4899';
            } else if (space.id >= 29 && space.id <= 36) {
              borderColor = '#8b5cf6';
            } else {
              borderColor = '#f59e0b';
            }

            return (
              <div
                key={space.id}
                style={{
                  background: bgColor,
                  border: `2px solid ${borderColor}`,
                  borderRadius: '12px',
                  padding: '8px',
                  minHeight: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                    <span>#{space.id}</span>
                    {space.stop && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>STOP</span>}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginTop: '2px' }}>
                    {space.title}
                  </div>
                </div>

                {/* マス上の車（プレイヤーコマ） */}
                {playersHere.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {playersHere.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: p.color,
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: '#fff',
                          animation: 'carBounce 2s infinite ease-in-out'
                        }}
                      >
                        🚗 P{p.id}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* EVENT LOGS */}
      <div style={{
        background: 'rgba(0,0,0,0.4)',
        borderRadius: '14px',
        padding: '14px 18px',
        fontSize: '12px',
        color: '#cbd5e1',
        maxHeight: '120px',
        overflowY: 'auto'
      }}>
        <div style={{ fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}>📜 人生イベントログ:</div>
        {G.logs.map((log, idx) => (
          <div key={idx} style={{ marginBottom: '3px' }}>{log}</div>
        ))}
      </div>
    </div>
  );
};
