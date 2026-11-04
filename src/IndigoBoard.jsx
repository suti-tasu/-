// IndigoBoard.jsx - Indigo (インディゴ) Board UI
import React, { useState } from 'react';
import { UnifiedLobby } from './UnifiedLobby';
import {
  HEX_DIRECTIONS,
  CORNER_ISLANDS,
  getHexDistance,
  getRotatedPaths,
  getOppositeSide
} from './IndigoGame';

const HEX_SIZE = 34; // 六角形の外接半径

// 軸座標 (q, r) から 画面ピクセル (x, y) への変換 (Pointy-topped)
const hexToPixel = (q, r) => {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * (1.5 * r);
  return { x, y };
};

// 正六角形の頂点座標列を生成
const getHexPoints = (cx, cy, radius) => {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return pts.join(' ');
};

// 各辺 (0〜5) の中点座標を計算
const getEdgeMidpoint = (cx, cy, side, radius) => {
  const a1 = (Math.PI / 180) * (60 * side - 30);
  const a2 = (Math.PI / 180) * (60 * ((side + 1) % 6) - 30);
  const x1 = cx + radius * Math.cos(a1);
  const y1 = cy + radius * Math.sin(a1);
  const x2 = cx + radius * Math.cos(a2);
  const y2 = cy + radius * Math.sin(a2);
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
};

// タイル内の水路パスを描画する SVG Path 文字列を生成
const renderPathCurve = (cx, cy, sideA, sideB, radius) => {
  const pA = getEdgeMidpoint(cx, cy, sideA, radius);
  const pB = getEdgeMidpoint(cx, cy, sideB, radius);

  // 向かい合う辺（直線）の場合
  if ((sideA + 3) % 6 === sideB) {
    return `M ${pA.x} ${pA.y} L ${pB.x} ${pB.y}`;
  }

  // カーブの場合：制御点をタイル中心方向に適度に引く
  const diff = Math.abs(sideA - sideB);
  const isAdjacent = diff === 1 || diff === 5;
  const ctrlWeight = isAdjacent ? 0.45 : 0.25;
  const ctrlX = cx * (1 - ctrlWeight) + ((pA.x + pB.x) / 2) * ctrlWeight;
  const ctrlY = cy * (1 - ctrlWeight) + ((pA.y + pB.y) / 2) * ctrlWeight;

  return `M ${pA.x} ${pA.y} Q ${ctrlX} ${ctrlY} ${pB.x} ${pB.y}`;
};

// プレイヤーカラーパレット
const PLAYER_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea'];
const PLAYER_BG = ['#eff6ff', '#fef2f2', '#f0fdf4', '#faf5ff'];

