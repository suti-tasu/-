const INVALID_MOVE = 'INVALID_MOVE';

export const CARD_TYPES = {
  CRIMINAL: { id: 'criminal', name: '犯人', desc: '手札がこの1枚の時のみ出せる。出したら勝ち。' },
  FIRST_DISCOVERER: { id: 'first_discoverer', name: '第一発見者', desc: 'ゲーム開始時、必ず一番最初に出す。' },
  DETECTIVE: { id: 'detective', name: '探偵', desc: '1人を指名する。その人が「犯人」を持っていれば勝ち。「アリバイ」を持っていたら無効。' },
  ALIBI: { id: 'alibi', name: 'アリバイ', desc: '探偵に指名された時、「犯人」を持っていても「違います」と言える。' },
  ACCOMPLICE: { id: 'accomplice', name: 'たくらみ', desc: '出すと犯人の味方になる。犯人が勝てば一緒に勝ち。' },
  DOG: { id: 'dog', name: 'いぬ', desc: '1人を指名し、手札1枚を引いて見る。「犯人」なら勝ち、それ以外なら相手の手札に戻す。' },
  BOY: { id: 'boy', name: '少年', desc: '出すと、現在「犯人」を持っている人がこっそりあなたにだけ正体を明かす。' },
  WITNESS: { id: 'witness', name: '目撃者', desc: '1人を指名し、その人の手札をすべてこっそり見る。' },
  TRADE: { id: 'trade', name: '取り引き', desc: '1人を指名し、お互いの手札から1枚選んで交換する。' },
  INFO_MANIPULATION: { id: 'info_manipulation', name: '情報操作', desc: '全員が手札から1枚選び、同時に左隣の人に渡す。' },
  RUMOR: { id: 'rumor', name: 'うわさ', desc: '全員が、右隣の人の手札からランダムに1枚引く。' },
  CITIZEN: { id: 'citizen', name: '一般人', desc: '特に効果はない。' },
};

const ALL_CARDS = [
  'criminal', 'first_discoverer', 
  'detective', 'detective',
  'alibi', 'alibi', 'alibi', 'alibi',
  'accomplice', 'accomplice', 'accomplice',
  'dog', 'dog',
  'boy',
  'witness',
  'trade', 'trade',
  'info_manipulation', 'info_manipulation',
  'rumor', 'rumor',
  'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen'
];

const MUST_CARDS = {
  3: ['first_discoverer', 'criminal', 'detective', 'alibi'],
  4: ['first_discoverer', 'criminal', 'detective', 'alibi', 'accomplice'],
  5: ['first_discoverer', 'criminal', 'detective', 'alibi', 'alibi', 'accomplice'],
  6: ['first_discoverer', 'criminal', 'detective', 'detective', 'alibi', 'alibi', 'accomplice', 'accomplice'],
  7: ['first_discoverer', 'criminal', 'detective', 'detective', 'alibi', 'alibi', 'alibi', 'accomplice', 'accomplice'],
};

const buildDeck = (numPlayers, random) => {
  if (numPlayers < 3) numPlayers = 3;
  if (numPlayers > 8) numPlayers = 8;
  if (numPlayers >= 8) return random.Shuffle([...ALL_CARDS]);
  const must = [...MUST_CARDS[numPlayers]];
  let pool = [...ALL_CARDS];
  
  must.forEach(mc => {
    const idx = pool.indexOf(mc);
    if (idx !== -1) pool.splice(idx, 1);
  });
  
  pool = random.Shuffle(pool);
  const neededRandom = numPlayers * 4 - must.length;
  const randomSelected = pool.slice(0, neededRandom);
  
  return random.Shuffle([...must, ...randomSelected]);
};

