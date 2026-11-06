// JinseiGame.js - 47都道府県 ご当地人生ゲームのゲームロジック
// 通常モード ＋ 隠しリアルハードモード（親ガチャ・偏差値・学歴フィルター）
import { getPrefectureById } from './data/prefecturesData';

export const OCCUPATIONS = [
  { id: 'doctor', title: '名医・ドクター', baseSalary: 220, maxSalary: 550, icon: '🩺', type: 'expert', minHensachi: 68, tierDesc: '最難関医学部卒' },
  { id: 'consultant', title: '外資系コンサル・高級官僚', baseSalary: 180, maxSalary: 480, icon: '⚖️', type: 'tokyo', minHensachi: 64, tierDesc: '難関旧帝・早慶上位卒' },
  { id: 'salaryman', title: '大手企業 総合職', baseSalary: 130, maxSalary: 300, icon: '💼', type: 'general', minHensachi: 56, tierDesc: '有名私立・上位国公立卒' },
  { id: 'it_engineer', title: 'ITベンチャー 起業家', baseSalary: 150, maxSalary: 450, icon: '💻', type: 'tokyo', minHensachi: 52, tierDesc: '理系大・IT専門卒' },
  { id: 'civil_servant', title: '安定の地方公務員', baseSalary: 110, maxSalary: 240, icon: '🏛️', type: 'local', minHensachi: 48, tierDesc: '地元大学・短大卒' },
  { id: 'driver', title: '現場プロ・大型ドライバー', baseSalary: 110, maxSalary: 280, icon: '🚚', type: 'local', minHensachi: 0, tierDesc: '学歴不問！実力と体力勝負' },
  { id: 'farmer', title: 'アグリビジネス・農業王', baseSalary: 100, maxSalary: 350, icon: '🚜', type: 'local', minHensachi: 0, tierDesc: '学歴不問！大地と生きる情熱' },
  { id: 'artisan', title: '伝統工芸・名匠職人', baseSalary: 90, maxSalary: 380, icon: '🏺', type: 'local', minHensachi: 0, tierDesc: '学歴不問！研ぎ澄まされた技' },
  { id: 'idol', title: 'ご当地スター・アイドル', baseSalary: 80, maxSalary: 550, icon: '🎤', type: 'entertainment', minHensachi: 0, tierDesc: '学歴不問！天性のオーラと夢' },
  { id: 'freeter', title: '自由人・フリーター', baseSalary: 60, maxSalary: 160, icon: '🎸', type: 'general', minHensachi: 0, tierDesc: '束縛されないマイルート' },
];

export const HOUSES = [
  { id: 'apartment', name: '都会のデザイナーズマンション', price: 2000, sellValue: 2400, icon: '🏢' },
  { id: 'suburb_house', name: '郊外の庭付き一軒家', price: 1500, sellValue: 1800, icon: '🏡' },
  { id: 'kominka', name: '地元のリノベ古民家屋敷', price: 900, sellValue: 1300, icon: '🏯' },
];

// 親の年収・家庭環境テーブル（ハードモード親ガチャ）
export const PARENT_INCOME_TIERS = [
  { roll: 1, title: '困窮家庭（借金生活）', income: 180, baseHensachi: 38, icon: '🏚️', desc: '生活費が足りず奨学金（借金100万）でスタート。独学で苦学。' },
  { roll: 2, title: 'ギリギリ庶民家庭', income: 300, baseHensachi: 44, icon: '🛖', desc: '塾には通えず、参考書は図書館で借りて独学。' },
  { roll: 3, title: '一般的な地方家庭', income: 420, baseHensachi: 49, icon: '🏠', desc: '公立小中高へ進学。部活中心ののびのび生活。' },
  { roll: 4, title: '平均的サラリーマン家庭', income: 540, baseHensachi: 53, icon: '🏡', desc: '高校受験の前に近所の個人塾へ通わせてもらう。' },
  { roll: 5, title: '安定の中流家庭', income: 680, baseHensachi: 57, icon: '🏘️', desc: '大手進学塾と通信教育。中堅大学への進学コース。' },
  { roll: 6, title: 'アッパーミドル家庭', income: 880, baseHensachi: 61, icon: '🏙️', desc: '私立中高一貫校または難関公立高。夏期講習完備。' },
  { roll: 7, title: 'エリート企業戦士家庭', income: 1150, baseHensachi: 65, icon: '🏢', desc: '英語教育と短期留学。難関早慶・旧帝大狙い。' },
  { roll: 8, title: '開業医・大企業役員家庭', income: 1700, baseHensachi: 69, icon: '💎', desc: '名門私立・医学部専門予備校へ手厚い教育課金！' },
  { roll: 9, title: '大企業オーナー一族', income: 3000, baseHensachi: 73, icon: '🏰', desc: '専属家庭教師軍団。旧帝大・医学部・海外名門大。' },
  { roll: 10, title: '雲の上の大富豪・名門財閥', income: 5500, baseHensachi: 77, icon: '👑', desc: '圧倒的財力とコネクション！生まれた瞬間からエリート。' },
];

