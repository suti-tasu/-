import { deck1, deck2, deck3 } from './data/cards.js';
import { nobles as allNobles } from './data/nobles.js';

export const getBonuses = (player) => {
  const bonuses = { white: 0, blue: 0, green: 0, red: 0, black: 0 };
  player.cards.forEach(card => {
    if (bonuses[card.gem] !== undefined) bonuses[card.gem]++;
  });
  return bonuses;
};

export const canAffordCard = (player, card) => {
  if (!card) return false;
  const bonuses = getBonuses(player);
  let goldNeeded = 0;
  for (const [gem, cost] of Object.entries(card.cost)) {
    const available = player.tokens[gem] + bonuses[gem];
    if (cost > available) {
      goldNeeded += (cost - available);
    }
  }
  return goldNeeded <= player.tokens.gold;
};

export const getTotalTokens = (player) => {
  return Object.values(player.tokens).reduce((a, b) => a + b, 0);
};

const payForCard = (G, player, card) => {
  const bonuses = getBonuses(player);
  for (const [gem, cost] of Object.entries(card.cost)) {
    let amountToPay = cost - bonuses[gem];
    if (amountToPay > 0) {
      if (player.tokens[gem] >= amountToPay) {
        player.tokens[gem] -= amountToPay;
        G.tokens[gem] += amountToPay;
      } else {
        const goldToUse = amountToPay - player.tokens[gem];
        G.tokens[gem] += player.tokens[gem];
        player.tokens[gem] = 0;
        player.tokens.gold -= goldToUse;
        G.tokens.gold += goldToUse;
      }
    }
  }
};

const getInitialState = (ctx, random) => {
  let d1 = random.Shuffle([...deck1]);
  let d2 = random.Shuffle([...deck2]);
  let d3 = random.Shuffle([...deck3]);
  let activeNobles = random.Shuffle([...allNobles]).slice(0, ctx.numPlayers + 1);

  const players = {};
  for (let i = 0; i < ctx.numPlayers; i++) {
    players[i] = {
      score: 0,
      tokens: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 },
      cards: [],
      nobles: [],
      reserved: []
    };
  }

  const tokenCount = ctx.numPlayers === 4 ? 7 : (ctx.numPlayers === 3 ? 5 : 4);

  return {
    tokens: { white: tokenCount, blue: tokenCount, green: tokenCount, red: tokenCount, black: tokenCount, gold: 5 },
    decks: { 1: d1, 2: d2, 3: d3 },
    board: {
      1: d1.splice(0, 4),
      2: d2.splice(0, 4),
      3: d3.splice(0, 4)
    },
    nobles: activeNobles,
    players,
    isLastRound: false
  };
};

export const Splendor = {
  name: 'splendor',
  
  setup: ({ ctx, random }) => getInitialState(ctx, random),

  turn: {
    order: {
      first: ({ ctx, random }) => random.D6() % ctx.numPlayers,
      next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    },
    onEnd: ({ G, ctx }) => {
      // 貴族のチェック
      const player = G.players[ctx.currentPlayer];
      const bonuses = getBonuses(player);
      
      const affordableNobleIndex = G.nobles.findIndex(noble => {
        for (const [gem, cost] of Object.entries(noble.cost)) {
          if ((bonuses[gem] || 0) < cost) return false;
        }
        return true;
      });

      if (affordableNobleIndex !== -1) {
        const noble = G.nobles[affordableNobleIndex];
        player.nobles.push(noble);
        player.score += noble.points;
        G.nobles.splice(affordableNobleIndex, 1);
      }

      // 15点チェック
      if (player.score >= 15) {
        G.isLastRound = true;
      }
    },
    stages: {
      discard: {
        moves: {
          discardTokens: ({ G, ctx, events }, colorsToDiscard) => {
            const player = G.players[ctx.currentPlayer];
            colorsToDiscard.forEach(color => {
              if (player.tokens[color] > 0) {
                player.tokens[color]--;
                G.tokens[color]++;
              }
            });
            if (getTotalTokens(player) <= 10) {
              events.endTurn();
            }
          }
        }
      }
    }
  },

  moves: {
    takeTokens: ({ G, ctx, events }, colors) => {
      const player = G.players[ctx.currentPlayer];
      // colors is like ['red', 'blue', 'green'] or ['red', 'red']
      colors.forEach(color => {
        if (G.tokens[color] > 0) {
          G.tokens[color]--;
          player.tokens[color]++;
        }
      });
      if (getTotalTokens(player) > 10) {
        events.setStage('discard');
      } else {
        events.endTurn();
      }
    },
    buyCard: ({ G, ctx, events }, level, index) => {
      const player = G.players[ctx.currentPlayer];
      const card = G.board[level][index];
      
      if (card && canAffordCard(player, card)) {
        payForCard(G, player, card);
        player.cards.push(card);
        player.score += card.points;
        G.board[level][index] = G.decks[level].pop() || null;
        events.endTurn();
      }
    },
    buyReservedCard: ({ G, ctx, events }, index) => {
      const player = G.players[ctx.currentPlayer];
      const card = player.reserved[index];
      
      if (card && canAffordCard(player, card)) {
        payForCard(G, player, card);
        player.cards.push(card);
        player.score += card.points;
        player.reserved.splice(index, 1);
        events.endTurn();
      }
    },
    reserveCard: ({ G, ctx, events }, level, index) => {
      const player = G.players[ctx.currentPlayer];
      if (player.reserved.length >= 3) return;
      
      const card = G.board[level][index];
      if (card) {
        player.reserved.push(card);
        G.board[level][index] = G.decks[level].pop() || null;
        
        if (G.tokens.gold > 0) {
          G.tokens.gold--;
          player.tokens.gold++;
        }

        if (getTotalTokens(player) > 10) {
          events.setStage('discard');
        } else {
          events.endTurn();
        }
      }
    },
    reserveCardFromDeck: ({ G, ctx, events }, level) => {
      const player = G.players[ctx.currentPlayer];
      if (player.reserved.length >= 3) return;
      if (G.decks[level].length === 0) return;

      const card = G.decks[level].pop();
      player.reserved.push(card);
      
      if (G.tokens.gold > 0) {
        G.tokens.gold--;
        player.tokens.gold++;
      }

      if (getTotalTokens(player) > 10) {
        events.setStage('discard');
      } else {
        events.endTurn();
      }
    }
  },

  endIf: ({ G, ctx }) => {
    if (G.isLastRound && (ctx.playOrderPos === ctx.numPlayers - 1)) {
      const scores = Object.keys(G.players).map(pId => ({
        id: pId,
        score: G.players[pId].score,
        devCards: G.players[pId].cards.length
      }));
      
      scores.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.devCards - b.devCards; // Tiebreaker: fewest development cards
      });
      
      return { winner: scores[0].id };
    }
  }
};
