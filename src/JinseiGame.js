// JinseiGame.js - 47都道府県 ご当地人生ゲームのゲームロジック
// ニンテンドースイッチ風 5大時代（ライフステージ）＆ターン固定進行モデル
// 通常モード ＋ 隠しリアルハードモード（親ガチャ・偏差値・学歴フィルター）
import { PREFECTURES, getPrefectureById } from './data/prefecturesData.js';
import { LIFE_ERAS, getEraById, getAllSpacesFlat, getSpaceMoneyDetails, calculateNextPosition } from './data/lifeErasData.js';

export { LIFE_ERAS, getEraById, getSpaceMoneyDetails, calculateNextPosition };
export const BOARD_SPACES = getAllSpacesFlat();

export const OCCUPATIONS = [
  { id: 'doctor', title: '名医・ドクター', baseSalary: 220, maxSalary: 550, icon: '🩺', type: 'expert', minHensachi: 68, minStamina: 40, reqAcademic: 75, reqStamina: 40, tierDesc: '最難関医学部卒・極限の医学知性と夜勤に耐える体力' },
  { id: 'consultant', title: '外資系コンサル・高級官僚', baseSalary: 180, maxSalary: 480, icon: '⚖️', type: 'tokyo', minHensachi: 64, minStamina: 45, reqAcademic: 70, reqStamina: 45, tierDesc: '難関大卒・高度論理思考と激務に耐えるタフネス' },
  { id: 'athlete', title: 'プロアスリート・五輪選手', baseSalary: 160, maxSalary: 500, icon: '⚽', type: 'expert', minHensachi: 38, minStamina: 70, reqAcademic: 35, reqStamina: 75, tierDesc: '強靭な肉体と日々の鍛錬！極限の運動体力特化' },
  { id: 'it_engineer', title: 'ITベンチャー 起業家', baseSalary: 150, maxSalary: 450, icon: '💻', type: 'tokyo', minHensachi: 52, minStamina: 45, reqAcademic: 60, reqStamina: 55, tierDesc: '理系大卒・最先端IT技術と開発をやり抜く集中体力' },
  { id: 'salaryman', title: '大手企業 総合職', baseSalary: 130, maxSalary: 300, icon: '💼', type: 'general', minHensachi: 54, minStamina: 48, reqAcademic: 58, reqStamina: 50, tierDesc: '有名大卒・知性と通勤営業をこなす安定の体力' },
  { id: 'civil_servant', title: '安定の地方公務員', baseSalary: 110, maxSalary: 240, icon: '🏛️', type: 'local', minHensachi: 48, minStamina: 45, reqAcademic: 52, reqStamina: 48, tierDesc: '地元大短大卒・公務員試験突破と日々の奉仕体力' },
  { id: 'driver', title: '現場プロ・大型ドライバー', baseSalary: 110, maxSalary: 280, icon: '🚚', type: 'local', minHensachi: 0, minStamina: 58, reqAcademic: 40, reqStamina: 60, tierDesc: '学歴不問！全国輸送を支える頑強なタフネス体力' },
  { id: 'farmer', title: 'アグリビジネス・農業王', baseSalary: 100, maxSalary: 350, icon: '🚜', type: 'local', minHensachi: 0, minStamina: 52, reqAcademic: 45, reqStamina: 55, tierDesc: '学歴不問！自然を愛する知識と朝起きのバイタリティ' },
  { id: 'artisan', title: '伝統工芸・名匠職人', baseSalary: 90, maxSalary: 380, icon: '🏺', type: 'local', minHensachi: 0, minStamina: 48, reqAcademic: 50, reqStamina: 50, tierDesc: '学歴不問！繊細な美意識と一日中集中する持続体力' },
  { id: 'idol', title: 'ご当地スター・アイドル', baseSalary: 80, maxSalary: 550, icon: '🎤', type: 'entertainment', minHensachi: 0, minStamina: 50, reqAcademic: 45, reqStamina: 50, tierDesc: '学歴不問！激しいダンスレッスンとステージをこなす体力' },
  { id: 'freeter', title: '自由人・フリーター', baseSalary: 60, maxSalary: 160, icon: '🎸', type: 'general', minHensachi: 0, minStamina: 0, reqAcademic: 0, reqStamina: 0, tierDesc: '学歴・体力不問！自由気ままなマイルート' },
  { id: 'unemployed', title: '無職・求職中', baseSalary: 0, maxSalary: 0, icon: '🏚️', type: 'general', minHensachi: 0, minStamina: 0, reqAcademic: 0, reqStamina: 0, tierDesc: '学歴・体力不問。充電期間で知性と体力を鍛え直そう' },
];

// 就職ルーレット（1〜10の出目と職業の対応テーブル）
export const JOB_ROULETTE_TABLE = {
  1: 'salaryman',     // 💼 大手企業 総合職 (給与 130万, minHensachi: 56)
  2: 'civil_servant', // 🏛️ 安定の地方公務員 (給与 110万, minHensachi: 48)
  3: 'driver',        // 🚚 現場プロ・大型ドライバー (給与 110万, minHensachi: 0)
  4: 'farmer',        // 🚜 アグリビジネス・農業王 (給与 100万, minHensachi: 0)
  5: 'artisan',       // 🏺 伝統工芸・名匠職人 (給与 90万, minHensachi: 0)
  6: 'idol',          // 🎤 ご当地スター・アイドル (給与 80万, minHensachi: 0)
  7: 'it_engineer',   // 💻 ITベンチャー 起業家 (給与 150万, minHensachi: 52)
  8: 'consultant',    // ⚖️ 外資系コンサル・高級官僚 (給与 180万, minHensachi: 64)
  9: 'doctor',        // 🩺 名医・ドクター (給与 220万, minHensachi: 68)
  10: 'athlete',      // ⚽ プロアスリート・五輪選手 (給与 160万, minHensachi: 40)
};

export const HOUSES = [
  { id: 'apartment', name: '都会のデザイナーズマンション', price: 2000, sellValue: 2400, icon: '🏢' },
  { id: 'suburb_house', name: '郊外の庭付き一軒家', price: 1500, sellValue: 1800, icon: '🏡' },
  { id: 'kominka', name: '地元のリノベ古民家屋敷', price: 900, sellValue: 1300, icon: '🏯' },
];

// 親の年収・家庭環境テーブル（ハードモード親ガチャ）
export const PARENT_INCOME_TIERS = [
  { roll: 1, title: '困窮家庭（借金生活）', income: 180, baseHensachi: 38, icon: '🏚️', startMoney: -100, startDebt: 1, desc: '生活費が足りず奨学金（借金100万）でスタート。独学で苦学。' },
  { roll: 2, title: 'ギリギリ庶民家庭', income: 300, baseHensachi: 44, icon: '🛖', startMoney: 0, desc: '塾には通えず、参考書は図書館で借りて独学。' },
  { roll: 3, title: '一般的な地方家庭', income: 420, baseHensachi: 49, icon: '🏠', startMoney: 50, desc: '公立小中高へ進学。部活中心ののびのび生活。' },
  { roll: 4, title: '平均的サラリーマン家庭', income: 540, baseHensachi: 53, icon: '🏡', startMoney: 100, desc: '高校受験の前に近所の個人塾へ通わせてもらう。' },
  { roll: 5, title: '安定の中流家庭', income: 680, baseHensachi: 57, icon: '🏘️', startMoney: 200, desc: '大手進学塾と通信教育。中堅大学への進学コース。' },
  { roll: 6, title: 'アッパーミドル家庭', income: 880, baseHensachi: 61, icon: '🏙️', startMoney: 400, desc: '私立中高一貫校または難関公立高。夏期講習完備。' },
  { roll: 7, title: 'エリート企業戦士家庭', income: 1150, baseHensachi: 65, icon: '🏢', startMoney: 800, desc: '英語教育と短期留学。難関早慶・旧帝大狙い。' },
  { roll: 8, title: '開業医・大企業役員家庭', income: 1700, baseHensachi: 69, icon: '💎', startMoney: 1500, desc: '名門私立・医学部専門予備校へ手厚い教育課金！' },
  { roll: 9, title: '大企業オーナー一族', income: 3000, baseHensachi: 73, icon: '🏰', startMoney: 2500, desc: '専属家庭教師軍団。旧帝大・医学部・海外名門大。' },
  { roll: 10, title: '雲の上の大富豪・名門財閥', income: 5500, baseHensachi: 77, icon: '👑', startMoney: 5000, desc: '圧倒的財力とコネクション！生まれた瞬間からエリート。' },
];