// ボードのマスデータ (全45マス)
export const BOARD_SPACES = [
  // 0〜6: 幼少期・進学
  { id: 0, title: '誕生！', desc: '日本列島のどこかに誕生！人生の冒険がここから始まる！', type: 'start' },
  { id: 1, title: 'わんぱく時代', desc: '自然の中を駆け回って元気に遊ぶ！お年玉をもらう。', type: 'money', amount: 30 },
  { id: 2, title: '図書館で猛勉強', desc: '読書と探求に熱中。知性と教養がぐーんとアップ！', type: 'study', icon: '📚' },
  { id: 3, title: '部活で全国大会！', desc: '青春の汗！県大会を突破し全国大会へ出場！', type: 'sports', amount: 50 },
  { id: 4, title: '甘酸っぱい初恋', desc: '地元の夕焼け橋で告白！胸キュンの思い出。', type: 'event', icon: '💌' },
  { id: 5, title: 'バイト代を貯金', desc: 'コンビニとファミレスを掛け持ちしてコツコツ貯金！', type: 'money', amount: 40 },
  { id: 6, title: '【進路選択】', desc: '「大都会コース」か「地元就職コース」かを選択！', type: 'branch_career' },

  // 7〜13: 大都会コース
  { id: 7, title: 'いざ上京！', desc: '満員電車と高層ビルに圧倒。新生活の敷金礼金。', type: 'money', amount: -20, route: 'tokyo' },
  { id: 8, title: '都会で就職活動！', desc: '大手企業やITベンチャーに内定！職業を選択。', type: 'job', route: 'tokyo' },
  { id: 9, title: '初任給！給料日', desc: '待ちに待った初任給！親孝行で故郷にプレゼント。', type: 'payday', route: 'tokyo' },
  { id: 10, title: 'プレゼン大成功', desc: '徹夜の新規企画が役員会で大絶賛！特別ボーナス獲得！', type: 'money', amount: 70, route: 'tokyo' },
  { id: 11, title: 'タワマン家賃更新', desc: '都会の家賃は高い！敷金更新料の支払い。', type: 'money', amount: -30, route: 'tokyo' },
  { id: 12, title: 'ビジネスパートナー', desc: '異業種交流会で意気投合！有望な人脈を構築。', type: 'money', amount: 60, route: 'tokyo' },
  { id: 13, title: '昇給！給料日', desc: '実績が認められて昇給！給与を受け取る。', type: 'payday', route: 'tokyo' },

  // 14〜20: 地元就職コース
  { id: 14, title: '地元で就職活動！', desc: '地元企業・公務員に就職決定！職業を選択。', type: 'job', route: 'local' },
  { id: 15, title: '初任給！給料日', desc: '初めての給料！実家暮らしで生活費が超節約できる！', type: 'payday', route: 'local' },
  { id: 16, title: '実家の温もり', desc: '母の手料理と快適な部屋！食費が浮いて貯金増。', type: 'money', amount: 50, route: 'local' },
  { id: 17, title: '地域活性化リーダー', desc: '若手代表として地元イベントを企画して大盛況！', type: 'money', amount: 60, route: 'local' },
  { id: 18, title: '車社会の相棒', desc: 'マイカーを購入してドライブ！小回りの利く充実ライフ。', type: 'event', icon: '🚙', route: 'local' },
  { id: 19, title: '特産品ビジネスヒット', desc: '地元の隠れた名産品をネット通販して大評判に！', type: 'money', amount: 80, route: 'local' },
  { id: 20, title: '安定昇給！給料日', desc: '誠実な働きぶりで地域の信頼を獲得！給与受け取り。', type: 'payday', route: 'local' },

  // 21〜28: 結婚・マイホーム・家庭 (合流)
  { id: 21, title: '運命の出会い', desc: '友人の結婚式の二次会で素敵なパートナーと出会う！', type: 'event', icon: '✨' },
  { id: 22, title: '【結婚マス】', desc: '祝・結婚！全員からご祝儀をもらい車に配偶者ピン追加！', type: 'marriage', stop: true },
  { id: 23, title: 'ハネムーン旅行', desc: '夫婦で記念旅行！世界遺産を巡って愛を深める。', type: 'travel', amount: -20 },
  { id: 24, title: '【マイホーム購入】', desc: '理想のマイホームを手に入れよう！不動産を購入。', type: 'buy_house' },
  { id: 25, title: '第一子誕生！', desc: '元気な赤ちゃんが誕生！車に子供ピン追加＆祝い金！', type: 'baby', count: 1 },
  { id: 26, title: '給料日＆家族手当', desc: '家族が増えて一家の大黒柱！給料日に家族手当が追加！', type: 'payday' },
  { id: 27, title: '家族でレジャー', desc: '遊園地と水族館へ！子供たちの笑顔プライスレス。', type: 'money', amount: -20 },
  { id: 28, title: '第二子誕生！', desc: '賑やか家族！さらに子供ピン追加＆親戚からお祝い！', type: 'baby', count: 1 },

  // 29〜36: ミドルエイジ・大波乱＆帰省
  { id: 29, title: '【お盆・正月の帰省】', desc: '故郷へ里帰り！出身県から手厚い仕送りと特産品が届く！', type: 'homecoming', stop: true },
  { id: 30, title: '方言カルチャーショック', desc: '「それってどういう意味！？」同郷なら意気投合ボーナス！', type: 'dialects' },
  { id: 31, title: '【人生の分岐点】', desc: '「一攫千金・大勝負コース」か「地方創生・安定コース」か選択！', type: 'branch_midlife' },
  { id: 32, title: '管理職に昇進！', desc: '部下を率いるリーダーへ！責任と給与が大幅ランクアップ。', type: 'promotion' },
  { id: 33, title: '給料日（役員待遇）', desc: '充実の給与受け取り！老後の資金計画を立てる。', type: 'payday' },
  { id: 34, title: '健康診断で要観察', desc: 'お酒を控えめに。保険加入していれば給付金受取。', type: 'health_check' },
  { id: 35, title: '趣味の極み', desc: 'ゴルフ・家庭菜園・伝統芸能！大人の贅沢を満喫。', type: 'money', amount: -30 },
  { id: 36, title: '子どもの巣立ち', desc: '子供が無事大学卒業＆就職！子育て完了のお祝い金。', type: 'money', amount: 80 },

  // 37〜44: 老後・ゴール決算
  { id: 37, title: '【定年退職マス】', desc: '長年の勤続お疲れ様でした！退職金を受け取る！', type: 'retirement', stop: true },
  { id: 38, title: '夫婦水入らずの旅', desc: '日本全国の温泉と美食を巡る極上バカンス！', type: 'travel', amount: 50 },
  { id: 39, title: '孫にお小遣い', desc: '「じいじ、ばあば大好き！」可愛い孫に囲まれて至福。', type: 'money', amount: -20 },
  { id: 40, title: '年金支給日！', desc: '国からの公的年金を受け取る！毎月の安定収入。', type: 'pension' },
  { id: 41, title: '地域の名士に就任', desc: '長年の経験を活かして地域の相談役に推薦される。', type: 'money', amount: 70 },
  { id: 42, title: '最後の宝くじ大勝負', desc: '年末ジャンボ！ルーレットを回して大当たりを狙え！', type: 'lottery' },
  { id: 43, title: '悠々自適の余生', desc: '愛する家族と故郷の絆。心豊かな人生のフィナーレへ。', type: 'money', amount: 50 },
  { id: 44, title: '【億万長者の館（ゴール）】', desc: '人生の終着駅！到着順ボーナス＋最終決算で大富豪決定！', type: 'goal', stop: true },
];

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
        prefecture: null,
        parentIncome: null, // 親ガチャ情報 (ハードモード用)
        hensachi: 50,       // 偏差値 (ハードモード用)
        position: 0,
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
      gameState: 'select_prefecture', // 'select_prefecture' | 'playing' | 'game_over'
      isHardMode: false, // 隠しリアル格差ハードモード
      players,
      currentTurnPlayer: '0',
      rouletteValue: null,
      isSpinning: false,
      turnStep: 'select_prefecture',
      currentSpaceModal: null,
      goalCount: 0,
      logs: ['🎲 47都道府県 ご当地人生ゲームがスタートしました！出身地を選択してください。'],
      winner: null,
    };
  },

  moves: {
    // 0. 隠しハードモードの切り替え
    toggleHardMode: ({ G }) => {
      G.isHardMode = !G.isHardMode;
      if (G.isHardMode) {
        G.logs.unshift(`💀【隠しモード解放】リアル格差社会ハードモードが有効化されました！（親ガチャ・偏差値・学歴フィルター）`);
      } else {
        G.logs.unshift(`🟢 通常モード（夢と希望の人生ゲーム）に切り替えました。`);
      }
    },

    // 1. 出身都道府県の選択
    choosePrefecture: ({ G, random }, playerID, prefId) => {
      if (G.gameState !== 'select_prefecture') return;
      const pref = getPrefectureById(prefId);
      if (!pref) return;

      const p = G.players[playerID];
      p.prefecture = pref;
      p.souvenirs.push({ ...pref.souvenir, count: 1 });
      G.logs.unshift(`🗾 Player ${playerID} は【${pref.name}】出身に決定！（特産品: ${pref.souvenir.name} 獲得）`);

      // パッシブ初期ボーナス
      if (pref.passiveType === 'insurance_free') {
        p.insurance.life = true;
        p.insurance.fire = true;
        G.logs.unshift(`🛡️ 【${pref.traitName}】により、保険（生命・火災）が無料付帯されました！`);
      }

      // ハードモード時：親ガチャルーレット＆偏差値決定！
      if (G.isHardMode) {
        const pRoll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
        const parentTier = PARENT_INCOME_TIERS[pRoll - 1];
        // 努力・運のゆらぎ (-3〜+5)
        const luckDelta = random ? (random.Die(9) - 4) : (Math.floor(Math.random() * 9) - 4);
        const finalHensachi = Math.max(35, Math.min(78, parentTier.baseHensachi + luckDelta));

        p.parentIncome = parentTier;
        p.hensachi = finalHensachi;

        if (pRoll === 1) {
          p.debt += 1; // 奨学金100万スタート
        }

        G.logs.unshift(`💀【親ガチャ結果】Player ${playerID} の実家: 年収 ${parentTier.income}万円（${parentTier.title}）➔ 初期偏差値【${finalHensachi}】！`);
      }

      // 全員が出身地を選び終えたらゲーム開始
      const allSelected = Object.values(G.players).every((p) => p.prefecture !== null);
      if (allSelected) {
        G.gameState = 'playing';
        G.turnStep = 'spin';
        G.logs.unshift(`🎉 全員の出身地が決定！第1ターンのルーレットを回してください！`);
      }
    },

    // 2. ルーレットを回す
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

      const roll = random.Die(10);
      const totalSteps = Math.min(10, roll + bonus);
      G.rouletteValue = totalSteps;
      G.isSpinning = true;

      // 移動処理
      let targetPos = p.position + totalSteps;

      // 確定ストップマスのチェック (結婚: 22, 帰省: 29, 退職: 37, ゴール: 44, 進路分岐: 6)
      const stopPositions = [6, 22, 29, 31, 37, 44];
      for (const stop of stopPositions) {
        if (p.position < stop && targetPos >= stop) {
          targetPos = stop;
          break;
        }
      }

      // ルート補正
      if (p.branchRoute === 'tokyo' && p.position < 7 && targetPos >= 7) {
        // 大都会コース進入
      } else if (p.branchRoute === 'local' && p.position < 14 && targetPos >= 7) {
        targetPos = 14 + (targetPos - 7);
      }

      // コース合流
      if (p.branchRoute === 'tokyo' && targetPos > 13 && targetPos < 21) {
        targetPos = 21;
      } else if (p.branchRoute === 'local' && targetPos > 20 && targetPos < 21) {
        targetPos = 21;
      }

      if (targetPos > 44) targetPos = 44;

      p.position = targetPos;
      G.turnStep = 'resolve_space';

      const space = BOARD_SPACES.find((s) => s.id === targetPos) || BOARD_SPACES[0];
      G.logs.unshift(`🎯 Player ${playerID} がルーレット【${roll}${bonus ? '+1' : ''}】を出し、【${space.title}】に止まりました！`);

      // マスイベント適用
      JinseiGame.resolveSpaceEffects(G, ctx, playerID, space);
    },

    // 3. 職業選択 (通常または学歴フィルター/逆転面接)
    chooseJob: ({ G, ctx, random }, playerID, jobId, tryGamble = false) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];
      const occ = OCCUPATIONS.find((o) => o.id === jobId) || OCCUPATIONS[OCCUPATIONS.length - 1];

      if (G.isHardMode) {
        if (tryGamble) {
          // 奇跡のコネ・大逆転面接チャレンジ (出目9以上で合格)
          const roll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
          if (roll >= 9) {
            p.occupation = occ;
            p.salary = occ.baseSalary;
            G.logs.unshift(`🔥【大逆転採用！】面接官に実力と熱意が刺さり奇跡の合格！【${occ.title}】に就任！（給料: ${occ.baseSalary}万円）`);
          } else {
            p.money -= 40;
            const freeterOcc = OCCUPATIONS.find((o) => o.id === 'freeter');
            p.occupation = freeterOcc;
            p.salary = freeterOcc.baseSalary;
            G.logs.unshift(`❌【お祈りメール】学歴の壁に跳ね返され不合格！就活浪人費用 -40万円、フリーターとしてスタート…`);
          }
        } else {
          // 偏差値判定
          if ((p.hensachi || 50) >= occ.minHensachi) {
            p.occupation = occ;
            p.salary = occ.baseSalary;
            G.logs.unshift(`🎓【正規採用！】偏差値【${p.hensachi}】の実力で見事【${occ.title}】に合格！（初任給: ${occ.baseSalary}万円）`);
          } else {
            // 学歴不問職へ
            const fallbackOcc = OCCUPATIONS.find((o) => o.minHensachi === 0);
            p.occupation = fallbackOcc;
            p.salary = fallbackOcc.baseSalary;
            G.logs.unshift(`⚠️ 偏差値不足のため【${fallbackOcc.title}】に配属されました。`);
          }
        }
      } else {
        // 通常モード：希望の職業に就任
        p.occupation = occ;
        p.salary = occ.baseSalary;
        G.logs.unshift(`🎓 Player ${playerID} が【${occ.title}】に就任！（給料: ${p.salary}万円）`);
      }

      G.currentSpaceModal = null;
      G.turnStep = 'end_turn';
    },

    // 4. 分岐ルート選択
    chooseRoute: ({ G, ctx }, playerID, route) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];

      if (p.position === 6) {
        p.branchRoute = route; // 'tokyo' or 'local'
        G.logs.unshift(`🚀 Player ${playerID} は【${route === 'tokyo' ? '大都会コース' : '地元就職コース'}】を選択！`);
        p.position = route === 'tokyo' ? 7 : 14;
      } else if (p.position === 31) {
        p.midlifeRoute = route;
        G.logs.unshift(`💼 Player ${playerID} は【${route === 'gamble' ? '一攫千金大勝負コース' : '地方創生安定コース'}】を選択！`);
      }

      G.currentSpaceModal = null;
      G.turnStep = 'end_turn';
    },

    // 5. マイホーム購入選択
    chooseHouse: ({ G, ctx }, playerID, houseId) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];
      const house = HOUSES.find((h) => h.id === houseId);
      if (!house) {
        G.logs.unshift(`🏡 Player ${playerID} はマイホーム購入を見送りました。`);
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

      G.currentSpaceModal = null;
      G.turnStep = 'end_turn';
    },

    // 6. 手番終了
    endTurn: ({ G, events }) => {
      G.currentSpaceModal = null;
      G.rouletteValue = null;
      G.isSpinning = false;

      const allFinished = Object.values(G.players).every((p) => p.isGoal);
      if (allFinished) {
        JinseiGame.calculateFinalSettlement(G);
        G.gameState = 'game_over';
        G.logs.unshift(`🏆 全員がゴールしました！最終決算集計を行います！`);
        return;
      }

      events.endTurn();
      G.turnStep = 'spin';
    },

    // 7. ゲームリセット
    restartGame: ({ G, ctx }) => {
      const resetG = JinseiGame.setup({ ctx });
      resetG.isHardMode = G.isHardMode; // モード設定は引き継ぎ
      Object.assign(G, resetG);
    },
  },

  // マスイベントの自動解決ロジック
  resolveSpaceEffects: (G, ctx, playerID, space) => {
    const p = G.players[playerID];

    // デフォルトのモーダル情報
    G.currentSpaceModal = {
      spaceId: space.id,
      title: space.title,
      desc: space.desc,
      type: space.type,
    };

    switch (space.type) {
      case 'money':
        p.money += space.amount;
        if (space.amount > 0) {
          G.logs.unshift(`💰 Player ${playerID} が +${space.amount}万円 獲得！`);
        } else {
          G.logs.unshift(`💸 Player ${playerID} が ${Math.abs(space.amount)}万円 を支払いました。`);
        }
        break;

      case 'study':
        if (G.isHardMode) {
          p.hensachi = Math.min(80, (p.hensachi || 50) + 3);
          G.logs.unshift(`📖 【猛勉強の成果！】知性と教養がUPし、偏差値が +3 上昇！（現在: 偏差値【${p.hensachi}】）`);
        } else {
          p.money += 20;
          G.logs.unshift(`📖 図書館で猛勉強！読書感想文コンクールで入賞し図書カード +20万円 獲得！`);
        }
        break;

      case 'sports':
        p.money += space.amount;
        if (G.isHardMode) {
          p.hensachi = Math.min(80, (p.hensachi || 50) + 1);
          G.logs.unshift(`🏃 全国大会出場！スポーツ推薦枠を獲得し、偏差値が +1 UP！（現在: 偏差値【${p.hensachi}】）`);
        }
        break;

      case 'job':
        // 職業選択モーダルを開く
        G.currentSpaceModal = {
          spaceId: space.id,
          title: G.isHardMode ? '💀【就職活動・学歴フィルター】' : '🎓【就職マス】職業を選択！',
          desc: G.isHardMode
            ? `あなたの偏差値【${p.hensachi || 50}】を元に選考されます。高偏差値の職業には学歴フィルターが存在します！`
            : '就任したい職業を選択してください！',
          type: 'choose_job',
        };
        break;

      case 'payday':
        if (p.occupation) {
          let pay = p.salary;
          if (p.prefecture?.passiveType === 'salary_boost_heavy') pay += 50;
          if (p.prefecture?.passiveType === 'salary_boost') pay += 20;
          if (p.car.spouse) pay += 20;
          pay += p.car.kids * 15;

          p.money += pay;
          G.logs.unshift(`💵 【給料日】Player ${playerID} が給料 ${pay}万円 を受け取りました！`);
        } else {
          p.money += 80;
          G.logs.unshift(`💵 【給料日】アルバイト給与 80万円 を受け取りました！`);
        }
        break;

      case 'marriage':
        if (!p.car.spouse) {
          p.car.spouse = true;
          let giftFromOthers = 30;
          if (p.prefecture?.passiveType === 'wedding_bonus') giftFromOthers = 50;

          let totalGifts = 0;
          Object.keys(G.players).forEach(otherPid => {
            if (otherPid !== playerID) {
              G.players[otherPid].money -= giftFromOthers;
              totalGifts += giftFromOthers;
            }
          });
          p.money += totalGifts + 100;
          G.logs.unshift(`💍 祝・結婚！Player ${playerID} に配偶者ピン追加！全員からご祝儀計 +${totalGifts + 100}万円！`);
        }
        break;

      case 'baby':
        p.car.kids += space.count;
        let babyBonus = 100;
        if (p.prefecture?.passiveType === 'child_bonus') babyBonus = 150;
        p.money += babyBonus;
        G.logs.unshift(`👶 赤ちゃん誕生！Player ${playerID} の車に子供ピン追加！国・県からお祝い金 +${babyBonus}万円！`);
        break;

      case 'homecoming':
        if (p.prefecture) {
          const hc = p.prefecture.homecoming;
          p.money += hc.money;
          p.souvenirs.push({ ...p.prefecture.souvenir, count: 1 });
          G.logs.unshift(`📦 【実家に帰省！】${p.prefecture.name}から仕送り +${hc.money}万円＆特産品【${p.prefecture.souvenir.name}】が届きました！`);
        }
        break;

      case 'retirement':
        if (!p.isRetired) {
          p.isRetired = true;
          const retirementFund = 400 + (p.salary ? Math.round(p.salary * 1.5) : 100);
          p.money += retirementFund;
          G.logs.unshift(`🎖️ 【定年退職】長年のお勤めお疲れ様でした！退職金 +${retirementFund}万円 支給！`);
        }
        break;

      case 'pension':
        let pensionAmount = 100;
        if (p.prefecture?.passiveType === 'pension_boost') pensionAmount = 150;
        p.money += pensionAmount;
        G.logs.unshift(`👵 【年金支給】Player ${playerID} が年金 +${pensionAmount}万円 を受給しました！`);
        break;

      case 'goal':
        if (!p.isGoal) {
          p.isGoal = true;
          G.goalCount += 1;
          p.goalRank = G.goalCount;
          const rankBonus = p.goalRank === 1 ? 500 : (p.goalRank === 2 ? 300 : 100);
          p.money += rankBonus;
          G.logs.unshift(`🏁 【祝・ゴール！】Player ${playerID} が第${p.goalRank}位でゴールイン！（着順ボーナス +${rankBonus}万円）`);
        }
        break;

      default:
        break;
    }
  },

  // 最終決算（ファイナルアセットジャッジ）
  calculateFinalSettlement: (G) => {
    Object.values(G.players).forEach(p => {
      let totalAsset = p.money;

      if (p.house) {
        let houseVal = p.house.sellValue;
        if (p.prefecture?.passiveType === 'kobe_estate_boost') {
          houseVal = Math.round(houseVal * 1.5);
        }
        totalAsset += houseVal;
      }

      if (p.car.spouse) totalAsset += 300;
      let kidVal = 200;
      if (p.prefecture?.passiveType === 'family_bonus_boost') kidVal = 300;
      totalAsset += p.car.kids * kidVal;

      p.souvenirs.forEach(s => {
        let sVal = s.value;
        if (p.prefecture?.passiveType === 'souvenir_value_boost') sVal = Math.round(sVal * 1.2);
        totalAsset += sVal;
      });

      totalAsset -= p.debt * 100;
      p.finalAsset = totalAsset;
    });

    const sorted = Object.values(G.players).sort((a, b) => b.finalAsset - a.finalAsset);
    G.winner = sorted[0];
    G.ranking = sorted;
    G.logs.unshift(`👑 【最終優勝者決定！】優勝は総資産 ${sorted[0].finalAsset}万円 の Player ${sorted[0].id}（出身: ${sorted[0].prefecture?.name || '不明'}）です！おめでとうございます！`);
  },
};
