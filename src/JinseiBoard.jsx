// JinseiBoard.jsx - 47都道府県 ご当地人生ゲームの盤面コンポーネント
// 通常モード ＋ 隠しリアルハードモード（親ガチャ・偏差値・学歴フィルター）対応
import React, { useState, useEffect } from 'react';
import { UnifiedLobby } from './UnifiedLobby';
import { PREFECTURES, REGIONS, getPrefectureById } from './data/prefecturesData';
import { LIFE_ERAS, getEraById, getSpaceMoneyDetails } from './data/lifeErasData';
import { BOARD_SPACES, HOUSES, OCCUPATIONS, JOB_ROULETTE_TABLE } from './JinseiGame';

export const JinseiBoard = ({ G, ctx, moves, playerID, matchData }) => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isSpinningLocal, setIsSpinningLocal] = useState(false);
  const [spinDegree, setSpinDegree] = useState(0);
  const [hoveredSpace, setHoveredSpace] = useState(null);
  const [viewEraId, setViewEraId] = useState(G.era || 1);

  useEffect(() => {
    if (G.era) {
      setViewEraId(G.era);
    }
  }, [G.era]);

  const [isSpinningJob, setIsSpinningJob] = useState(false);
  const [tempJobRoll, setTempJobRoll] = useState(null);
  const [isSpectatorDismissed, setIsSpectatorDismissed] = useState(false);

  useEffect(() => {
    setIsSpectatorDismissed(false);
  }, [G.currentSpaceModal?.spaceId, G.currentSpaceModal?.type, G.turnStep]);

  const pid = playerID || '0';
  const myPlayer = G.players[pid] || G.players['0'];
  const isMyTurn = ctx.currentPlayer === pid;

  // 出身地選択フェーズ用のプレビュー状態（初期値は決定済み都道府県、未決定なら東京）
  const [previewPrefId, setPreviewPrefId] = useState(() => myPlayer?.prefecture?.id || 'tokyo');
  const [isRollingRandom, setIsRollingRandom] = useState(false);
  const [gachaShuffleName, setGachaShuffleName] = useState('');
  const [randomNotice, setRandomNotice] = useState('');

  // プレイヤー名取得
  const getPlayerName = (id) => {
    const p = matchData?.find((m) => m.id == id);
    return p && p.name ? p.name : `Player ${id}`;
  };

  // 通常モード：おまかせランダム（プレビュー選出）
  const handleRollRandomPreview = () => {
    if (isRollingRandom) return;
    setIsRollingRandom(true);
    setRandomNotice('');

    let count = 0;
    const interval = setInterval(() => {
      const randPref = PREFECTURES[Math.floor(Math.random() * PREFECTURES.length)];
      setGachaShuffleName(`${randPref.emoji} ${randPref.name}`);
      count++;
      if (count > 9) {
        clearInterval(interval);
        const finalPref = PREFECTURES[Math.floor(Math.random() * PREFECTURES.length)];
        setPreviewPrefId(finalPref.id);
        setIsRollingRandom(false);
        setGachaShuffleName('');
        setRandomNotice(`🎲 ランダム選出: 【${finalPref.name}】が選ばれました！気に入ったら「決定する」を押してください。`);
      }
    }, 60);
  };

  // 通常モード：ランダム即時決定
  const handleRollRandomImmediate = () => {
    if (isRollingRandom) return;
    setIsRollingRandom(true);
    let count = 0;
    const interval = setInterval(() => {
      const randPref = PREFECTURES[Math.floor(Math.random() * PREFECTURES.length)];
      setGachaShuffleName(`${randPref.emoji} ${randPref.name}`);
      count++;
      if (count > 10) {
        clearInterval(interval);
        moves.choosePrefectureRandom(pid);
        setIsRollingRandom(false);
        setGachaShuffleName('');
        setRandomNotice('');
      }
    }, 60);
  };

  // ハードモード：運命の出生地ガチャ（完全強制ランダム）
  const handleTriggerHardModeGacha = () => {
    if (isRollingRandom || myPlayer.prefecture) return;
    setIsRollingRandom(true);
    let count = 0;
    const interval = setInterval(() => {
      const randPref = PREFECTURES[Math.floor(Math.random() * PREFECTURES.length)];
      setGachaShuffleName(`${randPref.emoji} ${randPref.name}`);
      count++;
      if (count > 14) {
        clearInterval(interval);
        moves.choosePrefectureRandom(pid);
        setIsRollingRandom(false);
        setGachaShuffleName('');
      }
    }, 60);
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
        onStart={() => (moves.startGame ? moves.startGame() : moves.restartGame())}
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

    // 現在プレビュー選択中の都道府県
    const currentPreviewPref = getPrefectureById(previewPrefId) || filteredPrefectures[0] || PREFECTURES[0];
    const isCurrentConfirmed = myPlayer.prefecture?.id === currentPreviewPref.id;
    const confirmedCount = Object.values(G.players).filter((p) => p.prefecture !== null).length;
    const totalCount = Object.keys(G.players).length;

    return (
      <div style={{
        maxWidth: '960px',
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

        {/* ========================================================
            CASE A: ハードモード（出生地は完全強制ランダムガチャ）
           ======================================================== */}
        {G.isHardMode ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fca5a5', letterSpacing: '1.5px' }}>
                💀 JINSEI GAME 47 • REAL HARD MODE
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '6px 0', textShadow: '0 2px 8px rgba(0,0,0,0.4)', color: '#fef08a' }}>
                運命の出生地ガチャ（人は生まれ故郷を選べない…）
              </h2>
              <p style={{ fontSize: '14px', color: '#fecaca', margin: 0, lineHeight: 1.5 }}>
                ハードモードは<strong>【強制ランダム】</strong>です！<br />
                日本のどこに産み落とされるか、そして実家の年収・初期偏差値まで、すべては神のみぞ知る運命のガチャで決まります！
              </p>
            </div>

            {/* 未決定の場合：ガチャを引くボックス */}
            {!myPlayer.prefecture ? (
              <div style={{
                padding: '28px 24px',
                background: 'linear-gradient(135deg, rgba(69, 10, 10, 0.95), rgba(127, 29, 29, 0.95))',
                border: '3px solid #ef4444',
                borderRadius: '24px',
                boxShadow: '0 15px 40px rgba(239, 68, 68, 0.45)',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '54px', marginBottom: '8px' }}>
                  {isRollingRandom ? '🎰' : '🎲'}
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#fef08a', margin: '0 0 10px' }}>
                  {isRollingRandom ? `運命の抽選中: ${gachaShuffleName}` : '出生地ガチャを引いて人生をスタートせよ！'}
                </h3>
                <p style={{ color: '#fecaca', fontSize: '14px', maxWidth: '580px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                  ボタンを押すと、47都道府県からあなたの生まれ故郷が強制決定されます。<br />
                  親の年収（親ガチャ）と初期偏差値も同時にルーレットで決定されます！（※再選択不可）
                </p>
                <button
                  disabled={isRollingRandom}
                  onClick={handleTriggerHardModeGacha}
                  style={{
                    padding: '16px 40px',
                    fontSize: '18px',
                    fontWeight: '900',
                    borderRadius: '20px',
                    border: '3px solid #fde047',
                    background: isRollingRandom
                      ? '#7f1d1d'
                      : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
                    color: '#ffffff',
                    cursor: isRollingRandom ? 'wait' : 'pointer',
                    boxShadow: '0 8px 30px rgba(220, 38, 38, 0.7)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    transform: isRollingRandom ? 'scale(0.98)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{isRollingRandom ? '🎰' : '💀'}</span>
                  <span>{isRollingRandom ? '運命の出生地を抽選中…！' : '運命の出生地ガチャを回す！（強制ランダム）'}</span>
                </button>
              </div>
            ) : (
              /* 決定済みの場合：確定ステータス表示 */
              <div style={{
                padding: '22px 26px',
                background: 'linear-gradient(135deg, rgba(69, 10, 10, 0.95), rgba(46, 8, 8, 0.95))',
                border: '2px solid #ef4444',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      fontSize: '44px',
                      width: '68px',
                      height: '68px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #ef4444',
                      flexShrink: 0
                    }}>
                      {myPlayer.prefecture.emoji}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>
                          {myPlayer.prefecture.name}
                        </span>
                        <span style={{ fontSize: '11px', background: myPlayer.prefecture.color, padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                          {myPlayer.prefecture.regionName}
                        </span>
                        <span style={{ fontSize: '11px', background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: '900' }}>
                          🔒 運命確定（出生地ガチャ済）
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#fde047', fontWeight: 'bold', marginTop: '4px' }}>
                        ✨ 【{myPlayer.prefecture.traitName}】 {myPlayer.prefecture.traitDesc}
                      </div>
                      {myPlayer.parentIncome && (
                        <div style={{ fontSize: '13px', color: '#fca5a5', fontWeight: 'bold', marginTop: '3px' }}>
                          💀 親ガチャ結果: 実家年収 {myPlayer.parentIncome.income}万円（${myPlayer.parentIncome.title}）➔ 初期偏差値【${myPlayer.hensachi}】
                          {myPlayer.debt > 0 && '（※奨学金借金100万スタート）'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ color: '#34d399', fontSize: '14px', fontWeight: 'bold', background: 'rgba(0,0,0,0.35)', padding: '10px 18px', borderRadius: '12px', border: '1px solid #10b981' }}>
                    ✓ 誕生確定！他のプレイヤーをお待ちください…
                  </div>
                </div>
              </div>
            )}

            {/* ハードモード時の都道府県カタログ（閲覧専用） */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: '#fca5a5', fontWeight: 'bold' }}>
                  📖 日本全国47都道府県 データ図鑑（※ハードモード中は強制ランダムのため閲覧専用）
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '12px',
                maxHeight: '340px',
                overflowY: 'auto',
                padding: '8px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '16px'
              }}>
                {PREFECTURES.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: myPlayer.prefecture?.id === p.id ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.05)',
                      border: myPlayer.prefecture?.id === p.id ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '14px',
                      padding: '12px',
                      opacity: myPlayer.prefecture?.id === p.id ? 1 : 0.75
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '20px' }}>{p.emoji}</span>
                        <strong style={{ fontSize: '15px', color: '#ffffff' }}>{p.name}</strong>
                      </div>
                      <span style={{ fontSize: '10px', background: p.color, padding: '2px 6px', borderRadius: '8px', fontWeight: 'bold' }}>
                        {p.regionName}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#fde047', fontWeight: 'bold', marginBottom: '2px' }}>
                      ✨ 【{p.traitName}】
                    </div>
                    <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.3 }}>
                      {p.traitDesc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
              CASE B: 通常モード（自由選択 ＋ おまかせランダム）
             ======================================================== */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#6ee7b7', letterSpacing: '1.5px' }}>
                🗾 JINSEI GAME 47 • BIRTHPLACE SELECTION
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '6px 0', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                出身都道府県を選択して決定してください！
              </h2>
              <p style={{ fontSize: '14px', color: '#a7f3d0', margin: 0 }}>
                各県独自の「パッシブスキル」「ご当地特産品」「帰省イベント」があなたの人生を左右します！<br />
                迷った時は<strong>「🎲 おまかせランダム」</strong>で運を天に任せることも可能です！
              </p>
            </div>

            {/* ランダム選出結果通知バナー */}
            {randomNotice && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.25)',
                border: '1px solid #f59e0b',
                color: '#fef08a',
                padding: '8px 16px',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '14px',
                fontSize: '13px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span>{randomNotice}</span>
                <button
                  onClick={() => setRandomNotice('')}
                  style={{ background: 'none', border: 'none', color: '#fef08a', cursor: 'pointer', fontSize: '14px' }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* 地方フィルタータブ ＋ おまかせランダムボタン */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px' }}>
              <button
                onClick={() => setSelectedRegion('all')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: selectedRegion === 'all' ? '2px solid #fde047' : '1px solid rgba(255,255,255,0.2)',
                  background: selectedRegion === 'all' ? '#10b981' : 'rgba(0,0,0,0.3)',
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

              {/* 🎲 おまかせランダム選出ボタン */}
              <button
                onClick={handleRollRandomPreview}
                disabled={isRollingRandom}
                style={{
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: '2px solid #fde047',
                  background: 'linear-gradient(135deg, #d97706, #b45309)',
                  color: '#fff',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.45)'
                }}
              >
                <span>{isRollingRandom ? '🎰' : '🎲'}</span>
                <span>{isRollingRandom ? (gachaShuffleName || '抽選中…') : 'おまかせランダム'}</span>
              </button>
            </div>

            {/* 都道府県カード一覧グリッド */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '12px',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '8px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '16px'
            }}>
              {filteredPrefectures.map((p) => {
                const isConfirmedByMe = myPlayer.prefecture?.id === p.id;
                const isPreviewed = previewPrefId === p.id;
                const otherPlayersChosen = Object.values(G.players).filter((pl) => pl.id !== pid && pl.prefecture?.id === p.id);

                let cardBorder = '1px solid rgba(255,255,255,0.15)';
                let cardBg = 'rgba(255,255,255,0.06)';
                let cardShadow = 'none';

                if (isConfirmedByMe) {
                  cardBorder = '2px solid #34d399';
                  cardBg = 'linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(5, 150, 105, 0.4))';
                  cardShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                } else if (isPreviewed) {
                  cardBorder = '2px solid #fde047';
                  cardBg = 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.3))';
                  cardShadow = '0 0 18px rgba(253, 224, 71, 0.4)';
                }

                return (
                  <div
                    key={p.id}
                    onClick={() => setPreviewPrefId(p.id)}
                    style={{
                      background: cardBg,
                      border: cardBorder,
                      borderRadius: '16px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: cardShadow,
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>{p.emoji}</span>
                        <strong style={{ fontSize: '17px', color: '#ffffff' }}>{p.name}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {isConfirmedByMe && (
                          <span style={{ fontSize: '10px', background: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: '8px', fontWeight: '900' }}>
                            ✓ 決定済み
                          </span>
                        )}
                        {isPreviewed && !isConfirmedByMe && (
                          <span style={{ fontSize: '10px', background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '8px', fontWeight: '900' }}>
                            👀 選択中
                          </span>
                        )}
                        <span style={{ fontSize: '11px', background: p.color, padding: '2px 7px', borderRadius: '10px', fontWeight: 'bold' }}>
                          {p.regionName}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#fde047', fontWeight: 'bold', marginBottom: '4px' }}>
                      ✨ 【{p.traitName}】
                    </div>
                    <div style={{ fontSize: '11px', color: '#d1fae5', lineHeight: 1.4, marginBottom: '8px' }}>
                      {p.traitDesc}
                    </div>

                    <div style={{ fontSize: '11px', color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>🎁 初期特産品: <strong>{p.souvenir.name}</strong></span>
                      <span style={{ color: '#fde047', fontWeight: 'bold' }}>+{p.souvenir.value}万</span>
                    </div>

                    {otherPlayersChosen.length > 0 && (
                      <div style={{ marginTop: '6px', fontSize: '10px', color: '#a7f3d0', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '6px' }}>
                        👥 {otherPlayersChosen.map((pl) => getPlayerName(pl.id)).join(', ')} が決定済
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 選択中の都道府県のプレビュー & 決定ボタンバー */}
            {currentPreviewPref && (
              <div style={{
                marginTop: '16px',
                padding: '16px 20px',
                background: isCurrentConfirmed
                  ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(4, 120, 87, 0.95))'
                  : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
                border: isCurrentConfirmed ? '2px solid #34d399' : '2px solid #f59e0b',
                borderRadius: '18px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 340px' }}>
                  <div style={{
                    fontSize: '36px',
                    width: '56px',
                    height: '56px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.2)',
                    flexShrink: 0
                  }}>
                    {currentPreviewPref.emoji}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>
                        {currentPreviewPref.name}
                      </span>
                      <span style={{ fontSize: '11px', background: currentPreviewPref.color, padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                        {currentPreviewPref.regionName}
                      </span>
                      {isCurrentConfirmed && (
                        <span style={{ fontSize: '11px', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: '900' }}>
                          ✓ あなたの出身地として決定済み
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#fde047', fontWeight: 'bold', marginTop: '2px' }}>
                      ✨ 【{currentPreviewPref.traitName}】 {currentPreviewPref.traitDesc}
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
                      🎁 初期特産品: {currentPreviewPref.souvenir.name} ({currentPreviewPref.souvenir.value}万円) ｜ 📦 帰省時仕送り: +{currentPreviewPref.homecoming.money}万円
                    </div>
                  </div>
                </div>

                {/* 決定アクションボタン（手動決定 ＆ ランダム即時決定） */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {isCurrentConfirmed ? (
                    <div style={{
                      padding: '12px 24px',
                      borderRadius: '16px',
                      background: 'rgba(16, 185, 129, 0.25)',
                      border: '2px solid #34d399',
                      color: '#6ee7b7',
                      fontWeight: '900',
                      fontSize: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>✓</span>
                      <span>【{currentPreviewPref.name}】に決定済み！（他の人の完了を待機中…）</span>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => moves.choosePrefecture(pid, currentPreviewPref.id)}
                        style={{
                          padding: '14px 28px',
                          borderRadius: '16px',
                          border: '2px solid #fde047',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#ffffff',
                          fontSize: '16px',
                          fontWeight: '900',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.6)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>👉</span>
                        <span>
                          {myPlayer.prefecture
                            ? `【${currentPreviewPref.name}】に変更して決定する！`
                            : `【${currentPreviewPref.name}】に決定する！`}
                        </span>
                      </button>

                      <button
                        onClick={handleRollRandomImmediate}
                        disabled={isRollingRandom}
                        title="47都道府県からおまかせで1つ選んで即時決定します"
                        style={{
                          padding: '14px 18px',
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.25)',
                          background: 'rgba(0,0,0,0.45)',
                          color: '#fde047',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>🎲</span>
                        <span>{isRollingRandom ? '抽選中…' : 'ランダム即時決定！'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* プレイヤーの決定状況 */}
        <div style={{
          marginTop: '16px',
          padding: '14px 20px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: G.isHardMode ? '#fca5a5' : '#6ee7b7' }}>
              各プレイヤーの決定状況 ({confirmedCount} / {totalCount} 人):
            </span>
            {Object.values(G.players).map((p) => {
              const hasChosen = p.prefecture !== null;
              const isMe = p.id === pid;
              return (
                <span
                  key={p.id}
                  style={{
                    fontSize: '12px',
                    background: hasChosen ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.1)',
                    border: hasChosen ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{hasChosen ? '🟢' : '⏳'}</span>
                  <span style={{ fontWeight: isMe ? '900' : 'bold', color: isMe ? '#fde047' : '#e2e8f0' }}>
                    {getPlayerName(p.id)}{isMe ? ' (あなた)' : ''}:
                  </span>
                  <strong style={{ color: hasChosen ? '#34d399' : '#94a3b8' }}>
                    {hasChosen ? `${p.prefecture.emoji} ${p.prefecture.name} (決定済)` : '選択中…'}
                  </strong>
                  {G.isHardMode && p.parentIncome && (
                    <span style={{ fontSize: '11px', color: '#fca5a5' }}>
                      (親年収${p.parentIncome.income}万/偏差値${p.hensachi})
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          {myPlayer.prefecture && (
            <div style={{ color: '#34d399', fontSize: '13px', fontWeight: 'bold' }}>
              ✓ あなたは【{myPlayer.prefecture.name}】で決定済みです
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
  const currentEra = getEraById(G.era || 1);
  const viewingEra = getEraById(viewEraId || G.era || 1);
  const turnPid = G.currentTurnPlayer || ctx.currentPlayer;
  const turnPlayer = G.players[turnPid] || myPlayer;
  const isActionPlayer = turnPid === pid;
  const activeInspectSpace = hoveredSpace || viewingEra.spaces.find((s) => s.id === G.players[turnPid]?.position) || viewingEra.spaces[0];
  const isHovering = !!hoveredSpace;
  const stageTag = { name: `第${viewingEra.id}時代: ${viewingEra.name}`, color: viewingEra.color, bg: `${viewingEra.color}26`, stageNum: viewingEra.id, sub: viewingEra.sub };
  const playersOnSpace = Object.values(G.players).filter((p) => G.era === viewingEra.id && p.position === activeInspectSpace.id);
  const inspectMoneyInfo = getSpaceMoneyDetails(activeInspectSpace, turnPlayer);

  return (
    <div style={{
      maxWidth: '1300px',
      margin: '12px auto',
      padding: '0 12px',
      fontFamily: "'Segoe UI', -apple-system, sans-serif"
    }}>
      <style>{`
        .game-main-layout {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 940px) {
          .game-main-layout {
            grid-template-columns: 1fr;
          }
        }
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

      {/* 5-ERA LIFE STAGE TIMELINE BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
        border: `2px solid ${currentEra.color}55`,
        borderRadius: '16px',
        padding: '12px 18px',
        marginBottom: '14px',
        boxShadow: `0 4px 20px ${currentEra.color}22`,
      }}>
        {/* Era Headline & Turn counters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '26px' }}>{currentEra.icon}</span>
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                CURRENT LIFE STAGE • 現在の時代
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: currentEra.color }}>
                第{G.era}時代: {currentEra.name}
                <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'normal', marginLeft: '8px' }}>
                  （{currentEra.sub}）
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>時代ターン残</div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#38bdf8' }}>
                残り {Math.max(0, G.eraMaxTurns - (myPlayer?.eraTurns || 0))} / {G.eraMaxTurns} ターン
              </div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>人生総年数</div>
              <div style={{ fontSize: '15px', fontWeight: '900', color: '#facc15' }}>
                第 {(myPlayer?.totalTurns || 0) + 1} 年目
              </div>
            </div>
          </div>
        </div>

        {/* 5-Era Step Navigation Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {LIFE_ERAS.map((era) => {
            const isCurrent = G.era === era.id;
            const isPast = G.era > era.id;
            const isViewing = viewEraId === era.id;
            return (
              <button
                key={era.id}
                onClick={() => setViewEraId(era.id)}
                style={{
                  flex: 1,
                  minWidth: '110px',
                  padding: '7px 8px',
                  borderRadius: '10px',
                  border: isViewing ? `2px solid ${era.color}` : (isCurrent ? '1.5px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.08)'),
                  background: isViewing ? 'rgba(255,255,255,0.14)' : (isCurrent ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.2)'),
                  color: isViewing || isCurrent ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: isCurrent ? '900' : 'bold' }}>
                  <span>{era.icon}</span>
                  <span>{era.name}</span>
                  {isPast && <span style={{ color: '#34d399', fontSize: '11px' }}>✓</span>}
                  {isCurrent && <span style={{ background: era.color, color: '#000', fontSize: '8px', fontWeight: '900', padding: '0 3px', borderRadius: '3px' }}>NOW</span>}
                </div>
                <span style={{ fontSize: '9px', color: isViewing ? era.color : '#64748b' }}>
                  {era.maxTurns}ターン
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LIVE ACTION BROADCAST TICKER */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(30, 58, 138, 0.9) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(30, 58, 138, 0.9) 100%)',
        border: '1.5px solid #38bdf8',
        borderRadius: '12px',
        padding: '9px 16px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        boxShadow: '0 4px 16px rgba(56, 189, 248, 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <span style={{ fontSize: '20px', animation: 'carBounce 1.5s infinite' }}>📢</span>
          <span style={{
            fontSize: '11px',
            fontWeight: '900',
            color: '#38bdf8',
            background: 'rgba(56, 189, 248, 0.2)',
            padding: '2px 8px',
            borderRadius: '6px',
            whiteSpace: 'nowrap'
          }}>
            最新実況速報
          </span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', lineHeight: 1.3 }}>
            {G.logs[0] || 'ゲーム進行中…'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#cbd5e1' }}>
          <span>現在の手番:</span>
          <strong style={{
            color: '#ffffff',
            background: turnPlayer.color,
            padding: '2px 10px',
            borderRadius: '12px',
            fontWeight: '900',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}>
            🚗 {getPlayerName(turnPid)}
          </strong>
        </div>
      </div>

      {/* 観戦者向け：イベント再表示フローティングボタン */}
      {!isActionPlayer && G.currentSpaceModal && isSpectatorDismissed && (
        <button
          onClick={() => setIsSpectatorDismissed(false)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 900,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            border: '2px solid #ffffff',
            borderRadius: '24px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: '900',
            boxShadow: '0 4px 18px rgba(245, 158, 11, 0.6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'roulettePulse 1.5s infinite'
          }}
        >
          <span>📢</span>
          <span>{getPlayerName(turnPid)} の着地イベントを見る</span>
        </button>
      )}

      {/* EVENT MODALS: 分岐選択・マイホーム購入・職業選択モーダル（全員に共有表示） */}
      {G.currentSpaceModal && (!isSpectatorDismissed || isActionPlayer) && (
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
            maxWidth: '600px',
            width: '100%',
            color: '#ffffff',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            {/* 着地プレイヤー表示＆観戦時閉じるボタン */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: `${turnPlayer.color}25`,
                border: `1.5px solid ${turnPlayer.color}`,
                padding: '4px 12px',
                borderRadius: '20px'
              }}>
                <span style={{ fontSize: '15px' }}>🚗</span>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#ffffff' }}>
                  {getPlayerName(turnPid)} が着地！
                </span>
                {isActionPlayer ? (
                  <span style={{ fontSize: '10px', background: turnPlayer.color, color: '#fff', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                    あなた
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                    観戦中
                  </span>
                )}
              </div>

              {!isActionPlayer && (
                <button
                  onClick={() => setIsSpectatorDismissed(true)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#94a3b8',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  盤面を見る（閉じる）
                </button>
              )}
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 10px', color: G.isHardMode ? '#f87171' : '#38bdf8' }}>
              📍 {G.currentSpaceModal.title}
            </h3>
            <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '14px' }}>
              {G.currentSpaceModal.desc}
            </p>

            {/* お金の増減・所持金変動ハイライトバナー */}
            {G.currentSpaceModal.deltaMoney !== undefined && (
              <div style={{
                margin: '12px 0 20px',
                padding: '14px 18px',
                borderRadius: '16px',
                background: G.currentSpaceModal.deltaMoney > 0
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.35))'
                  : G.currentSpaceModal.deltaMoney < 0
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.35))'
                  : 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(30, 64, 175, 0.3))',
                border: G.currentSpaceModal.deltaMoney > 0
                  ? '2px solid #10b981'
                  : G.currentSpaceModal.deltaMoney < 0
                  ? '2px solid #ef4444'
                  : '2px solid #38bdf8',
                boxShadow: G.currentSpaceModal.deltaMoney > 0
                  ? '0 0 18px rgba(16, 185, 129, 0.35)'
                  : G.currentSpaceModal.deltaMoney < 0
                  ? '0 0 18px rgba(239, 68, 68, 0.35)'
                  : '0 0 18px rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '32px' }}>
                    {G.currentSpaceModal.deltaMoney > 0 ? '💰' : G.currentSpaceModal.deltaMoney < 0 ? '💸' : '🛡️'}
                  </span>
                  <div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold' }}>
                      マネー変動（増減）
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '900',
                      letterSpacing: '0.5px',
                      color: G.currentSpaceModal.deltaMoney > 0 ? '#34d399' : G.currentSpaceModal.deltaMoney < 0 ? '#f87171' : '#38bdf8'
                    }}>
                      {G.currentSpaceModal.deltaMoney > 0
                        ? `+${G.currentSpaceModal.deltaMoney} 万円 獲得！`
                        : G.currentSpaceModal.deltaMoney < 0
                        ? `${G.currentSpaceModal.deltaMoney} 万円 支出`
                        : '自己負担 0 万円（保険補償）'}
                    </div>
                    {G.currentSpaceModal.details && (
                      <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '3px', fontWeight: '500' }}>
                        {G.currentSpaceModal.details}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0,0,0,0.45)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>所持金の推移</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff' }}>
                    <span style={{ color: '#94a3b8' }}>{G.currentSpaceModal.beforeMoney}万</span>
                    <span style={{ margin: '0 8px', color: '#38bdf8' }}>➔</span>
                    <span style={{ color: '#facc15', fontSize: '18px', fontWeight: '900' }}>
                      {G.currentSpaceModal.afterMoney} 万円
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 出身地恩恵発動バナー */}
            {G.currentSpaceModal.hometownPerk && (
              <div style={{
                margin: '10px 0 16px',
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))',
                border: '2px solid #fbbf24',
                boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '28px' }}>✨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#fde047', letterSpacing: '0.3px' }}>
                    【出身地恩恵: {G.currentSpaceModal.hometownPerk.emoji} {G.currentSpaceModal.hometownPerk.prefName}「{G.currentSpaceModal.hometownPerk.traitName}」発動！】
                  </div>
                  <div style={{ fontSize: '12px', color: '#ffffff', marginTop: '3px', fontWeight: 'bold' }}>
                    {G.currentSpaceModal.hometownPerk.effect}
                  </div>
                </div>
              </div>
            )}

            {/* 全国ご当地旅行＆名産品獲得カード */}
            {G.currentSpaceModal.travelData && (() => {
              const td = G.currentSpaceModal.travelData;
              return (
                <div style={{
                  margin: '12px 0 18px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: '2px solid #38bdf8',
                  padding: '16px',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                      🗾 全国ご当地旅・お土産GET！
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fef08a' }}>
                      {td.destination.regionName}地方
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '32px' }}>{td.destination.emoji}</span>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>
                        {td.destination.name} への旅
                      </div>
                      <div style={{ fontSize: '11px', color: '#bae6fd', fontStyle: 'italic' }}>
                        「{td.destination.flavor}」
                      </div>
                    </div>
                  </div>

                  {/* 獲得したご当地名産品 */}
                  <div style={{
                    background: 'rgba(0,0,0,0.35)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255,255,255,0.2)',
                    marginTop: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>{td.souvenir.icon}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>
                          {td.souvenir.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#7dd3fc' }}>
                          お土産バッグに保存（最終決算時に資産加算）
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '9px', color: '#cbd5e1' }}>名産品の資産価値</div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#4ade80' }}>
                        +{td.souvenir.value}万円
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 就職ルーレット（強制ストップ就職マス） */}
            {G.currentSpaceModal.type === 'choose_job' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  padding: '10px 14px',
                  background: G.isHardMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  border: G.isHardMode ? '1px solid #ef4444' : '1px solid #38bdf8',
                  borderRadius: '12px',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: G.isHardMode ? '#fca5a5' : '#7dd3fc'
                }}>
                  {G.isHardMode
                    ? `💀 ハードモード学歴フィルター：あなたの偏差値【${myPlayer.hensachi || 50}】！ルーレット（1〜10）を回して運命の就職先が決まります。偏差値が基準に満たない場合は学歴フィルターにより不採用となり、就活費 -30万円＆【無職（給料0円）】で人生続行となります！（※ループなし）`
                    : '🎡 人生の運命の分かれ道！就職ルーレット（1〜10）を回してあなたの職業と給料を決定しましょう！（強制ストップマス）'}
                </div>

                {/* ルーレット出目と職業の対応一覧 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '8px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                  background: 'rgba(0,0,0,0.25)',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const jobId = JOB_ROULETTE_TABLE[num];
                    const occ = OCCUPATIONS.find((o) => o.id === jobId) || OCCUPATIONS[0];
                    const myHensachi = myPlayer.hensachi || 50;
                    const isQualified = !G.isHardMode || myHensachi >= occ.minHensachi;

                    return (
                      <div
                        key={num}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '10px',
                          background: isQualified ? 'rgba(255,255,255,0.06)' : 'rgba(239, 68, 68, 0.12)',
                          border: isQualified ? '1px solid rgba(255,255,255,0.12)' : '1px dashed #ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: isQualified ? '#38bdf8' : '#ef4444',
                          color: '#0f172a',
                          fontWeight: '900',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          flexShrink: 0
                        }}>
                          {num}
                        </span>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>{occ.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: isQualified ? '#ffffff' : '#fca5a5',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {occ.title}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            給料: {occ.baseSalary}万 {G.isHardMode && occ.minHensachi > 0 ? `• 要偏差値: ${occ.minHensachi}` : '• 学歴不問'}
                          </div>
                        </div>
                        {G.isHardMode && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '900',
                            color: isQualified ? '#4ade80' : '#f87171',
                            flexShrink: 0
                          }}>
                            {isQualified ? '◯ 合格' : '✕ 不可'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ルーレット回転ボタン（行動者） または 観戦中メッセージ */}
                {isActionPlayer ? (
                  <button
                    disabled={isSpinningJob}
                    onClick={() => {
                      if (isSpinningJob) return;
                      setIsSpinningJob(true);
                      let ticks = 0;
                      const interval = setInterval(() => {
                        ticks++;
                        setTempJobRoll(Math.floor(Math.random() * 10) + 1);
                        if (ticks >= 14) {
                          clearInterval(interval);
                          setIsSpinningJob(false);
                          moves.spinJobRoulette(pid);
                        }
                      }, 70);
                    }}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '16px',
                      background: isSpinningJob
                        ? 'linear-gradient(135deg, #475569, #334155)'
                        : 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '900',
                      fontSize: '18px',
                      cursor: isSpinningJob ? 'wait' : 'pointer',
                      boxShadow: isSpinningJob ? 'none' : '0 6px 20px rgba(245, 158, 11, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      transition: 'all 0.2s ease',
                      marginTop: '6px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>🎡</span>
                    <span>
                      {isSpinningJob ? `運命のルーレット回転中… 【 出目: ${tempJobRoll || 1} 】` : '運命の就職ルーレットを回す！'}
                    </span>
                  </button>
                ) : (
                  <div style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'rgba(0,0,0,0.4)',
                    border: `1.5px dashed ${turnPlayer.color}`,
                    textAlign: 'center',
                    marginTop: '6px'
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#facc15' }}>
                      🎡 {getPlayerName(turnPid)} が就職ルーレットを回しています…
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      どの職業に決定するか固唾をのんで見守ろう！
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 就職ルーレット結果発表モーダル */}
            {G.currentSpaceModal.type === 'job_result' && G.currentSpaceModal.resultData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(() => {
                  const res = G.currentSpaceModal.resultData;
                  const passed = res.passed;
                  return (
                    <div style={{
                      padding: '20px',
                      borderRadius: '16px',
                      background: passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: passed ? '2px solid #10b981' : '2px solid #ef4444',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                        就職ルーレット出目
                      </div>
                      <div style={{
                        fontSize: '44px',
                        fontWeight: '900',
                        color: passed ? '#facc15' : '#f87171',
                        lineHeight: 1,
                        marginBottom: '12px'
                      }}>
                        【 {res.roll} 】
                      </div>

                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                        {res.finalOcc.icon}
                      </div>

                      <div style={{ fontSize: '20px', fontWeight: '900', color: passed ? '#ffffff' : '#fca5a5', marginBottom: '4px' }}>
                        {passed ? `採用決定！【${res.finalOcc.title}】` : `学歴フィルター不採用…【${res.candidate.title}】`}
                      </div>

                      {passed ? (
                        <div>
                          <div style={{ fontSize: '15px', color: '#34d399', fontWeight: 'bold', marginTop: '6px' }}>
                            初任給: {res.finalOcc.baseSalary}万円
                          </div>
                          {res.isHardMode && res.candidate.minHensachi > 0 && (
                            <div style={{ fontSize: '12px', color: '#a7f3d0', marginTop: '6px' }}>
                              🎓 あなたの偏差値【${myPlayer.hensachi || 50}】 ≧ 採用基準【${res.candidate.minHensachi}】（書類選考突破！）
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '13px', color: '#f87171', marginTop: '6px', lineHeight: 1.5 }}>
                            志望先: 要偏差値【{res.candidate.minHensachi}】に対し あなたの偏差値【{myPlayer.hensachi || 50}】<br />
                            就活費用として <strong>-30万円</strong> 支払い。
                          </div>
                          <div style={{
                            marginTop: '10px',
                            padding: '8px 12px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '8px',
                            color: '#fde047',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            🏚️【無職・求職中（給料0円）】として人生を続行します！（※就活ループなし）
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {isActionPlayer ? (
                  <button
                    onClick={() => moves.endTurn(pid)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '900',
                      fontSize: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>結果を確定して次へ進む（手番終了）</span>
                    <span>👉</span>
                  </button>
                ) : (
                  <div style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(0,0,0,0.3)',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '13px'
                  }}>
                    👀 {getPlayerName(turnPid)} が採用結果を確認中…
                  </div>
                )}
              </div>
            )}

            {/* 進路分岐選択 */}
            {G.currentSpaceModal.type === 'branch_career' && (() => {
              const isTokyo = (turnPlayer?.prefecture?.id || myPlayer.prefecture?.id) === 'tokyo';
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {isActionPlayer ? (
                    <>
                      <button
                        onClick={() => moves.chooseRoute(pid, 'tokyo')}
                        style={{
                          padding: '14px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 'bold',
                          fontSize: '15px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                        }}
                      >
                        {isTokyo
                          ? '🗼 都心エリート・都内自立コース（偏差値+2 / 自立生活費 -20万円）'
                          : '🏙️ 大都会コースに進む（偏差値+2 / 上京費用 -20万円）'}
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
                          fontSize: '15px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)'
                        }}
                      >
                        {isTokyo
                          ? '🌾 地方移住・UIターンコース（地方移住定着金 +30万円）'
                          : '🌾 地元就職・地域貢献コース（地元定着支援金 +30万円）'}
                      </button>
                    </>
                  ) : (
                    <div style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: 'rgba(0,0,0,0.4)',
                      border: `1.5px dashed ${turnPlayer.color}`,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#38bdf8' }}>
                        🚩 {getPlayerName(turnPid)} が進路を選択しています…
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        {isTokyo ? '「都心エリート自立」か「地方移住UIターン」か選択中' : '「大都会コース（上京）」か「地元就職コース」か選択中'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 中年キャリア大勝負分岐 */}
            {G.currentSpaceModal.type === 'branch_midlife' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {isActionPlayer ? (
                  <>
                    <button
                      onClick={() => moves.chooseRoute(pid, 'venture')}
                      style={{
                        padding: '14px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)'
                      }}
                    >
                      🚀 ベンチャー起業・大勝負コース（特別出資金 +80万円）
                    </button>
                    <button
                      onClick={() => moves.chooseRoute(pid, 'steady')}
                      style={{
                        padding: '14px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)'
                      }}
                    >
                      🛡️ 堅実継続・安定コース（特別手当 +30万円）
                    </button>
                  </>
                ) : (
                  <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'rgba(0,0,0,0.4)',
                    border: `1.5px dashed ${turnPlayer.color}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#c084fc' }}>
                      ⚖️ {getPlayerName(turnPid)} が中年のキャリア分岐を選択中…
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      一攫千金の起業か、堅実安定か！？
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* マイホーム購入選択 */}
            {G.currentSpaceModal.type === 'buy_house' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isActionPlayer ? (
                  <>
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
                  </>
                ) : (
                  <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'rgba(0,0,0,0.4)',
                    border: `1.5px dashed ${turnPlayer.color}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fb923c' }}>
                      🏡 {getPlayerName(turnPid)} がマイホーム購入を検討中…
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      購入するか、見送るか選択を待っています
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 時代進行マイルストーン（祝・進級/就任/退職） */}
            {G.currentSpaceModal.type === 'era_milestone' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: '56px', animation: 'roulettePulse 1.5s infinite' }}>
                  🎊
                </div>
                {isActionPlayer ? (
                  <button
                    onClick={() => moves.endTurn(pid)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '900',
                      fontSize: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>🚀</span>
                    <span>新しい時代をスタートする！（手番開始）</span>
                  </button>
                ) : (
                  <div style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(0,0,0,0.3)',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '13px'
                  }}>
                    🎊 {getPlayerName(turnPid)} が新時代開始を確認中…
                  </div>
                )}
              </div>
            )}

            {/* 通常イベントマス（了解して次へ進む） */}
            {!['branch_career', 'branch_midlife', 'buy_house', 'choose_job', 'job_result', 'era_milestone'].includes(G.currentSpaceModal.type) && (
              isActionPlayer ? (
                <button
                  onClick={() => moves.endTurn(pid)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '900',
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>👉</span>
                  <span>了解して次のプレイヤーへ進む（ターン終了）</span>
                </button>
              ) : (
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  👀 {getPlayerName(turnPid)} がイベント結果を確認中…（まもなく交代）
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* 2-COLUMN COMPACT RESPONSIVE MAIN LAYOUT */}
      <div className="game-main-layout">
        {/* LEFT COLUMN: CONTROLS, INSPECTOR, STATUS, LOGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 1. ROULETTE & CONTROLS COMPACT PANEL */}
          <div style={{
            background: 'linear-gradient(145deg, #111827 0%, #1e293b 100%)',
            borderRadius: '16px',
            padding: '14px 16px',
            border: '2px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>
                  CURRENT TURN
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff' }}>
                  {getPlayerName(ctx.currentPlayer)} の手番
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '8px',
                background: isMyTurn ? 'rgba(52, 211, 153, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                color: isMyTurn ? '#34d399' : '#94a3b8',
                fontWeight: 'bold'
              }}>
                {isMyTurn ? '👉 あなたの手番' : '⏳ 相手の行動待ち'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'conic-gradient(#ef4444 0% 10%, #f97316 10% 20%, #f59e0b 20% 30%, #10b981 30% 40%, #06b6d4 40% 50%, #3b82f6 50% 60%, #6366f1 60% 70%, #8b5cf6 70% 80%, #ec4899 80% 90%, #f43f5e 90% 100%)',
                  border: '4px solid #ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  transform: `rotate(${spinDegree}deg)`,
                  transition: isSpinningLocal ? 'transform 1.2s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '16px',
                    color: '#1f2937'
                  }}>
                    {G.rouletteValue !== null ? G.rouletteValue : '🎡'}
                  </div>
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '14px solid #fbbf24',
                  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))'
                }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {isMyTurn && G.turnStep === 'spin' && (
                  <button
                    onClick={handleSpinRoulette}
                    disabled={isSpinningLocal || myPlayer.isGoal}
                    style={{
                      width: '100%',
                      padding: '14px 12px',
                      fontSize: '16px',
                      fontWeight: '900',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                      transition: 'all 0.15s'
                    }}
                  >
                    🎡 ルーレットを回す！
                  </button>
                )}

                {isMyTurn && (G.turnStep === 'resolve_space' || G.turnStep === 'end_turn') && !G.currentSpaceModal && (
                  <button
                    onClick={() => moves.endTurn(pid)}
                    style={{
                      width: '100%',
                      padding: '12px 10px',
                      fontSize: '14px',
                      fontWeight: '900',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>👉 ターン終了（交代）</span>
                  </button>
                )}

                {(!isMyTurn || (G.turnStep !== 'spin' && G.currentSpaceModal)) && (
                  <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                    {isMyTurn ? 'イベントモーダルで選択中…' : '相手のターン進行中…'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. HOVERED / ACTIVE SPACE INSPECTOR */}
          <div style={{
            background: isHovering ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))' : 'rgba(15, 23, 42, 0.85)',
            border: isHovering ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '12px 14px',
            boxShadow: isHovering ? '0 6px 20px rgba(56, 189, 248, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '20px' }}>{activeInspectSpace.icon || '📍'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: '8px', color: '#94a3b8', fontWeight: 'bold' }}>
                    #{activeInspectSpace.id}
                  </span>
                  <strong style={{ fontSize: '13px', color: '#ffffff' }}>
                    {activeInspectSpace.title}
                  </strong>
                  {activeInspectSpace.stop && (
                    <span style={{ fontSize: '9px', background: '#dc2626', color: '#fff', padding: '1px 5px', borderRadius: '6px', fontWeight: '900' }}>
                      STOP
                    </span>
                  )}
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '900',
                    color: inspectMoneyInfo.color,
                    background: `${inspectMoneyInfo.color}22`,
                    border: `1px solid ${inspectMoneyInfo.color}55`,
                    padding: '1px 6px',
                    borderRadius: '4px'
                  }}>
                    {inspectMoneyInfo.badge}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
              {activeInspectSpace.desc}
            </div>

            {/* お金・上限・収支の目安表示 */}
            <div style={{
              marginTop: '8px',
              padding: '6px 10px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              border: `1px solid ${inspectMoneyInfo.color}44`,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>
                  💰 収支目安・上限:
                </span>
                <span style={{ fontSize: '11px', fontWeight: '900', color: inspectMoneyInfo.color }}>
                  {inspectMoneyInfo.maxLimit}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 'bold' }}>
                {inspectMoneyInfo.detail}
              </div>
            </div>

            {playersOnSpace.length > 0 && (
              <div style={{ marginTop: '6px', display: 'flex', gap: '4px', alignItems: 'center', fontSize: '10px', color: '#94a3b8' }}>
                <span>現在地:</span>
                {playersOnSpace.map((pl) => (
                  <span key={pl.id} style={{ background: pl.color, color: '#fff', padding: '1px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
                    🚗 P{pl.id}
                  </span>
                ))}
              </div>
            )}
            <div style={{ fontSize: '10px', color: isHovering ? '#38bdf8' : '#64748b', marginTop: '4px', textAlign: 'right' }}>
              {isHovering ? '👀 カーソル位置のマスを表示中' : '💡 マスにカーソルを合わせると詳細表示'}
            </div>
          </div>

          {/* 3. PLAYERS STATUS PANEL */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: Object.keys(G.players).length <= 2 ? '1fr 1fr' : '1fr',
            gap: '8px'
          }}>
            {Object.values(G.players).map((p) => {
              const isCurrent = ctx.currentPlayer === p.id;
              return (
                <div
                  key={p.id}
                  style={{
                    background: isCurrent ? 'linear-gradient(135deg, #065f46, #047857)' : 'rgba(15, 23, 42, 0.85)',
                    border: isCurrent ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '8px 10px',
                    color: '#ffffff',
                    fontSize: '11px',
                    boxShadow: isCurrent ? '0 4px 12px rgba(52, 211, 153, 0.25)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: p.color, fontSize: '12px' }}>
                      {getPlayerName(p.id)} {isCurrent && '🎯'}
                    </strong>
                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: '6px' }}>
                      {p.prefecture?.emoji} {p.prefecture?.shortName}
                    </span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#fde047', margin: '2px 0' }}>
                    {p.money.toLocaleString()} <span style={{ fontSize: '10px', color: '#fff' }}>万円</span>
                  </div>
                  {G.isHardMode && (
                    <div style={{ fontSize: '10px', color: '#fca5a5', lineHeight: 1.3 }}>
                      実家: {p.parentIncome ? `${p.parentIncome.income}万` : '未定'} • 偏差値: <strong style={{ color: '#fde047' }}>【{p.hensachi || 50}】</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    💼 {p.occupation ? p.occupation.title : '無職（求職中）'}
                  </div>
                  {/* 家族・子供ステータスバッジ */}
                  <div style={{
                    marginTop: '5px',
                    padding: '4px 6px',
                    borderRadius: '8px',
                    background: p.car.kids > 0 ? 'rgba(244, 114, 182, 0.2)' : 'rgba(255,255,255,0.06)',
                    border: p.car.kids > 0 ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '13px' }}>{p.car.kids > 0 ? '👨‍👩‍👧‍👦' : (p.car.spouse ? '👫' : '👤')}</span>
                      <strong style={{ fontSize: '11px', color: p.car.kids > 0 ? '#fbcfe8' : '#cbd5e1' }}>
                        {p.car.kids > 0 ? `子ども ${p.car.kids}人` : '子どもなし'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {p.car.spouse && (
                        <span style={{ background: '#f43f5e', color: '#fff', padding: '1px 4px', borderRadius: '4px', fontSize: '8px', fontWeight: 'bold' }}>
                          配偶者
                        </span>
                      )}
                      {p.car.kids > 0 ? (
                        Array.from({ length: p.car.kids }).map((_, i) => (
                          <span
                            key={i}
                            style={{
                              background: '#ec4899',
                              color: '#fff',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontSize: '9px',
                              fontWeight: '900',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                            }}
                            title={`第${i + 1}子（毎給料手当 +15万 / 決算資産 +200万）`}
                          >
                            👶 子{i + 1}
                          </span>
                        ))
                      ) : null}
                    </div>
                  </div>
                  {p.car.kids > 0 && (
                    <div style={{ fontSize: '9px', color: '#6ee7b7', marginTop: '2px', textAlign: 'right' }}>
                      給料手当 +{p.car.kids * 15}万 / 決算資産 +{p.car.kids * 200}万
                    </div>
                  )}

                  {/* 出身県＆パッシブ恩恵 */}
                  {p.prefecture && (
                    <div style={{
                      marginTop: '6px',
                      padding: '5px 7px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      fontSize: '9px',
                      color: '#fef3c7'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#fde047' }}>
                          🗾 {p.prefecture.emoji} {p.prefecture.name}
                        </span>
                        <span style={{ fontSize: '8px', background: p.prefecture.color, color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {p.prefecture.regionName}
                        </span>
                      </div>
                      <div style={{ color: '#fed7aa', fontWeight: 'bold', marginTop: '2px' }}>
                        ✨【{p.prefecture.traitName}】
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '8px', lineHeight: 1.25, marginTop: '2px' }}>
                        {p.prefecture.traitDesc}
                      </div>
                      {(p.insurance?.life || p.insurance?.fire) && (
                        <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
                          {p.insurance?.life && (
                            <span style={{ fontSize: '7px', background: '#0284c7', color: '#fff', padding: '0 4px', borderRadius: '3px' }}>
                              🛡️ 生命保険付帯
                            </span>
                          )}
                          {p.insurance?.fire && (
                            <span style={{ fontSize: '7px', background: '#dc2626', color: '#fff', padding: '0 4px', borderRadius: '3px' }}>
                              🛡️ 火災保険付帯
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ご当地特産品・お土産コレクション */}
                  {p.souvenirs && p.souvenirs.length > 0 && (() => {
                    const sTotal = p.souvenirs.reduce((acc, s) => acc + (s.value || 0), 0);
                    return (
                      <div style={{
                        marginTop: '5px',
                        padding: '4px 6px',
                        borderRadius: '8px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        fontSize: '9px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <span style={{ color: '#7dd3fc', fontWeight: 'bold' }}>
                            🎁 名産品お土産 ({p.souvenirs.length}品)
                          </span>
                          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                            +{sTotal}万
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', maxHeight: '55px', overflowY: 'auto' }}>
                          {p.souvenirs.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                background: 'rgba(255,255,255,0.12)',
                                borderRadius: '4px',
                                padding: '1px 4px',
                                fontSize: '8px',
                                color: '#e2e8f0',
                                whiteSpace: 'nowrap',
                                border: '1px solid rgba(255,255,255,0.08)'
                              }}
                              title={`${s.prefName || ''}: ${s.name} (資産価値 +${s.value}万)\n${s.flavor || ''}`}
                            >
                              {s.icon} {s.name.split(' ')[0]} (+{s.value}万)
                            </span>
                          ))}
                        </div>
                        {p.souvenirs.length >= 3 && (
                          <div style={{ fontSize: '8px', color: '#fde047', marginTop: '2px', textAlign: 'right', fontWeight: 'bold' }}>
                            {p.souvenirs.length >= 5 ? '🏆 日本一周グランドトラベラー（決算+300万）' : '🎖️ 全国旅行マスター（決算+150万）'}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {/* 4. EVENT LOGS */}
          <div style={{
            background: 'rgba(0,0,0,0.35)',
            borderRadius: '12px',
            padding: '10px 12px',
            fontSize: '11px',
            color: '#cbd5e1',
            maxHeight: '120px',
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', fontSize: '10px' }}>
              📜 人生イベントログ:
            </div>
            {G.logs.map((log, idx) => (
              <div key={idx} style={{ marginBottom: '2px', lineHeight: 1.3 }}>{log}</div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: BOARD GAME MAP */}
        <div style={{
          background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '18px',
          padding: '16px',
          border: '2px solid rgba(255,255,255,0.12)',
          boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Map Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>{viewingEra.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: '900', color: viewingEra.color }}>
                {viewingEra.name} サーキットマップ（全{viewingEra.spaces.length}マス）
              </span>
            </div>
            {viewEraId !== G.era ? (
              <button
                onClick={() => setViewEraId(G.era || 1)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid #38bdf8',
                  background: 'rgba(56, 189, 248, 0.25)',
                  color: '#7dd3fc',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                👉 現在進行中の第{G.era}時代に戻る
              </button>
            ) : (
              <div style={{
                fontSize: '11px',
                color: '#34d399',
                fontWeight: 'bold',
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                📍 あなたの現在地: #{myPlayer.position}マス目
              </div>
            )}
          </div>

          {/* Era filter tabs */}
          <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.25)',
            padding: '6px 10px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            {LIFE_ERAS.map((era) => (
              <button
                key={era.id}
                onClick={() => setViewEraId(era.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: viewEraId === era.id ? `2px solid ${era.color}` : '1px solid rgba(255,255,255,0.1)',
                  background: viewEraId === era.id ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: viewEraId === era.id ? '#ffffff' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: viewEraId === era.id ? '900' : 'normal',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{era.icon}</span>
                <span>{era.name}</span>
                {G.era === era.id && (
                  <span style={{ fontSize: '8px', background: era.color, color: '#000', padding: '0 4px', borderRadius: '4px', fontWeight: '900' }}>
                    進行中
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Board Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '8px',
            paddingRight: '2px'
          }}>
            {viewingEra.spaces.map((space) => {
              const playersHere = Object.values(G.players).filter((p) => G.era === viewingEra.id && p.position === space.id);
              const isHovered = hoveredSpace?.id === space.id && hoveredSpace?.eraId === viewingEra.id;
              const isMyPieceHere = G.era === viewingEra.id && myPlayer.position === space.id;
              const isTurnLandingSpace = viewEraId === G.era && space.id === G.players[turnPid]?.position;

              return (
                <div
                  key={space.id}
                  onMouseEnter={() => setHoveredSpace({ ...space, eraId: viewingEra.id })}
                  onMouseLeave={() => setHoveredSpace(null)}
                  title={`#${space.id} ${space.title}\n${space.desc}${space.amount ? ` (${space.amount > 0 ? '+' : ''}${space.amount}万円)` : ''}`}
                  style={{
                    background: isHovered
                      ? 'rgba(56, 189, 248, 0.22)'
                      : isTurnLandingSpace
                      ? 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.28) 0%, rgba(30, 41, 59, 0.95) 100%)'
                      : isMyPieceHere
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(255,255,255,0.05)',
                    border: isHovered
                      ? '2px solid #38bdf8'
                      : isTurnLandingSpace
                      ? '2.5px solid #f59e0b'
                      : isMyPieceHere
                      ? '2px solid #34d399'
                      : `1.5px solid ${viewingEra.color}66`,
                    borderRadius: '12px',
                    padding: '8px 10px',
                    minHeight: '82px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    cursor: 'pointer',
                    transform: isHovered ? 'translateY(-2px)' : (isTurnLandingSpace ? 'scale(1.02)' : 'none'),
                    boxShadow: isHovered
                      ? '0 6px 14px rgba(56, 189, 248, 0.35)'
                      : isTurnLandingSpace
                      ? '0 0 18px rgba(245, 158, 11, 0.65)'
                      : isMyPieceHere
                      ? '0 0 12px rgba(52, 211, 153, 0.4)'
                      : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontWeight: 'bold' }}>#{space.id}</span>
                        {isTurnLandingSpace && (
                          <span style={{
                            background: '#f59e0b',
                            color: '#000',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontSize: '8px',
                            fontWeight: '900',
                            animation: 'roulettePulse 1.2s infinite'
                          }}>
                            ⚡ 着地！
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {space.stop && (
                          <span style={{ color: '#ffffff', background: '#dc2626', padding: '1px 5px', borderRadius: '4px', fontWeight: '900', fontSize: '8px' }}>
                            STOP
                          </span>
                        )}
                        <span style={{ fontSize: '13px' }}>{space.icon || '📍'}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: isTurnLandingSpace ? '#fde047' : '#ffffff', marginTop: '3px', lineHeight: 1.25 }}>
                      {space.title}
                    </div>
                  </div>

                  {(() => {
                    const mInfo = getSpaceMoneyDetails(space, myPlayer);
                    return (
                      <div style={{
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '2px'
                      }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '900',
                          color: mInfo.color,
                          background: `${mInfo.color}22`,
                          border: `1px solid ${mInfo.color}55`,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap'
                        }}>
                          {mInfo.badge}
                        </span>
                        <span
                          style={{
                            fontSize: '8px',
                            color: '#94a3b8',
                            textAlign: 'right',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '65px'
                          }}
                          title={mInfo.maxLimit}
                        >
                          {mInfo.maxLimit.replace('上限: ', '').replace('給料上限: ', '').replace('上限目安: ', '')}
                        </span>
                      </div>
                    );
                  })()}

                  {playersHere.length > 0 && (
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {playersHere.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            background: p.color,
                            borderRadius: '4px',
                            padding: '2px 5px',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            color: '#fff',
                            animation: 'carBounce 2s infinite ease-in-out',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title={`プレイヤー${p.id} (${p.name || ''}) - ${p.car?.spouse ? '配偶者あり' : '独身'}, 子供: ${p.car?.kids || 0}人`}
                        >
                          <span>🚗 P{p.id}</span>
                          {p.car?.spouse && <span title="配偶者同乗">👫</span>}
                          {p.car?.kids > 0 && (
                            <span
                              style={{
                                background: 'rgba(255,255,255,0.3)',
                                borderRadius: '3px',
                                padding: '0 3px',
                                fontSize: '8px',
                                border: '1px solid rgba(255,255,255,0.4)'
                              }}
                              title={`子供 ${p.car.kids}人`}
                            >
                              👶x{p.car.kids}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
