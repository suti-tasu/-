// UnifiedLobby.jsx - 統一待機ルーム（待ち合い）コンポーネント
import React, { useState } from 'react';

export const UnifiedLobby = ({
  gameTitle,
  gameIcon,
  gameSubtitle,
  themeColor = '#00838f',
  themeGradient = 'linear-gradient(135deg, #00838f, #00acc1)',
  numPlayers = 2,
  playerIds = [],
  pid = '0',
  getPlayerName = (id) => `Player ${id}`,
  isHost = false,
  hostOnlyStart = false,
  onStart,
  startText = '🚀 箱から出してゲームを開始する！',
  onShowRules,
  rulesModal,
  children
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // URLからmatchIDを取得
  const params = new URLSearchParams(window.location.search);
  const matchID = params.get('match') || '';
  const inviteUrl = window.location.href;

  const handleCopyCode = () => {
    if (!matchID) return;
    navigator.clipboard.writeText(matchID);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const totalSlots = Math.max(numPlayers, playerIds.length);
  const joinedCount = playerIds.length;
  const emptySlotsCount = Math.max(0, totalSlots - joinedCount);

  return (
    <div style={{
      maxWidth: '720px',
      margin: '20px auto',
      padding: '0 12px',
      fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
      textAlign: 'center',
      boxSizing: 'border-box'
    }}>
      <style>{`
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
        }
        @keyframes pulseEmpty {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {rulesModal}

      {/* OPENED BOX LID (斜め奥に立てかけられたパッケージのフタ) */}
      <div style={{
        width: '94%',
        maxWidth: '640px',
        margin: '0 auto -16px',
        background: themeGradient,
        borderRadius: '16px 16px 6px 6px',
        padding: '16px 22px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        transform: 'perspective(700px) rotateX(10deg)',
        transformOrigin: 'bottom center',
        border: '2px solid rgba(255,255,255,0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontSize: '34px',
            animation: 'floatIcon 3s ease-in-out infinite',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))'
          }}>
            {gameIcon}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '10px', color: '#fde047', fontWeight: '900', letterSpacing: '1px' }}>
              📦 BOARD GAME BOX • OPENED (開封済み)
            </div>
            <div style={{ fontSize: '19px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.3px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {gameTitle}
            </div>
          </div>
        </div>

        {onShowRules && (
          <button
            onClick={onShowRules}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.15s ease'
            }}
          >
            📖 付属説明書 (ルール)
          </button>
        )}
      </div>

      {/* INNER BOX CONTAINER (内箱インサートトレイ) */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '24px',
        border: `4px solid ${themeColor}`,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 6px 18px rgba(0,0,0,0.08)',
        padding: '26px 22px 22px',
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box'
      }}>
        {/* サブタイトル / キャッチコピー */}
        {gameSubtitle && (
          <div style={{
            background: 'rgba(0,0,0,0.03)',
            borderRadius: '10px',
            padding: '6px 14px',
            fontSize: '12px',
            color: '#64748b',
            fontWeight: '600',
            marginBottom: '16px',
            border: '1px dashed #cbd5e1'
          }}>
            🎲 {gameSubtitle}
          </div>
        )}

        {/* 招待チケットトレイ */}
        {matchID && (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff, #f1f5f9)',
            padding: '12px 16px',
            borderRadius: '14px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            marginBottom: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>🎟️ 部屋コード:</span>
                <span style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#0f172a'
                }}>
                  {matchID}
                </span>
                <button
                  onClick={handleCopyCode}
                  style={{
                    background: copiedCode ? '#16a34a' : '#ffffff',
                    color: copiedCode ? '#ffffff' : '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {copiedCode ? '✓ コピー済' : '📋 コピー'}
                </button>
              </div>

              <button
                onClick={handleCopyUrl}
                style={{
                  background: copiedUrl ? '#16a34a' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                  transition: 'all 0.15s'
                }}
              >
                {copiedUrl ? '✓ 招待リンクをコピーしました！' : '🔗 友達を招待（リンクをコピー）'}
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              ※ 招待リンクまたは部屋コードを友達に送って参加してもらってください。
            </div>
          </div>
        )}

        {/* GAME OPTIONS / SETTINGS (CHILDREN) */}
        {children && (
          <div style={{
            marginBottom: '18px',
            textAlign: 'left'
          }}>
            {children}
          </div>
        )}

        {/* PARTICIPANTS SECTION (プレイヤーコマ収納トレイ) */}
        <div style={{
          background: '#f1f5f9',
          padding: '14px 18px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.04)',
          marginBottom: '22px',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
              ♟️ プレイヤーのコマ収納トレイ
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 'bold',
              background: joinedCount >= totalSlots ? '#dcfce7' : '#e0f2fe',
              color: joinedCount >= totalSlots ? '#15803d' : '#0369a1',
              padding: '2px 9px',
              borderRadius: '12px'
            }}>
              {joinedCount} / {totalSlots}人
            </span>
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {playerIds.map(id => {
              const isMe = id === pid;
              const isPlayerHost = id === '0';
              const name = getPlayerName(id);

              return (
                <div
                  key={id}
                  style={{
                    background: isMe ? '#f0fdf4' : '#ffffff',
                    border: isMe ? '2px solid #86efac' : '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isMe ? '#22c55e' : '#64748b',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                  }}>
                    {isPlayerHost ? '👑' : '♟️'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                      {name}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                      {isPlayerHost && (
                        <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                          ホスト
                        </span>
                      )}
                      {isMe && (
                        <span style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                          あなた
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* EMPTY SLOT PLACEHOLDERS (型抜きスポンジの凹み風) */}
            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                style={{
                  border: '2px dashed #cbd5e1',
                  background: 'rgba(203, 213, 225, 0.25)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  animation: 'pulseEmpty 2s infinite',
                  userSelect: 'none'
                }}
              >
                <span>⏳</span>
                <span>コマ待機中... ({joinedCount + idx + 1}人目)</span>
              </div>
            ))}
          </div>
        </div>

        {/* START ACTION AREA */}
        {hostOnlyStart && !isHost ? (
          <div style={{
            padding: '16px',
            background: '#fffbeb',
            border: '2px solid #fde68a',
            borderRadius: '14px',
            color: '#92400e',
            fontWeight: 'bold',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            ⏳ ホスト（{getPlayerName('0')}）がゲームを開始するのを待っています...
          </div>
        ) : (
          <div>
            <button
              onClick={onStart}
              style={{
                width: '100%',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: themeGradient,
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              {startText}
            </button>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
              {hostOnlyStart
                ? `※ あなたはホストです。参加者が揃ったら開始してください。`
                : `※ ホスト（${getPlayerName('0')}）または参加者のどなたでも開始できます。`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