export const HanninGame = {
  name: 'hannin',

  setup: ({ ctx, random }) => {
    const deck = buildDeck(ctx.numPlayers, random);
    const players = {};
    let startingPlayer = '0';

    for (let i = 0; i < ctx.numPlayers; i++) {
      const pid = i.toString();
      const hand = [deck.pop(), deck.pop(), deck.pop(), deck.pop()];
      players[pid] = {
        hand,
        isAccomplice: false,
        isDog: false, privateKnowledge: []
      };
      if (hand.includes('first_discoverer')) {
        startingPlayer = pid;
      }
    }

    return {
      players,
      startingPlayer,
      discardPile: [],
      winner: null,
      winnerDetails: null,
      logs: []
    };
  },

  turn: {
    order: {
      first: ({ G }) => parseInt(G.startingPlayer, 10),
      next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    },
    stages: {
      tradeSelect: {
        moves: {
          selectCardForTrade: ({ G, ctx, events }, cardIndex) => {
            const pid = ctx.playerID;
            if (pid === G.pendingTrade.initiator) {
              G.pendingTrade.initiatorCard = cardIndex;
            } else if (pid === G.pendingTrade.target) {
              G.pendingTrade.targetCard = cardIndex;
            }
            
            // Check if both have selected
            if (G.pendingTrade.initiatorCard !== null && G.pendingTrade.targetCard !== null) {
              const iPid = G.pendingTrade.initiator;
              const tPid = G.pendingTrade.target;
              const iIdx = G.pendingTrade.initiatorCard;
              const tIdx = G.pendingTrade.targetCard;
              
              const iCard = G.players[iPid].hand[iIdx];
              const tCard = G.players[tPid].hand[tIdx];
              
              G.players[iPid].hand[iIdx] = tCard;
              G.players[tPid].hand[tIdx] = iCard;
              
              G.logs.push(`取り引きが完了しました。`);
              G.pendingTrade = null;
              events.endTurn();
            }
          }
        }
      },
      infoSelect: {
        moves: {
          selectCardForInfo: ({ G, ctx, events }, cardIndex) => {
            const pid = ctx.playerID;
            G.pendingInfo.selections[pid] = cardIndex;
            
            if (Object.keys(G.pendingInfo.selections).length === ctx.numPlayers) {
              const selections = G.pendingInfo.selections;
              const passedCards = {};
              
              Object.keys(selections).forEach(id => {
                passedCards[id] = G.players[id].hand[selections[id]];
              });
              
              Object.keys(selections).forEach(id => {
                G.players[id].hand.splice(selections[id], 1);
              });
              
              Object.keys(passedCards).forEach(id => {
                const leftIdx = (parseInt(id, 10) + 1) % ctx.numPlayers;
                G.players[leftIdx.toString()].hand.push(passedCards[id]);
              });
              
              G.logs.push(`情報操作が完了し、全員のカードが移動しました。`);
              G.pendingInfo = null;
              events.endTurn();
            }
          }
        }
      }
    }
  },

  moves: {
    playCard: ({ G, ctx, events }, cardIndex, targetPlayerId) => {
      if (G.winner) return INVALID_MOVE;
      const pid = ctx.currentPlayer;
      const player = G.players[pid];
      const card = player.hand[cardIndex];

      if (G.discardPile.length === 0 && card !== 'first_discoverer') {
        return INVALID_MOVE;
      }

      if (card === 'criminal' && player.hand.length > 1) {
        return INVALID_MOVE;
      }

      const needsTarget = ['detective', 'dog', 'witness', 'trade'].includes(card);
      if (needsTarget) {
        if (targetPlayerId === undefined || targetPlayerId === null || targetPlayerId === pid) return INVALID_MOVE;
        if (G.players[targetPlayerId].hand.length === 0) return INVALID_MOVE;
      }

      player.hand.splice(cardIndex, 1);
      let logMsg = `【Player ${pid}】[${CARD_TYPES[card.toUpperCase()].name}] をプレイ。`;
      let result = null;
      let shouldEndTurn = true;

      switch (card) {
        case 'criminal':
          G.winner = 'criminal';
          G.winnerDetails = `Player ${pid} が犯人として逃げ切りました！`;
          events.endGame();
          break;

        case 'detective':
          const targetHand = G.players[targetPlayerId].hand;
          if (targetHand.includes('alibi')) {
            result = 'alibi';
            logMsg += `Player ${targetPlayerId} を指名しましたが、アリバイがありました。`;
          } else if (targetHand.includes('criminal')) {
            G.winner = 'town';
            G.winnerDetails = `Player ${pid} が探偵として犯人（Player ${targetPlayerId}）を言い当てました！`;
            events.endGame();
          } else {
            result = 'miss';
            logMsg += `Player ${targetPlayerId} は犯人ではありませんでした。`;
          }
          break;

        case 'dog':
          const tHand = G.players[targetPlayerId].hand;
          const randomIdx = ctx.random.Die(tHand.length) - 1;
          const pulledCard = tHand[randomIdx];
          if (pulledCard === 'criminal') {
            G.winner = 'town';
            G.winnerDetails = `Player ${pid} のいぬが犯人（Player ${targetPlayerId}）を見つけました！`;
            events.endGame();
          } else {
            result = { card: pulledCard, target: targetPlayerId }; 
            logMsg += `Player ${targetPlayerId} の手札を1枚確認し、犯人ではありませんでした。`;
          }
          break;

        case 'boy':
          const criminalOwner = Object.keys(G.players).find(id => G.players[id].hand.includes('criminal'));
          result = { criminalOwner }; 
          logMsg += `少年が犯人の正体に気づきました。`;
          break;

        case 'witness':
          result = { hand: [...G.players[targetPlayerId].hand], target: targetPlayerId }; 
          logMsg += `Player ${targetPlayerId} の手札をすべて見ました。`;
          break;

        case 'accomplice':
          player.isAccomplice = true;
          logMsg += `犯人の味方になった。`;
          break;

        case 'rumor':
          const pullInfo = {};
          Object.keys(G.players).forEach(id => {
            const rightIdx = (parseInt(id, 10) - 1 + ctx.numPlayers) % ctx.numPlayers;
            const rightId = rightIdx.toString();
            if (G.players[rightId].hand.length > 0) {
              pullInfo[id] = { target: rightId, idx: ctx.random.Die(G.players[rightId].hand.length) - 1 };
            }
          });
          
          const pulledCards = {};
          Object.keys(pullInfo).forEach(id => {
            pulledCards[id] = G.players[pullInfo[id].target].hand[pullInfo[id].idx];
          });
          
          const indicesToRemove = {};
          Object.keys(pullInfo).forEach(id => {
            const target = pullInfo[id].target;
            if (!indicesToRemove[target]) indicesToRemove[target] = [];
            indicesToRemove[target].push(pullInfo[id].idx);
          });
          
          Object.keys(indicesToRemove).forEach(target => {
            indicesToRemove[target].sort((a,b) => b-a).forEach(idx => {
              G.players[target].hand.splice(idx, 1);
            });
          });
          
          Object.keys(pulledCards).forEach(id => {
            G.players[id].hand.push(pulledCards[id]);
          });
          
          logMsg += `全員が右隣からランダムに1枚引きました。`;
          break;

        case 'trade':
          G.pendingTrade = {
            initiator: pid,
            target: targetPlayerId,
            initiatorCard: null,
            targetCard: null
          };
          logMsg += `Player ${targetPlayerId} と取り引きを始めました。（カード選択中...）`;
          shouldEndTurn = false;
          events.setActivePlayers({ value: { [pid]: 'tradeSelect', [targetPlayerId]: 'tradeSelect' } });
          break;

        case 'info_manipulation':
          G.pendingInfo = {
            selections: {}
          };
          logMsg += `情報操作が発動！全員が左隣に1枚渡します。（カード選択中...）`;
          shouldEndTurn = false;
          events.setActivePlayers({ all: 'infoSelect' });
          break;

        case 'first_discoverer':
        case 'alibi':
        case 'citizen':
          break;
      }

      G.discardPile.push({ pid, card, target: targetPlayerId });
      if (result) G.players[pid].privateKnowledge.push({ card, target: targetPlayerId, result });
      G.logs.push(logMsg);

      if (shouldEndTurn && !G.winner) {
        events.endTurn();
      }
    }
  }
};