// 手番交代の共通処理（ニンテンドースイッチ風 時代進行連動）
export const advanceToNextTurn = (G, ctx, events) => {
  G.currentSpaceModal = null;
  G.rouletteValue = null;
  G.isSpinning = false;
  G.turnStep = 'spin';

  // 1. 現在の時代で全プレイヤーが規定ターン数を終えているかチェック
  const allCurrentEraDone = Object.values(G.players).every(
    (p) => (p.eraTurns || 0) >= G.eraMaxTurns
  );

  if (allCurrentEraDone) {
    if (G.era === 1) {
      // 第1時代（子ども時代）終了 ➔ 第2時代（青年期）へ進級！
      G.era = 2;
      G.eraMaxTurns = 6;
      Object.values(G.players).forEach((p) => {
        p.eraTurns = 0;
        p.position = 0;
        p.eraRoute = null;
      });
      G.currentSpaceModal = {
        type: 'era_milestone',
        title: '🎓【祝・青年期へ進級！】',
        desc: '子ども時代（6年間）が終了し、波乱万丈の青年期（中高生・青春・受験時代）がスタート！学問と部活、アルバイトに励み、将来の進路や就職に向けて自分を磨きましょう！',
      };
      G.logs.unshift('🎓【時代進行】第1時代（子ども時代）が終了し、全員で第2時代（青年期・全6ターン）へ進級しました！');
    } else if (G.era === 2) {
      // 第2時代（青年期）終了 ➔ 運命の進路選択＆就職ルーレット！
      // まだ職業が決まっていないプレイヤーがいれば順次進路選択へ誘導
      const unassignedPlayer = Object.values(G.players).find((p) => !p.occupation);
      if (unassignedPlayer) {
        const isTokyo = unassignedPlayer.prefecture?.id === 'tokyo';
        G.currentSpaceModal = {
          spaceId: unassignedPlayer.position,
          title: isTokyo ? '🚩【青年期終了・運命の進路選択】' : '🚩【青年期終了・運命の進路選択】',
          desc: isTokyo
            ? `Player ${unassignedPlayer.id}（東京出身）の進路選択！生粋の東京っ子として「都心エリート自立」で勝負するか、「地方移住・UIターン」に飛び出すか選択してください。`
            : `Player ${unassignedPlayer.id}（${unassignedPlayer.prefecture?.name || '地方'}出身）の進路選択！「大都会コース（上京）」で勝負するか、「地元就職コース」で安定を築くか選択してください。`,
          type: 'branch_career',
        };
        G.currentTurnPlayer = unassignedPlayer.id;
        if (events && events.endTurn) {
          events.endTurn({ next: unassignedPlayer.id });
        }
        return;
      }

      // 全員の就職先が決定済み ➔ 第3時代（大人時代・前半）へ進出！
      G.era = 3;
      G.eraMaxTurns = 6;
      Object.values(G.players).forEach((p) => {
        p.eraTurns = 0;
        p.position = 0;
        p.eraRoute = null;
      });
      G.currentSpaceModal = {
        type: 'era_milestone',
        title: '💼【祝・新社会人！大人時代・前半スタート！】',
        desc: '全員の就職先が決定し、いよいよ本格的な社会人生活がスタート！定期給料日や結婚、マイホーム購入など、人生の黄金期（全6ターン）を駆け抜けましょう！',
      };
      G.logs.unshift('💼【時代進行】第2時代（青年期）が終了し、全員就職して第3時代（大人時代・前半・全6ターン）へ進出しました！');
    } else if (G.era === 3) {
      // 第3時代（大人時代・前半）終了 ➔ アイドル・アスリートの引退チェック
      const retiringPlayer = Object.values(G.players).find(
        (p) => (p.occupation?.id === 'idol' || p.occupation?.id === 'athlete') && !p.hasRetiredAtEra4
      );

      if (retiringPlayer) {
        retiringPlayer.hasRetiredAtEra4 = true;
        const isIdol = retiringPlayer.occupation?.id === 'idol';
        const bonus = 100;
        retiringPlayer.money += bonus;

        G.currentSpaceModal = {
          spaceId: retiringPlayer.position,
          type: 'job_change',
          isForced: true,
          retireReason: isIdol ? 'idol_graduation' : 'athlete_retirement',
          bonusMoney: bonus,
          beforeMoney: retiringPlayer.money - bonus,
          afterMoney: retiringPlayer.money,
          deltaMoney: bonus,
          title: isIdol ? '🎤 💐【祝・アイドル卒業＆引退式典】' : '⚽ 🏆【祝・プロアスリート現役引退式典】',
          desc: isIdol
            ? `40代を迎え、伝説のアイドルとして有終の美を飾りドーム公演で卒業！卒業祝金 +${bonus}万円 を受領しました！年齢制限によりアイドル継続は不可のため、セカンドキャリアへ強制転職となります！`
            : `40代を迎え、惜しまれつつ現役引退セレモニー！引退記念一時金 +${bonus}万円 を受領しました！アスリート継続は不可のため、セカンドキャリアへ強制転職となります！`,
          details: `${isIdol ? 'アイドル卒業祝い金' : '現役引退功労金'}: +${bonus}万円 獲得！セカンドキャリアを選択してください。`,
        };
        G.currentTurnPlayer = retiringPlayer.id;
        if (events && events.endTurn) {
          events.endTurn({ next: retiringPlayer.id });
        }
        G.logs.unshift(
          isIdol
            ? `🎤 💐【アイドル卒業式典】Player ${retiringPlayer.id} は40代を迎えアイドルを卒業！卒業祝金 +${bonus}万円 受領！セカンドキャリアへ強制転職！`
            : `⚽ 🏆【現役引退式典】Player ${retiringPlayer.id} は40代を迎え現役引退！引退功労金 +${bonus}万円 受領！セカンドキャリアへ強制転職！`
        );
        return;
      }

      // 全員の引退処理完了後 ➔ 第4時代（大人時代・後半）へ進出！
      G.era = 4;
      G.eraMaxTurns = 6;
      Object.values(G.players).forEach((p) => {
        p.eraTurns = 0;
        p.position = 0;
        p.eraRoute = null;
      });
      G.currentSpaceModal = {
        type: 'era_milestone',
        title: '⚖️【大人時代・後半スタート！】',
        desc: '40代〜50代の中高年期へ突入！キャリアの分岐（起業 vs 昇進）や役員昇進、実家への帰省など、大人の責任と実績が試される時代（全6ターン）です！',
      };
      G.logs.unshift('⚖️【時代進行】第3時代（大人時代・前半）が終了し、第4時代（大人時代・後半・全6ターン）へ進出しました！');
    } else if (G.era === 4) {
      // 第4時代（大人時代・後半）終了 ➔ 定年退職式典＆第5時代（シニア・老後時代）へ！
      Object.values(G.players).forEach((p) => {
        if (!p.isRetired) {
          p.isRetired = true;
          let retMoney = 0;
          if (p.occupation?.id === 'unemployed') {
            retMoney = 0;
          } else if (p.occupation?.id === 'freeter') {
            retMoney = 200;
          } else {
            retMoney = Math.round((p.salary || 100) * 8);
          }
          p.money += retMoney;
          G.logs.unshift(`🎖️ 【定年退職式典】Player ${p.id} が定年退職！職業【${p.occupation?.title || '無職'}】の功績に応じた退職金 +${retMoney}万円 支給！`);
        }
      });
      G.era = 5;
      G.eraMaxTurns = 4;
      Object.values(G.players).forEach((p) => {
        p.eraTurns = 0;
        p.position = 0;
        p.eraRoute = null;
      });
      G.currentSpaceModal = {
        type: 'era_milestone',
        title: '🏰【祝・定年退職＆シニア・老後時代スタート！】',
        desc: '長年の会社員生活お疲れ様でした！全員に退職金が支給されました！ここからは悠々自適のセカンドライフ（全4ターン）。定期年金を受け取りながら人生の集大成へ向かいましょう！',
      };
      G.logs.unshift('🏰【時代進行】第4時代が終了！全員退職金を受給し、第5時代（シニア・老後時代・全4ターン）へ突入しました！');
    } else if (G.era === 5) {
      // 第5時代終了 ➔ ゲーム終了＆最終資産決算！
      JinseiGame.calculateFinalSettlement(G);
      G.gameState = 'game_over';
      G.logs.unshift('👑 全5時代（一生涯）がすべて終了しました！人生の集大成・最終決算を行います！');
      return;
    }
  }

  // 2. 次のプレイヤーを探す（現在の時代でまだ規定ターン数に達していないプレイヤー）
  const numPlayers = ctx.numPlayers;
  const playOrder = ctx.playOrder || Object.keys(G.players);
  const currentPos = playOrder.indexOf(ctx.currentPlayer);
  let nextPid = ctx.currentPlayer;

  for (let i = 1; i <= numPlayers; i++) {
    const candidatePid = playOrder[(currentPos + i) % numPlayers];
    const candidateP = G.players[candidatePid];
    if (candidateP && (candidateP.eraTurns || 0) < G.eraMaxTurns) {
      nextPid = candidatePid;
      break;
    }
  }

  G.currentTurnPlayer = nextPid;
  if (events && events.endTurn) {
    events.endTurn({ next: nextPid });
  }
};

// 都道府県確定処理の共通ヘルパー
export const applyPrefectureChoice = (G, random, playerID, prefId) => {
  if (G.gameState !== 'select_prefecture') return;
  const pref = getPrefectureById(prefId);
  if (!pref) return;

  const p = G.players[playerID];
  if (!p) return;

  // 選び直しの場合は前回の特産品・保険の重複を防止
  if (p.prefecture) {
    p.souvenirs = p.souvenirs.filter((s) => s.prefId !== p.prefecture.id);
    if (p.prefecture.passiveType === 'insurance_free') {
      p.insurance.life = false;
      p.insurance.fire = false;
    }
  }

  p.prefecture = pref;
  p.souvenirs.push({
    id: `${pref.id}_initial`,
    prefId: pref.id,
    prefName: pref.name,
    regionName: pref.regionName,
    name: pref.souvenir.name,
    icon: pref.souvenir.icon,
    value: pref.souvenir.value,
    flavor: pref.flavor,
    count: 1
  });
  G.logs.unshift(`🗾 Player ${playerID} は【${pref.name}（${pref.regionName}）】出身に決定！（名産品: 【${pref.souvenir.icon} ${pref.souvenir.name}】資産価値 +${pref.souvenir.value}万）`);
  G.logs.unshift(`✨ 【出身地恩恵: ${pref.emoji} ${pref.name}「${pref.traitName}」】${pref.traitDesc}`);

  // パッシブ初期ボーナス
  if (pref.passiveType === 'insurance_free') {
    p.insurance.life = true;
    p.insurance.fire = true;
    G.logs.unshift(`🛡️ 【${pref.traitName}】により、保険（生命・火災）が無料付帯されました！`);
  }

  // ハードモード時：親ガチャルーレット＆偏差値・体力決定！
  if (G.isHardMode) {
    const pRoll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
    const parentTier = PARENT_INCOME_TIERS[pRoll - 1];
    const luckDelta = random ? (random.Die(9) - 4) : (Math.floor(Math.random() * 9) - 4);
    const finalHensachi = Math.max(35, Math.min(78, parentTier.baseHensachi + luckDelta));

    // 体力も生まれ持った運動素質・バイタリティとして決定！（35〜80）
    const stamRoll = random ? (random.Die(11) - 6) : (Math.floor(Math.random() * 11) - 6);
    const finalStamina = Math.max(35, Math.min(80, 50 + stamRoll * 3));
    p.stamina = finalStamina;
    p.academic = Math.max(25, Math.min(95, Math.round(finalHensachi * 1.05 - 8)));

    p.parentIncome = parentTier;
    p.hensachi = finalHensachi;
    p.money = parentTier.startMoney !== undefined ? parentTier.startMoney : 100;
    if (parentTier.startDebt) {
      p.debt = parentTier.startDebt;
    }

    G.logs.unshift(`💀【出生地＆親ガチャ結果】Player ${playerID} は運命により【${pref.name}】に誕生！実家年収: ${parentTier.income}万円（${parentTier.title}）➔ 初期資金【${p.money}万円】${p.debt > 0 ? `（借金${p.debt * 100}万）` : ''} ＆ 🎓偏差値【${finalHensachi}】 ＆ 🏃体力【${finalStamina}】！`);
  }

  // 全員が出身地を選び終えたらゲーム開始
  const allSelected = Object.values(G.players).every((pl) => pl.prefecture !== null);
  if (allSelected) {
    G.gameState = 'playing';
    G.turnStep = 'spin';
    G.logs.unshift(`🎉 全員の出身地が決定！第1時代（子ども時代）のルーレットを回してください！`);
  }
};

