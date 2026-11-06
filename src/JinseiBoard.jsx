// JinseiBoard.jsx - 47都道府県 ご当地人生ゲームの盤面コンポーネント
// 通常モード ＋ 隠しリアルハードモード（親ガチャ・偏差値・学歴フィルター）対応
import React, { useState } from 'react';
import { UnifiedLobby } from './UnifiedLobby';
import { PREFECTURES, REGIONS, getPrefectureById } from './data/prefecturesData';
import { BOARD_SPACES, HOUSES, OCCUPATIONS } from './JinseiGame';

export const JinseiBoard = ({ G, ctx, moves, playerID, matchData }) => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isSpinningLocal, setIsSpinningLocal] = useState(false);
  const [spinDegree, setSpinDegree] = useState(0);
  const [hoveredSpace, setHoveredSpace] = useState(null);
  const [stageFilter, setStageFilter] = useState('all');

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

          {isMyTurn && (G.turnStep === 'resolve_space' || G.turnStep === 'end_turn') && !G.currentSpaceModal && (
            <button
              onClick={() => moves.endTurn(pid)}
              style={{
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>👉</span>
              <span>次のプレイヤーへ進む（ターン終了）</span>
            </button>
          )}
        </div>
      </div>

      {/* ステージ判定ヘルパー */}
      {(() => null)()}
      {/* マス詳細インスペクター (マウスカーソルを合わせたマスの詳細を表示) */}
      {(() => {
        const getStageTag = (sId) => {
          if (sId <= 35) return { name: '🌱 幼少期・学生時代', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', stageNum: 1, range: '0〜35' };
          if (sId <= 75) return { name: '💼 就活・新社会人', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', stageNum: 2, range: '36〜75' };
          if (sId <= 115) return { name: '💍 結婚・マイホーム', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)', stageNum: 3, range: '76〜115' };
          if (sId <= 155) return { name: '⚖️ 中年・大勝負・帰省', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', stageNum: 4, range: '116〜155' };
          return { name: '🏰 セカンドライフ・老後・ゴール', color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', stageNum: 5, range: '156〜200' };
        };

        const activeInspectSpace = hoveredSpace || BOARD_SPACES.find((s) => s.id === myPlayer.position) || BOARD_SPACES[0];
        const isHovering = !!hoveredSpace;
        const stageTag = getStageTag(activeInspectSpace.id);
        const playersOnSpace = Object.values(G.players).filter((p) => p.position === activeInspectSpace.id);

        return (
          <div style={{
            background: isHovering ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))' : 'rgba(15, 23, 42, 0.85)',
            border: isHovering ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '18px',
            padding: '14px 20px',
            marginBottom: '16px',
            boxShadow: isHovering ? '0 10px 30px rgba(56, 189, 248, 0.3)' : 'none',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              fontSize: '36px',
              width: '56px',
              height: '56px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${stageTag.color}`,
              flexShrink: 0
            }}>
              {activeInspectSpace.icon || '📍'}
            </div>

            <div style={{ flex: '1 1 320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '10px', color: '#94a3b8', fontWeight: '900' }}>
                  #{activeInspectSpace.id}
                </span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>
                  {activeInspectSpace.title}
                </span>
                <span style={{ fontSize: '11px', background: stageTag.bg, color: stageTag.color, padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {stageTag.name}
                </span>
                {activeInspectSpace.stop && (
                  <span style={{ fontSize: '11px', background: '#dc2626', color: '#ffffff', padding: '2px 8px', borderRadius: '10px', fontWeight: '900', boxShadow: '0 0 10px rgba(220,38,38,0.5)' }}>
                    🛑 STOP（確定停止マス）
                  </span>
                )}
                {activeInspectSpace.amount !== undefined && (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '900',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: activeInspectSpace.amount > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: activeInspectSpace.amount > 0 ? '#34d399' : '#f87171'
                  }}>
                    {activeInspectSpace.amount > 0 ? `+${activeInspectSpace.amount}万円` : `${activeInspectSpace.amount}万円`}
                  </span>
                )}
              </div>

              <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                {activeInspectSpace.desc}
              </div>

              {playersOnSpace.length > 0 && (
                <div style={{ fontSize: '11px', color: '#fde047', marginTop: '4px', fontWeight: 'bold' }}>
                  🚗 現在このマスに滞在中: {playersOnSpace.map((pl) => getPlayerName(pl.id)).join(', ')}
                </div>
              )}
            </div>

            <div style={{ fontSize: '11px', color: isHovering ? '#38bdf8' : '#94a3b8', fontWeight: 'bold', marginLeft: 'auto', textAlign: 'right' }}>
              {isHovering ? '👀 カーソル位置のマス詳細を表示中' : '💡 マスにカーソルを合わせると詳細を閲覧できます'}
            </div>
          </div>
        );
      })()}

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
            maxWidth: '600px',
            width: '100%',
            color: '#ffffff',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            maxHeight: '85vh',
            overflowY: 'auto'
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
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#fca5a5',
                  marginBottom: '4px'
                }}>
                  ⚠️ 就職は必須です！不合格の場合は就職浪人費用 -30万円 を支払い、就活エリアの起点（マス36）へ戻り再挑戦となります！
                </div>
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
                            応募する（内定獲得）
                          </button>
                        ) : (
                          <button
                            onClick={() => moves.chooseJob(pid, occ.id, true)}
                            title="ルーレット出目8以上で奇跡のコネ採用！不合格時は浪人費用 -30万円＆マス36へ戻る"
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

            {/* 進路分岐選択 (マス35) */}
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
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  🏙️ 大都会コースに進む（偏差値+2 / 上京費用 -20万円）
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
                  🌾 地元就職コースに進む（地元定着支援金 +30万円）
                </button>
              </div>
            )}

            {/* 中年キャリア大勝負分岐 (マス125) */}
            {G.currentSpaceModal.type === 'branch_midlife' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              </div>
            )}

            {/* マイホーム購入選択 (マス95) */}
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

            {/* 通常イベントマス（了解して次へ進む） */}
            {!['branch_career', 'branch_midlife', 'buy_house', 'choose_job'].includes(G.currentSpaceModal.type) && (
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
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span>🗺️ 人生すごろくコースマップ（全201マス: 0〜200 / 1ステージ35〜45マス特大構成）</span>
          <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
            🟢 幼少期(0-35) ➔ 💼 就職(36-75) ➔ 💍 結婚・家(76-115) ➔ ⚖️ 中年・帰省(116-155) ➔ 🏰 老後・ゴール(156-200)
          </span>
        </div>

        {/* ステージ切り替えタブバー */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.25)',
          padding: '8px 12px',
          borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>ステージ表示:</span>
          {[
            { id: 'all', label: '全マス (201マス)', color: '#38bdf8' },
            { id: 1, label: '🌱 第1: 幼少期 (0-35)', color: '#10b981' },
            { id: 2, label: '💼 第2: 就活・社会人 (36-75)', color: '#38bdf8' },
            { id: 3, label: '💍 第3: 結婚・家庭 (76-115)', color: '#f472b6' },
            { id: 4, label: '⚖️ 第4: 中年・大勝負 (116-155)', color: '#c084fc' },
            { id: 5, label: '🏰 第5: 老後・ゴール (156-200)', color: '#facc15' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStageFilter(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                border: stageFilter === tab.id ? `2px solid ${tab.color}` : '1px solid rgba(255,255,255,0.15)',
                background: stageFilter === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
                color: stageFilter === tab.id ? '#ffffff' : '#cbd5e1',
                fontSize: '11px',
                fontWeight: stageFilter === tab.id ? '900' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => {
              const sNum = myPlayer.position <= 35 ? 1 : (myPlayer.position <= 75 ? 2 : (myPlayer.position <= 115 ? 3 : (myPlayer.position <= 155 ? 4 : 5)));
              setStageFilter(sNum);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #10b981',
              background: 'rgba(16, 185, 129, 0.25)',
              color: '#6ee7b7',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            📍 あなたの現在地へジャンプ (#{myPlayer.position})
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '10px',
          maxHeight: '650px',
          overflowY: 'auto',
          paddingRight: '6px'
        }}>
          {BOARD_SPACES
            .filter((space) => {
              if (stageFilter === 'all') return true;
              const sNum = space.id <= 35 ? 1 : (space.id <= 75 ? 2 : (space.id <= 115 ? 3 : (space.id <= 155 ? 4 : 5)));
              return sNum === stageFilter;
            })
            .map((space) => {
            const playersHere = Object.values(G.players).filter((p) => p.position === space.id);
            const isHovered = hoveredSpace?.id === space.id;
            const isMyPieceHere = myPlayer.position === space.id;

            let borderColor = '#10b981';
            if (space.id <= 35) borderColor = '#10b981';
            else if (space.id <= 75) borderColor = '#38bdf8';
            else if (space.id <= 115) borderColor = '#f472b6';
            else if (space.id <= 155) borderColor = '#c084fc';
            else if (space.id === 200) borderColor = '#facc15';
            else borderColor = '#fb923c';

            return (
              <div
                key={space.id}
                onMouseEnter={() => setHoveredSpace(space)}
                onMouseLeave={() => setHoveredSpace(null)}
                title={`#${space.id} ${space.title}\n${space.desc}${space.amount ? ` (${space.amount > 0 ? '+' : ''}${space.amount}万円)` : ''}`}
                style={{
                  background: isHovered
                    ? 'rgba(56, 189, 248, 0.18)'
                    : isMyPieceHere
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(255,255,255,0.06)',
                  border: isHovered
                    ? '2px solid #38bdf8'
                    : isMyPieceHere
                    ? '2px solid #34d399'
                    : `2px solid ${borderColor}`,
                  borderRadius: '12px',
                  padding: '8px',
                  minHeight: '84px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  cursor: 'pointer',
                  transform: isHovered ? 'translateY(-2px)' : 'none',
                  boxShadow: isHovered
                    ? '0 6px 16px rgba(56, 189, 248, 0.4)'
                    : isMyPieceHere
                    ? '0 0 12px rgba(52, 211, 153, 0.4)'
                    : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94a3b8' }}>
                    <span style={{ fontWeight: 'bold' }}>#{space.id}</span>
                    <span style={{ fontSize: '13px' }}>{space.icon || '📍'}</span>
                    {space.stop && (
                      <span style={{ color: '#ffffff', background: '#dc2626', padding: '1px 5px', borderRadius: '6px', fontWeight: '900', fontSize: '9px' }}>
                        STOP
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', marginTop: '4px', lineHeight: 1.3 }}>
                    {space.title}
                  </div>
                </div>

                {/* 金額バッジがあれば表示 */}
                {space.amount !== undefined && (
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: space.amount > 0 ? '#34d399' : '#f87171',
                    marginTop: '4px'
                  }}>
                    {space.amount > 0 ? `+${space.amount}万` : `${space.amount}万`}
                  </div>
                )}

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
                          animation: 'carBounce 2s infinite ease-in-out',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
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