export const IndigoBoard = ({ G, ctx, moves, playerID, matchData }) => {
  const [selectedHex, setSelectedHex] = useState(null); // { q, r }
  const [previewRot, setPreviewRot] = useState(0); // 0〜5
  const [showRules, setShowRules] = useState(false);

  const pid = playerID || '0';
  const isActivePlayer = ctx.currentPlayer === pid;
  const myPlayer = G.players[pid] || { hand: null, score: 0, collectedGems: [] };

  const getPlayerName = (id) => {
    if (id === null || id === undefined) return '？？？';
    const p = matchData?.find(m => m.id == id);
    return p && p.name ? p.name : `Player ${id}`;
  };

  // タイル配置確定
  const handleConfirmPlacement = () => {
    if (!selectedHex || !isActivePlayer || G.gameState !== 'playing') return;
    moves.placeTile(selectedHex.q, selectedHex.r, previewRot);
    setSelectedHex(null);
    setPreviewRot(0);
  };

  // 全ヘックスのリストを作成 (dist <= 4)
  const allHexes = [];
  for (let q = -4; q <= 4; q++) {
    for (let r = -4; r <= 4; r++) {
      if (getHexDistance(q, r) <= 4) {
        allHexes.push({ q, r, key: `${q},${r}` });
      }
    }
  }

  // ルールモーダル
  const rulesModal = showRules && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
      <div style={{ background: '#fff', padding: '28px', borderRadius: '16px', maxWidth: '620px', width: '95%', maxHeight: '85vh', overflowY: 'auto', textAlign: 'left', lineHeight: 1.6, color: '#1e293b' }}>
        <h2 style={{ marginTop: 0, color: '#0284c7', borderBottom: '2px solid #bae6fd', paddingBottom: '8px' }}>
          🌊 インディゴ (Indigo) 公式ルール
        </h2>
        
        <h3 style={{ color: '#0369a1', marginBottom: '6px' }}>🎯 目的</h3>
        <p style={{ margin: '0 0 12px' }}>
          水路タイルを置いて宝石（サファイア・エメラルド・アンバー）を滑らせ、**自分のゲート（外周ゴール）へと導いて得点を競う**ゲームです！
        </p>

        <h3 style={{ color: '#0369a1', marginBottom: '6px' }}>💎 宝石の種類と得点</h3>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li><strong style={{ color: '#2563eb' }}>サファイア (青)</strong>: <strong>3点</strong> （中央島の中心に1つだけ眠る主宝！）</li>
          <li><strong style={{ color: '#16a34a' }}>エメラルド (緑)</strong>: <strong>2点</strong> （中央島の周囲に5つ配置）</li>
          <li><strong style={{ color: '#ca8a04' }}>アンバー (黄)</strong>: <strong>1点</strong> （外周6隅の島に各1つ配置）</li>
        </ul>

        <h3 style={{ color: '#0369a1', marginBottom: '6px' }}>🚪 ゲートの「共有」システム</h3>
        <p style={{ margin: '0 0 12px' }}>
          外周にある6つのゲートは、プレイ人数に応じて**隣のプレイヤーと共有**されます：
        </p>
        <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li><strong>2人プレイ:</strong> 3ゲートずつ単独所有（共有なし）。</li>
          <li><strong>3人プレイ:</strong> 1ゲート単独所有 ＋ 2ゲートを隣人と共有。</li>
          <li><strong>4人プレイ:</strong> 全6ゲートが2人ずつの共有ゲート！</li>
        </ul>
        <p style={{ margin: '0 0 12px', background: '#f0f9ff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '13px' }}>
          💡 <strong>共有ゲートに宝石が入った場合:</strong> そのゲートを共有する<strong>両方のプレイヤーに満額の得点が加算</strong>されます！相手を利用しつつ協力する駆け引きが醍醐味です。
        </p>

        <h3 style={{ color: '#0369a1', marginBottom: '6px' }}>🔨 手番の流れ</h3>
        <ol style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
          <li>空いているマスをクリックして選択します。</li>
          <li>「🔄 回転」ボタンでタイルの向きを決めて「決定」を押します。</li>
          <li>水路が繋がった宝石は、水流に乗って自動的にスルスルと移動します！</li>
          <li><strong style={{ color: '#dc2626' }}>💥 宝石同士の激突:</strong> 2つの宝石が同じ水路で衝突した場合、<strong>両方の宝石が消滅</strong>します！</li>
        </ol>

        <button
          onClick={() => setShowRules(false)}
          style={{ width: '100%', padding: '12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}
        >
          閉じる
        </button>
      </div>
    </div>
  );

  // 1. ロビー画面
  if (G.gameState === 'lobby') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <UnifiedLobby
          gameTitle="インディゴ (Indigo)"
          gameIcon="🌊"
          gameSubtitle="タイルを敷いて美しい宝石を導く！ クニツィアの六角形ルート構築名作"
          themeColor="#0284c7"
          themeGradient="linear-gradient(135deg, #0284c7, #0369a1)"
          numPlayers={ctx.numPlayers}
          playerIds={Object.keys(G.players)}
          pid={pid}
          getPlayerName={getPlayerName}
          isHost={pid === '0'}
          onStart={() => moves.startGame()}
          onShowRules={() => setShowRules(true)}
          rulesModal={rulesModal}
        />
      </div>
    );
  }

  // 2. メイン対戦画面
  return (
    <div style={{ maxWidth: '1020px', margin: '0 auto', padding: '10px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      {rulesModal}

      {/* TOP HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '12px 18px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🌊</span>
          <div>
            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#0284c7' }}>Indigo</span>
            <span style={{ marginLeft: '10px', background: isActivePlayer ? '#dcfce7' : '#f1f5f9', color: isActivePlayer ? '#15803d' : '#64748b', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
              {isActivePlayer ? '👉 あなたの手番です' : `⏳ ${getPlayerName(ctx.currentPlayer)} の手番`}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowRules(true)}
          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
        >
          📖 ルール
        </button>
      </div>

      {/* PLAYERS & SCORES BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ctx.numPlayers}, 1fr)`, gap: '8px', marginBottom: '12px' }}>
        {Object.keys(G.players).map((id, idx) => {
          const p = G.players[id];
          const isTurn = ctx.currentPlayer === id;
          const isMe = id === pid;
          const color = PLAYER_COLORS[idx % 4];

          // 宝石の内訳集計
          const sapphires = p.collectedGems.filter(g => g.type === 'sapphire').length;
          const emeralds = p.collectedGems.filter(g => g.type === 'emerald').length;
          const ambers = p.collectedGems.filter(g => g.type === 'amber').length;

          return (
            <div
              key={id}
              style={{
                background: isTurn ? '#f0f9ff' : '#ffffff',
                border: isTurn ? `2px solid ${color}` : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '8px 10px',
                boxShadow: isTurn ? `0 2px 10px ${color}33` : '0 2px 4px rgba(0,0,0,0.04)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 'bold', color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {getPlayerName(id)} {isMe ? '(自分)' : ''}
              </div>
              <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                🏆 {p.score}点
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '4px', fontSize: '10px' }}>
                <span title="サファイア(3点)">💎{sapphires}</span>
                <span title="エメラルド(2点)">🟢{emeralds}</span>
                <span title="アンバー(1点)">🟡{ambers}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN CONTAINER: BOARD + SIDE CONTROLS */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        
        {/* SVG HEX BOARD (Left/Main) */}
        <div style={{ flex: '1 1 580px', minWidth: '320px', background: 'radial-gradient(circle, #0c1a2e 0%, #030d1a 100%)', borderRadius: '16px', padding: '16px', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          
          <svg width="560" height="520" viewBox="-280 -260 560 520" style={{ overflow: 'visible', userSelect: 'none' }}>
            <defs>
              <linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            {/* 6つのゲート外周ゾーン表示 */}
            {[0, 1, 2, 3, 4, 5].map(gateIdx => {
              const owners = G.gatewayOwners[gateIdx] || [];
              const angle = (gateIdx * 60 + 30) * (Math.PI / 180);
              const labelDist = 208;
              const lx = labelDist * Math.cos(angle);
              const ly = labelDist * Math.sin(angle);

              return (
                <g key={`gate-${gateIdx}`} transform={`translate(${lx}, ${ly})`}>
                  <rect
                    x="-32"
                    y="-12"
                    width="64"
                    height="24"
                    rx="12"
                    fill="rgba(15, 23, 42, 0.88)"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fef3c7"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    G{gateIdx + 1}: {owners.map(o => `P${o}`).join('&')}
                  </text>
                </g>
              );
            })}

            {/* 盤面全ヘックス描画 */}
            {allHexes.map(({ q, r, key }) => {
              const { x, y } = hexToPixel(q, r);
              const isCenter = q === 0 && r === 0;
              const isCorner = CORNER_ISLANDS.some(ci => ci.q === q && ci.r === r);
              const tile = G.board[key];
              const isSelected = selectedHex?.q === q && selectedHex?.r === r;
              const isPlayable = !isCenter && !isCorner && !tile;

              // 1. 中央宝島 (0,0)
              if (isCenter) {
                return (
                  <g key={key} transform={`translate(${x}, ${y})`}>
                    <polygon
                      points={getHexPoints(0, 0, HEX_SIZE - 2)}
                      fill="#1e1b4b"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                    />
                    <circle cx="0" cy="0" r="16" fill="#312e81" stroke="#818cf8" strokeWidth="1.5" />
                    <text textAnchor="middle" dominantBaseline="central" fontSize="14">
                      💎
                    </text>
                  </g>
                );
              }

              // 2. 6隅の宝島
              if (isCorner) {
                const cornerIdx = CORNER_ISLANDS.findIndex(ci => ci.q === q && ci.r === r);
                return (
                  <g key={key} transform={`translate(${x}, ${y})`}>
                    <polygon
                      points={getHexPoints(0, 0, HEX_SIZE - 2)}
                      fill="#1e293b"
                      stroke="#f59e0b"
                      strokeWidth="2"
                    />
                    <circle cx="0" cy="0" r="14" fill="#334155" stroke="#fbbf24" strokeWidth="1.5" />
                    <text textAnchor="middle" dominantBaseline="central" fontSize="13">
                      🟡
                    </text>
                  </g>
                );
              }

              // 3. 配置済みタイル
              if (tile) {
                return (
                  <g key={key} transform={`translate(${x}, ${y})`}>
                    {/* タイルベース */}
                    <polygon
                      points={getHexPoints(0, 0, HEX_SIZE - 2)}
                      fill="#0f2942"
                      stroke="#1e3a5f"
                      strokeWidth="1.5"
                    />
                    {/* 3本の水路パス */}
                    {tile.paths.map(([sA, sB], pIdx) => {
                      const d = renderPathCurve(0, 0, sA, sB, HEX_SIZE - 2);
                      return (
                        <g key={pIdx}>
                          {/* 水路溝 */}
                          <path d={d} fill="none" stroke="#0369a1" strokeWidth="10" strokeLinecap="round" />
                          {/* 水流 */}
                          <path d={d} fill="none" stroke="url(#waterFlow)" strokeWidth="5" strokeLinecap="round" />
                          {/* 光沢 */}
                          <path d={d} fill="none" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="3 4" />
                        </g>
                      );
                    })}
                  </g>
                );
              }

              // 4. 空きマス（配置可能）
              return (
                <g
                  key={key}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => isPlayable && isActivePlayer && setSelectedHex({ q, r })}
                  style={{ cursor: isPlayable && isActivePlayer ? 'pointer' : 'default' }}
                >
                  <polygon
                    points={getHexPoints(0, 0, HEX_SIZE - 2)}
                    fill={isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.65)'}
                    stroke={isSelected ? '#38bdf8' : (isPlayable && isActivePlayer ? '#334155' : '#1e293b')}
                    strokeWidth={isSelected ? '2.5' : '1'}
                    strokeDasharray={isSelected ? 'none' : '3 3'}
                    style={{ transition: 'all 0.15s' }}
                  />

                  {/* プレビュー表示 */}
                  {isSelected && myPlayer.hand && (() => {
                    const previewPaths = getRotatedPaths(myPlayer.hand.paths, previewRot);
                    return previewPaths.map(([sA, sB], pIdx) => {
                      const d = renderPathCurve(0, 0, sA, sB, HEX_SIZE - 2);
                      return (
                        <path
                          key={pIdx}
                          d={d}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="4"
                          strokeDasharray="4 2"
                          opacity="0.9"
                        />
                      );
                    });
                  })()}
                </g>
              );
            })}

            {/* 盤面上の宝石たち (走る・待機する宝石の描画) */}
            {G.gems.map(gem => {
              if (gem.status === 'exited' || gem.status === 'destroyed') return null;

              let gx = 0;
              let gy = 0;

              if (gem.status === 'center') {
                if (gem.type === 'sapphire') {
                  gx = 0;
                  gy = 0;
                } else {
                  // エメラルド: 中央島の外縁
                  const m = getEdgeMidpoint(0, 0, gem.centerSlot, HEX_SIZE - 6);
                  gx = m.x;
                  gy = m.y;
                }
              } else if (gem.status === 'corner') {
                const { x, y } = hexToPixel(gem.q, gem.r);
                gx = x;
                gy = y;
              } else if (gem.status === 'board') {
                const { x, y } = hexToPixel(gem.q, gem.r);
                const m = getEdgeMidpoint(x, y, gem.edgeSide, HEX_SIZE - 2);
                gx = m.x;
                gy = m.y;
              }

              const icon = gem.type === 'sapphire' ? '💎' : (gem.type === 'emerald' ? '🟢' : '🟡');

              return (
                <g key={gem.id} transform={`translate(${gx}, ${gy})`} style={{ pointerEvents: 'none' }}>
                  <circle cx="0" cy="0" r="11" fill="rgba(15, 23, 42, 0.75)" stroke="#fff" strokeWidth="1.5" />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="12">
                    {icon}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* SIDEBAR: HAND & CONTROLS (Right) */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* TILE HAND & ROTATION */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#0f172a', marginBottom: '10px' }}>
              🖐️ あなたの手札タイル
            </div>

            {myPlayer.hand ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* 手札タイルのプレビューSVG */}
                <div style={{ width: '130px', height: '130px', background: '#0c1a2e', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0284c7' }}>
                  <svg width="120" height="120" viewBox="-60 -60 120 120">
                    <polygon points={getHexPoints(0, 0, 48)} fill="#0f2942" stroke="#38bdf8" strokeWidth="1.5" />
                    {getRotatedPaths(myPlayer.hand.paths, previewRot).map(([sA, sB], idx) => {
                      const d = renderPathCurve(0, 0, sA, sB, 48);
                      return (
                        <g key={idx}>
                          <path d={d} fill="none" stroke="#0369a1" strokeWidth="10" strokeLinecap="round" />
                          <path d={d} fill="none" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* 回転ボタン */}
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', width: '100%' }}>
                  <button
                    onClick={() => setPreviewRot(prev => (prev + 1) % 6)}
                    disabled={!isActivePlayer}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      cursor: isActivePlayer ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      color: '#334155'
                    }}
                  >
                    🔄 60° 回転 ({previewRot * 60}°)
                  </button>
                </div>

                {/* 確定・キャンセルボタン */}
                {selectedHex && (
                  <div style={{ marginTop: '10px', width: '100%', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedHex(null)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleConfirmPlacement}
                      style={{
                        flex: 2,
                        padding: '10px',
                        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        boxShadow: '0 4px 10px rgba(2, 132, 199, 0.4)'
                      }}
                    >
                      ここに配置！
                    </button>
                  </div>
                )}

                {!selectedHex && isActivePlayer && (
                  <div style={{ marginTop: '10px', color: '#0284c7', fontSize: '12px', fontWeight: 'bold' }}>
                    👆 盤面の空きマスをクリックして選択してください
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px' }}>
                山札・手札はありません
              </div>
            )}
          </div>

          {/* GATEWAY OWNERSHIP GUIDE */}
          <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
            <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
              🚪 ゲート所有権 (G1〜G6):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {G.gatewayOwners.map((owners, gIdx) => (
                <div key={gIdx} style={{ background: '#ffffff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold', color: '#b45309' }}>ゲート {gIdx + 1}</span>
                  <span>{owners.map(o => getPlayerName(o)).join(' & ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GAME LOGS */}
          <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
              📜 走行ログ
            </div>
            <div style={{ maxHeight: '140px', overflowY: 'auto', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
              {G.logs.map((log, i) => (
                <div key={i} style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '3px', marginBottom: '3px' }}>
                  {log.replace(/Player (\d+)/g, (_, id) => getPlayerName(id))}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* GAME OVER MODAL */}
      {G.gameState === 'game_over' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', maxWidth: '480px', width: '90%', padding: '28px', textAlign: 'center', boxShadow: '0 15px 40px rgba(0,0,0,0.4)', border: '3px solid #0284c7' }}>
            <div style={{ fontSize: '48px', marginBottom: '6px' }}>🏆</div>
            <h2 style={{ color: '#0369a1', margin: '0 0 6px', fontSize: '24px' }}>全宝石がゴールしました！</h2>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a', marginBottom: '20px' }}>
              👑 勝者: {getPlayerName(G.winner)} ({G.rankings[0]?.score}点)
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>最終順位:</div>
              {G.rankings?.map((r, rankIdx) => (
                <div key={r.playerID} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', marginBottom: '4px', background: rankIdx === 0 ? '#fef08a' : '#ffffff', border: '1px solid #e2e8f0', fontWeight: rankIdx === 0 ? 'bold' : 'normal', fontSize: '14px' }}>
                  <span>{rankIdx + 1}位: {getPlayerName(r.playerID)}</span>
                  <span style={{ color: '#0284c7', fontWeight: 'bold' }}>{r.score}点</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => moves.restartGame()}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              🔄 もう一度遊ぶ（ロビーに戻る）
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