export const JinseiGame = {
  name: 'jinsei',

  setup: ({ ctx }) => {
    const numPlayers = ctx.numPlayers;
    const players = {};
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

    for (let i = 0; i < numPlayers; i++) {
      const pid = i.toString();
      players[pid] = {
        id: pid,
        name: `Player ${i}`,
        color: colors[i % colors.length],
        money: 500, // 初期所持金 500万円
        academic: 50, // 学力（知性・勉強パラメータ: 0〜100）
        stamina: 50,  // 体力（運動・体力パラメータ: 0〜100）
        prefecture: null,
        parentIncome: null, // 親ガチャ情報 (ハードモード用)
        hensachi: 50,       // 偏差値 (ハードモード用)
        position: 0,
        eraTurns: 0,        // 現在の時代でのターン数
        totalTurns: 0,      // 人生総ターン数
        eraRoute: null,     // 現在の時代で選択したコース ('A' or 'B')
        branchRoute: null,
        midlifeRoute: null,
        occupation: null,
        salary: 0,
        house: null,
        car: {
          color: colors[i % colors.length],
          spouse: false,
          kids: 0,
        },
        insurance: {
          life: false,
          fire: false,
        },
        souvenirs: [],
        debt: 0,
        isRetired: false,
        isGoal: false,
        goalRank: null,
        logs: [`👶 人生のスタートラインに立ちました！`],
      };
    }

    return {
      gameState: 'lobby', // 'lobby' | 'select_prefecture' | 'playing' | 'game_over'
      isHardMode: false,  // 隠しリアル格差ハードモード
      era: 1,             // 1: 子ども時代, 2: 青年期, 3: 大人前半, 4: 大人後半, 5: シニア
      eraMaxTurns: 6,     // 現在の時代の規定ターン数（1.5倍：旧4 -> 6ターン）
      players,
      currentTurnPlayer: '0',
      rouletteValue: null,
      isSpinning: false,
      turnStep: 'select_prefecture',
      currentSpaceModal: null,
      goalCount: 0,
      logs: ['🎲 47都道府県 ご当地人生ゲームがスタートしました！出身地を選択してください。'],
      winner: null,
      ranking: null,
    };
  },

  turn: {
    activePlayers: { all: null },
    order: {
      first: () => 0,
      next: ({ G, ctx }) => {
        const numPlayers = ctx.numPlayers;
        let nextPos = (ctx.playOrderPos + 1) % numPlayers;
        for (let i = 0; i < numPlayers; i++) {
          const nextPid = ctx.playOrder[nextPos];
          if ((G.players[nextPid]?.eraTurns || 0) < G.eraMaxTurns) {
            return nextPos;
          }
          nextPos = (nextPos + 1) % numPlayers;
        }
        return nextPos;
      },
    },
  },

  moves: {
    // 待機ロビーからゲーム開始（ホストが実行）
    startGame: ({ G }) => {
      if (G.gameState !== 'lobby') return;
      G.gameState = 'select_prefecture';
      G.logs.unshift('🎲 人生ゲームがスタートしました！出身都道府県を選択してください。');
    },

    // 0. 隠しハードモードの切り替え
    toggleHardMode: ({ G }) => {
      G.isHardMode = !G.isHardMode;
      if (G.isHardMode) {
        Object.values(G.players).forEach((p) => {
          if (p.prefecture) {
            p.souvenirs = p.souvenirs.filter((s) => s.id !== p.prefecture.souvenir.id);
            if (p.prefecture.passiveType === 'insurance_free') {
              p.insurance.life = false;
              p.insurance.fire = false;
            }
          }
          p.prefecture = null;
          p.parentIncome = null;
          p.hensachi = 50;
        });
        G.logs.unshift(`💀【隠しモード解放】リアル格差社会ハードモードが有効化！（出生地は強制ランダムガチャ・親ガチャ・学歴フィルター）`);
      } else {
        G.logs.unshift(`🟢 通常モード（夢と希望の人生ゲーム）に切り替えました。出身地を自由に選択できます。`);
      }
    },

    // 1-A. 出身都道府県の手動選択（通常モード用）
    choosePrefecture: ({ G, random }, playerID, prefId) => {
      if (G.gameState !== 'select_prefecture') return;
      if (G.isHardMode) return;
      applyPrefectureChoice(G, random, playerID, prefId);
    },

    // 1-B. 出身都道府県のランダム決定（通常モードのおまかせ / ハードモードの強制出生地ガチャ）
    choosePrefectureRandom: ({ G, random }, playerID) => {
      if (G.gameState !== 'select_prefecture') return;
      if (G.isHardMode && G.players[playerID]?.prefecture !== null) return;

      const randIdx = random ? (random.Die(PREFECTURES.length) - 1) : Math.floor(Math.random() * PREFECTURES.length);
      const chosenPref = PREFECTURES[randIdx];
      applyPrefectureChoice(G, random, playerID, chosenPref.id);
    },

    // 2. ルーレットを回す（ニンテンドースイッチ風 時代サーキット周回・分岐対応）
    spinRoulette: ({ G, ctx, random }, playerID) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      if (G.turnStep !== 'spin') return;

      const p = G.players[playerID];
      if (p.isGoal) return;

      // 和歌山スキル: ルーレット+1
      let bonus = 0;
      if (p.prefecture?.passiveType === 'spin_plus_one') {
        bonus = 1;
      }

      const roll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
      const totalSteps = Math.min(10, roll + bonus);
      G.rouletteValue = totalSteps;
      G.isSpinning = true;

      const currentEra = getEraById(G.era);
      const eraSpaces = currentEra.spaces;
      const branchInfo = currentEra.branchInfo;
      const lastSpaceId = eraSpaces.length - 1;

      // すでに時代のゴール（最終マス）に到達している場合は待機ボーナス（ループ完全防止）
      if (p.position >= lastSpaceId) {
        p.eraTurns = (p.eraTurns || 0) + 1;
        p.totalTurns = (p.totalTurns || 0) + 1;
        const standbyBonus = 30;
        p.money += standbyBonus;
        G.turnStep = 'resolve_space';
        const remainingTurns = Math.max(0, G.eraMaxTurns - p.eraTurns);
        G.logs.unshift(`🌟 Player ${playerID} は既に【${currentEra.name}・ゴール】に到達しています！優雅なバカンス待機ボーナス +${standbyBonus}万円 獲得！（残り${remainingTurns}ターン）`);
        G.currentSpaceModal = {
          spaceId: lastSpaceId,
          title: `🌟 【${currentEra.name}・ゴール待機中】`,
          desc: `すでに時代のゴールに到達しています！他のプレイヤーの進行を待つ間、優雅に過ごして特別待機ボーナス +${standbyBonus}万円 を獲得しました！`,
          type: 'goal_standby',
          beforeMoney: p.money - standbyBonus,
          afterMoney: p.money,
          deltaMoney: standbyBonus,
          details: `ゴール待機ボーナス: +${standbyBonus}万円 を受領しました！`,
          hometownPerk: null,
          travelData: null,
        };
        return;
      }

      // 分岐点ストップ判定：まだコース未選択の状態で分岐点に到達・通過する場合は必ず分岐点でストップ
      let targetPos;
      if (branchInfo && p.position < branchInfo.branchSpaceId && p.position + totalSteps >= branchInfo.branchSpaceId && !p.eraRoute) {
        targetPos = branchInfo.branchSpaceId;
      } else {
        targetPos = calculateNextPosition(p.position, totalSteps, p.eraRoute, branchInfo, eraSpaces.length);
      }

      p.position = targetPos;
      p.eraTurns = (p.eraTurns || 0) + 1;
      p.totalTurns = (p.totalTurns || 0) + 1;
      G.turnStep = 'resolve_space';

      const space = eraSpaces[targetPos] || eraSpaces[0];
      const remainingTurns = Math.max(0, G.eraMaxTurns - p.eraTurns);
      const isGoalSpace = targetPos === lastSpaceId;

      G.logs.unshift(
        isGoalSpace
          ? `🏁 🎉 Player ${playerID} が【${currentEra.name}・ゴール】に到達！【${space.title}】お祝い金獲得！（残り${remainingTurns}ターン）`
          : `🎯 Player ${playerID} がルーレット【${roll}${bonus ? '+1' : ''}】！【${space.title}】に到着！（${currentEra.name} 残り${remainingTurns}ターン）`
      );

      // マスイベント適用
      JinseiGame.resolveSpaceEffects(G, ctx, playerID, space, random);
    },

    // 2-B. 時代コース分岐選択 (Aコース vs Bコース)
    chooseEraBranch: ({ G, ctx, events }, playerID, routeKey) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];
      if (!p) return;

      const currentEra = getEraById(G.era);
      const branchInfo = currentEra?.branchInfo;
      if (!branchInfo) return;

      const chosenRoute = branchInfo.routes[routeKey] || branchInfo.routes.A;
      p.eraRoute = routeKey;

      if (routeKey === 'A') {
        p.academic = Math.min(100, (p.academic || 50) + 5);
      } else {
        p.stamina = Math.min(100, (p.stamina || 50) + 5);
      }

      G.logs.unshift(`🛤️ Player ${playerID} は【${chosenRoute.name}】を選択しました！（${chosenRoute.desc}）`);
      advanceToNextTurn(G, ctx, events);
    },

    // 3. 職業選択 (通常または学歴フィルター/逆転面接)
    chooseJob: ({ G, ctx, random, events }, playerID, jobId, tryGamble = false) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];

      // 就活断念・無職選択
      if (jobId === 'unemployed') {
        const unempOcc = OCCUPATIONS.find((o) => o.id === 'unemployed') || { id: 'unemployed', title: '無職・求職中', baseSalary: 0, maxSalary: 0, icon: '🏚️' };
        p.occupation = unempOcc;
        p.salary = 0;
        G.logs.unshift(`🏚️ Player ${playerID} は就職を断念し、【無職・求職中】として人生を続行します！（給料: 0万円）`);
        advanceToNextTurn(G, ctx, events);
        return;
      }

      const occ = OCCUPATIONS.find((o) => o.id === jobId) || OCCUPATIONS[OCCUPATIONS.length - 1];

      if (G.isHardMode) {
        if (tryGamble) {
          const roll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
          if (roll >= 8) {
            p.occupation = occ;
            p.salary = occ.baseSalary;
            G.logs.unshift(`🔥【大逆転採用！】出目【${roll}】で面接官に熱意が刺さり奇跡の合格！【${occ.title}】に就任！（給料: ${occ.baseSalary}万円）`);
            advanceToNextTurn(G, ctx, events);
          } else {
            p.money -= 30;
            const unempOcc = OCCUPATIONS.find((o) => o.id === 'unemployed') || { id: 'unemployed', title: '無職・求職中', baseSalary: 0, maxSalary: 0, icon: '🏚️' };
            p.occupation = unempOcc;
            p.salary = 0;
            G.logs.unshift(`❌【お祈りメール…全滅！】出目【${roll}】で不合格！就活費用 -30万円。就職できず【無職】として人生を続行します…！`);
            advanceToNextTurn(G, ctx, events);
          }
        } else {
          const devReq = occ.minHensachi || 0;
          const stamReq = occ.minStamina || 0;
          const devPass = devReq === 0 || (p.hensachi || 50) >= devReq;
          const stamPass = stamReq === 0 || (p.stamina || 50) >= stamReq;
          if (devPass && stamPass) {
            p.occupation = occ;
            p.salary = occ.baseSalary;
            G.logs.unshift(`🎓【正規採用！】偏差値【${p.hensachi || 50}】＆ 体力【${p.stamina || 50}】の実力で見事【${occ.title}】に合格！（初任給: ${occ.baseSalary}万円）`);
            advanceToNextTurn(G, ctx, events);
          } else {
            p.money -= 30;
            const unempOcc = OCCUPATIONS.find((o) => o.id === 'unemployed') || { id: 'unemployed', title: '無職・求職中', baseSalary: 0, maxSalary: 0, icon: '🏚️' };
            p.occupation = unempOcc;
            p.salary = 0;
            const reasons = [];
            if (!devPass) reasons.push(`要偏差値【${devReq}】に対し偏差値【${p.hensachi || 50}】`);
            if (!stamPass) reasons.push(`要体力【${stamReq}】に対し体力【${p.stamina || 50}】`);
            G.logs.unshift(`⚠️ ${reasons.join(' ＆ ')}が不足のため採用見送り！就活費用 -30万円。【無職】として人生を続行します。`);
            advanceToNextTurn(G, ctx, events);
          }
        }
      } else {
        p.occupation = occ;
        p.salary = occ.baseSalary;
        G.logs.unshift(`🎓 Player ${playerID} が【${occ.title}】に就任！（給料: ${p.salary}万円）`);
        advanceToNextTurn(G, ctx, events);
      }
    },

    // 3-B. 就職ルーレット（1〜10のルーレットで職業決定）
    spinJobRoulette: ({ G, ctx, random }, playerID) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];
      if (!p) return;

      const roll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
      const jobId = JOB_ROULETTE_TABLE[roll] || 'salaryman';
      const candidateOcc = OCCUPATIONS.find((o) => o.id === jobId) || OCCUPATIONS[0];
      const pDev = p.hensachi || 50;
      const pStam = p.stamina || 50;

      let resultData = {
        roll,
        candidate: candidateOcc,
        passed: true,
        finalOcc: candidateOcc,
        isHardMode: !!G.isHardMode,
        playerID,
        playerHensachi: pDev,
        playerStamina: pStam,
        penalty: 0,
        failReason: '',
      };

      if (G.isHardMode) {
        const devReq = candidateOcc.minHensachi || 0;
        const stamReq = candidateOcc.minStamina || 0;
        const devPass = devReq === 0 || pDev >= devReq;
        const stamPass = stamReq === 0 || pStam >= stamReq;

        if (devPass && stamPass) {
          p.occupation = candidateOcc;
          p.salary = candidateOcc.baseSalary;
          resultData.passed = true;
          resultData.finalOcc = candidateOcc;
          G.logs.unshift(`🎓【就職ルーレット】出目【${roll}】！偏差値【${pDev}】(要:${devReq}) ＆ 体力【${pStam}】(要:${stamReq})で見事【${candidateOcc.title}】に正規採用！（初任給: ${candidateOcc.baseSalary}万円）`);
        } else {
          // 学歴・体力選考フィルター不合格 -> 就活費 -30万、無職で続行
          p.money -= 30;
          const unempOcc = OCCUPATIONS.find((o) => o.id === 'unemployed') || { id: 'unemployed', title: '無職・求職中', baseSalary: 0, maxSalary: 0, icon: '🏚️' };
          p.occupation = unempOcc;
          p.salary = 0;
          resultData.passed = false;
          resultData.finalOcc = unempOcc;
          resultData.penalty = 30;

          const reasons = [];
          if (!devPass) reasons.push(`要偏差値【${devReq}】に対し偏差値【${pDev}】`);
          if (!stamPass) reasons.push(`要体力【${stamReq}】に対し体力【${pStam}】`);
          const reasonStr = reasons.join(' ＆ ') + ' が不足';
          resultData.failReason = reasonStr;

          G.logs.unshift(`💀【就職ルーレット】出目【${roll}】…志望先【${candidateOcc.title}】の選考に対し、${reasonStr}のため不採用！就活費用 -30万円、【無職・求職中】として人生を続行します…！`);
        }
      } else {
        // 通常モード：出目の職業に即就任
        p.occupation = candidateOcc;
        p.salary = candidateOcc.baseSalary;
        resultData.passed = true;
        resultData.finalOcc = candidateOcc;
        G.logs.unshift(`🎉【就職ルーレット】出目【${roll}】！Player ${playerID} は【${candidateOcc.title}】に就職決定！（初任給: ${candidateOcc.baseSalary}万円）`);
      }

      G.currentSpaceModal = {
        spaceId: p.position,
        title: resultData.passed ? '🎉 【採用決定！】就職ルーレット結果' : '💀 【選考フィルター不採用…】就職ルーレット結果',
        desc: resultData.passed
          ? `出目【${roll}】で【${resultData.finalOcc.title}】に内定しました！（初任給: ${resultData.finalOcc.baseSalary}万円）`
          : `出目【${roll}】の【${candidateOcc.title}】の選考は、${resultData.failReason}のため不合格となりました…！`,
        type: 'job_result',
        resultData,
      };
      G.turnStep = 'end_turn';
    },

    // 3-C. 転職チャンス（学力・体力ラインを参照して転職または現状維持）
    changeJob: ({ G, ctx, events }, playerID, jobId) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];
      if (!p) return;

      const modal = G.currentSpaceModal;
      const isForced = modal?.isForced;
      const currentOcc = p.occupation;

      // 現状維持（転職しない・現在の職業を継続）
      if (!jobId || jobId === 'keep' || jobId === currentOcc?.id) {
        if (isForced) {
          G.logs.unshift(`⚠️ 年齢・引退規定により現在の職業【${currentOcc?.title}】を維持することはできません！別のセカンドキャリアを選択してください。`);
          return;
        }
        G.logs.unshift(`💼 Player ${playerID} は転職を見送り、現在の職業【${currentOcc?.icon || ''} ${currentOcc?.title || '無職'}】（給料:${p.salary}万円）を誇りを持って継続します！`);
        advanceToNextTurn(G, ctx, events);
        return;
      }

      const targetOcc = OCCUPATIONS.find((o) => o.id === jobId);
      if (!targetOcc) {
        advanceToNextTurn(G, ctx, events);
        return;
      }

      // 年齢制限チェック：壮年期（Era 3）以降はアイドルへの新規就任不可、熟年期（Era 4）以降はアイドル・アスリートへの新規就任不可
      if ((G.era >= 3 && targetOcc.id === 'idol') || (G.era >= 4 && (targetOcc.id === 'idol' || targetOcc.id === 'athlete'))) {
        G.logs.unshift(`⚠️ 年齢規定により【${targetOcc.icon} ${targetOcc.title}】へ就任することはできません！別の職業を選択してください。`);
        return;
      }

      const reqAcad = targetOcc.reqAcademic || 0;
      const reqStam = targetOcc.reqStamina || 0;
      const pAcad = p.academic || 50;
      const pStam = p.stamina || 50;

      if (pAcad >= reqAcad && pStam >= reqStam) {
        const oldTitle = currentOcc ? `${currentOcc.icon} ${currentOcc.title}` : '無職';
        p.occupation = targetOcc;
        p.salary = targetOcc.baseSalary;
        G.logs.unshift(`🎉 ✨【キャリアアップ大成功！】Player ${playerID} は【${oldTitle}】から【${targetOcc.icon} ${targetOcc.title}】へ転職！（給料: ${targetOcc.baseSalary}万円 / 学力:${pAcad}≧${reqAcad}, 体力:${pStam}≧${reqStam}）`);
      } else {
        G.logs.unshift(`⚠️ 学力または体力の要件を満たしていないため、転職は行われませんでした。（必要学力:${reqAcad}/現在:${pAcad}, 必要体力:${reqStam}/現在:${pStam}）`);
        if (isForced) {
          // 強制転職の場合は要件を満たす職を選ばせるためリターン
          return;
        }
      }

      advanceToNextTurn(G, ctx, events);
    },

    // 4. 分岐ルート選択 (進路分岐 または 中年キャリア分岐)
    chooseRoute: ({ G, ctx, events }, playerID, route) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];

      // 青年期進路選択 ('tokyo' or 'local')
      if (route === 'tokyo' || route === 'local') {
        p.branchRoute = route;
        const isTokyo = p.prefecture?.id === 'tokyo';
        if (route === 'tokyo') {
          p.money -= 20;
          if (G.isHardMode) p.hensachi = (p.hensachi || 50) + 2;
          if (isTokyo) {
            G.logs.unshift(`🗼 Player ${playerID} は生粋の東京人！【都心エリート・都内自立コース】を選択！（偏差値+2、自立生活費 -20万円）`);
          } else {
            G.logs.unshift(`🏙️ Player ${playerID} は【大都会コース】を選択！夢と希望を胸に上京！（偏差値+2、引越し費 -20万円）`);
          }
        } else {
          p.money += 30;
          if (isTokyo) {
            G.logs.unshift(`🌾 Player ${playerID} は東京を飛び出し【地方移住・UIターンコース】を選択！（地方移住定着金 +30万円）`);
          } else {
            G.logs.unshift(`🌾 Player ${playerID} は生まれ故郷の【地元就職コース】を選択！地元定着祝い金 +30万円 獲得！`);
          }
        }

        // 直ちに運命の就職ルーレットモーダルを開く
        G.currentSpaceModal = {
          spaceId: p.position,
          title: G.isHardMode ? '💀【運命の就職ルーレット・学歴＆体力選考フィルター】' : '🎡【運命の就職ルーレット】就職先を決定！',
          desc: G.isHardMode
            ? `進路決定！ルーレット（1〜10）を回して就職先を決定します。現在の偏差値【${p.hensachi || 50}】＆ 体力【${p.stamina || 50}】で採用基準を突破できるか！？不合格時は就活費 -30万円、【無職】で人生続行！`
            : '進路決定！運命の就職ルーレット（1〜10）を回してあなたの職業を決定しよう！',
          type: 'choose_job',
        };
        return;
      }

      // 中年キャリア分岐 ('venture' or 'steady')
      if (route === 'venture' || route === 'steady') {
        p.midlifeRoute = route;
        if (route === 'venture') {
          p.money += 80;
          G.logs.unshift(`🚀 Player ${playerID} は【ベンチャー起業・大勝負コース】を選択！特別出資金 +80万円 獲得！`);
        } else {
          p.money += 30;
          G.logs.unshift(`🛡️ Player ${playerID} は【堅実継続・安定コース】を選択！特別手当 +30万円 獲得！`);
        }
        advanceToNextTurn(G, ctx, events);
        return;
      }

      advanceToNextTurn(G, ctx, events);
    },

    // 5. マイホーム購入選択
    chooseHouse: ({ G, ctx, events }, playerID, houseId) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];
      const house = HOUSES.find((h) => h.id === houseId);
      if (!house) {
        G.logs.unshift(`🏡 Player ${playerID} はマイホーム購入を見送り、賃貸生活を継続します。`);
      } else {
        let price = house.price;
        if (p.prefecture?.passiveType === 'real_estate_discount') {
          price = Math.round(price * 0.7);
        }
        if (p.prefecture?.passiveType === 'negotiate_discount') {
          price = Math.round(price * 0.8);
        }

        p.money -= price;
        p.house = { ...house, purchasePrice: price };
        G.logs.unshift(`🏡 Player ${playerID} が【${house.name}】を ${price}万円 で購入しました！`);
      }

      advanceToNextTurn(G, ctx, events);
    },

    // 5-B. ハードモード親ガチャ旅行決断（行く vs キャンセル）
    decideTravel: ({ G, ctx, random, events }, playerID, choice) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];
      if (!p) return;

      const modal = G.currentSpaceModal;
      if (!modal || modal.type !== 'choose_travel') return;

      const space = modal.space;
      const parentTier = p.parentIncome || { income: 500, title: '平均的一般家庭', icon: '🏠' };
      const beforeMoney = p.money;

      if (choice === 'cancel') {
        let deltaMoney = 0;
        let acadDelta = 0;
        let stamDelta = 0;
        let hensachiDelta = 0;
        let summaryDesc = '';

        if (parentTier.income < 400) {
          deltaMoney = 5;
          acadDelta = 5;
          stamDelta = 5;
          p.money += deltaMoney;
          p.academic = Math.min(100, (p.academic || 50) + acadDelta);
          p.stamina = Math.min(100, (p.stamina || 50) + stamDelta);
          summaryDesc = `親から「うちはよそと違うの！」と言われ旅行はあえなくキャンセル…！しかし涙を拭ってお留守番とお手伝いでお駄賃 +5万円 獲得！さらに図書館での独学と走り込みで【学力 +5】【体力 +5】大幅アップ！`;
          G.logs.unshift(`🏠 💀【親ガチャの現実・旅行キャンセル】Player ${playerID} は実家年収（${parentTier.income}万）のため旅行を断念してお留守番。お駄賃 +5万円 ＆ 独学とお手伝いでたくましく成長！（学力+5/体力+5）`);
        } else if (parentTier.income < 1000) {
          deltaMoney = 15;
          acadDelta = 4;
          p.money += deltaMoney;
          p.academic = Math.min(100, (p.academic || 50) + acadDelta);
          summaryDesc = `家族と相談して旅行を賢くキャンセル！浮いた家族旅行代から特別お小遣い・貯蓄として +15万円 獲得！自宅でじっくり読書と自習をして【学力 +4】アップ！`;
          G.logs.unshift(`🏠 【旅行キャンセル・堅実貯金】Player ${playerID} は旅行をキャンセルして貯金 +15万円 ＆ 自宅学習で学力+4！`);
        } else {
          deltaMoney = 50;
          hensachiDelta = 1;
          p.money += deltaMoney;
          p.hensachi = Math.min(80, (p.hensachi || 50) + hensachiDelta);
          summaryDesc = `「旅行に行かないならこれで好きなものを買いなさい！」富豪の親から自由に使っていいとお小遣い +50万円 支給！さらに余裕ある家庭環境で【偏差値 +1】UP！`;
          G.logs.unshift(`🏠 👑【親ガチャ大勝利・旅行キャンセル】Player ${playerID} は旅行をパスしたものの、富豪の親（実家年収:${parentTier.income}万）から自由資金 +50万円 支給＆偏差値+1！`);
        }

        G.currentSpaceModal = {
          spaceId: space?.id || p.position,
          title: parentTier.income < 400 ? '🏠 💀【親ガチャの現実・旅行キャンセル】' : parentTier.income >= 1000 ? '🏠 👑【親ガチャ大勝利・旅行キャンセル】' : '🏠 【旅行キャンセル・堅実貯金】',
          desc: summaryDesc,
          type: 'travel_cancel_result',
          deltaMoney,
          beforeMoney,
          afterMoney: p.money,
          details: `所持金: ${beforeMoney}万 ➔ ${p.money}万 ${acadDelta > 0 ? `| 学力 +${acadDelta}` : ''} ${stamDelta > 0 ? `| 体力 +${stamDelta}` : ''} ${hensachiDelta > 0 ? `| 偏差値 +${hensachiDelta}` : ''}`,
        };
        G.turnStep = 'end_turn';
        return;
      }

      // choice === 'go'
      const baseCost = Math.abs(space?.amount || 25);
      let effectiveCost = baseCost;
      let travelBonus = 0;
      const perkNotes = [];

      // 親の年収による補正
      if (parentTier.income < 400) {
        effectiveCost += 10;
        perkNotes.push(`困窮実家（年収${parentTier.income}万）:親支援なし・自腹追加+10万`);
      } else if (parentTier.income >= 1000) {
        effectiveCost = 0;
        travelBonus += 30;
        p.hensachi = Math.min(80, (p.hensachi || 50) + 1);
        perkNotes.push(`富裕層実家（年収${parentTier.income}万）:親全額負担＆お小遣い+30万＆偏差値+1`);
      } else if (parentTier.income >= 680) {
        effectiveCost = Math.round(effectiveCost / 2);
        perkNotes.push(`安定実家（年収${parentTier.income}万）:親が旅費半額負担`);
      }

      // 出身地恩恵チェック
      if (p.prefecture?.passiveType === 'real_estate_discount') {
        travelBonus += 50;
        perkNotes.push('北海道「でっかい大地」:+50万');
      }
      if (p.prefecture?.passiveType === 'amusement_bonus') {
        travelBonus += 40;
        perkNotes.push('千葉「夢の国パワー」:+40万');
      }
      if (p.prefecture?.passiveType === 'onsen_heal_bonus') {
        travelBonus += 60;
        perkNotes.push('大分「日本一のおんせん県」:+60万');
      }
      if (p.prefecture?.passiveType === 'udon_cost_saver') {
        effectiveCost = 0;
        perkNotes.push('香川「讃岐うどんコスパ」:旅費0円');
      }
      if (p.prefecture?.passiveType === 'penalty_half') {
        effectiveCost = Math.round(effectiveCost / 2);
        perkNotes.push('静岡「富士山と駿河湾」:旅費半額');
      }

      const otherPrefs = PREFECTURES.filter((pr) => pr.id !== p.prefecture?.id);
      const candidates = otherPrefs.length > 0 ? otherPrefs : PREFECTURES;
      const destIdx = random ? (random.Die(candidates.length) - 1) : Math.floor(Math.random() * candidates.length);
      const destination = candidates[destIdx] || PREFECTURES[0];

      const newSouvenir = {
        id: `${destination.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        prefId: destination.id,
        prefName: destination.name,
        regionName: destination.regionName,
        name: destination.souvenir.name,
        icon: destination.souvenir.icon,
        value: destination.souvenir.value,
        flavor: destination.flavor,
        count: 1
      };
      p.souvenirs = p.souvenirs || [];
      p.souvenirs.push(newSouvenir);

      const netMoney = travelBonus - effectiveCost;
      p.money += netMoney;

      let perkMsg = '';
      if (perkNotes.length > 0) {
        perkMsg = `【実家・出身恩恵: ${perkNotes.join(', ')}】`;
      }

      const detailsText = `🗾【${destination.emoji} ${destination.name}（${destination.regionName}）】へ旅行！\nご当地名産品【${destination.souvenir.icon} ${destination.souvenir.name}】（資産価値 +${destination.souvenir.value}万円）を獲得！\n` +
        `旅費: ${effectiveCost}万円 ${travelBonus > 0 ? `| ボーナス: +${travelBonus}万円` : ''} ➔ 収支: ${netMoney >= 0 ? '+' + netMoney : netMoney}万円`;

      G.logs.unshift(
        `✈️ 【家族旅行出発！】Player ${playerID} が【${destination.emoji} ${destination.name}】へ旅行！名産品【${destination.souvenir.icon} ${destination.souvenir.name}】（価値+${destination.souvenir.value}万）獲得！${perkMsg ? ` ✨${perkMsg}` : ''}`
      );

      const travelData = {
        destination,
        souvenir: newSouvenir,
        baseCost,
        effectiveCost,
        travelBonus,
        netMoney,
        perkMsg
      };

      G.currentSpaceModal = {
        spaceId: space?.id || p.position,
        title: space?.title || '【全国ご当地旅行】',
        desc: space?.desc || '全国の名所へ旅行！ご当地名産品を獲得！',
        type: 'travel',
        travelData,
        deltaMoney: netMoney,
        beforeMoney,
        afterMoney: p.money,
        details: detailsText,
      };
      G.turnStep = 'end_turn';
    },

    // 6. 手番終了
    endTurn: ({ G, ctx, events }, playerID) => {
      if (G.gameState !== 'playing') return;
      if (playerID && ctx.currentPlayer !== playerID) return;

      advanceToNextTurn(G, ctx, events);
    },

    // 7. ゲームリセット
    restartGame: ({ G, ctx }) => {
      const resetG = JinseiGame.setup({ ctx });
      resetG.isHardMode = G.isHardMode;
      resetG.gameState = 'select_prefecture';
      Object.assign(G, resetG);
    },
  },

  // マスイベントの自動解決ロジック
  resolveSpaceEffects: (G, ctx, playerID, space, random) => {
    const p = G.players[playerID];
    const beforeMoney = p.money;
    let detailsText = '';
    let hometownPerkTriggered = null;
    let travelData = null;

    switch (space.type) {
      case 'money': {
        const amt = space.amount || 0;
        if (amt < 0) {
          const loss = Math.abs(amt);
          // 沖縄: なんくるないさー魂
          if (p.prefecture?.passiveType === 'nankurunaisa_shield') {
            detailsText = `沖縄の「なんくるないさー魂」発動！損失 ${loss}万円 を「まあいいさ〜」と笑顔で全額無効化（自己負担0円）！`;
            hometownPerkTriggered = {
              prefName: p.prefecture.name,
              emoji: p.prefecture.emoji,
              traitName: p.prefecture.traitName,
              effect: `なんくるないさー精神で出費（${loss}万円）を完全無効化！`
            };
          }
          // 奈良: 大仏の慈悲
          else if (p.prefecture?.passiveType === 'buddha_peace') {
            detailsText = `奈良の大仏様の慈悲により、出費 ${loss}万円 を大仏様が全額補填して自己負担0円！`;
            hometownPerkTriggered = {
              prefName: p.prefecture.name,
              emoji: p.prefecture.emoji,
              traitName: p.prefecture.traitName,
              effect: `大仏様の慈悲により損失（${loss}万円）が全額補填！`
            };
          }
          // 静岡: 富士山と駿河湾
          else if (p.prefecture?.passiveType === 'penalty_half') {
            const reducedLoss = Math.round(loss / 2);
            p.money -= reducedLoss;
            detailsText = `静岡の富士山と駿河湾の懐深さにより、出費が半額（-${reducedLoss}万円）に軽減！`;
            hometownPerkTriggered = {
              prefName: p.prefecture.name,
              emoji: p.prefecture.emoji,
              traitName: p.prefecture.traitName,
              effect: `マイナス出費が半額（-${reducedLoss}万円）に軽減！`
            };
            G.logs.unshift(`💸 Player ${playerID} が半額出費 ${reducedLoss}万円 を支払いました。`);
          } else {
            p.money += amt;
            detailsText = `${loss}万円 を支払いました。`;
            G.logs.unshift(`💸 Player ${playerID} が ${loss}万円 を支払いました。`);
          }

          // 福島: 起き上がり小法師（借金・赤字救済）
          if (p.money < 0 && p.prefecture?.passiveType === 'income_boost') {
            p.money += 100;
            detailsText += ' ★福島「起き上がり小法師」発動！赤字転落を検知し自治体支援金 +100万円 受給！';
            hometownPerkTriggered = {
              prefName: p.prefecture.name,
              emoji: p.prefecture.emoji,
              traitName: p.prefecture.traitName,
              effect: '起き上がり小法師魂！赤字転落時に自治体支援金 +100万円 受給！'
            };
          }
        } else {
          p.money += amt;
          detailsText = `+${amt}万円 を獲得しました！`;
          G.logs.unshift(`💰 Player ${playerID} が +${amt}万円 獲得！`);
        }
        break;
      }

      case 'study': {
        let studyAmt = space.amount || 20;
        p.academic = Math.min(100, (p.academic || 50) + 6);
        if (p.prefecture?.passiveType === 'artisan_bonus') {
          // 岐阜: 美濃飛騨の名工魂
          studyAmt += 30;
          hometownPerkTriggered = {
            prefName: p.prefecture.name,
            emoji: p.prefecture.emoji,
            traitName: p.prefecture.traitName,
            effect: '美濃飛騨の名工魂により、学術・研究奨励金 +30万円 追加！'
          };
        }
        if (G.isHardMode) {
          p.hensachi = Math.min(80, (p.hensachi || 50) + 3);
          p.money += (studyAmt - (space.amount || 20));
          detailsText = `知性と教養がUP！学力 +6（現在:${p.academic}）＆ 偏差値 +3 上昇！${studyAmt > (space.amount || 20) ? `（名工奨励金 +${studyAmt - (space.amount || 20)}万）` : ''}`;
          G.logs.unshift(`📖 【猛勉強の成果！】学力 +6（現在:${p.academic}）＆ 偏差値 +3 上昇！（現在: 偏差値【${p.hensachi}】）`);
        } else {
          p.money += studyAmt;
          detailsText = `知性と教養がUP！学力 +6（現在:${p.academic}）＆ 特別奨励金 +${studyAmt}万円 獲得！`;
          G.logs.unshift(`📖 【学問と教養】学力 +6（現在:${p.academic}）＆ 猛勉強の成果で特別奨励金 +${studyAmt}万円 獲得！`);
        }
        break;
      }

      case 'sports':
        p.stamina = Math.min(100, (p.stamina || 50) + 6);
        p.money += (space.amount || 20);
        if (G.isHardMode) {
          p.hensachi = Math.min(80, (p.hensachi || 50) + 1);
          detailsText = `体力 +6（現在:${p.stamina}）＆ 大会賞金 +${space.amount || 20}万円 ＆ 偏差値 +1 UP！`;
          G.logs.unshift(`🏃 【文武両道！】体力 +6（現在:${p.stamina}）＆ 大会で大活躍、偏差値 +1 UP！（現在: 偏差値【${p.hensachi}】）`);
        } else {
          detailsText = `体力 +6（現在:${p.stamina}）＆ 大会賞金 +${space.amount || 20}万円 獲得！`;
          G.logs.unshift(`🏃 【スポーツ躍動！】体力 +6（現在:${p.stamina}）＆ 大会賞金 +${space.amount || 20}万円 獲得！`);
        }
        break;

      case 'payday': {
        if (p.occupation && p.occupation.id !== 'unemployed' && p.salary > 0) {
          let pay = p.salary;
          const bonusItems = [];
          if (p.prefecture?.passiveType === 'salary_boost_heavy') {
            pay += 50;
            bonusItems.push('東京メガロポリス+50万');
            hometownPerkTriggered = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: '首都特別手当 +50万円' };
          }
          if (p.prefecture?.passiveType === 'toyota_saving') {
            pay += 50;
            bonusItems.push('愛知堅実貯蓄+50万');
            hometownPerkTriggered = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: 'ものづくり王国・堅実貯蓄ボーナス +50万円' };
          }
          if (p.prefecture?.passiveType === 'salary_boost') {
            pay += 20;
            bonusItems.push('岩手南部鉄器+20万');
            hometownPerkTriggered = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: '粘り強さボーナス +20万円' };
          }
          if (p.car.spouse) { pay += 20; bonusItems.push('配偶者手当+20万'); }
          if (p.car.kids) {
            const kidRate = p.prefecture?.passiveType === 'kibidango_family' ? 30 : 15;
            const kAllowance = p.car.kids * kidRate;
            pay += kAllowance;
            bonusItems.push(`子供手当(${p.car.kids}人)+${kAllowance}万`);
            if (p.prefecture?.passiveType === 'kibidango_family') {
              hometownPerkTriggered = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: '桃太郎の吉備団子により子供手当が2倍！' };
            }
          }

          p.money += pay;
          detailsText = `基本給: ${p.salary}万 ${bonusItems.length > 0 ? `(${bonusItems.join(', ')})` : ''} ➔ 給料受取 +${pay}万円`;
          G.logs.unshift(`💵 【定期給料日】Player ${playerID} が給料 ${pay}万円 を受給しました！`);
        } else {
          p.money += 20;
          detailsText = '無職のため定例給与なし（日雇いバイト代 +20万円 のみ受給）';
          G.logs.unshift(`💵 【定期給料日】Player ${playerID} は無職のため定例給与なし（日雇いバイト代 20万円 のみ受給）`);
        }
        break;
      }

      case 'marriage':
        if (!p.car.spouse) {
          p.car.spouse = true;
          let giftFromOthers = 30;
          let nationalBonus = 100;
          if (p.prefecture?.passiveType === 'wedding_bonus') {
            giftFromOthers = 50;
            hometownPerkTriggered = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: 'さくらんぼの寄り添いにより参列者全員からの祝儀+50万円' };
          }
          if (p.prefecture?.passiveType === 'izumo_marriage_bless') {
            giftFromOthers = 50;
            nationalBonus = 200;
            hometownPerkTriggered = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: '出雲大社の縁結びにより祝儀特大UP（祝儀+50万＆国祝金+200万）' };
          }

          let totalGifts = 0;
          Object.keys(G.players).forEach((otherPid) => {
            if (otherPid !== playerID) {
              G.players[otherPid].money -= giftFromOthers;
              totalGifts += giftFromOthers;
            }
          });
          const totalMarriage = totalGifts + nationalBonus;
          p.money += totalMarriage;
          detailsText = `参加者全員からのご祝儀計 +${totalGifts}万円 ＋ 国・県からのお祝い金 +${nationalBonus}万円！（計 +${totalMarriage}万円）`;
          G.logs.unshift(`💍 祝・結婚！Player ${playerID} に配偶者ピン追加！全員からご祝儀計 +${totalMarriage}万円！`);
        } else {
          detailsText = 'すでに既婚のため結婚式イベントはスキップされました';
        }
        break;

      case 'child':
      case 'baby': {
        const bonusPerKid = space.amount || 50;
        let isShotgunWedding = false;

        // まだ結婚していない場合は「授かり婚・電撃結婚」として配偶者ピンも自動追加！
        if (!p.car.spouse) {
          p.car.spouse = true;
          isShotgunWedding = true;
        }

        // 赤ちゃん誕生
        p.car.kids = (p.car.kids || 0) + 1;
        const kidNum = p.car.kids;

        let babyBonus = bonusPerKid;
        if (p.prefecture?.passiveType === 'child_bonus') {
          babyBonus = Math.round(bonusPerKid * 1.5);
          hometownPerkTriggered = {
            prefName: p.prefecture.name,
            emoji: p.prefecture.emoji,
            traitName: p.prefecture.traitName,
            effect: `上毛かるたの英才教育により出産祝い金が +${babyBonus}万円 に増額！`
          };
        }

        p.money += babyBonus;

        const kidTitle = kidNum === 1 ? '第1子' : (kidNum === 2 ? '第2子' : `第${kidNum}子`);

        if (isShotgunWedding) {
          detailsText = `【授かり婚＆出産！】素敵なパートナーと電撃結婚し、待望の${kidTitle}が誕生！（配偶者＋子どもピン追加、計${p.car.kids}人）出産祝い金 +${babyBonus}万円 獲得！（給料手当毎月+${p.car.kids * 15}万＆決算資産+${p.car.kids * 200}万確定）`;
          G.logs.unshift(`👶 💍 【授かり婚＆出産！】Player ${playerID} は電撃結婚し、待望の${kidTitle}が誕生！（配偶者＆子どもピン追加、計${p.car.kids}人）出産祝い金 +${babyBonus}万円！`);
        } else {
          detailsText = `【祝・${kidTitle}誕生！】元気な赤ちゃんが誕生しました！（子どもピン追加、計${p.car.kids}人）出産祝い金 +${babyBonus}万円 獲得！（給料手当毎月+${p.car.kids * 15}万＆決算資産+${p.car.kids * 200}万確定）`;
          G.logs.unshift(`👶 【祝・${kidTitle}誕生！】Player ${playerID} に${kidTitle}が誕生！（子どもピン追加、計${p.car.kids}人）出産祝い金 +${babyBonus}万円！`);
        }
        break;
      }

      case 'child_event': {
        const amt = space.amount || 30;
        p.money += amt;
        if ((p.car.kids || 0) > 0) {
          detailsText = `わが子の成長を家族みんなでお祝い！お祝い金 +${amt}万円 を受領しました！`;
          G.logs.unshift(`🎒 👨‍👩‍👧‍👦 Player ${playerID} はわが子の成長をお祝い！お祝い金 +${amt}万円 獲得！`);
        } else {
          detailsText = `親戚や友人の子どものお祝いに参列！お返しや感謝の謝礼 +${amt}万円 を受け取りました！`;
          G.logs.unshift(`🎁 Player ${playerID} は親戚・友人の子どもの成長祝いに参列し、感謝のお礼 +${amt}万円 獲得！`);
        }
        break;
      }

      case 'child_education': {
        if ((p.car.kids || 0) > 0) {
          const cost = p.car.kids * 40;
          p.money -= cost;
          detailsText = `子供（${p.car.kids}人）の大学進学！学費支援として計 ${cost}万円 支払いました。（1人あたり40万）`;
          G.logs.unshift(`🎓 【子供の大学進学】Player ${playerID} は子供${p.car.kids}人の学費として ${cost}万円 を支払いました。`);
        } else {
          p.money += 30;
          detailsText = `子供がいないため大人の学びに集中！リスキリング成功で特別手当 +30万円 獲得！`;
          G.logs.unshift(`🌟 【大人の学び直し・自己投資】Player ${playerID} は子供なしのため自己投資！スキルアップで特別手当 +30万円 獲得！`);
        }
        break;
      }

      case 'grandchild_birth': {
        if ((p.car.kids || 0) > 0) {
          p.money -= 30;
          detailsText = `目に入れても痛くないお孫さんが誕生！お祝いとおもちゃ代として 30万円 を支払いました。`;
          G.logs.unshift(`🧸 【お孫さん誕生】Player ${playerID} にお孫さん誕生！お祝い代として 30万円 を支出！`);
        } else {
          p.money += 20;
          detailsText = `子供がいないため看板ペット（愛犬・愛猫）をお迎え！癒やしの毎日にご近所から差し入れ +20万円 獲得！`;
          G.logs.unshift(`🐾 【看板ペットお迎え】Player ${playerID} は癒やしのペットをお迎え！ご近所から差し入れ +20万円 獲得！`);
        }
        break;
      }

      case 'grandchild_gift': {
        if ((p.car.kids || 0) > 0) {
          p.money -= 20;
          detailsText = `お孫さんの小学校入学！ランドセルとお祝い金として 20万円 をプレゼントしました。`;
          G.logs.unshift(`🎁 【お孫さんの入学祝い】Player ${playerID} がお孫さんへ入学祝い 20万円 をプレゼント！`);
        } else {
          p.money += 30;
          detailsText = `子供がいないためシニア趣味に没頭！シルバーフェスタで見事入賞し、賞金 +30万円 獲得！`;
          G.logs.unshift(`🥇 【シニア趣味コンクール入賞】Player ${playerID} は趣味の作品で入賞！賞金 +30万円 獲得！`);
        }
        break;
      }

      case 'buy_house':
        detailsText = '物件価格: 900万〜2000万円（最終資産価値 1300万〜2400万円）';
        break;

      case 'branch_route': {
        const curEra = getEraById(G.era);
        const bInfo = curEra?.branchInfo;
        detailsText = bInfo ? bInfo.branchDesc : '運命のコース分岐点です！進みたいコースを選択してください。';
        break;
      }

      case 'branch_career':
        detailsText = '自立・上京コース（引越し費 -20万/偏差値+2）または 地元・地方コース（定着祝い金 +30万）';
        break;

      case 'branch_midlife':
        detailsText = 'ベンチャー起業（特別出資 +80万）または 堅実継続（特別手当 +30万）';
        break;

      case 'job_change': {
        const isIdol = p.occupation?.id === 'idol';
        const isAthleteInLateEra = p.occupation?.id === 'athlete' && G.era >= 4;
        const isForcedRetire = isIdol || isAthleteInLateEra;

        if (isForcedRetire) {
          const bonus = 50;
          p.money += bonus;
          const title = isIdol ? '🎤 💐【祝・アイドル卒業！セカンドキャリア強制転職】' : '⚽ 🏆【祝・現役引退！セカンドキャリア強制転職】';
          const desc = isIdol
            ? `30代を迎え、ファンや事務所から温かく見送られアイドルを卒業！卒業準備金 +${bonus}万円 を受領しました！規約によりアイドル継続は不可のため、これまでの学力と体力を活かして新しい職業へ転職してください！`
            : `体力の限界を迎え、惜しまれつつ現役引退！引退功労金 +${bonus}万円 を受領しました！アスリート継続は不可のため、新しいセカンドキャリアを選択してください！`;

          G.currentSpaceModal = {
            spaceId: space.id,
            title,
            desc,
            type: 'job_change',
            isForced: true,
            retireReason: isIdol ? 'idol_graduation' : 'athlete_retirement',
            bonusMoney: bonus,
            beforeMoney: p.money - bonus,
            afterMoney: p.money,
            deltaMoney: bonus,
            details: `${isIdol ? 'アイドル卒業祝い金' : '現役引退功労金'}: +${bonus}万円 獲得！現状維持は不可、新しい職業を選択してください。`,
            hometownPerk: null,
            travelData: null,
          };
          G.logs.unshift(
            isIdol
              ? `🎤 💐【アイドル卒業勧告】Player ${playerID} はアイドル卒業を迎え、卒業祝い金 +${bonus}万円 獲得！セカンドキャリアへ強制転職となります！`
              : `⚽ 🏆【現役引退勧告】Player ${playerID} は現役引退を迎え、引退祝い金 +${bonus}万円 獲得！セカンドキャリアへ強制転職となります！`
          );
          return;
        }

        detailsText = '学力と体力を活かして新しい職業へ転職できます！転職するか現在の職業を継続するか選択してください。';
        G.currentSpaceModal = {
          spaceId: space.id,
          title: space.title,
          desc: space.desc,
          type: 'job_change',
          beforeMoney: p.money,
          afterMoney: p.money,
          deltaMoney: 0,
          details: detailsText,
          hometownPerk: null,
          travelData: null,
        };
        G.logs.unshift(`💼 【転職チャンス到来！】Player ${playerID} は転職チャンスマスに到着！学力(${p.academic || 50})・体力(${p.stamina || 50})を活かして転職するか選択できます！`);
        return;
      }

      case 'health_check': {
        const isCovered = p.insurance?.life;
        if (p.prefecture?.passiveType === 'mikan_rescue') {
          // 愛媛: 蛇口からみかんジュース
          hometownPerkTriggered = {
            prefName: p.prefecture.name,
            emoji: p.prefecture.emoji,
            traitName: p.prefecture.traitName,
            effect: '愛媛みかんジュースの柑橘パワーで体調万全・健診費用0円！'
          };
          detailsText = '愛媛の柑橘パワーで体調万全！自己負担 0円！';
          G.logs.unshift(`🏥 【健康診断】愛媛みかんパワーで体調万全！自己負担0円でした！`);
        } else if (isCovered) {
          detailsText = '生命保険（加入済）が適用され、自己負担 0円！';
          G.logs.unshift(`🏥 【健康診断】生命保険（${p.prefecture?.name || '加入済'}）が適用され自己負担0円でした！`);
        } else {
          p.money -= 20;
          detailsText = '保険未加入のため、人間ドック費用 20万円 を支払いました。';
          G.logs.unshift(`🏥 【健康診断】人間ドック精密検査費用として 20万円 を支払いました。`);
        }
        break;
      }

      case 'typhoon': {
        const isCovered = p.insurance?.fire;
        const cost = isCovered ? 0 : 50;
        p.money -= cost;
        if (isCovered) {
          detailsText = '火災保険（加入済）が適用され、屋根修理代が全額補償（自己負担 0円）！';
          G.logs.unshift(`🌀 【大型台風襲来】火災保険（${p.prefecture?.name || '加入済'}）が適用され屋根修理代が全額補償！`);
        } else {
          detailsText = '保険未加入のため、修理費用 50万円 を支払いました。';
          G.logs.unshift(`🌀 【大型台風襲来】暴風雨で屋根瓦破損！修理代として 50万円 を支払いました。`);
        }
        break;
      }

      case 'homecoming':
        if (p.prefecture) {
          const hc = p.prefecture.homecoming;
          let hcMoney = hc.money;
          if (p.prefecture.passiveType === 'rice_double') {
            // 新潟: 越後魚沼の極上コシヒカリ 仕送り2倍
            hcMoney *= 2;
            hometownPerkTriggered = {
              prefName: p.prefecture.name,
              emoji: p.prefecture.emoji,
              traitName: p.prefecture.traitName,
              effect: `コシヒカリ米俵付きで実家仕送りが2倍（+${hcMoney}万円）！`
            };
          }
          p.money += hcMoney;
          const hcSouvenir = {
            id: `${p.prefecture.id}_hc_${Date.now()}`,
            prefId: p.prefecture.id,
            prefName: p.prefecture.name,
            regionName: p.prefecture.regionName,
            name: p.prefecture.souvenir.name,
            icon: p.prefecture.souvenir.icon,
            value: p.prefecture.souvenir.value,
            flavor: p.prefecture.flavor,
            count: 1
          };
          p.souvenirs.push(hcSouvenir);
          detailsText = `故郷【${p.prefecture.emoji} ${p.prefecture.name}】へ里帰り！実家からの仕送り +${hcMoney}万円 ＆ 名産品【${p.prefecture.souvenir.icon} ${p.prefecture.souvenir.name}】（資産価値 +${p.prefecture.souvenir.value}万）獲得！`;
          G.logs.unshift(`📦 【実家に帰省！】${p.prefecture.name}から仕送り +${hcMoney}万円＆名産品【${p.prefecture.souvenir.icon} ${p.prefecture.souvenir.name}】が届きました！`);
        }
        break;

      case 'lottery': {
        let lRoll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
        if (p.prefecture?.passiveType === 'ishin_gamble_boost') {
          // 山口: 明治維新の志士魂
          lRoll = Math.min(10, lRoll + 2);
          hometownPerkTriggered = {
            prefName: p.prefecture.name,
            emoji: p.prefecture.emoji,
            traitName: p.prefecture.traitName,
            effect: '維新の志士魂で宝くじ出目+2補正！'
          };
        }
        if (lRoll >= 8) {
          let winAmt = 1000;
          if (p.prefecture?.passiveType === 'gamble_boost') {
            // 石川: 加賀百万石の豪運
            winAmt = 2000;
            hometownPerkTriggered = {
              prefName: p.prefecture.name,
              emoji: p.prefecture.emoji,
              traitName: p.prefecture.traitName,
              effect: '加賀百万石の豪運により当せん金が2倍（+2000万円）！'
            };
          }
          p.money += winAmt;
          detailsText = `ルーレット出目【${lRoll}】！見事1等当せん +${winAmt}万円 獲得！`;
          G.logs.unshift(`🎰 【宝くじ大勝負・超大当たり！】ルーレット【${lRoll}】で見事1等 +${winAmt}万円 に当選！一攫千金！`);
        } else if (lRoll >= 5) {
          p.money += 200;
          detailsText = `ルーレット出目【${lRoll}】！見事2等当せんで +200万円 獲得！`;
          G.logs.unshift(`🎰 【宝くじ中当たり！】ルーレット【${lRoll}】で見事2等 +200万円 に当選！`);
        } else {
          p.money += 30;
          detailsText = `ルーレット出目【${lRoll}】…末等当せんで +30万円 獲得！`;
          G.logs.unshift(`🎰 【宝くじ】ルーレット【${lRoll}】…末等当選で +30万円 獲得！`);
        }
        break;
      }

      case 'travel': {
        // ハードモード＆子ども時代・青年期（親と同居中）：親の年収に応じた家族旅行分岐モーダル！
        if (G.isHardMode && p.parentIncome && G.era <= 2) {
          const parentTier = p.parentIncome;
          let adviceText = '';
          let goPreview = '';
          let cancelPreview = '';

          if (parentTier.income < 400) {
            adviceText = '「うちは毎日の生活費だけでギリギリなの…旅行なんて贅沢は絶対に無理！（親の援助: 0円）」';
            goPreview = '親の支援ゼロ！自腹＆追加負担で強行（-25万〜）➔ 意地で名産品獲得';
            cancelPreview = '旅費0円！お留守番でお駄賃 +5万＆独学とお手伝いで学力+5・体力+5！';
          } else if (parentTier.income < 1000) {
            adviceText = '「やりくりすれば行けるけれど、キャンセルして貯金や勉強に回すのも賢いわね。」';
            goPreview = parentTier.income >= 680 ? '親が旅費を半額負担！お得に名産品獲得！' : '家族で計画通り旅行へ！名産品獲得！';
            cancelPreview = '旅費0円！浮いた旅費を貯金 +15万 ＆ 自宅で勉強（学力+4）！';
          } else {
            adviceText = '「旅費くらい全部親が出してあげるわ！行かないならお小遣いをあげるわよ！」';
            goPreview = '親が全額負担（旅費0円）＆お小遣い +30万 ＆ 名産品獲得 ＆ 偏差値+1！';
            cancelPreview = '親から自由資金 +50万円 支給 ＆ 偏差値+1！';
          }

          G.currentSpaceModal = {
            spaceId: space.id,
            title: '✈️ 【親の年収と家族会議】旅行に行く？それともキャンセル？',
            desc: `実家年収【${parentTier.income}万円】（${parentTier.title}）。家族旅行マスに到着しましたが、実家の経済状況を踏まえてどうしますか？`,
            type: 'choose_travel',
            space,
            parentIncome: parentTier,
            adviceText,
            goPreview,
            cancelPreview,
          };
          G.turnStep = 'resolve_space';
          G.logs.unshift(`✈️ 【親の年収と家族会議】Player ${playerID} は実家年収【${parentTier.income}万】の家庭環境で旅行に行くかキャンセルかの岐路に立ちました！`);
          return;
        }

        const baseCost = Math.abs(space.amount || 25);
        let effectiveCost = baseCost;
        let travelBonus = 0;
        const perkNotes = [];

        // 出身地恩恵チェック
        if (p.prefecture?.passiveType === 'real_estate_discount') {
          travelBonus += 50;
          perkNotes.push('北海道「でっかい大地」:+50万');
        }
        if (p.prefecture?.passiveType === 'amusement_bonus') {
          travelBonus += 40;
          perkNotes.push('千葉「夢の国パワー」:+40万');
        }
        if (p.prefecture?.passiveType === 'onsen_heal_bonus') {
          travelBonus += 60;
          perkNotes.push('大分「日本一のおんせん県」:+60万');
        }
        if (p.prefecture?.passiveType === 'udon_cost_saver') {
          effectiveCost = 0;
          perkNotes.push('香川「讃岐うどんコスパ」:旅費0円');
        }
        if (p.prefecture?.passiveType === 'penalty_half') {
          effectiveCost = Math.round(effectiveCost / 2);
          perkNotes.push('静岡「富士山と駿河湾」:旅費半額');
        }

        // 旅先の選定（全47都道府県から出身県以外を優先的にランダム選出）
        const otherPrefs = PREFECTURES.filter((pr) => pr.id !== p.prefecture?.id);
        const candidates = otherPrefs.length > 0 ? otherPrefs : PREFECTURES;
        const destIdx = random ? (random.Die(candidates.length) - 1) : Math.floor(Math.random() * candidates.length);
        const destination = candidates[destIdx] || PREFECTURES[0];

        // ご当地名産品の獲得！
        const newSouvenir = {
          id: `${destination.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          prefId: destination.id,
          prefName: destination.name,
          regionName: destination.regionName,
          name: destination.souvenir.name,
          icon: destination.souvenir.icon,
          value: destination.souvenir.value,
          flavor: destination.flavor,
          count: 1
        };
        p.souvenirs = p.souvenirs || [];
        p.souvenirs.push(newSouvenir);

        const netMoney = travelBonus - effectiveCost;
        p.money += netMoney;

        let perkMsg = '';
        if (perkNotes.length > 0) {
          perkMsg = `【出身恩恵: ${perkNotes.join(', ')}】`;
          hometownPerkTriggered = {
            prefName: p.prefecture.name,
            emoji: p.prefecture.emoji,
            traitName: p.prefecture.traitName,
            effect: perkNotes.join(' / ')
          };
        }

        detailsText = `🗾【${destination.emoji} ${destination.name}（${destination.regionName}）】へ旅行！\nご当地名産品【${destination.souvenir.icon} ${destination.souvenir.name}】（資産価値 +${destination.souvenir.value}万円）を獲得！\n` +
          `旅費: ${effectiveCost}万円 ${travelBonus > 0 ? `| 出身恩恵: +${travelBonus}万円` : ''} ➔ 収支: ${netMoney >= 0 ? '+' + netMoney : netMoney}万円`;

        G.logs.unshift(
          `✈️ 【全国ご当地旅！】Player ${playerID} が【${destination.emoji} ${destination.name}】へ旅行！ご当地名産品【${destination.souvenir.icon} ${destination.souvenir.name}】（価値+${destination.souvenir.value}万）を獲得！${perkMsg ? ` ✨${perkMsg}` : ''}`
        );

        travelData = {
          destination,
          souvenir: newSouvenir,
          baseCost,
          effectiveCost,
          travelBonus,
          netMoney,
          perkMsg
        };
        break;
      }

      case 'pension': {
        let pensionAmount = 100;
        if (p.prefecture?.passiveType === 'pension_boost') {
          pensionAmount = 150;
          hometownPerkTriggered = {
            prefName: p.prefecture.name,
            emoji: p.prefecture.emoji,
            traitName: p.prefecture.traitName,
            effect: '長寿日本一の健康長寿により年金受給額が +150万円 に増額！'
          };
        }
        p.money += pensionAmount;
        detailsText = `公的年金受給日！+${pensionAmount}万円 を受け取りました。`;
        G.logs.unshift(`👵 【定期年金支給】Player ${playerID} が年金 +${pensionAmount}万円 を受給しました！`);
        break;
      }

      case 'retirement':
        if (!p.isRetired) {
          p.isRetired = true;
          let retirementFund = 0;
          if (p.occupation?.id === 'unemployed') {
            retirementFund = 0;
          } else if (p.occupation?.id === 'freeter') {
            retirementFund = 200;
          } else {
            retirementFund = Math.round((p.salary || 100) * 8);
          }
          p.money += retirementFund;
          detailsText = `長年の功績を讃え、退職金 +${retirementFund}万円 支給！`;
          G.logs.unshift(`🎖️ 【定年退職】長年のお勤めお疲れ様でした！職業【${p.occupation?.title || '無職'}】の功績に応じた退職金 +${retirementFund}万円 支給！`);
        } else {
          detailsText = 'すでに退職金を受給済みです';
        }
        break;

      case 'goal':
        if (!p.isGoal) {
          p.isGoal = true;
          G.goalCount += 1;
          p.goalRank = G.goalCount;
          const rankBonus = p.goalRank === 1 ? 2000 : (p.goalRank === 2 ? 1000 : (p.goalRank === 3 ? 400 : 100));
          p.money += rankBonus;
          detailsText = `第${p.goalRank}位で生涯ゴール！着順ボーナス +${rankBonus}万円 獲得！`;
          G.logs.unshift(`🏁 【祝・ゴール！】Player ${playerID} が第${p.goalRank}位で生涯ゴール！着順ボーナス +${rankBonus}万円 獲得！`);
        }
        break;

      case 'era_goal': {
        const bonus = space.amount || 100;
        p.money += bonus;
        detailsText = `時代のゴールに堂々到達！ゴールお祝い金 +${bonus}万円 を獲得！`;
        G.logs.unshift(`🏁 🎉 【祝・時代ゴール到達！】Player ${playerID} が【${space.title}】に到達！お祝い金 +${bonus}万円 獲得！`);
        break;
      }

      default:
        break;
    }

    if (hometownPerkTriggered) {
      G.logs.unshift(`✨ 【出身地恩恵: ${hometownPerkTriggered.emoji || ''} ${hometownPerkTriggered.prefName}「${hometownPerkTriggered.traitName}」発動！】${hometownPerkTriggered.effect}`);
    }

    const afterMoney = p.money;
    const deltaMoney = afterMoney - beforeMoney;

    // モーダル情報
    G.currentSpaceModal = {
      spaceId: space.id,
      title: space.title,
      desc: space.desc,
      type: space.type,
      beforeMoney,
      afterMoney,
      deltaMoney,
      details: detailsText,
      hometownPerk: hometownPerkTriggered,
      travelData,
    };
  },

  // 最終決算（ファイナルアセットジャッジ）
  calculateFinalSettlement: (G) => {
    Object.values(G.players).forEach((p) => {
      let totalAsset = p.money;

      if (p.house) {
        let houseVal = p.house.sellValue;
        if (p.prefecture?.passiveType === 'kobe_estate_boost') {
          houseVal = Math.round(houseVal * 1.5);
        }
        totalAsset += houseVal;
      }

      if (p.car.spouse) totalAsset += 500;
      let kidVal = 300;
      if (p.prefecture?.passiveType === 'family_bonus_boost') kidVal = 500;
      totalAsset += (p.car.kids || 0) * kidVal;

      // ご当地名産品の資産加算
      let souvenirTotal = 0;
      p.souvenirs.forEach((s) => {
        let sVal = s.value || 100;
        if (p.prefecture?.passiveType === 'souvenir_value_boost') {
          // 佐賀: 有田焼の美 全名産品の最終売却価格が2倍
          sVal = Math.round(sVal * 2.0);
        }
        souvenirTotal += sVal;
      });
      totalAsset += souvenirTotal;

      // 全国トラベラー賞ボーナス
      if (p.souvenirs.length >= 5) {
        totalAsset += 500;
        G.logs.unshift(`🗾 🏆【日本一周グランドトラベラー賞！】Player ${p.id} は全国の名産品を${p.souvenirs.length}品収集！特別ボーナス +500万円！`);
      } else if (p.souvenirs.length >= 3) {
        totalAsset += 250;
        G.logs.unshift(`🗾 🎖️【全国旅行マスター賞！】Player ${p.id} は全国の名産品を${p.souvenirs.length}品収集！特別ボーナス +250万円！`);
      }

      // 文武両道・学力賞・体力賞ボーナス
      const acad = p.academic || 50;
      const stam = p.stamina || 50;
      if (acad >= 75 && stam >= 75) {
        totalAsset += 400;
        G.logs.unshift(`🏅 🏆【文武両道マスター賞！】Player ${p.id} は学力【${acad}】＆体力【${stam}】を共に極めた！特別ボーナス +400万円！`);
      } else if (acad >= 80) {
        totalAsset += 200;
        G.logs.unshift(`📚 🎖️【知性マスター賞！】Player ${p.id} は学力【${acad}】に到達！特別学術ボーナス +200万円！`);
      } else if (stam >= 80) {
        totalAsset += 200;
        G.logs.unshift(`🏃 🎖️【健康バイタリティ賞！】Player ${p.id} は体力【${stam}】に到達！特別健康ボーナス +200万円！`);
      }

      totalAsset -= (p.debt || 0) * 100;
      p.finalAsset = totalAsset;
    });

    const sorted = Object.values(G.players).sort((a, b) => b.finalAsset - a.finalAsset);
    G.winner = sorted[0];
    G.ranking = sorted;
    G.logs.unshift(`👑 【最終優勝者決定！】優勝は総資産 ${sorted[0].finalAsset}万円 の Player ${sorted[0].id}（出身: ${sorted[0].prefecture?.name || '不明'}）です！おめでとうございます！`);
  },
};
