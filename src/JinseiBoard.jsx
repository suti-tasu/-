// JinseiBoard.jsx - 47都道府県 ご当地人生ゲームの盤面コンポーネント
// 通常モード ＋ 隠しリアルハードモード（親ガチャ・偏差値・学歴フィルター）対応
import React, { useState, useEffect } from 'react';
import { UnifiedLobby } from './UnifiedLobby';
import { PREFECTURES, REGIONS, getPrefectureById } from './data/prefecturesData';
import { LIFE_ERAS, getEraById, getSpaceMoneyDetails } from './data/lifeErasData';
import { BOARD_SPACES, HOUSES, OCCUPATIONS, PREFECTURE_FAMOUS_COMPANIES, JOB_ROULETTE_TABLE, buildJobRouletteInfo, getAvailableOccupationsForPlayer, getPrefectureCompanyOcc, isFamilyRouletteZoneSpace, getOccupationRankTitle, getSalaryForRank, isQualifiedForJob, calculateCurrentAssets, getHousePricingForPlayer } from './JinseiGame';

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
  const [selectedChangeJobId, setSelectedChangeJobId] = useState(null);
  const [isSpinningJobChange, setIsSpinningJobChange] = useState(false);
  const [tempJobChangeRoll, setTempJobChangeRoll] = useState(null);
  const [isSpinningFamily, setIsSpinningFamily] = useState(false);
  const [tempFamilyRoll, setTempFamilyRoll] = useState(null);
  const [isSpectatorDismissed, setIsSpectatorDismissed] = useState(false);
  const [showCareerGuideModal, setShowCareerGuideModal] = useState(false);
  const [careerGuideTab, setCareerGuideTab] = useState('overview');
  const [selectedHistoryPid, setSelectedHistoryPid] = useState(null);

  useEffect(() => {
    setIsSpectatorDismissed(false);
    setSelectedChangeJobId(null);
    setIsSpinningJobChange(false);
    setTempJobChangeRoll(null);
  }, [G.currentSpaceModal?.spaceId, G.currentSpaceModal?.type, G.turnStep]);

  // メインルーレットの出目に合わせてホイールの針（12時方向）と数字をピタッと一致させる
  useEffect(() => {
    if (isSpinningLocal || !G.rouletteValue) return;
    const val = Math.max(1, Math.min(10, G.rouletteValue));
    const targetMod = (360 - ((val - 1) * 36 + 18)) % 360;
    setSpinDegree((prev) => {
      const currentMod = ((prev % 360) + 360) % 360;
      const diff = (targetMod - currentMod + 360) % 360;
      return diff === 0 ? prev : prev + diff;
    });
  }, [G.rouletteValue, G.turnStep, ctx.currentPlayer, isSpinningLocal]);

  const isSpectator = playerID === null || playerID === undefined;
  const pid = isSpectator ? '0' : playerID.toString();
  const myPlayer = G.players[pid] || G.players['0'];
  const isMyTurn = !isSpectator && ctx.currentPlayer === pid;

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

  // ログや詳細テキスト内の「Player X」「PX:」をプレイヤー名へ置換
  const formatLogWithNames = (text) => {
    if (typeof text !== 'string') return text;
    return text
      .replace(/Player (\d+)/g, (_, id) => getPlayerName(id))
      .replace(/\bP(\d+):/g, (_, id) => `${getPlayerName(id)}:`);
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

  // ルーレット回転アニメーション（3回転後に確定出目の扇形へピタッと停止）
  const handleSpinRoulette = () => {
    if (!isMyTurn || G.turnStep !== 'spin' || isSpinningLocal || myPlayer.isGoal) return;
    setIsSpinningLocal(true);

    setSpinDegree((prev) => prev + 1080);

    setTimeout(() => {
      moves.spinRoulette(pid);
      setIsSpinningLocal(false);
    }, 850);
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
        pid={isSpectator ? null : pid}
        getPlayerName={getPlayerName}
        isHost={!isSpectator && pid === '0'}
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
        {!isSpectator && (
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
        )}

        {isSpectator ? (
          <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(0,0,0,0.35)', borderRadius: '16px', marginBottom: '16px', border: '1px solid rgba(56,189,248,0.4)' }}>
            <div style={{ fontSize: '36px', marginBottom: '6px' }}>👀</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#fde047' }}>観戦モード中：出生地の決定を待っています…</div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>全員が出身地を選ぶと人生ゲーム本編が始まります！</div>
          </div>
        ) : G.isHardMode ? (
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
                日本のどこに産み落とされるか、そして実家の年収・初期偏差値・初期体力まで、すべては神のみぞ知る運命のガチャで決まります！
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
                  親の年収（親ガチャ）と初期偏差値・初期体力も同時にルーレットで決定されます！（※再選択不可）
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
                          💀 親ガチャ結果: 実家年収 {myPlayer.parentIncome.income}万円（{myPlayer.parentIncome.title}）➔ 🎓偏差値【{myPlayer.hensachi}】 • 🏃体力【{myPlayer.stamina || 50}】
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
                    {(() => {
                      const localComp = getPrefectureCompanyOcc(p.id);
                      if (!localComp) return null;
                      return (
                        <div style={{ fontSize: '11px', color: '#93c5fd', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>🏢 地元企業枠: <strong>{localComp.icon} {localComp.title.split('（')[0]}</strong></span>
                          <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{localComp.baseSalary}万</span>
                        </div>
                      );
                    })()}

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
              const isMe = !isSpectator && p.id === pid;
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
                      (親年収${p.parentIncome.income}万 / 偏差値${p.hensachi} / 体力${p.stamina || 50})
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
                      親年収: {p.parentIncome.income}万円 ({p.parentIncome.title}) ➔ 🎓偏差値【{p.hensachi}】 • 🏃体力【{p.stamina || 50}】
                      {p.parentIncome.roll <= 3 && idx === 0 && ' 🔥【下剋上キング賞獲得！】'}
                    </div>
                  )}
                  {(() => {
                    const bd = p.finalBreakdown || { ...calculateCurrentAssets(p), awardsBonus: 0 };
                    return (
                      <div style={{ fontSize: '12px', opacity: 0.9, lineHeight: 1.5 }}>
                        <div>
                          💵 現金: <strong>{bd.cash?.toLocaleString()}万</strong>
                          {' • '}🏡 不動産({p.house ? p.house.name : 'なし'}): <strong>+{bd.houseValue?.toLocaleString()}万</strong>
                          {' • '}🎁 名産品({p.souvenirs?.length || 0}品): <strong>+{bd.souvenirValue?.toLocaleString()}万</strong>
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.85 }}>
                          👨‍👩‍👧‍👦 家族({p.car.spouse ? '配偶者あり' : '独身'}/子{p.car.kids}人): <strong>+{bd.familyValue?.toLocaleString()}万</strong>
                          {bd.localCompanyBonus > 0 && <> • 🏠 ご当地企業賞: <strong>+{bd.localCompanyBonus}万</strong></>}
                          {bd.awardsBonus > 0 && <> • 🏆 各賞ボーナス: <strong>+{bd.awardsBonus}万</strong></>}
                          {bd.debtPenalty > 0 && <> • 💳 借金返済: <strong style={{ color: '#fca5a5' }}>-{bd.debtPenalty}万</strong></>}
                        </div>
                      </div>
                    );
                  })()}
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

        {/* =====================================================
            📈 所持金推移グラフ（全プレイヤーの生涯マネー推移）
           ===================================================== */}
        {(() => {
          const playersList = G.ranking || Object.values(G.players);
          const allSeries = playersList.map((pl) => ({
            player: pl,
            points: (pl.moneyHistory && pl.moneyHistory.length > 0)
              ? pl.moneyHistory
              : [{ step: 0, era: 1, label: '開始', money: pl.money }, { step: 1, era: 5, label: '終了', money: pl.money }],
          }));
          const maxLen = Math.max(2, ...allSeries.map((s) => s.points.length));
          const allMoneyVals = allSeries.flatMap((s) => s.points.map((pt) => pt.money));
          const rawMin = Math.min(0, ...allMoneyVals);
          const rawMax = Math.max(500, ...allMoneyVals);
          const padRange = Math.max(100, Math.round((rawMax - rawMin) * 0.1));
          const yMin = rawMin - (rawMin < 0 ? padRange : 0);
          const yMax = rawMax + padRange;
          const ySpan = Math.max(1, yMax - yMin);

          const svgW = 760;
          const svgH = 260;
          const padL = 62;
          const padR = 22;
          const padT = 20;
          const padB = 34;
          const plotW = svgW - padL - padR;
          const plotH = svgH - padT - padB;

          const getX = (idx, len) => padL + (len <= 1 ? 0 : (idx / Math.max(1, maxLen - 1)) * plotW);
          const getY = (val) => padT + ((yMax - val) / ySpan) * plotH;

          // 時代切り替わり位置（先頭プレイヤーのデータから取得）
          const refPts = allSeries[0]?.points || [];
          const eraMarkers = [];
          let lastEra = null;
          refPts.forEach((pt, idx) => {
            if (pt.era !== lastEra) {
              eraMarkers.push({ idx, era: pt.era, label: pt.era === 1 ? '子ども' : pt.era === 2 ? '青年' : pt.era === 3 ? '壮年' : pt.era === 4 ? '熟年' : 'シニア' });
              lastEra = pt.era;
            }
          });

          const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(yMin + ySpan * t));

          return (
            <div style={{
              background: 'rgba(15, 23, 42, 0.78)',
              borderRadius: '18px',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '18px 20px',
              marginBottom: '22px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#38bdf8' }}>
                  📈 生涯・所持金推移グラフ（万円）
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12px' }}>
                  {allSeries.map(({ player: pl, points }) => {
                    const peak = Math.max(...points.map((pt) => pt.money));
                    return (
                      <div key={pl.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.06)', padding: '3px 9px', borderRadius: '999px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: pl.color, display: 'inline-block' }} />
                        <strong style={{ color: '#fff' }}>{getPlayerName(pl.id)}</strong>
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>(最高 {peak.toLocaleString()}万)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', minWidth: '520px', height: 'auto', display: 'block' }}>
                  {/* 時代境界線 */}
                  {eraMarkers.map((em, i) => {
                    const x = getX(em.idx, refPts.length);
                    return (
                      <g key={i}>
                        <line x1={x} y1={padT} x2={x} y2={svgH - padB} stroke="rgba(148, 163, 184, 0.22)" strokeDasharray="4,4" />
                        <text x={x + 4} y={svgH - 12} fill="#94a3b8" fontSize="10" fontWeight="bold">{em.label}</text>
                      </g>
                    );
                  })}

                  {/* Y軸グリッド・目盛り */}
                  {yTicks.map((tv, i) => {
                    const y = getY(tv);
                    return (
                      <g key={i}>
                        <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="rgba(255,255,255,0.08)" />
                        <text x={padL - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="10">
                          {tv.toLocaleString()}
                        </text>
                      </g>
                    );
                  })}

                  {/* 0万円ライン */}
                  {yMin < 0 && yMax > 0 && (
                    <line x1={padL} y1={getY(0)} x2={svgW - padR} y2={getY(0)} stroke="rgba(248, 113, 113, 0.5)" strokeWidth="1.2" strokeDasharray="3,3" />
                  )}

                  {/* 各プレイヤーの折れ線 */}
                  {allSeries.map(({ player: pl, points }) => {
                    const ptsAttr = points.map((pt, idx) => `${getX(idx, points.length).toFixed(1)},${getY(pt.money).toFixed(1)}`).join(' ');
                    const lastPt = points[points.length - 1];
                    const lx = getX(points.length - 1, points.length);
                    const ly = getY(lastPt.money);
                    return (
                      <g key={pl.id}>
                        <polyline
                          fill="none"
                          stroke={pl.color}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={ptsAttr}
                        />
                        <circle cx={lx} cy={ly} r="4.5" fill={pl.color} stroke="#ffffff" strokeWidth="1.5" />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          );
        })()}

        {/* =====================================================
            📜 各プレイヤーの人生史（生涯タイムライン）
           ===================================================== */}
        {(() => {
          const playersList = G.ranking || Object.values(G.players);
          const activePid = selectedHistoryPid && playersList.some((pl) => pl.id === selectedHistoryPid)
            ? selectedHistoryPid
            : (playersList[0]?.id || '0');
          const targetP = playersList.find((pl) => pl.id === activePid) || playersList[0];
          const history = targetP?.lifeHistory || [];

          return (
            <div style={{
              background: 'rgba(15, 23, 42, 0.78)',
              borderRadius: '18px',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              padding: '18px 20px',
              marginBottom: '26px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#fbbf24' }}>
                  📜 人生史タイムライン（プレイバック）
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {playersList.map((pl, idx) => {
                    const isSel = pl.id === targetP?.id;
                    return (
                      <button
                        key={pl.id}
                        onClick={() => setSelectedHistoryPid(pl.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '999px',
                          border: isSel ? `2px solid ${pl.color}` : '1px solid rgba(255,255,255,0.2)',
                          background: isSel ? `${pl.color}33` : 'rgba(255,255,255,0.06)',
                          color: '#ffffff',
                          fontWeight: isSel ? '900' : 'bold',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}位`} {getPlayerName(pl.id)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {targetP && (
                <>
                  {/* 人物プロフィールサマリー */}
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    marginBottom: '12px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    borderLeft: `4px solid ${targetP.color}`
                  }}>
                    <span>🗾 出身: <strong>{targetP.prefecture?.emoji} {targetP.prefecture?.name}</strong></span>
                    <span>💼 最終職業: <strong>{targetP.occupation ? `${targetP.occupation.icon} ${targetP.occupation.title}${getOccupationRankTitle(targetP.occupation, targetP.jobRank) ? `（${getOccupationRankTitle(targetP.occupation, targetP.jobRank)}）` : ''}` : '無職'}</strong></span>
                    <span>📚 学力: <strong>{targetP.academic ?? 50}</strong></span>
                    <span>🏃 体力: <strong>{targetP.stamina ?? 50}</strong></span>
                    <span>🎓 偏差値: <strong>{targetP.hensachi ?? 50}</strong></span>
                    <span>👨‍👩‍👧‍👦 家族: <strong>{targetP.car?.spouse ? '配偶者あり' : '独身'} / 子{targetP.car?.kids || 0}人</strong></span>
                    <span>🎁 名産品: <strong>{targetP.souvenirs?.length || 0}品</strong></span>
                  </div>

                  {/* 年表イベント一覧 */}
                  <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingRight: '6px'
                  }}>
                    {history.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#94a3b8', padding: '12px', textAlign: 'center' }}>
                        人生史データがありません
                      </div>
                    ) : (
                      history.map((ev, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.04)',
                            borderLeft: `3px solid ${ev.eraColor || '#38bdf8'}`
                          }}
                        >
                          <span style={{ fontSize: '18px', flexShrink: 0 }}>{ev.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <div style={{ fontSize: '13px', fontWeight: '900', color: '#ffffff' }}>
                                <span style={{
                                  fontSize: '10px',
                                  background: `${ev.eraColor || '#38bdf8'}33`,
                                  color: ev.eraColor || '#7dd3fc',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  marginRight: '6px'
                                }}>
                                  {ev.eraName}
                                </span>
                                {ev.title}
                              </div>
                              <div style={{ fontSize: '11px', color: '#fde047', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                所持金: {ev.moneyAfter?.toLocaleString()}万
                              </div>
                            </div>
                            {ev.detail && (
                              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px', lineHeight: 1.4 }}>
                                {formatLogWithNames(ev.detail)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })()}

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
  const isActionPlayer = !isSpectator && turnPid === pid;
  const activeInspectSpace = hoveredSpace || viewingEra.spaces.find((s) => s.id === G.players[turnPid]?.position) || viewingEra.spaces[0];
  const isHovering = !!hoveredSpace;
  const stageTag = { name: `第${viewingEra.id}時代: ${viewingEra.name}`, color: viewingEra.color, bg: `${viewingEra.color}26`, stageNum: viewingEra.id, sub: viewingEra.sub };
  const playersOnSpace = Object.values(G.players).filter((p) => G.era === viewingEra.id && p.position === activeInspectSpace.id);
  const inspectMoneyInfo = getSpaceMoneyDetails(activeInspectSpace, turnPlayer);

  const allPlayers = Object.values(G.players);
  const leftPlayers = allPlayers.length > 2 ? allPlayers.slice(0, 2) : [allPlayers[0]].filter(Boolean);
  const rightPlayers = allPlayers.length > 2 ? allPlayers.slice(2, 4) : [allPlayers[1]].filter(Boolean);

  const renderPlayerCard = (p) => {
    if (!p) return null;
    const isCurrent = ctx.currentPlayer === p.id;
    const assets = calculateCurrentAssets(p);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '4px', margin: '2px 0' }}>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#fde047' }}>
            {p.money.toLocaleString()} <span style={{ fontSize: '10px', color: '#fff' }}>万円</span>
          </div>
          <div style={{ fontSize: '9px', color: '#a7f3d0', fontWeight: 'bold' }} title="現金 + 不動産 + 名産品 + 家族 + ご当地企業賞 - 借金">
            💎総資産:{assets.estimatedTotalAsset.toLocaleString()}万
          </div>
        </div>

        {/* 保有資産内訳（マイホーム・名産品・家族・借金） */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '3px',
          marginBottom: '4px',
          fontSize: '8.5px'
        }}>
          <span style={{
            padding: '1px 5px',
            borderRadius: '4px',
            background: p.house ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255,255,255,0.06)',
            border: p.house ? '1px solid rgba(52, 211, 153, 0.45)' : '1px solid rgba(255,255,255,0.1)',
            color: p.house ? '#6ee7b7' : '#94a3b8',
            fontWeight: 'bold'
          }} title={p.house ? `${p.house.name}（決算評価額 +${assets.houseValue}万）` : 'マイホーム未購入'}>
            {p.house ? `${p.house.icon}家:+${assets.houseValue}万` : '🏠家:なし'}
          </span>
          <span style={{
            padding: '1px 5px',
            borderRadius: '4px',
            background: (p.souvenirs?.length || 0) > 0 ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255,255,255,0.06)',
            border: (p.souvenirs?.length || 0) > 0 ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255,255,255,0.1)',
            color: (p.souvenirs?.length || 0) > 0 ? '#7dd3fc' : '#94a3b8',
            fontWeight: 'bold'
          }} title={`ご当地名産品 ${p.souvenirs?.length || 0}品（合計評価額 +${assets.souvenirValue}万）`}>
            🎁土産{p.souvenirs?.length || 0}:+{assets.souvenirValue}万
          </span>
          {assets.familyValue > 0 && (
            <span style={{
              padding: '1px 5px',
              borderRadius: '4px',
              background: 'rgba(244, 114, 182, 0.18)',
              border: '1px solid rgba(244, 114, 182, 0.4)',
              color: '#fbcfe8',
              fontWeight: 'bold'
            }}>
              👪家族:+{assets.familyValue}万
            </span>
          )}
          {assets.localCompanyBonus > 0 && (
            <span style={{
              padding: '1px 5px',
              borderRadius: '4px',
              background: 'rgba(245, 158, 11, 0.22)',
              border: '1px solid rgba(251, 191, 36, 0.45)',
              color: '#fde047',
              fontWeight: 'bold'
            }} title="ご当地有名企業勤務特典：毎給料+20% / 住宅10%OFF / 退職金1.25倍 / 決算+300万">
              🏠地元賞:+300万
            </span>
          )}
          {assets.debtPenalty > 0 && (
            <span style={{
              padding: '1px 5px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(248, 113, 113, 0.5)',
              color: '#fca5a5',
              fontWeight: 'bold'
            }}>
              💳借金:-{assets.debtPenalty}万
            </span>
          )}
        </div>

        {/* 学力 ＆ 体力 パラメータバー */}
        <div style={{
          marginTop: '4px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '7px',
          padding: '4px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* 学力 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '1px' }}>
              <span style={{ color: '#7dd3fc', fontWeight: 'bold' }}>📚 学力</span>
              <span style={{ color: '#38bdf8', fontWeight: '900' }}>{p.academic || 50} / 100</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.12)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.max(0, p.academic || 50))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          {/* 体力 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '1px' }}>
              <span style={{ color: '#86efac', fontWeight: 'bold' }}>🏃 体力</span>
              <span style={{ color: '#4ade80', fontWeight: '900' }}>{p.stamina || 50} / 100</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.12)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.max(0, p.stamina || 50))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #059669, #34d399)',
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {G.isHardMode ? (
          <div style={{
            fontSize: '10px',
            color: '#fca5a5',
            lineHeight: 1.3,
            marginTop: '3px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.25)',
            padding: '2px 5px',
            borderRadius: '5px'
          }}>
            <span>実家:{p.parentIncome ? `${p.parentIncome.income}万` : '未定'}</span>
            <span>🎓偏差値:<strong style={{ color: '#fde047' }}>{p.hensachi || 50}</strong></span>
            <span>🏃体力:<strong style={{ color: '#86efac' }}>{p.stamina || 50}</strong></span>
          </div>
        ) : (
          <div style={{
            fontSize: '10px',
            color: '#94a3b8',
            lineHeight: 1.3,
            marginTop: '3px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.25)',
            padding: '2px 5px',
            borderRadius: '5px'
          }}>
            <span>📚学力:<strong style={{ color: '#7dd3fc' }}>{p.academic || 50}</strong></span>
            <span>🏃体力:<strong style={{ color: '#86efac' }}>{p.stamina || 50}</strong></span>
            {p.branchRoute === 'tokyo' && <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>🏙️×1.2</span>}
          </div>
        )}
        <div style={{ fontSize: '10px', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            💼 {p.occupation ? p.occupation.title : '無職（求職中）'}
          </span>
          {p.occupation && p.occupation.id !== 'unemployed' && getOccupationRankTitle(p.occupation, p.jobRank) && (
            <span style={{
              flexShrink: 0,
              fontSize: '9px',
              fontWeight: 'bold',
              padding: '1px 5px',
              borderRadius: '4px',
              background: (p.jobRank || 0) >= 3 ? 'rgba(250, 204, 21, 0.25)' : 'rgba(56, 189, 248, 0.2)',
              color: (p.jobRank || 0) >= 3 ? '#fde047' : '#7dd3fc',
              border: `1px solid ${(p.jobRank || 0) >= 3 ? 'rgba(250, 204, 21, 0.5)' : 'rgba(56, 189, 248, 0.4)'}`
            }}>
              {getOccupationRankTitle(p.occupation, p.jobRank)}
            </span>
          )}
          {p.occupation?.isLocalCompany && (
            <span style={{
              flexShrink: 0,
              fontSize: '8.5px',
              fontWeight: '900',
              padding: '1px 4px',
              borderRadius: '4px',
              background: 'rgba(245, 158, 11, 0.28)',
              color: '#fde047',
              border: '1px solid rgba(251, 191, 36, 0.55)'
            }} title="ご当地企業特典：毎給料+20% / 住宅10%OFF / 退職金1.25倍 / 決算+300万">
              🏠特典
            </span>
          )}
        </div>
        {/* 時代進行ターン＆コースバッジ */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '3px',
          fontSize: '9px',
          background: 'rgba(0,0,0,0.25)',
          padding: '2px 5px',
          borderRadius: '5px'
        }}>
          <span style={{ color: '#38bdf8' }}>
            ⏳ 残り {Math.max(0, G.eraMaxTurns - (p.eraTurns || 0))} / {G.eraMaxTurns}T
          </span>
          {p.eraRoute ? (
            <span style={{
              color: p.eraRoute === 'A' ? '#7dd3fc' : '#fde047',
              fontWeight: 'bold'
            }}>
              🛤️ {p.eraRoute === 'A' ? 'Aルート' : 'Bルート'}
            </span>
          ) : (
            <span style={{ color: '#94a3b8' }}>共通区間</span>
          )}
          {(G.era === 3 || G.era === 4 || G.era === 5) && (
            <span style={{ color: ((p.eraTurns || 0) % 2 === 1) ? '#34d399' : '#94a3b8', fontWeight: 'bold', fontSize: '9px' }}>
              {G.era === 5 ? '👵年金' : '💵給料'}{((p.eraTurns || 0) % 2 === 1) ? ':次回支給!' : ':2T毎'}
            </span>
          )}
        </div>
        {/* 家族・子供ステータスバッジ */}
        <div style={{
          marginTop: '4px',
          padding: '3px 6px',
          borderRadius: '7px',
          background: p.car.kids > 0 ? 'rgba(244, 114, 182, 0.2)' : 'rgba(255,255,255,0.06)',
          border: p.car.kids > 0 ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '3px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px' }}>{p.car.kids > 0 ? '👨‍👩‍👧‍👦' : (p.car.spouse ? '👫' : '👤')}</span>
            <strong style={{ fontSize: '10px', color: p.car.kids > 0 ? '#fbcfe8' : '#cbd5e1' }}>
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
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontSize: '8px',
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
          <div style={{ fontSize: '8px', color: '#6ee7b7', marginTop: '1px', textAlign: 'right' }}>
            給料手当 +{p.car.kids * (p.prefecture?.passiveType === 'kibidango_family' ? 30 : 15)}万 / 決算 +{p.car.kids * (p.prefecture?.passiveType === 'family_bonus_boost' ? 500 : 300)}万
          </div>
        )}

        {/* 出身県＆パッシブ恩恵 */}
        {p.prefecture && (
          <div style={{
            marginTop: '4px',
            padding: '4px 6px',
            borderRadius: '7px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: '9px',
            color: '#fef3c7'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#fde047' }}>
                🗾 {p.prefecture.emoji} {p.prefecture.name}
              </span>
              <span style={{ fontSize: '8px', background: p.prefecture.color, color: '#fff', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' }}>
                {p.prefecture.regionName}
              </span>
            </div>
            <div style={{ color: '#fed7aa', fontWeight: 'bold', marginTop: '1px', fontSize: '8px' }}>
              ✨【{p.prefecture.traitName}】
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '8px', lineHeight: 1.2, marginTop: '1px' }}>
              {p.prefecture.traitDesc}
            </div>
            {(p.insurance?.life || p.insurance?.fire) && (
              <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                {p.insurance?.life && (
                  <span style={{ fontSize: '7px', background: '#0284c7', color: '#fff', padding: '0 3px', borderRadius: '3px' }}>
                    🛡️ 生命保険付帯
                  </span>
                )}
                {p.insurance?.fire && (
                  <span style={{ fontSize: '7px', background: '#dc2626', color: '#fff', padding: '0 3px', borderRadius: '3px' }}>
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
              marginTop: '4px',
              padding: '3px 5px',
              borderRadius: '7px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontSize: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ color: '#7dd3fc', fontWeight: 'bold' }}>
                  🎁 名産品 ({p.souvenirs.length}品)
                </span>
                <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                  +{sTotal}万
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxHeight: '45px', overflowY: 'auto' }}>
                {p.souvenirs.map((s, sIdx) => (
                  <span
                    key={sIdx}
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      borderRadius: '3px',
                      padding: '1px 3px',
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
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div style={{
      maxWidth: '1600px',
      margin: '10px auto',
      padding: '0 10px',
      fontFamily: "'Segoe UI', -apple-system, sans-serif"
    }}>
      <style>{`
        .game-main-layout {
          display: grid;
          grid-template-columns: 265px 1fr 265px;
          gap: 12px;
          align-items: start;
          width: 100%;
        }
        @media (max-width: 1280px) {
          .game-main-layout {
            grid-template-columns: 235px 1fr 235px;
            gap: 10px;
          }
        }
        @media (max-width: 980px) {
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
          <span>💀 【隠しモード】リアル格差社会ハードモード稼働中（親ガチャ ➔ 偏差値＆体力 ➔ 就職選考フィルター）</span>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowCareerGuideModal(true)}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '1.5px solid #38bdf8',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.15s'
              }}
              title="全12職業の給料・必要学力・必要体力を確認できます"
            >
              <span style={{ fontSize: '15px' }}>📋</span>
              <span>職業一覧・転職ライン確認</span>
            </button>

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
            {G.logs[0] ? formatLogWithNames(G.logs[0]) : 'ゲーム進行中…'}
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
              {formatLogWithNames(G.currentSpaceModal.desc)}
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
                        {formatLogWithNames(G.currentSpaceModal.details)}
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

            {/* 役職昇進お祝いバナー */}
            {G.currentSpaceModal.promotionData && (() => {
              const pd = G.currentSpaceModal.promotionData;
              return (
                <div style={{
                  margin: '10px 0 16px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.22), rgba(249, 115, 22, 0.28))',
                  border: '2px solid #facc15',
                  boxShadow: '0 0 18px rgba(250, 204, 21, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <span style={{ fontSize: '32px' }}>{pd.alreadyMax ? '👑' : '🎊'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#fde047' }}>
                      {pd.alreadyMax
                        ? `【最高位功労賞！】${pd.icon || '💼'} ${pd.occTitle}`
                        : `【祝・スピード昇進！】${pd.icon || '💼'} ${pd.occTitle}`}
                    </div>
                    {pd.alreadyMax ? (
                      <div style={{ fontSize: '12px', color: '#ffffff', marginTop: '4px', fontWeight: 'bold' }}>
                        すでに最高役職「<span style={{ color: '#fde047' }}>{pd.newRankTitle}</span>」（ランク5/5）到達済み！特別功労賞与 <span style={{ color: '#34d399' }}>+{pd.maxBonus}万円</span> 獲得！
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#ffffff', marginTop: '4px', lineHeight: 1.5 }}>
                        役職: <span style={{ color: '#cbd5e1' }}>{pd.oldRankTitle}</span> ➔ <strong style={{ color: '#fde047', fontSize: '14px' }}>{pd.newRankTitle}</strong>（ランク {pd.newRank + 1}/5）<br />
                        給料ベース: <span style={{ color: '#cbd5e1' }}>{pd.oldSalary}万円</span> ➔ <strong style={{ color: '#34d399', fontSize: '14px' }}>{pd.newSalary}万円</strong>（<span style={{ color: '#34d399' }}>+{pd.salaryDelta}万円 UP!</span>）
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

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
            {G.currentSpaceModal.type === 'choose_job' && (() => {
              const targetHensachi = turnPlayer.hensachi || 50;
              const targetAcademic = turnPlayer.academic || 50;
              const targetStamina = turnPlayer.stamina || 50;
              const targetName = isActionPlayer ? 'あなた' : getPlayerName(turnPid);
              const rInfo = G.currentSpaceModal.rouletteInfo || buildJobRouletteInfo(turnPlayer, G.isHardMode);
              const slots = rInfo.slots || [];
              const unqualifiedJobs = rInfo.unqualifiedJobs || [];

              return (
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
                      ? `💀 ハードモード適性ルーレット（${targetName}: 🎓偏差値 ${targetHensachi} / 🏃体力 ${targetStamina}）：全${rInfo.totalRegularJobs || 18}職のうち条件を満たす【${rInfo.qualifiedCount}種】だけで10枠を構成しました！${rInfo.filledCount > 0 ? `（不足分 ${rInfo.filledCount}枠をなれる職業で穴埋め済み）` : ''}`
                      : `🎡 パーソナライズ就職ルーレット（${targetName}: 📚学力 ${targetAcademic} / 🏃体力 ${targetStamina}）：全${rInfo.totalRegularJobs || 18}職のうち現在の能力で就ける【${rInfo.qualifiedCount}種】だけで10枠を作成しました！${rInfo.filledCount > 0 ? `（なれない職業を外し、なれる職業で ${rInfo.filledCount}枠を穴埋め済み！）` : ''}`}
                  </div>

                  {/* 出身県ご当地企業のエントリー状況バナー */}
                  {rInfo.excludedByTokyoBranch && rInfo.rawLocalCompany ? (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(59, 130, 246, 0.16)',
                      border: '1.5px solid rgba(96, 165, 250, 0.55)',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      color: '#bfdbfe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      <span>
                        🏙️ 上京（大都会コース）を選択したため、出身企業【{rInfo.rawLocalCompany.icon} {rInfo.rawLocalCompany.title}】はルーレット対象外となります
                      </span>
                    </div>
                  ) : rInfo.localCompany && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: rInfo.localCompanyQualified ? 'rgba(245, 158, 11, 0.18)' : 'rgba(239, 68, 68, 0.14)',
                      border: rInfo.localCompanyQualified ? '1.5px solid #fbbf24' : '1.5px solid rgba(248, 113, 113, 0.55)',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      color: rInfo.localCompanyQualified ? '#fde047' : '#fecaca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      <span>
                        {rInfo.localCompanyQualified
                          ? `🏠 ✨ 出身企業【${rInfo.localCompany.icon} ${rInfo.localCompany.title}】がルーレット1番枠にエントリー済み！`
                          : `🏠 ⚠️ 出身企業【${rInfo.localCompany.icon} ${rInfo.localCompany.title}】は条件未達のためルーレット除外`}
                      </span>
                      <span style={{ fontWeight: 'bold', color: rInfo.localCompanyQualified ? '#4ade80' : '#fca5a5' }}>
                        {G.isHardMode
                          ? `必要: 🎓偏差値${rInfo.localCompany.minHensachi}(現在${targetHensachi})・🏃体力${rInfo.localCompany.minStamina}(現在${targetStamina})`
                          : `必要: 📚学力${rInfo.localCompany.reqAcademic}(現在${targetAcademic})・🏃体力${rInfo.localCompany.reqStamina}(現在${targetStamina})`}
                      </span>
                    </div>
                  )}

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
                    {slots.map(({ slot: num, occ, isFill }) => {
                      return (
                        <div
                          key={num}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '10px',
                            background: occ.isLocalCompany
                              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(59, 130, 246, 0.18))'
                              : isFill
                              ? 'rgba(245, 158, 11, 0.12)'
                              : 'rgba(255,255,255,0.06)',
                            border: occ.isLocalCompany
                              ? '1.5px solid #fbbf24'
                              : isFill
                              ? '1px solid rgba(251, 191, 36, 0.4)'
                              : '1px solid rgba(255,255,255,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: occ.isLocalCompany ? '#f59e0b' : isFill ? '#fbbf24' : '#38bdf8',
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
                              color: occ.isLocalCompany ? '#fde047' : '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {occ.title}
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                              給料: {occ.baseSalary}万 {G.isHardMode
                                ? `• 偏差値:${occ.minHensachi || '不問'} • 体力:${occ.minStamina || '不問'}`
                                : `• 学力:${occ.reqAcademic || '不問'} • 体力:${occ.reqStamina || '不問'}`}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '900',
                            color: occ.isLocalCompany ? '#fde047' : isFill ? '#fde047' : '#4ade80',
                            flexShrink: 0
                          }}>
                            {occ.isLocalCompany ? '🏠 出身企業' : isFill ? '🔄 穴埋め' : '◯ 資格OK'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {unqualifiedJobs.length > 0 && (
                    <div style={{
                      padding: '8px 10px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px dashed rgba(239, 68, 68, 0.35)',
                      borderRadius: '10px',
                      fontSize: '11px',
                      color: '#fca5a5',
                      lineHeight: 1.5
                    }}>
                      <strong>🚫 条件未達のためルーレットから除外（{unqualifiedJobs.length}職）：</strong>
                      {unqualifiedJobs.map((uj) => (
                        <span key={uj.id} style={{ display: 'inline-block', marginRight: '8px' }}>
                          {uj.icon}{uj.title}({G.isHardMode ? `偏${uj.minHensachi}/体${uj.minStamina}` : `学${uj.reqAcademic}/体${uj.reqStamina}`})
                        </span>
                      ))}
                    </div>
                  )}

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
              );
            })()}

            {/* 就職ルーレット結果発表モーダル */}
            {G.currentSpaceModal.type === 'job_result' && G.currentSpaceModal.resultData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(() => {
                  const res = G.currentSpaceModal.resultData;
                  const passed = res.passed;
                  const resHensachi = res.playerHensachi ?? turnPlayer.hensachi ?? 50;
                  const resStamina = res.playerStamina ?? turnPlayer.stamina ?? 50;
                  const targetName = isActionPlayer ? 'あなた' : getPlayerName(turnPid);
                  const devReq = res.candidate.minHensachi || 0;
                  const stamReq = res.candidate.minStamina || 0;

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
                        {passed ? `採用決定！【${res.finalOcc.title}】` : `採用選考不合格…【${res.candidate.title}】`}
                      </div>

                      {passed ? (
                        <div>
                          <div style={{ fontSize: '15px', color: '#34d399', fontWeight: 'bold', marginTop: '6px' }}>
                            初任給: {res.finalOcc.baseSalary}万円
                          </div>
                          {res.localHireBonus > 0 && (
                            <div style={{
                              marginTop: '8px',
                              padding: '8px 12px',
                              borderRadius: '10px',
                              background: 'rgba(245, 158, 11, 0.22)',
                              border: '1px solid #fbbf24',
                              fontSize: '12px',
                              color: '#fde047',
                              fontWeight: 'bold'
                            }}>
                              🏠 ✨ ご当地企業内定特典発動！地元凱旋祝い金 +{res.localHireBonus}万円 獲得！<br />
                              <span style={{ fontSize: '11px', color: '#fef3c7' }}>（今後も 毎給料+20% / 住宅10%OFF / 退職金1.25倍 / 決算+300万！）</span>
                            </div>
                          )}
                          {res.isHardMode && (devReq > 0 || stamReq > 0) && (
                            <div style={{ fontSize: '12px', color: '#a7f3d0', marginTop: '6px', lineHeight: 1.5 }}>
                              {devReq > 0 && <div>🎓 {targetName}の偏差値【{resHensachi}】 ≧ 採用基準【{devReq}】（書類選考突破！）</div>}
                              {stamReq > 0 && <div>🏃 {targetName}の体力【{resStamina}】 ≧ 採用基準【{stamReq}】（体力選考突破！）</div>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '13px', color: '#f87171', marginTop: '6px', lineHeight: 1.5 }}>
                            {res.failReason ? `不採用理由: ${res.failReason}` : '採用基準に達しませんでした'}<br />
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

            {/* 転職ルーレット結果発表モーダル */}
            {G.currentSpaceModal.type === 'job_change_result' && G.currentSpaceModal.changeResultData && (() => {
              const res = G.currentSpaceModal.changeResultData;
              const passed = res.passed;
              const resultOcc = passed ? res.targetOcc : (res.isForced ? res.fallbackOcc : res.oldOcc);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: passed ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)',
                    border: passed ? '2px solid #10b981' : '2px solid #ef4444',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                      転職ルーレット出目（6〜10で成功 / 確率 50%）
                    </div>
                    <div style={{
                      fontSize: '46px',
                      fontWeight: '900',
                      color: passed ? '#facc15' : '#f87171',
                      lineHeight: 1,
                      marginBottom: '12px'
                    }}>
                      【 {res.roll} 】
                    </div>

                    <div style={{ fontSize: '44px', marginBottom: '8px' }}>
                      {passed ? (res.targetOcc?.icon || '🎉') : '💧'}
                    </div>

                    <div style={{ fontSize: '20px', fontWeight: '900', color: passed ? '#ffffff' : '#fca5a5', marginBottom: '6px' }}>
                      {passed
                        ? `転職決定！【${res.targetOcc?.title}】`
                        : `不採用…【${res.targetOcc?.title}】への転職失敗`}
                    </div>

                    {passed ? (
                      <div style={{ fontSize: '13px', color: '#d1fae5', lineHeight: 1.7 }}>
                        <div>
                          役職: <strong>{res.newRankTitle || '一般'}</strong>（引き継ぎランク { (res.carriedRank || 0) + 1 }/5）
                        </div>
                        <div style={{ fontSize: '16px', color: '#34d399', fontWeight: '900', marginTop: '4px' }}>
                          給料: {res.oldSalary}万円 ➔ {res.newSalary}万円
                        </div>
                        {res.localHireBonus > 0 && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            background: 'rgba(245, 158, 11, 0.22)',
                            border: '1px solid #fbbf24',
                            fontSize: '12px',
                            color: '#fde047',
                            fontWeight: 'bold'
                          }}>
                            🏠 ✨ ご当地企業転職特典！凱旋祝い金 +{res.localHireBonus}万円 ＆ 毎給料+20% / 住宅10%OFF / 退職金1.25倍 / 決算+300万！
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#fee2e2', lineHeight: 1.7 }}>
                        {res.isForced ? (
                          <div>
                            現役引退に伴い、暫定キャリアとして <strong>{resultOcc?.icon} {resultOcc?.title}</strong>（給料 {res.newSalary}万円）で再出発します！
                          </div>
                        ) : (
                          <div>
                            現在の職業 <strong>{resultOcc?.icon} {resultOcc?.title}</strong>（{res.oldRankTitle ? `${res.oldRankTitle} / ` : ''}給料 {res.newSalary}万円）をそのまま継続します！
                          </div>
                        )}
                      </div>
                    )}
                  </div>

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
                      👀 {getPlayerName(turnPid)} が転職ルーレット結果を確認中…
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 転職チャンス選択モーダル（職業を選んで2分の1で成功/失敗のルーレット抽選！） */}
            {G.currentSpaceModal.type === 'job_change' && (() => {
              const modal = G.currentSpaceModal;
              const isForced = modal.isForced;
              const currentOcc = turnPlayer.occupation;
              const pAcad = turnPlayer.academic || 50;
              const pStam = turnPlayer.stamina || 50;
              const availableOccs = getAvailableOccupationsForPlayer(turnPlayer);
              const selectedOcc = availableOccs.find((o) => o.id === selectedChangeJobId) || null;
              const previewRank = (currentOcc && currentOcc.id !== 'unemployed' && selectedOcc && selectedOcc.id !== 'unemployed')
                ? Math.floor((turnPlayer.jobRank || 0) / 2)
                : 0;
              const previewSalary = selectedOcc ? getSalaryForRank(selectedOcc, previewRank, 0) : 0;
              const previewRankTitle = selectedOcc ? getOccupationRankTitle(selectedOcc, previewRank) : '';

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* 強制転職・卒業引退バナー */}
                  {isForced && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.4))',
                      border: '1.5px solid #ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '32px' }}>
                        {modal.retireReason === 'idol_graduation' ? '🎤' : '⚽'}
                      </span>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '900', color: '#fca5a5' }}>
                          {modal.retireReason === 'idol_graduation' ? '🎤 💐【祝・アイドル卒業＆引退勧告！】' : '⚽ 🏆【祝・プロアスリート現役引退！】'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#fee2e2', marginTop: '2px', lineHeight: 1.4 }}>
                          {modal.retireReason === 'idol_graduation'
                            ? `年齢規定により「アイドル」は卒業（現役終了）となります！卒業祝い金 +${modal.bonusMoney || 50}万円 を受領しました！現状維持は不可のため、セカンドキャリアを選択してください！`
                            : `年齢規定により「プロアスリート」は現役引退となります！引退功労金 +${modal.bonusMoney || 50}万円 を受領しました！現状維持は不可のため、セカンドキャリアを選択してください！`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 現在のステータス ＆ 職業バナー */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))',
                    border: '1.5px solid #38bdf8'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>現在の職業 ＆ 給料</div>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff' }}>
                        {currentOcc ? `${currentOcc.icon} ${currentOcc.title}` : '🏚️ 無職・求職中'}
                        <span style={{ fontSize: '13px', color: '#facc15', marginLeft: '8px' }}>
                          （給料: {turnPlayer.salary || 0}万円）
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        background: 'rgba(56, 189, 248, 0.2)',
                        border: '1px solid #38bdf8',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '10px', color: '#7dd3fc', fontWeight: 'bold' }}>📚 学力</div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#38bdf8' }}>{pAcad}</div>
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        background: 'rgba(52, 211, 153, 0.2)',
                        border: '1px solid #34d399',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: 'bold' }}>🏃 体力</div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#34d399' }}>{pStam}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isForced ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                    border: isForced ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: '12px',
                    color: '#cbd5e1',
                    lineHeight: 1.5
                  }}>
                    {isForced ? (
                      <span>⚠️ <strong>【セカンドキャリア選択】</strong> 資格を満たす職業から希望先を1つ選び、<strong>確率1/2（6〜10で合格）の転職ルーレット</strong>に挑戦してください！（不採用時はフリーター転身）</span>
                    ) : (
                      <span>💡 <strong>【転職ルーレットルール】</strong> 資格（学力・体力）を満たす職業を1つ選んで <strong>確率1/2（50%：出目6〜10で成功 / 1〜5で失敗）</strong> の転職ルーレットに挑戦！（失敗時は現職継続 / 現状維持も選択可）</span>
                    )}
                  </div>

                  {/* 職業一覧グリッド */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '10px',
                    maxHeight: '290px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}>
                    {availableOccs.map((occ) => {
                      const isCurrent = currentOcc?.id === occ.id;
                      const isSelected = selectedChangeJobId === occ.id;
                      const reqAcad = occ.reqAcademic || 0;
                      const reqStam = occ.reqStamina || 0;
                      const acadPass = pAcad >= reqAcad;
                      const stamPass = pStam >= reqStam;
                      const isQualified = acadPass && stamPass;
                      const isAgeBlocked = (G.era >= 3 && occ.id === 'idol') || (G.era >= 4 && (occ.id === 'idol' || occ.id === 'athlete'));

                      return (
                        <div
                          key={occ.id}
                          style={{
                            padding: '12px',
                            borderRadius: '12px',
                            background: isSelected
                              ? 'rgba(250, 204, 21, 0.22)'
                              : isCurrent
                              ? (isForced ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.25)')
                              : isAgeBlocked
                              ? 'rgba(15, 23, 42, 0.4)'
                              : isQualified
                              ? 'rgba(16, 185, 129, 0.14)'
                              : 'rgba(15, 23, 42, 0.65)',
                            border: isSelected
                              ? '2px solid #facc15'
                              : isCurrent
                              ? (isForced ? '2px dashed #ef4444' : '2px solid #3b82f6')
                              : isAgeBlocked
                              ? '1px dashed rgba(239, 68, 68, 0.3)'
                              : isQualified
                              ? '1.5px solid #10b981'
                              : '1px dashed rgba(255, 255, 255, 0.15)',
                            boxShadow: isSelected ? '0 0 14px rgba(250, 204, 21, 0.35)' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            opacity: isAgeBlocked ? 0.45 : (isQualified || isCurrent ? 1 : 0.6),
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '20px' }}>{occ.icon}</span>
                              <strong style={{ fontSize: '13px', color: '#ffffff' }}>{occ.title}</strong>
                            </div>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '900',
                              color: '#facc15',
                              background: 'rgba(250, 204, 21, 0.15)',
                              padding: '2px 6px',
                              borderRadius: '6px'
                            }}>
                              給料: {occ.baseSalary}万
                            </span>
                          </div>

                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {occ.tierDesc}
                          </div>

                          {/* Requirements Badges */}
                          <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
                            <span style={{
                              flex: 1,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: acadPass ? 'rgba(56, 189, 248, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: acadPass ? '#38bdf8' : '#f87171',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}>
                              📚 学力 {reqAcad} {acadPass ? '✓' : `(不足${reqAcad - pAcad})`}
                            </span>
                            <span style={{
                              flex: 1,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: stamPass ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: stamPass ? '#34d399' : '#f87171',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}>
                              🏃 体力 {reqStam} {stamPass ? '✓' : `(不足${reqStam - pStam})`}
                            </span>
                          </div>

                          {/* Action Button */}
                          {isActionPlayer && (
                            <div style={{ marginTop: '4px' }}>
                              {isAgeBlocked ? (
                                <div style={{
                                  padding: '5px',
                                  textAlign: 'center',
                                  fontSize: '11px',
                                  color: '#f87171',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  borderRadius: '6px'
                                }}>
                                  ⛔ 年齢制限（引退済）
                                </div>
                              ) : isCurrent ? (
                                isForced ? (
                                  <div style={{
                                    padding: '6px',
                                    textAlign: 'center',
                                    fontSize: '11px',
                                    color: '#fca5a5',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    borderRadius: '6px',
                                    fontWeight: 'bold'
                                  }}>
                                    ❌ 引退・卒業のため継続不可
                                  </div>
                                ) : (
                                  <button
                                    disabled={isSpinningJobChange}
                                    onClick={() => moves.changeJob(pid, 'keep')}
                                    style={{
                                      width: '100%',
                                      padding: '7px',
                                      borderRadius: '8px',
                                      background: 'rgba(59, 130, 246, 0.3)',
                                      border: '1px solid #3b82f6',
                                      color: '#93c5fd',
                                      fontWeight: 'bold',
                                      fontSize: '11px',
                                      cursor: isSpinningJobChange ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    現在の職業（現状維持）
                                  </button>
                                )
                              ) : isQualified ? (
                                <button
                                  disabled={isSpinningJobChange}
                                  onClick={() => setSelectedChangeJobId(occ.id)}
                                  style={{
                                    width: '100%',
                                    padding: '7px',
                                    borderRadius: '8px',
                                    background: selectedChangeJobId === occ.id
                                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                      : 'linear-gradient(135deg, #10b981, #059669)',
                                    border: selectedChangeJobId === occ.id ? '1.5px solid #fef08a' : 'none',
                                    color: '#ffffff',
                                    fontWeight: '900',
                                    fontSize: '12px',
                                    cursor: isSpinningJobChange ? 'not-allowed' : 'pointer',
                                    boxShadow: selectedChangeJobId === occ.id
                                      ? '0 2px 10px rgba(245, 158, 11, 0.5)'
                                      : '0 2px 8px rgba(16, 185, 129, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <span>{selectedChangeJobId === occ.id ? '✅' : '🎯'}</span>
                                  <span>
                                    {selectedChangeJobId === occ.id
                                      ? '選択中！（下のルーレットへ）'
                                      : `選択する（給料${occ.baseSalary}万〜）`}
                                  </span>
                                </button>
                              ) : (
                                <div style={{
                                  padding: '5px',
                                  textAlign: 'center',
                                  fontSize: '11px',
                                  color: '#94a3b8',
                                  background: 'rgba(0,0,0,0.2)',
                                  borderRadius: '6px'
                                }}>
                                  🔒 資格ライン未達
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 選択中の職業への 2分の1 転職ルーレットパネル */}
                  {isActionPlayer && (
                    <div style={{
                      padding: '14px',
                      borderRadius: '14px',
                      background: selectedOcc
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(16, 185, 129, 0.14))'
                        : 'rgba(15, 23, 42, 0.6)',
                      border: selectedOcc ? '2px solid #facc15' : '1px dashed rgba(255,255,255,0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      {selectedOcc ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '900', color: '#fde047' }}>
                              🎯 志望先: {selectedOcc.icon} {selectedOcc.title}
                              {previewRankTitle ? `（${previewRankTitle}）` : ''}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399' }}>
                              内定時給料: {previewSalary}万円 ／ 転職確率: 50% (1/2)
                            </div>
                          </div>

                          {/* 1〜10（1〜5失敗 / 6〜10成功）の視認用スロット */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: '5px',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '8px',
                            borderRadius: '10px'
                          }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                              const isWin = num >= 6;
                              const isHighlighted = tempJobChangeRoll === num;
                              return (
                                <div
                                  key={num}
                                  style={{
                                    padding: '5px 2px',
                                    borderRadius: '7px',
                                    textAlign: 'center',
                                    background: isHighlighted
                                      ? '#facc15'
                                      : isWin
                                      ? 'rgba(16, 185, 129, 0.25)'
                                      : 'rgba(239, 68, 68, 0.18)',
                                    border: isHighlighted
                                      ? '2px solid #fff'
                                      : isWin
                                      ? '1px solid #10b981'
                                      : '1px solid rgba(239, 68, 68, 0.45)',
                                    color: isHighlighted ? '#0f172a' : (isWin ? '#6ee7b7' : '#fca5a5'),
                                    fontWeight: '900',
                                    fontSize: '11px'
                                  }}
                                >
                                  <div>{num}</div>
                                  <div style={{ fontSize: '9px' }}>{isWin ? '🎉成功' : '💧失敗'}</div>
                                </div>
                              );
                            })}
                          </div>

                          <button
                            disabled={isSpinningJobChange}
                            onClick={() => {
                              if (isSpinningJobChange || !selectedOcc) return;
                              setIsSpinningJobChange(true);
                              let ticks = 0;
                              const timer = setInterval(() => {
                                ticks++;
                                setTempJobChangeRoll(Math.floor(Math.random() * 10) + 1);
                                if (ticks >= 12) {
                                  clearInterval(timer);
                                  setIsSpinningJobChange(false);
                                  setTempJobChangeRoll(null);
                                  moves.changeJob(pid, selectedOcc.id);
                                }
                              }, 70);
                            }}
                            style={{
                              width: '100%',
                              padding: '14px',
                              borderRadius: '12px',
                              background: isSpinningJobChange
                                ? 'linear-gradient(135deg, #475569, #334155)'
                                : 'linear-gradient(135deg, #f59e0b, #ea580c)',
                              border: 'none',
                              color: '#ffffff',
                              fontWeight: '900',
                              fontSize: '15px',
                              cursor: isSpinningJobChange ? 'wait' : 'pointer',
                              boxShadow: isSpinningJobChange ? 'none' : '0 4px 16px rgba(245, 158, 11, 0.45)'
                            }}
                          >
                            {isSpinningJobChange
                              ? `🎡 転職ルーレット抽選中… 【 出目: ${tempJobChangeRoll || 1} 】`
                              : `🎡 【${selectedOcc.title}】への転職ルーレットを回す！（成功率 1/2）`}
                          </button>
                        </>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', fontWeight: 'bold' }}>
                          ⬆️ 上の一覧から挑戦したい職業を選んで「選択する」を押すと、1/2の転職ルーレットが回せます！
                        </div>
                      )}
                    </div>
                  )}

                  {/* 現状維持ボタン or 観戦メッセージ */}
                  {isActionPlayer ? (
                    isForced ? (
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1.5px dashed #ef4444',
                        textAlign: 'center',
                        color: '#fca5a5',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}>
                        ⚠️ 卒業・引退のため「現状維持」は選択できません。上記から資格を満たす職業を選択してルーレットに挑戦してください。
                      </div>
                    ) : (
                      <button
                        disabled={isSpinningJobChange}
                        onClick={() => moves.changeJob(pid, 'keep')}
                        style={{
                          width: '100%',
                          padding: '14px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #475569, #334155)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          fontWeight: '900',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          marginTop: '4px'
                        }}
                      >
                        <span>🛡️</span>
                        <span>転職せず、現在の職業【{currentOcc?.title || '無職'}】を継続する（現状維持）</span>
                      </button>
                    )
                  ) : (
                    <div style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.3)',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '13px'
                    }}>
                      💼 {getPlayerName(turnPid)} が転職先{isForced ? '（セカンドキャリア）' : '（または現状維持）'}を検討中…
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 時代コース分岐選択（Aルート vs Bルート） */}
            {G.currentSpaceModal.type === 'branch_route' && (() => {
              const curEra = getEraById(G.era || 1);
              const bInfo = curEra?.branchInfo;
              if (!bInfo) return null;
              const routeA = bInfo.routes.A;
              const routeB = bInfo.routes.B;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '8px 0' }}>
                  <div style={{ fontSize: '13px', color: '#e2e8f0', textAlign: 'center', lineHeight: 1.5 }}>
                    {bInfo.branchDesc}
                  </div>

                  {isActionPlayer ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                      {/* Aコース */}
                      <div
                        onClick={() => moves.chooseEraBranch(pid, 'A')}
                        style={{
                          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(37, 99, 235, 0.25))',
                          border: `2px solid ${routeA.color}`,
                          borderRadius: '16px',
                          padding: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 15px rgba(56, 189, 248, 0.25)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '28px' }}>{routeA.icon}</span>
                            <div>
                              <span style={{ fontSize: '10px', background: routeA.color, color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: '900' }}>
                                Aルート
                              </span>
                              <div style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
                                {routeA.name}
                              </div>
                            </div>
                          </div>
                          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4, margin: '8px 0' }}>
                            {routeA.desc}
                          </p>
                        </div>
                        <button
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${routeA.color}, #1d4ed8)`,
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            cursor: 'pointer',
                            marginTop: '10px'
                          }}
                        >
                          👉 このルートを選択！
                        </button>
                      </div>

                      {/* Bコース */}
                      <div
                        onClick={() => moves.chooseEraBranch(pid, 'B')}
                        style={{
                          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.25))',
                          border: `2px solid ${routeB.color}`,
                          borderRadius: '16px',
                          padding: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.25)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '28px' }}>{routeB.icon}</span>
                            <div>
                              <span style={{ fontSize: '10px', background: routeB.color, color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: '900' }}>
                                Bルート
                              </span>
                              <div style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
                                {routeB.name}
                              </div>
                            </div>
                          </div>
                          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4, margin: '8px 0' }}>
                            {routeB.desc}
                          </p>
                        </div>
                        <button
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${routeB.color}, #b45309)`,
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            cursor: 'pointer',
                            marginTop: '10px'
                          }}
                        >
                          👉 このルートを選択！
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: 'rgba(0,0,0,0.4)',
                      border: `1.5px dashed ${turnPlayer.color}`,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#38bdf8' }}>
                        🚩 {getPlayerName(turnPid)} がコースを選択しています…
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        「{routeA.name}」か「{routeB.name}」か選択中
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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
                          ? '🗼 都心エリート・都内自立コース（マスのお金増減1.2倍 / 学力+4・偏差値+2 / 自立費 -20万円）'
                          : '🏙️ 大都会コース【上京】（マスのお金増減1.2倍 / 学力+4・偏差値+2 / 上京費 -20万円 / 出身企業は対象外）'}
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
                          : '🌾 地元就職・地域貢献コース（地元定着支援金 +30万円 / 出身企業がルーレット対象！）'}
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
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  fontSize: '11px',
                  color: '#a7f3d0',
                  lineHeight: 1.5
                }}>
                  💡 <strong>マイホーム購入のメリット：</strong> 全物件が購入価格より高い<strong>「最終資産価値」</strong>を持ち、ゲーム終了時の総資産が大きく増えます！（出身スキルやご当地企業社員割引でさらに大幅お得！）
                </div>
                {isActionPlayer ? (
                  <>
                    {HOUSES.map((h) => {
                      const pr = getHousePricingForPlayer(h, turnPlayer);
                      const hasDiscount = pr.effectivePrice < pr.basePrice;
                      return (
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
                            gap: '10px',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '900' }}>
                              {h.icon} {h.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                              <span>
                                決算評価額: <strong style={{ color: '#4ade80' }}>{pr.effectiveSell.toLocaleString()}万円</strong>
                              </span>
                              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                                （値上がり利益 +{pr.netGain.toLocaleString()}万）
                              </span>
                              {pr.discountLabels.map((lbl, i) => (
                                <span key={i} style={{ background: 'rgba(251, 191, 36, 0.22)', color: '#fde047', padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                                  🏷️ {lbl}
                                </span>
                              ))}
                              {pr.sellBoostLabel && (
                                <span style={{ background: 'rgba(16, 185, 129, 0.22)', color: '#6ee7b7', padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                                  ✨ {pr.sellBoostLabel}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {hasDiscount && (
                              <div style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                {pr.basePrice.toLocaleString()}万円
                              </div>
                            )}
                            <strong style={{ fontSize: '16px', color: '#fde047' }}>
                              {pr.effectivePrice.toLocaleString()}万円
                            </strong>
                          </div>
                        </button>
                      );
                    })}
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

            {/* ハードモード：親の年収による旅行決断モーダル（行く vs キャンセル） */}
            {G.currentSpaceModal.type === 'choose_travel' && (() => {
              const modal = G.currentSpaceModal;
              const pIncome = modal.parentIncome || turnPlayer.parentIncome || { income: 500, title: '平均的家庭', icon: '🏠' };
              const isPoor = pIncome.income < 400;
              const isRich = pIncome.income >= 1000;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '4px 0 12px' }}>
                  {/* 親ガチャ・実家ステータスバナー */}
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: isPoor
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.35))'
                      : isRich
                      ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(202, 138, 4, 0.35))'
                      : 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(30, 64, 175, 0.3))',
                    border: isPoor ? '1.5px solid #ef4444' : isRich ? '1.5px solid #facc15' : '1.5px solid #38bdf8',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold' }}>
                        💀 ハードモード【親ガチャ・実家経済状況】
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '900',
                        background: isPoor ? '#ef4444' : isRich ? '#facc15' : '#38bdf8',
                        color: isRich ? '#000' : '#fff'
                      }}>
                        {isPoor ? '⚠️ 困窮・自力必須' : isRich ? '👑 富豪・親ガチャ大勝利' : '🏡 一般家庭'}
                      </span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{pIncome.icon}</span>
                      <span>{pIncome.title}</span>
                      <span style={{ fontSize: '13px', color: '#facc15', marginLeft: 'auto' }}>
                        実家年収: {pIncome.income} 万円
                      </span>
                    </div>
                    {modal.adviceText && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.3)',
                        fontSize: '12px',
                        color: '#f1f5f9',
                        fontStyle: 'italic',
                        borderLeft: isPoor ? '3px solid #ef4444' : isRich ? '3px solid #facc15' : '3px solid #38bdf8'
                      }}>
                        💬 親「{modal.adviceText.replace(/^「|」$/g, '')}」
                      </div>
                    )}
                  </div>

                  {/* 選択肢ボタン */}
                  {isActionPlayer ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* ボタン1: 旅行に行く */}
                      <button
                        onClick={() => moves.decideTravel(pid, 'go')}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                          border: '1.5px solid #38bdf8',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          textAlign: 'left',
                          boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '900' }}>
                          <span>🛫</span>
                          <span>【予定通り旅行に行く！】</span>
                          <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto' }}>
                            名産品獲得
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#bae6fd', paddingLeft: '26px' }}>
                          {modal.goPreview}
                        </div>
                      </button>

                      {/* ボタン2: 旅行をキャンセルする */}
                      <button
                        onClick={() => moves.decideTravel(pid, 'cancel')}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: '14px',
                          background: isPoor
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : 'linear-gradient(135deg, #d97706, #b45309)',
                          border: isPoor ? '1.5px solid #34d399' : '1.5px solid #f59e0b',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          textAlign: 'left',
                          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '900' }}>
                          <span>🏠</span>
                          <span>【旅行をキャンセルする】</span>
                          <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto' }}>
                            {isPoor ? '能力大幅UP＆お駄賃' : isRich ? '自由資金+50万' : '旅費浮いて貯金'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: isPoor ? '#a7f3d0' : '#fde68a', paddingLeft: '26px' }}>
                          {modal.cancelPreview}
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.3)',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: '13px'
                    }}>
                      ✈️ {getPlayerName(turnPid)} が実家年収（{pIncome.income}万）を踏まえて旅行に行くかキャンセルするか検討中…
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 適齢期区間（第3時代 #1〜#60）：結婚・出産ルーレット */}
            {G.currentSpaceModal.type === 'family_roulette' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.16), rgba(236, 72, 153, 0.16))',
                  border: '1px solid rgba(244, 63, 94, 0.45)',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: '#fbcfe8'
                }}>
                  <div>🎯 <strong>確率 1/10（出目10）</strong>で <strong>{turnPlayer?.car?.spouse ? '👶 出産' : '💍 結婚 または 👶 出産'}</strong> イベントが発生！</div>
                  <div>💘 未婚時の結婚・出産当選時は <strong>2割（20%）でできちゃった婚</strong>！</div>
                  <div>👶👶 出産発生時は <strong>1%の確率で双子誕生</strong>（祝い金も2倍徴収）！</div>
                </div>

                {/* 1〜10 スロット一覧 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '6px',
                  background: 'rgba(0,0,0,0.28)',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const isWin = num === 10;
                    const isHighlighted = tempFamilyRoll === num;
                    return (
                      <div
                        key={num}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          background: isHighlighted
                            ? '#facc15'
                            : isWin
                            ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.4), rgba(236, 72, 153, 0.4))'
                            : 'rgba(255,255,255,0.05)',
                          border: isHighlighted
                            ? '2px solid #fff'
                            : isWin
                            ? '1.5px solid #f43f5e'
                            : '1px solid rgba(255,255,255,0.1)',
                          color: isHighlighted ? '#0f172a' : (isWin ? '#fde047' : '#94a3b8'),
                          fontWeight: '900',
                          fontSize: '11px'
                        }}
                      >
                        <div style={{ fontSize: '14px' }}>{num}</div>
                        <div style={{ fontSize: '9px' }}>{isWin ? '💍👶 当たり' : '🌿 日常'}</div>
                      </div>
                    );
                  })}
                </div>

                {isActionPlayer ? (
                  <button
                    disabled={isSpinningFamily}
                    onClick={() => {
                      if (isSpinningFamily) return;
                      setIsSpinningFamily(true);
                      let ticks = 0;
                      const timer = setInterval(() => {
                        ticks++;
                        setTempFamilyRoll(Math.floor(Math.random() * 10) + 1);
                        if (ticks >= 12) {
                          clearInterval(timer);
                          setIsSpinningFamily(false);
                          setTempFamilyRoll(null);
                          moves.spinFamilyRoulette(pid);
                        }
                      }, 70);
                    }}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '14px',
                      background: isSpinningFamily
                        ? 'linear-gradient(135deg, #475569, #334155)'
                        : 'linear-gradient(135deg, #ec4899, #f43f5e)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '900',
                      fontSize: '16px',
                      cursor: isSpinningFamily ? 'wait' : 'pointer',
                      boxShadow: isSpinningFamily ? 'none' : '0 6px 20px rgba(244, 63, 94, 0.4)'
                    }}
                  >
                    {isSpinningFamily
                      ? `🎡 ライフイベント抽選中… 【 ${tempFamilyRoll || 1} 】`
                      : '🎡 結婚・出産ルーレットを回す！（1/10）'}
                  </button>
                ) : (
                  <div style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(0,0,0,0.3)',
                    textAlign: 'center',
                    color: '#fbcfe8',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}>
                    🎡 {getPlayerName(turnPid)} が結婚・出産ルーレットを回しています…
                  </div>
                )}
              </div>
            )}

            {/* 結婚・出産ルーレット結果 */}
            {G.currentSpaceModal.type === 'family_roulette_result' && (
              <div style={{
                padding: '14px',
                borderRadius: '14px',
                textAlign: 'center',
                background: G.currentSpaceModal.hit
                  ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(245, 158, 11, 0.2))'
                  : 'rgba(255,255,255,0.05)',
                border: G.currentSpaceModal.hit ? '2px solid #f43f5e' : '1px solid rgba(255,255,255,0.12)',
                marginBottom: '6px'
              }}>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>ルーレット出目</div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  color: G.currentSpaceModal.hit ? '#fde047' : '#cbd5e1',
                  lineHeight: 1.1,
                  margin: '4px 0 8px'
                }}>
                  【 {G.currentSpaceModal.roll10} 】
                </div>
                {G.currentSpaceModal.outcome?.isShotgun && (
                  <span style={{
                    display: 'inline-block', background: '#f43f5e', color: '#fff',
                    padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '900', marginRight: '6px'
                  }}>
                    💘 できちゃった婚 (2割)!
                  </span>
                )}
                {G.currentSpaceModal.outcome?.isTwins && (
                  <span style={{
                    display: 'inline-block', background: '#f59e0b', color: '#0f172a',
                    padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '900'
                  }}>
                    👶👶 双子誕生 (1%)!!
                  </span>
                )}
              </div>
            )}

            {/* 通常イベントマス（了解して次へ進む） */}
            {!['branch_route', 'branch_career', 'branch_midlife', 'buy_house', 'choose_job', 'job_result', 'job_change_result', 'era_milestone', 'job_change', 'choose_travel', 'family_roulette'].includes(G.currentSpaceModal.type) && (
              isActionPlayer ? (
                <button
                  onClick={() => moves.endTurn(pid)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '16px',
                    background: G.currentSpaceModal.eligibleForFamilyRoulette
                      ? 'linear-gradient(135deg, #ec4899, #db2777)'
                      : 'linear-gradient(135deg, #10b981, #059669)',
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
                  <span>{G.currentSpaceModal.eligibleForFamilyRoulette ? '💍👶' : '👉'}</span>
                  <span>
                    {G.currentSpaceModal.eligibleForFamilyRoulette
                      ? '結婚・出産ルーレットへ進む（適齢期ゾーン！）'
                      : '了解して次のプレイヤーへ進む（ターン終了）'}
                  </span>
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

      {/* 📋 職業一覧・転職ライン確認モーダル */}
      {showCareerGuideModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            border: '2px solid #38bdf8',
            borderRadius: '24px',
            padding: '26px',
            maxWidth: '780px',
            width: '100%',
            color: '#ffffff',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '26px' }}>📋</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#38bdf8' }}>
                    全職業一覧 ＆ 転職ライン確認ガイド
                  </h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    体力と学力を高めて、高給エリート・専門職へのキャリアアップを目指そう！
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowCareerGuideModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  color: '#cbd5e1',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* あなたの現在のステータス */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(15, 23, 42, 0.7))',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '16px',
              padding: '12px 18px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>あなたの現在の職業 ＆ 給料</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#ffffff' }}>
                  {myPlayer?.occupation ? `${myPlayer.occupation.icon} ${myPlayer.occupation.title}` : '🏚️ 未就職・求職中'}
                  <span style={{ fontSize: '13px', color: '#facc15', marginLeft: '8px' }}>
                    （給料: {myPlayer?.salary || 0}万円）
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {G.isHardMode && (
                  <div style={{
                    padding: '6px 14px',
                    borderRadius: '10px',
                    background: 'rgba(244, 63, 94, 0.2)',
                    border: '1px solid #f43f5e',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#fda4af', fontWeight: 'bold' }}>🎓 あなたの偏差値</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#fb7185' }}>{myPlayer?.hensachi || 50}</div>
                  </div>
                )}
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid #38bdf8',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '10px', color: '#7dd3fc', fontWeight: 'bold' }}>📚 あなたの学力</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#38bdf8' }}>{myPlayer?.academic || 50}</div>
                </div>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: 'rgba(52, 211, 153, 0.2)',
                  border: '1px solid #34d399',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: 'bold' }}>🏃 あなたの体力</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#34d399' }}>{myPlayer?.stamina || 50}</div>
                </div>
              </div>
            </div>

            {/* パラメータ育成のコツ */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '11px',
              color: '#cbd5e1',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              lineHeight: 1.5,
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>💡 パラメータ育成のヒント:</span>
              <span>📖 <strong>勉強マス</strong>: 学力+6〜14 & 偏差値+2〜6</span>
              <span>🏃 <strong>運動マス</strong>: 体力+6〜14</span>
              <span>🏠 <strong>出身県企業</strong>: 出身都道府県ごとの名門企業にも就職可能！</span>
              <span>🛤️ <strong>コース分岐</strong>: Aコース(学力大幅UP) / Bコース(体力・資金UP)</span>
              <span>💼 <strong>転職チャンスマス</strong>: 壮年期（第3時代）で止まると資格を満たした職業へ転職挑戦可能！</span>
            </div>

            {/* ご当地有名企業5大特典バナー */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.12))',
              border: '1px solid rgba(251, 191, 36, 0.45)',
              borderRadius: '12px',
              padding: '9px 12px',
              marginBottom: '12px',
              fontSize: '11px',
              color: '#fef3c7',
              lineHeight: 1.5
            }}>
              <strong style={{ color: '#fde047' }}>🏠 【ご当地有名企業・在籍5大特典】</strong>
              出身県の固有企業に就職・転職すると
              <span style={{ color: '#4ade80', fontWeight: 'bold' }}> ①凱旋祝い金+80万 ②毎給料+20%(最低+30万) ③マイホーム10%OFF ④退職金1.25倍 ⑤決算特別賞+300万</span>
              が発動！（※地方出身者が上京コースを選ぶと初期就職ルーレットには含まれません）
            </div>

            {/* 表示切替タブ */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setCareerGuideTab('overview')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: careerGuideTab === 'overview' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
                  background: careerGuideTab === 'overview' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                  color: careerGuideTab === 'overview' ? '#7dd3fc' : '#94a3b8',
                  fontWeight: '900',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                👥 参加者の固有就職先 ＆ 共通職業一覧
              </button>
              <button
                onClick={() => setCareerGuideTab('all47')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: careerGuideTab === 'all47' ? '1.5px solid #fbbf24' : '1px solid rgba(255,255,255,0.15)',
                  background: careerGuideTab === 'all47' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                  color: careerGuideTab === 'all47' ? '#fde047' : '#94a3b8',
                  fontWeight: '900',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🗾 全47都道府県 ご当地企業一覧
              </button>
            </div>

            {careerGuideTab === 'overview' ? (
              <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 参加プレイヤー全員の固有就職先（出身県ご当地企業） */}
                <div style={{
                  background: 'rgba(251, 191, 36, 0.08)',
                  border: '1.5px solid rgba(251, 191, 36, 0.35)',
                  borderRadius: '14px',
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#fde047', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🏠</span>
                    <span>参加プレイヤー全員の固有就職先（出身県限定ご当地企業）</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '8px' }}>
                    {allPlayers.map((pl) => {
                      const localComp = getPrefectureCompanyOcc(pl.prefecture);
                      const plName = getPlayerName(pl.id);
                      const plAcad = pl.academic || 50;
                      const plStam = pl.stamina || 50;
                      const plHen = pl.hensachi || 50;
                      const isMe = pl.id === pid;
                      const isPlCurrent = pl.occupation?.id === localComp?.id;
                      const isInitialOk = localComp ? isQualifiedForJob(pl, localComp, G.isHardMode) : false;
                      const devReq = localComp?.minHensachi || 0;
                      const stamReq = G.isHardMode ? (localComp?.minStamina || 0) : (localComp?.reqStamina || 0);
                      return (
                        <div
                          key={pl.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '12px',
                            background: isMe ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.72)',
                            border: isMe ? '1.5px solid #38bdf8' : `1px solid ${pl.color || 'rgba(255,255,255,0.18)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '900' }}>
                              <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: pl.color }} />
                              <span style={{ color: '#ffffff' }}>{plName}{isMe ? '（あなた）' : ''}</span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', padding: '1px 7px', borderRadius: '6px' }}>
                              {pl.prefecture ? `${pl.prefecture.emoji} ${pl.prefecture.name}` : '未選択'}
                            </span>
                          </div>

                          {localComp ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '900', color: '#fde047' }}>
                                  {localComp.icon} {localComp.title}
                                  {isPlCurrent && (
                                    <span style={{ marginLeft: '6px', fontSize: '10px', background: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>
                                      就職中
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: '900', color: '#facc15', whiteSpace: 'nowrap' }}>
                                  {localComp.baseSalary}〜{localComp.maxSalary}万
                                </span>
                              </div>
                              <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.35 }}>
                                {localComp.tierDesc}
                              </div>
                              <div style={{ display: 'flex', gap: '5px', fontSize: '10px', marginTop: '2px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {G.isHardMode && (
                                  <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '5px',
                                    background: plHen >= devReq ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.22)',
                                    color: plHen >= devReq ? '#6ee7b7' : '#fca5a5',
                                    fontWeight: 'bold'
                                  }}>
                                    🎓要偏差値:{devReq}(現在:{plHen})
                                  </span>
                                )}
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '5px',
                                  background: plAcad >= localComp.reqAcademic ? 'rgba(56,189,248,0.18)' : 'rgba(239,68,68,0.18)',
                                  color: plAcad >= localComp.reqAcademic ? '#7dd3fc' : '#fca5a5',
                                  fontWeight: 'bold'
                                }}>
                                  📚要学力:{localComp.reqAcademic}(現在:{plAcad})
                                </span>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '5px',
                                  background: plStam >= stamReq ? 'rgba(52,211,153,0.18)' : 'rgba(239,68,68,0.18)',
                                  color: plStam >= stamReq ? '#6ee7b7' : '#fca5a5',
                                  fontWeight: 'bold'
                                }}>
                                  🏃要体力:{stamReq}(現在:{plStam})
                                </span>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '5px',
                                  background: isInitialOk ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.18)',
                                  color: isInitialOk ? '#4ade80' : '#fca5a5',
                                  fontWeight: '900'
                                }}>
                                  {isInitialOk ? '✅ ルーレット対象OK' : '🚫 初期就職条件未達'}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>出身地未決定</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 共通職業（＋あなたの固有企業）一覧グリッド */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '10px'
                }}>
                  {getAvailableOccupationsForPlayer(myPlayer).map((occ) => {
                    const myAcad = myPlayer?.academic || 50;
                    const myStam = myPlayer?.stamina || 50;
                    const myHen = myPlayer?.hensachi || 50;
                    const reqAcad = occ.reqAcademic || 0;
                    const reqStam = G.isHardMode ? (occ.minStamina || 0) : (occ.reqStamina || 0);
                    const reqHen = occ.minHensachi || 0;
                    const acadPass = myAcad >= reqAcad;
                    const henPass = myHen >= reqHen;
                    const primaryPass = G.isHardMode ? henPass : acadPass;
                    const stamPass = myStam >= reqStam;
                    const isQualified = isQualifiedForJob(myPlayer, occ, G.isHardMode);
                    const isTransferQualified = acadPass && myStam >= (occ.reqStamina || 0);
                    const isCurrent = myPlayer?.occupation?.id === occ.id;

                    return (
                      <div
                        key={occ.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '14px',
                          background: isCurrent
                            ? 'rgba(59, 130, 246, 0.2)'
                            : isQualified
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(30, 41, 59, 0.5)',
                          border: isCurrent
                            ? '2px solid #3b82f6'
                            : isQualified
                            ? '1.5px solid #10b981'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '24px' }}>{occ.icon}</span>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '900', color: '#ffffff' }}>
                                {occ.title}
                              </div>
                              {isCurrent && (
                                <span style={{ fontSize: '10px', background: '#3b82f6', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                  現在のあなたの職業
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '900',
                            color: '#facc15',
                            background: 'rgba(250, 204, 21, 0.15)',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            whiteSpace: 'nowrap'
                          }}>
                            {occ.maxSalary ? `${occ.baseSalary}〜${occ.maxSalary}万` : `給料: ${occ.baseSalary}万`}
                          </span>
                        </div>

                        <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.3 }}>
                          {occ.tierDesc}
                        </div>

                        {/* Requirement comparisons */}
                        <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                          {G.isHardMode ? (
                            <div style={{
                              flex: 1,
                              padding: '4px 8px',
                              borderRadius: '8px',
                              background: henPass ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              border: henPass ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                              color: henPass ? '#38bdf8' : '#fca5a5'
                            }}>
                              <div style={{ fontSize: '9px', color: '#94a3b8' }}>🎓 必要偏差値（初期就職）</div>
                              <div style={{ fontWeight: 'bold' }}>
                                {reqHen} {henPass ? `✓ (現在${myHen})` : `(あと+${reqHen - myHen})`}
                              </div>
                              <div style={{ fontSize: '9px', color: '#94a3b8' }}>転職目安 学力:{reqAcad}</div>
                            </div>
                          ) : (
                            <div style={{
                              flex: 1,
                              padding: '4px 8px',
                              borderRadius: '8px',
                              background: acadPass ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              border: acadPass ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                              color: acadPass ? '#38bdf8' : '#fca5a5'
                            }}>
                              <div style={{ fontSize: '9px', color: '#94a3b8' }}>📚 必要学力</div>
                              <div style={{ fontWeight: 'bold' }}>
                                {reqAcad} {acadPass ? `✓ (現在${myAcad})` : `(あと+${reqAcad - myAcad})`}
                              </div>
                            </div>
                          )}

                          <div style={{
                            flex: 1,
                            padding: '4px 8px',
                            borderRadius: '8px',
                            background: stamPass ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: stamPass ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                            color: stamPass ? '#34d399' : '#fca5a5'
                          }}>
                            <div style={{ fontSize: '9px', color: '#94a3b8' }}>🏃 必要体力</div>
                            <div style={{ fontWeight: 'bold' }}>
                              {reqStam} {stamPass ? `✓ (現在${myStam})` : `(あと+${reqStam - myStam})`}
                            </div>
                          </div>
                        </div>

                        {/* Status pill */}
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: isQualified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                          color: isQualified ? '#34d399' : '#f87171'
                        }}>
                          {isQualified
                            ? '✅ ルーレット＆就職対象！（条件達成）'
                            : G.isHardMode && isTransferQualified
                            ? '⚠️ 初期就職は偏差値不足（転職なら学力OK）'
                            : G.isHardMode
                            ? '🔒 資格未達（偏差値・体力を上げよう）'
                            : '🔒 資格未達（学力・体力を上げよう）'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* 全47都道府県 ご当地企業一覧 */
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                gap: '10px',
                maxHeight: '450px',
                overflowY: 'auto',
                paddingRight: '6px'
              }}>
                {PREFECTURES.map((pref) => {
                  const comp = PREFECTURE_FAMOUS_COMPANIES[pref.id];
                  if (!comp) return null;
                  const holders = allPlayers.filter((pl) => pl.prefecture?.id === pref.id);
                  return (
                    <div
                      key={pref.id}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: holders.length > 0 ? 'rgba(251, 191, 36, 0.14)' : 'rgba(15, 23, 42, 0.65)',
                        border: holders.length > 0 ? '1.5px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#7dd3fc' }}>
                          {pref.emoji} {pref.name}（{pref.regionName}）
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: '#facc15' }}>
                          {comp.baseSalary}〜{comp.maxSalary}万
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '900', color: '#ffffff' }}>
                        {comp.icon} {comp.title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.35 }}>
                        {comp.tierDesc}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', fontSize: '10px' }}>
                        <span style={{ color: '#cbd5e1' }}>
                          📚学力:{comp.reqAcademic} / 🏃体力:{comp.reqStamina} / 🎓偏差値:{comp.minHensachi}
                        </span>
                        {holders.length > 0 && (
                          <span style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {holders.map((h) => (
                              <span key={h.id} style={{ background: h.color, color: '#fff', padding: '1px 6px', borderRadius: '5px', fontWeight: 'bold' }}>
                                👤 {getPlayerName(h.id)}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setShowCareerGuideModal(false)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '900',
                fontSize: '15px',
                cursor: 'pointer',
                marginTop: '16px',
                boxShadow: '0 4px 16px rgba(56, 189, 248, 0.4)'
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 3-COLUMN COMPACT RESPONSIVE MAIN LAYOUT: LEFT (2 Players) | CENTER (Controls, Map, Logs) | RIGHT (2 Players) */}
      <div className="game-main-layout">
        {/* LEFT COLUMN: 2 PLAYERS (Player 0 & 1) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '900',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 4px'
          }}>
            <span>👥 プレイヤー陣営（左）</span>
          </div>
          {leftPlayers.map((p) => renderPlayerCard(p))}
        </div>

        {/* CENTER COLUMN: CONTROLS, INSPECTOR, BOARD MAP, LOGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
          {/* Top Row: Roulette Controls & Space Inspector */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '10px',
            alignItems: 'stretch'
          }}>
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
              <div style={{ position: 'relative', width: '136px', height: '136px', flexShrink: 0 }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '4px solid #ffffff',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
                  transform: `rotate(${spinDegree}deg)`,
                  transition: isSpinningLocal
                    ? 'transform 0.85s linear'
                    : 'transform 0.55s cubic-bezier(0.15, 0.9, 0.25, 1)',
                  overflow: 'hidden',
                  background: '#0f172a'
                }}>
                  <svg viewBox="0 0 120 120" width="100%" height="100%" style={{ display: 'block' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num, idx) => {
                      const colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];
                      const startRad = (idx * 36 * Math.PI) / 180;
                      const endRad = ((idx + 1) * 36 * Math.PI) / 180;
                      const midDeg = idx * 36 + 18;
                      const midRad = (midDeg * Math.PI) / 180;
                      const x1 = 60 + 60 * Math.sin(startRad);
                      const y1 = 60 - 60 * Math.cos(startRad);
                      const x2 = 60 + 60 * Math.sin(endRad);
                      const y2 = 60 - 60 * Math.cos(endRad);
                      const tx = 60 + 42 * Math.sin(midRad);
                      const ty = 60 - 42 * Math.cos(midRad);
                      const isHit = !isSpinningLocal && G.rouletteValue === num;
                      return (
                        <g key={num}>
                          <path
                            d={`M 60 60 L ${x1.toFixed(2)} ${y1.toFixed(2)} A 60 60 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`}
                            fill={colors[idx]}
                            stroke="rgba(255,255,255,0.65)"
                            strokeWidth="1"
                          />
                          <text
                            x={tx.toFixed(2)}
                            y={ty.toFixed(2)}
                            fill={isHit ? '#fef08a' : '#ffffff'}
                            stroke="#0f172a"
                            strokeWidth="2.6"
                            paintOrder="stroke"
                            fontSize={isHit ? '14' : '12'}
                            fontWeight="900"
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${midDeg}, ${tx.toFixed(2)}, ${ty.toFixed(2)})`}
                          >
                            {num}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* 中央の固定出目バッジ（回転せず常に水平表示） */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '2px solid #fbbf24',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}>
                  {isSpinningLocal ? (
                    <span style={{ fontSize: '18px' }}>🌀</span>
                  ) : G.rouletteValue !== null ? (
                    <>
                      <span style={{ fontWeight: '900', fontSize: '18px', color: '#0f172a' }}>{G.rouletteValue}</span>
                      <span style={{ fontWeight: '900', fontSize: '9px', color: '#d97706' }}>マス</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontWeight: '900', fontSize: '11px', color: '#0f172a' }}>1〜10</span>
                      <span style={{ fontWeight: 'bold', fontSize: '8px', color: '#64748b' }}>マス</span>
                    </>
                  )}
                </div>

                {/* 12時の判定針 */}
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
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))',
                  zIndex: 2
                }} />
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: G.rouletteValue !== null && !isSpinningLocal ? '#fde047' : '#cbd5e1',
                  textAlign: 'center'
                }}>
                  {isSpinningLocal
                    ? '🌀 1〜10マスを抽選中…'
                    : G.rouletteValue !== null
                    ? `🚀 出目【 ${G.rouletteValue} 】→ ${G.rouletteValue}マス進みました！`
                    : '🎯 1〜10マス進むルーレット'}
                </div>

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
              <div style={{ marginTop: '6px', display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap', fontSize: '10px', color: '#94a3b8' }}>
                <span>現在地:</span>
                {playersOnSpace.map((pl) => (
                  <span key={pl.id} style={{ background: pl.color, color: '#fff', padding: '1px 7px', borderRadius: '6px', fontWeight: 'bold', border: pl.id === pid ? '1px solid #fde047' : 'none' }}>
                    🚗 {getPlayerName(pl.id)}
                  </span>
                ))}
              </div>
            )}
            <div style={{ fontSize: '10px', color: isHovering ? '#38bdf8' : '#64748b', marginTop: '4px', textAlign: 'right' }}>
              {isHovering ? '👀 カーソル位置のマスを表示中' : '💡 マスにカーソルを合わせると詳細表示'}
            </div>
          </div>
        </div>

        {/* BOARD GAME MAP */}
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

          {/* Branch Route Info Banner */}
          {viewingEra.branchInfo && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.12) 0%, rgba(245, 158, 11, 0.12) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🛤️</span>
                <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{viewingEra.branchInfo.branchTitle}</span>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>#{viewingEra.branchInfo.branchSpaceId}マスで進路選択</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {viewingEra.branchInfo.routes.A.icon} A: {viewingEra.branchInfo.routes.A.name}
                  {viewEraId === G.era && myPlayer.eraRoute === 'A' && (
                    <span style={{ background: '#38bdf8', color: '#000', padding: '0 4px', borderRadius: '3px', fontSize: '9px', fontWeight: '900' }}>選択中</span>
                  )}
                </span>
                <span style={{ color: '#64748b', fontWeight: 'bold' }}>vs</span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid #f59e0b',
                  color: '#f59e0b',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {viewingEra.branchInfo.routes.B.icon} B: {viewingEra.branchInfo.routes.B.name}
                  {viewEraId === G.era && myPlayer.eraRoute === 'B' && (
                    <span style={{ background: '#f59e0b', color: '#000', padding: '0 4px', borderRadius: '3px', fontSize: '9px', fontWeight: '900' }}>選択中</span>
                  )}
                </span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(52, 211, 153, 0.15)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  color: '#34d399',
                  fontSize: '10px'
                }}>
                  #{viewingEra.branchInfo.mergeSpaceId}〜 合流
                </span>
              </div>
            </div>
          )}

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
              const isBranchChoice = space.type === 'branch_route';
              const isEraGoal = space.type === 'era_goal';
              const isRouteA = space.route === 'A';
              const isRouteB = space.route === 'B';
              const isDimmed = viewEraId === G.era && myPlayer.eraRoute && (
                (myPlayer.eraRoute === 'A' && isRouteB) ||
                (myPlayer.eraRoute === 'B' && isRouteA)
              );

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
                      : isEraGoal
                      ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.18) 0%, rgba(30, 41, 59, 0.9) 100%)'
                      : isBranchChoice
                      ? 'rgba(192, 132, 252, 0.12)'
                      : isRouteA
                      ? 'rgba(56, 189, 248, 0.08)'
                      : isRouteB
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'rgba(255,255,255,0.05)',
                    border: isHovered
                      ? '2px solid #38bdf8'
                      : isTurnLandingSpace
                      ? '2.5px solid #f59e0b'
                      : isMyPieceHere
                      ? '2px solid #34d399'
                      : isEraGoal
                      ? '2px solid #eab308'
                      : isBranchChoice
                      ? '2px solid #c084fc'
                      : isRouteA
                      ? '1.5px solid rgba(56, 189, 248, 0.55)'
                      : isRouteB
                      ? '1.5px solid rgba(245, 158, 11, 0.55)'
                      : `1.5px solid ${viewingEra.color}66`,
                    borderRadius: '12px',
                    padding: '8px 10px',
                    minHeight: '82px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    cursor: 'pointer',
                    opacity: isDimmed && !isHovered ? 0.45 : 1,
                    transform: isHovered ? 'translateY(-2px)' : (isTurnLandingSpace ? 'scale(1.02)' : 'none'),
                    boxShadow: isHovered
                      ? '0 6px 14px rgba(56, 189, 248, 0.35)'
                      : isTurnLandingSpace
                      ? '0 0 18px rgba(245, 158, 11, 0.65)'
                      : isMyPieceHere
                      ? '0 0 12px rgba(52, 211, 153, 0.4)'
                      : isEraGoal
                      ? '0 0 14px rgba(234, 179, 8, 0.4)'
                      : isBranchChoice
                      ? '0 0 10px rgba(192, 132, 252, 0.3)'
                      : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontWeight: 'bold' }}>#{space.id}</span>
                        {isFamilyRouletteZoneSpace(viewingEra.id, space) && (
                          <span title="結婚・出産ルーレット判定区間(1/10)" style={{ fontSize: '9px' }}>💍👶</span>
                        )}
                        {isEraGoal && (
                          <span style={{
                            background: '#eab308',
                            color: '#000',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontSize: '8px',
                            fontWeight: '900'
                          }}>
                            🏁 GOAL
                          </span>
                        )}
                        {isBranchChoice && (
                          <span style={{
                            background: '#a855f7',
                            color: '#fff',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontSize: '8px',
                            fontWeight: '900'
                          }}>
                            分岐
                          </span>
                        )}
                        {isRouteA && (
                          <span style={{
                            background: '#0284c7',
                            color: '#fff',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontSize: '8px',
                            fontWeight: '900'
                          }}>
                            A
                          </span>
                        )}
                        {isRouteB && (
                          <span style={{
                            background: '#d97706',
                            color: '#fff',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontSize: '8px',
                            fontWeight: '900'
                          }}>
                            B
                          </span>
                        )}
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
                      {playersHere.map((p) => {
                        const playerDisplayName = getPlayerName(p.id);
                        return (
                          <div
                            key={p.id}
                            style={{
                              background: p.color,
                              borderRadius: '6px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              fontWeight: '900',
                              color: '#fff',
                              animation: 'carBounce 2s infinite ease-in-out',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                              border: p.id === pid ? '1.5px solid #fde047' : '1px solid rgba(255,255,255,0.45)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              maxWidth: '100%'
                            }}
                            title={`${playerDisplayName} - ${p.car?.spouse ? '配偶者あり' : '独身'}, 子供: ${p.car?.kids || 0}人`}
                          >
                            <span>🚗</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '88px' }}>
                              {playerDisplayName}
                            </span>
                            {p.car?.spouse && <span title="配偶者同乗">👫</span>}
                            {p.car?.kids > 0 && (
                              <span
                                style={{
                                  background: 'rgba(255,255,255,0.3)',
                                  borderRadius: '3px',
                                  padding: '0 3px',
                                  fontSize: '8px',
                                  border: '1px solid rgba(255,255,255,0.4)',
                                  flexShrink: 0
                                }}
                                title={`子供 ${p.car.kids}人`}
                              >
                                👶x{p.car.kids}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* EVENT LOGS (Center Column Bottom) */}
        <div style={{
          background: 'rgba(0,0,0,0.35)',
          borderRadius: '12px',
          padding: '10px 14px',
          fontSize: '11px',
          color: '#cbd5e1',
          maxHeight: '130px',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', fontSize: '10px' }}>
            📜 人生イベントログ:
          </div>
          {G.logs.map((log, idx) => (
            <div key={idx} style={{ marginBottom: '2px', lineHeight: 1.3 }}>{formatLogWithNames(log)}</div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: 2 PLAYERS (Player 2 & 3) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '900',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 4px'
        }}>
          <span>👥 プレイヤー陣営（右）</span>
        </div>
        {rightPlayers.length > 0 ? (
          rightPlayers.map((p) => renderPlayerCard(p))
        ) : (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '11px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '12px',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            プレイヤーなし
          </div>
        )}
      </div>
    </div>
  </div>
);
};
