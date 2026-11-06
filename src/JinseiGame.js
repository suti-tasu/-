// JinseiGame.js - 47都道府県 ご当地人生ゲームのゲームロジック
// 通常モード ＋ 隠しリアルハードモード（親ガチャ・偏差値・学歴フィルター）
import { PREFECTURES, getPrefectureById } from './data/prefecturesData.js';

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

// ボードのマスデータ (全201マス: 0〜200, 1ステージあたり35〜45マス構成)
export const BOARD_SPACES = [
  {
    "id": 0,
    "title": "【誕生！人生のスタート】",
    "desc": "日本列島のどこかに誕生！人生の大冒険がここから始まる！",
    "type": "start",
    "icon": "👶"
  },
  {
    "id": 1,
    "title": "お友達がたくさんできた",
    "desc": "近所の公園で泥だらけになって遊ぶ！元気にすくすく成長。",
    "type": "money",
    "amount": 20,
    "icon": "🪁"
  },
  {
    "id": 2,
    "title": "虫歯の治療",
    "desc": "甘いお菓子の食べ過ぎで歯医者さんへ！痛い出費。",
    "type": "money",
    "amount": -10,
    "icon": "🦷"
  },
  {
    "id": 3,
    "title": "幼稚園のお遊戯会で主役",
    "desc": "大きな声で元気にセリフを言えた！親戚からお小遣い。",
    "type": "money",
    "amount": 20,
    "icon": "🎭"
  },
  {
    "id": 4,
    "title": "小学校入学！ピカピカのランドセル",
    "desc": "おじいちゃん・おばあちゃんから手厚い入学祝い金！",
    "type": "money",
    "amount": 30,
    "icon": "🎒"
  },
  {
    "id": 5,
    "title": "初めての通知表でオール5！",
    "desc": "勉強が楽しくてたまらない！ご褒美に図書券をもらう。",
    "type": "money",
    "amount": 20,
    "icon": "⭐"
  },
  {
    "id": 6,
    "title": "自転車の練習で生傷が絶えない",
    "desc": "何度も転びながら補助輪なしに乗れるようになった！絆創膏代。",
    "type": "money",
    "amount": -5,
    "icon": "🚲"
  },
  {
    "id": 7,
    "title": "少年少女スポーツ少年団に入団",
    "desc": "週末は朝からユニフォームを着て泥だらけで猛特訓！",
    "type": "money",
    "amount": -15,
    "icon": "⚾"
  },
  {
    "id": 8,
    "title": "部活の地域大会で大活躍！",
    "desc": "チーム一丸となって勝利！自信と協調性が身につく。",
    "type": "money",
    "amount": 20,
    "icon": "🏅"
  },
  {
    "id": 9,
    "title": "夏休みの自由研究が県で特選",
    "desc": "地域の特産品や自然を徹底調査！知事賞を受賞！",
    "type": "money",
    "amount": 30,
    "icon": "🔬"
  },
  {
    "id": 10,
    "title": "中学受験・進学塾の夏期講習",
    "desc": "難関中を目指して猛勉強！教育費がかさむ。",
    "type": "money",
    "amount": -25,
    "icon": "✏️"
  },
  {
    "id": 11,
    "title": "中学校入学！新しい制服",
    "desc": "少し大人びた制服に袖を通す！成長期で背がグングン伸びる。",
    "type": "money",
    "amount": 20,
    "icon": "🏫"
  },
  {
    "id": 12,
    "title": "英語スピーチコンテスト入賞",
    "desc": "毎日CDを聴いてシャドーイング特訓！語学力アップ。",
    "type": "study",
    "icon": "🗣️"
  },
  {
    "id": 13,
    "title": "友達とゲームソフトの貸し借り",
    "desc": "最新ゲームの裏技をみんなで攻略！夢中な放課後。",
    "type": "money",
    "amount": 10,
    "icon": "🎮"
  },
  {
    "id": 14,
    "title": "修学旅行で京都・奈良へ！",
    "desc": "八ッ橋と木刀をお土産に買う！一生の思い出。",
    "type": "travel",
    "amount": -20,
    "icon": "⛩️"
  },
  {
    "id": 15,
    "title": "生徒会役員・学級委員長に当選",
    "desc": "みんなのリーダーとして学校行事を大成功に導く！",
    "type": "money",
    "amount": 30,
    "icon": "🌟"
  },
  {
    "id": 16,
    "title": "定期テストで学年1位を獲得！",
    "desc": "深夜まで努力した成果が炸裂！親から特別お小遣い。",
    "type": "study",
    "icon": "📖"
  },
  {
    "id": 17,
    "title": "部活の県大会で見事優勝！",
    "desc": "汗と涙の猛特訓が実を結び、優勝旗を掲げる！",
    "type": "money",
    "amount": 40,
    "icon": "🏆"
  },
  {
    "id": 18,
    "title": "スマートフォンを買ってもらう",
    "desc": "念願のスマホデビュー！月々のギガ代は自分でお手伝い。",
    "type": "money",
    "amount": -15,
    "icon": "📱"
  },
  {
    "id": 19,
    "title": "高校受験・合格発表！サクラサク",
    "desc": "第一志望の高校に見事合格！親戚中からお祝いラッシュ！",
    "type": "money",
    "amount": 50,
    "icon": "🌸"
  },
  {
    "id": 20,
    "title": "高校進学・青春の1ページ",
    "desc": "学園祭の軽音楽部ステージで大盛り上がり！一生の親友ができる。",
    "type": "money",
    "amount": 20,
    "icon": "🎸"
  },
  {
    "id": 21,
    "title": "初めてのアルバイト体験",
    "desc": "コンビニやファミレスで接客初体験！自分のお金で買い物。",
    "type": "money",
    "amount": 30,
    "icon": "☕"
  },
  {
    "id": 22,
    "title": "部活の遠征合宿で全国へ！",
    "desc": "全国の強豪校と激突！交通費と宿泊費がかかる。",
    "type": "money",
    "amount": -20,
    "icon": "🚌"
  },
  {
    "id": 23,
    "title": "故郷の伝統夏祭りで太鼓を叩く",
    "desc": "浴衣を着て屋台巡り！地域の絆と温かさを実感。",
    "type": "money",
    "amount": 20,
    "icon": "🎆"
  },
  {
    "id": 24,
    "title": "全国統一模試で驚異のA判定！",
    "desc": "徹底的な過去問分析が結実！偏差値と自信が急上昇！",
    "type": "study",
    "icon": "📚"
  },
  {
    "id": 25,
    "title": "流行のファッションに目覚める",
    "desc": "古着屋やセレクトショップ巡り！オシャレに大散財。",
    "type": "money",
    "amount": -20,
    "icon": "👕"
  },
  {
    "id": 26,
    "title": "ファミレスで朝まで語り合う",
    "desc": "将来の夢や恋愛について親友と語り明かした青春。",
    "type": "money",
    "amount": -10,
    "icon": "🍟"
  },
  {
    "id": 27,
    "title": "ボランティア活動で地域貢献",
    "desc": "海岸清掃や福祉活動に参加！感謝状を受け取る。",
    "type": "money",
    "amount": 20,
    "icon": "🤝"
  },
  {
    "id": 28,
    "title": "普通自動車免許を取得！",
    "desc": "仮免・本免を一発合格！親の車を借りてドライブ。",
    "type": "money",
    "amount": -25,
    "icon": "🚗"
  },
  {
    "id": 29,
    "title": "大学・専門学校進学祝い！",
    "desc": "進路が決まり、自立への第一歩！新生活準備資金。",
    "type": "money",
    "amount": 40,
    "icon": "🎓"
  },
  {
    "id": 30,
    "title": "学生サークルでイベント主催",
    "desc": "企画力と行動力を発揮して大盛況！臨時収入。",
    "type": "money",
    "amount": 30,
    "icon": "🎪"
  },
  {
    "id": 31,
    "title": "青春18きっぷで日本縦断旅",
    "desc": "鈍行列車に揺られて全国の絶景とローカルフードを堪能！",
    "type": "travel",
    "amount": -20,
    "icon": "🚆"
  },
  {
    "id": 32,
    "title": "成人式！懐かしの同窓会",
    "desc": "二十歳の誓い！立派な大人へと成長した旧友と再会。",
    "type": "money",
    "amount": 30,
    "icon": "👘"
  },
  {
    "id": 33,
    "title": "TOEIC高得点・難関検定合格",
    "desc": "就職活動に向けて猛勉強！履歴書に書ける強みができる。",
    "type": "study",
    "icon": "📜"
  },
  {
    "id": 34,
    "title": "インターンシップで高評価獲得",
    "desc": "実務体験でビジネスの現場を肌で体感！人事部からスカウト。",
    "type": "money",
    "amount": 30,
    "icon": "💼"
  },
  {
    "id": 35,
    "title": "【進路選択・未来への旅立ち】",
    "desc": "大都会へ羽ばたくか、地元で地域貢献するか。人生最初の運命の岐路！",
    "type": "branch_career",
    "stop": true,
    "icon": "🚩"
  },
  {
    "id": 36,
    "title": "【就職活動スタート！】",
    "desc": "リクルートスーツに身を包み合同説明会へ！就職エリアの起点マス。",
    "type": "job_start",
    "icon": "💼"
  },
  {
    "id": 37,
    "title": "【運命の就職面接・採用マス】",
    "desc": "就職必須！希望職種にエントリー！（※不合格時はマス36へ戻り再挑戦）",
    "type": "choose_job",
    "stop": true,
    "icon": "🎓"
  },
  {
    "id": 38,
    "title": "新入社員ビジネスマナー研修",
    "desc": "名刺交換や電話応対の基本を特訓！社会人としての第一歩。",
    "type": "money",
    "amount": 20,
    "icon": "🤝"
  },
  {
    "id": 39,
    "title": "初給料日！親へのプレゼント",
    "desc": "初任給で両親に美味しいご飯と感謝の贈り物を届ける！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 40,
    "title": "会社の歓迎会で一芸披露",
    "desc": "特技を披露して先輩や上司のハートをガッチリ掴む！",
    "type": "money",
    "amount": 20,
    "icon": "🎤"
  },
  {
    "id": 41,
    "title": "通勤ラッシュの洗礼を受ける",
    "desc": "満員電車で押しつぶされそう！定期券代の出費。",
    "type": "money",
    "amount": -15,
    "icon": "🚃"
  },
  {
    "id": 42,
    "title": "先輩社員の手厚いOJT指導",
    "desc": "仕事のノウハウを丁寧に教わり、日々の業務に慣れていく。",
    "type": "money",
    "amount": 20,
    "icon": "📝"
  },
  {
    "id": 43,
    "title": "オフィスの備品整理で褒められる",
    "desc": "率先して雑務をこなす誠実さが職場で高く評価！",
    "type": "money",
    "amount": 20,
    "icon": "🧹"
  },
  {
    "id": 44,
    "title": "深夜の締め切り残業ラッシュ",
    "desc": "栄養ドリンク片手にチーム一丸でプロジェクトを死守！",
    "type": "money",
    "amount": -10,
    "icon": "⚡"
  },
  {
    "id": 45,
    "title": "初めての出張で特産品を堪能",
    "desc": "地方都市へ出張！商談成功のあと、ご当地グルメを満喫。",
    "type": "travel",
    "amount": -15,
    "icon": "🚅"
  },
  {
    "id": 46,
    "title": "夏のボーナス支給日！",
    "desc": "日頃の奮闘が評価され、まとまった賞与が振り込まれる！",
    "type": "payday",
    "icon": "💰"
  },
  {
    "id": 47,
    "title": "新規企画コンペで採用される！",
    "desc": "若手ならではの柔軟な発想が大抜擢！特別金一封。",
    "type": "money",
    "amount": 40,
    "icon": "💡"
  },
  {
    "id": 48,
    "title": "故郷の実家から温かい仕送り",
    "desc": "段ボールいっぱいの特産米と手作り味噌が届く！食費節約。",
    "type": "money",
    "amount": 30,
    "icon": "📦"
  },
  {
    "id": 49,
    "title": "業界の難関資格試験に一発合格",
    "desc": "毎週末の猛勉強が結実！毎月の資格手当が給与にプラス！",
    "type": "study",
    "icon": "📜"
  },
  {
    "id": 50,
    "title": "飲み会の幹事を完璧にこなす",
    "desc": "全員が大満足のコース料理を手配！上司から金一封。",
    "type": "money",
    "amount": 20,
    "icon": "🍻"
  },
  {
    "id": 51,
    "title": "給料日！着実に貯蓄が増加",
    "desc": "自立した生活が軌道に乗り、家計簿も安定！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 52,
    "title": "社内PCトラブルを迅速に解決",
    "desc": "IT知識を活かして部署のピンチを救い感謝される！",
    "type": "money",
    "amount": 30,
    "icon": "💻"
  },
  {
    "id": 53,
    "title": "営業成績で月間新人賞を獲得！",
    "desc": "足繁くクライアントに通った熱意が契約ラッシュへ！",
    "type": "money",
    "amount": 50,
    "icon": "🥇"
  },
  {
    "id": 54,
    "title": "スーツをオーダーメイドで新調",
    "desc": "勝負服を仕立ててプロ意識がさらに高まる！",
    "type": "money",
    "amount": -30,
    "icon": "👔"
  },
  {
    "id": 55,
    "title": "後輩社員が入社・メンター就任",
    "desc": "指導係に抜擢！教えることで自分の仕事の理解も深まる。",
    "type": "money",
    "amount": 20,
    "icon": "🌱"
  },
  {
    "id": 56,
    "title": "取引先との大規模商談を成約！",
    "desc": "綿密な市場リサーチとプレゼンで数千万円の案件を獲得！",
    "type": "money",
    "amount": 60,
    "icon": "🤝"
  },
  {
    "id": 57,
    "title": "冬のボーナス支給日！",
    "desc": "会社の業績アップに大きく貢献し、大幅増額ボーナス！",
    "type": "payday",
    "icon": "💰"
  },
  {
    "id": 58,
    "title": "有休を取得して温泉旅行へ",
    "desc": "名湯に浸かってリフレッシュ！明日からの活力を補給。",
    "type": "travel",
    "amount": -25,
    "icon": "♨️"
  },
  {
    "id": 59,
    "title": "地域のマラソン大会で完走！",
    "desc": "健康管理も社会人の基本！同僚たちと爽快な汗を流す。",
    "type": "money",
    "amount": 20,
    "icon": "🏃"
  },
  {
    "id": 60,
    "title": "社内業務効率化ツールの開発",
    "desc": "無駄なルーチン作業を自動化し、全社から大絶賛！",
    "type": "money",
    "amount": 40,
    "icon": "⚙️"
  },
  {
    "id": 61,
    "title": "給料日！生活水準がワンランクUP",
    "desc": "少し良い家電や調理器具を揃えて自炊が楽しくなる！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 62,
    "title": "取引先の接待ゴルフで好プレー",
    "desc": "礼儀正しいラウンドマナーで先方の社長に気に入られる！",
    "type": "money",
    "amount": 30,
    "icon": "⛳"
  },
  {
    "id": 63,
    "title": "主任昇格！役職手当が支給",
    "desc": "リーダー職へステップアップ！部下からの人望も厚い。",
    "type": "money",
    "amount": 50,
    "icon": "📈"
  },
  {
    "id": 64,
    "title": "同僚の結婚式でスピーチ",
    "desc": "感動の祝辞を述べて会場の涙を誘う！ご祝儀の出費。",
    "type": "money",
    "amount": -30,
    "icon": "💒"
  },
  {
    "id": 65,
    "title": "ご当地アンバサダーに就任",
    "desc": "生まれ故郷の魅力を社内外へアピールし、観光振興に貢献！",
    "type": "money",
    "amount": 40,
    "icon": "🗾"
  },
  {
    "id": 66,
    "title": "海外出張でグローバル市場開拓",
    "desc": "異文化コミュニケーションを駆使して海外パートナーと提携！",
    "type": "travel",
    "amount": -20,
    "icon": "✈️"
  },
  {
    "id": 67,
    "title": "夏のボーナス支給日！",
    "desc": "実績に応じたインセンティブが上乗せされる！",
    "type": "payday",
    "icon": "💰"
  },
  {
    "id": 68,
    "title": "社内イノベーション賞を受賞！",
    "desc": "新規事業の種となるプロトタイプが高く評価される！",
    "type": "money",
    "amount": 70,
    "icon": "🏆"
  },
  {
    "id": 69,
    "title": "健康診断でオールA判定！",
    "desc": "日頃の規則正しい生活と運動習慣が功を奏す！",
    "type": "money",
    "amount": 20,
    "icon": "💪"
  },
  {
    "id": 70,
    "title": "株式投資・つみたてNISAを開始",
    "desc": "資産運用をスタート！長期積立で堅実な資産形成へ。",
    "type": "money",
    "amount": 30,
    "icon": "📊"
  },
  {
    "id": 71,
    "title": "給料日！チームリーダー報酬",
    "desc": "組織を束ねるポジションとしての誇りと手厚い給料！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 72,
    "title": "クライアントのトラブルを神対応",
    "desc": "冷静な危機管理能力で大ピンチを信頼へと変える！",
    "type": "money",
    "amount": 50,
    "icon": "🛡️"
  },
  {
    "id": 73,
    "title": "ふるさと納税で絶品グルメ満喫",
    "desc": "地方に寄付して美味しい牛肉とフルーツの返礼品が山盛り！",
    "type": "money",
    "amount": 30,
    "icon": "🥩"
  },
  {
    "id": 74,
    "title": "キャリア研修で次世代幹部候補へ",
    "desc": "マネジメント研修を修了し、幹部コースへ推薦される！",
    "type": "study",
    "icon": "🎯"
  },
  {
    "id": 75,
    "title": "リフレッシュ休暇で南国リゾート",
    "desc": "エメラルドグリーンの海でダイビング！心身ともにフル充電。",
    "type": "travel",
    "amount": -35,
    "icon": "🏝️"
  },
  {
    "id": 76,
    "title": "運命の出会い・交際スタート",
    "desc": "友人の紹介や趣味の場で生涯のパートナーと巡り合う！",
    "type": "event",
    "icon": "✨"
  },
  {
    "id": 77,
    "title": "記念日ディナー・おしゃれデート",
    "desc": "夜景の見える高級レストランでロマンチックなひととき。",
    "type": "money",
    "amount": -20,
    "icon": "🍷"
  },
  {
    "id": 78,
    "title": "お互いの両親にご挨拶へ伺う",
    "desc": "緊張のご対面！手土産を渡し、温かく歓迎してもらう。",
    "type": "money",
    "amount": -20,
    "icon": "🍵"
  },
  {
    "id": 79,
    "title": "婚約指輪を購入！プロポーズ成功",
    "desc": "一生の愛を誓いプロポーズ！感動の涙とともに受諾。",
    "type": "money",
    "amount": -40,
    "icon": "💍"
  },
  {
    "id": 80,
    "title": "結婚式場の見学とドレス選び",
    "desc": "華やかなチャペルと試食会でテンション最高潮！",
    "type": "money",
    "amount": -10,
    "icon": "👗"
  },
  {
    "id": 81,
    "title": "新生活のインテリア・家具選び",
    "desc": "2人で使うソファやダイニングテーブルをおしゃれに購入。",
    "type": "money",
    "amount": -30,
    "icon": "🛋️"
  },
  {
    "id": 82,
    "title": "給料日！夫婦共働きで貯蓄急増",
    "desc": "家計を合算し、将来のマイホーム購入資金をプール！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 83,
    "title": "親族顔合わせの食事会",
    "desc": "両家の絆が深まる和やかな宴席！",
    "type": "money",
    "amount": -20,
    "icon": "🍱"
  },
  {
    "id": 84,
    "title": "婚姻届を提出！夫婦生活スタート",
    "desc": "市役所で受理され、晴れて法的な夫婦となる！",
    "type": "money",
    "amount": 30,
    "icon": "📄"
  },
  {
    "id": 85,
    "title": "【祝・結婚式！】人生の晴れ舞台",
    "desc": "全員からご祝儀をもらい車に配偶者ピン追加！幸せいっぱい！",
    "type": "marriage",
    "stop": true,
    "icon": "⛪"
  },
  {
    "id": 86,
    "title": "夢のハネムーン！海外リゾート旅",
    "desc": "地中海クルーズまたはハワイで極上の夫婦時間を過ごす！",
    "type": "travel",
    "amount": -40,
    "icon": "🏝️"
  },
  {
    "id": 87,
    "title": "結婚祝いのお返し・内祝い発送",
    "desc": "お世話になった方々へ感謝を込めてギフトを贈る。",
    "type": "money",
    "amount": -15,
    "icon": "🎁"
  },
  {
    "id": 88,
    "title": "夫婦で料理教室に通い始める",
    "desc": "週末に2人で美味しいパスタと魚料理をマスター！",
    "type": "money",
    "amount": -10,
    "icon": "🍳"
  },
  {
    "id": 89,
    "title": "給料日＆夫婦手当がスタート",
    "desc": "家族が増えて福利厚生手当が給与に上乗せ！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 90,
    "title": "マイホーム住宅展示場を見学",
    "desc": "最新のモデルハウスに夢が膨らむ！土地探しスタート。",
    "type": "money",
    "amount": 10,
    "icon": "🏗️"
  },
  {
    "id": 91,
    "title": "ファイナンシャルプランナーに相談",
    "desc": "将来の教育費や老後資金の綿密なライフプランを作成！",
    "type": "money",
    "amount": 20,
    "icon": "📋"
  },
  {
    "id": 92,
    "title": "故郷の実家から夫婦への温かい祝い金",
    "desc": "「2人で仲良く暮らすんだよ」と実家から手厚い支援。",
    "type": "money",
    "amount": 50,
    "icon": "👵"
  },
  {
    "id": 93,
    "title": "住宅ローンの事前審査に通過！",
    "desc": "信用力バツグン！低金利での融資枠を獲得。",
    "type": "money",
    "amount": 20,
    "icon": "🏦"
  },
  {
    "id": 94,
    "title": "理想の立地と間取りを発見！",
    "desc": "日当たり良好、駅近・公園近くの好物件に出会う！",
    "type": "money",
    "amount": 20,
    "icon": "📐"
  },
  {
    "id": 95,
    "title": "【マイホーム購入チャンス】",
    "desc": "理想の我が家を手に入れよう！マンション・一軒家・古民家から選択！",
    "type": "buy_house",
    "stop": true,
    "icon": "🏡"
  },
  {
    "id": 96,
    "title": "待望の第1子誕生！元気な産声",
    "desc": "車に子供ピン追加！国・自治体から手厚い出産祝い金！",
    "type": "baby",
    "count": 1,
    "icon": "👶"
  },
  {
    "id": 97,
    "title": "お宮参りと百日祝い写真撮影",
    "desc": "着物を羽織ってスタジオ撮影！家族のアルバムの宝物。",
    "type": "money",
    "amount": -20,
    "icon": "📷"
  },
  {
    "id": 98,
    "title": "児童手当・子育て支援給付金の受給",
    "desc": "毎月安定した子育て手当が支給され家計大助かり！",
    "type": "money",
    "amount": 40,
    "icon": "🍼"
  },
  {
    "id": 99,
    "title": "給料日＆家族手当がさらに増額！",
    "desc": "一家の大黒柱としての誇り！仕事へのモチベーションUP！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 100,
    "title": "ワンボックス・ファミリーカー購入",
    "desc": "ベビーカーも楽々積める広い車に買い替え！快適ドライブ。",
    "type": "money",
    "amount": -40,
    "icon": "🚐"
  },
  {
    "id": 101,
    "title": "子供が初めて歩いた記念日！",
    "desc": "ヨチヨチ歩きの愛らしい姿に家族みんなで大歓声！",
    "type": "money",
    "amount": 20,
    "icon": "👣"
  },
  {
    "id": 102,
    "title": "祖父母が孫を見に来訪！",
    "desc": "孫の可愛さに目尻が下がりっぱなし！手厚いお小遣い。",
    "type": "money",
    "amount": 50,
    "icon": "👴"
  },
  {
    "id": 103,
    "title": "家族でテーマパーク旅行！",
    "desc": "人気キャラクターと記念撮影！お土産とおもちゃで大散財。",
    "type": "travel",
    "amount": -30,
    "icon": "🎡"
  },
  {
    "id": 104,
    "title": "おめでた！第2子誕生！",
    "desc": "さらに車に子供ピン追加！賑やかで温かい大家族へ！",
    "type": "baby",
    "count": 1,
    "icon": "👶"
  },
  {
    "id": 105,
    "title": "夏のボーナス＆子育て応援金",
    "desc": "会社の業績好調と家族手当で過去最高クラスのボーナス！",
    "type": "payday",
    "icon": "💰"
  },
  {
    "id": 106,
    "title": "子供の保育園・幼稚園入園式",
    "desc": "新しいお友達がたくさんできる！制服やバッグの準備。",
    "type": "money",
    "amount": -20,
    "icon": "📛"
  },
  {
    "id": 107,
    "title": "週末のバーベキュー・キャンプ",
    "desc": "大自然の中で家族みんなで焼き肉と川遊び！絆が深まる。",
    "type": "money",
    "amount": -15,
    "icon": "⛺"
  },
  {
    "id": 108,
    "title": "地域の子育てサークルで頼れる存在",
    "desc": "近所のパパ友・ママ友と情報交換し、地域の絆ができる。",
    "type": "money",
    "amount": 20,
    "icon": "🤝"
  },
  {
    "id": 109,
    "title": "給料日！家族の笑顔を守る給与",
    "desc": "毎月の努力が家族の幸せな食卓を支える！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 110,
    "title": "子供の習い事（ピアノ・スイミング）",
    "desc": "すくすく才能を伸ばす！月謝と送迎を頑張る。",
    "type": "money",
    "amount": -20,
    "icon": "🏊"
  },
  {
    "id": 111,
    "title": "子供が小学校に入学！",
    "desc": "ピカピカのランドセルを背負って元気に登校！お祝い金。",
    "type": "money",
    "amount": 30,
    "icon": "🎒"
  },
  {
    "id": 112,
    "title": "運動会で子供が徒競走1位！",
    "desc": "パパ・ママ必死でビデオ撮影！家族でお重弁当を囲む。",
    "type": "money",
    "amount": 20,
    "icon": "🥇"
  },
  {
    "id": 113,
    "title": "自宅の庭にウッドデッキをDIY設置",
    "desc": "休日に家族でペンキ塗り！BBQができる素敵なテラス完成。",
    "type": "money",
    "amount": -20,
    "icon": "🔨"
  },
  {
    "id": 114,
    "title": "冬のボーナス支給日！",
    "desc": "年末の家族旅行やイベントに向けて手厚い支給！",
    "type": "payday",
    "icon": "💰"
  },
  {
    "id": 115,
    "title": "課長昇進！プレイングマネージャー",
    "desc": "部署を統括する管理職へ昇進！役職手当で年収大幅アップ！",
    "type": "money",
    "amount": 60,
    "icon": "👔"
  },
  {
    "id": 116,
    "title": "健康診断で要精密検査・人間ドック",
    "desc": "仕事の疲れとお酒の飲み過ぎ…（※保険加入で無料補償！）",
    "type": "health_check",
    "amount": -20,
    "icon": "🏥"
  },
  {
    "id": 117,
    "title": "給料日！充実の管理職報酬",
    "desc": "役職手当と業績評価が乗り、毎月の高額給与が振り込まれる！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 118,
    "title": "ふるさと納税で全国の特産品三昧",
    "desc": "生まれ故郷への応援寄付で美味しい海鮮やお肉が毎月届く！",
    "type": "money",
    "amount": 40,
    "icon": "🥩"
  },
  {
    "id": 119,
    "title": "子供の中学校進学・部活動支援",
    "desc": "本格的な部活道具や塾の費用！子供の挑戦を全力応援。",
    "type": "money",
    "amount": -30,
    "icon": "🏸"
  },
  {
    "id": 120,
    "title": "社内大型プロジェクトのリーダー着任",
    "desc": "会社の命運を握る重要プロジェクトを率いて奮闘！",
    "type": "money",
    "amount": 40,
    "icon": "📊"
  },
  {
    "id": 121,
    "title": "夏のボーナス！エグゼクティブ賞与",
    "desc": "プロジェクトの成功実績が反映され高額賞与獲得！",
    "type": "payday",
    "icon": "💰"
  },
  {
    "id": 122,
    "title": "自宅の太陽光発電＆エコキュート導入",
    "desc": "光熱費を大幅削減！エコ住宅化で不動産評価額が上昇。",
    "type": "money",
    "amount": -30,
    "icon": "☀️"
  },
  {
    "id": 123,
    "title": "趣味のゴルフでベストスコア更新！",
    "desc": "取引先との親睦コンペで見事準優勝！賞品をゲット。",
    "type": "money",
    "amount": 30,
    "icon": "⛳"
  },
  {
    "id": 124,
    "title": "副業・コンサルティング業務の開始",
    "desc": "これまでの豊富な専門知識を活かし、社外アドバイザーへ！",
    "type": "money",
    "amount": 50,
    "icon": "💡"
  },
  {
    "id": 125,
    "title": "【人生中盤・キャリア大勝負】",
    "desc": "「ベンチャー起業・大勝負」か「堅実継続・安定生活」か運命の決断！",
    "type": "branch_midlife",
    "stop": true,
    "icon": "⚖️"
  },
  {
    "id": 126,
    "title": "自宅の大規模リフォーム工事",
    "desc": "子供部屋の増設と最新システムキッチンへ改装！快適な住まい。",
    "type": "money",
    "amount": -40,
    "icon": "🔨"
  },
  {
    "id": 127,
    "title": "【臨時ボーナス大勝負（宝くじ）】",
    "desc": "ルーレットを回して大当たりなら臨時ボーナス100万円！",
    "type": "lottery",
    "icon": "🎰"
  },
  {
    "id": 128,
    "title": "子供の高校受験・難関進学校合格！",
    "desc": "親身なサポートが実を結び見事合格！親戚からお祝い。",
    "type": "money",
    "amount": 40,
    "icon": "💮"
  },
  {
    "id": 129,
    "title": "給料日！キャリアの最盛期",
    "desc": "培ってきた実績と信頼が最高峰の給与として還元される！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 130,
    "title": "株式投資・NISAで大儲け！",
    "desc": "長年積み立てた成長株が急騰！莫大な配当金と売却益！",
    "type": "money",
    "amount": 100,
    "icon": "📈"
  },
  {
    "id": 131,
    "title": "大型台風襲来・屋根瓦修理",
    "desc": "猛烈な暴風雨！火災保険に加入していれば全額補償！",
    "type": "typhoon",
    "amount": -50,
    "icon": "🌀"
  },
  {
    "id": 132,
    "title": "地域産業おこし協議会の理事就任",
    "desc": "地元の商店街や観光振興の活性化に貢献！感謝の手当。",
    "type": "money",
    "amount": 30,
    "icon": "🌾"
  },
  {
    "id": 133,
    "title": "冬のボーナス支給日！",
    "desc": "安定した高収入で家族の生活基盤は盤石！",
    "type": "payday",
    "icon": "💰"
  },
  {
    "id": 134,
    "title": "永年勤続20年表彰！特別功労金",
    "desc": "長年にわたる会社への貢献が讃えられ、特別感謝金が授与！",
    "type": "money",
    "amount": 80,
    "icon": "🎉"
  },
  {
    "id": 135,
    "title": "ぎっくり腰で整体・リハビリ通い",
    "desc": "庭の手入れで重い植木鉢を持って腰がピキッ！通院治療。",
    "type": "money",
    "amount": -15,
    "icon": "🩺"
  },
  {
    "id": 136,
    "title": "子供の大学受験・学費と一人暮らし費用",
    "desc": "私立大学へ進学！入学金と仕送りでまとまった出費。",
    "type": "money",
    "amount": -70,
    "icon": "🎓"
  },
  {
    "id": 137,
    "title": "給料日！統括マネージャー報酬",
    "desc": "重い責任を果たし続ける日々！手厚い報酬が口座へ。",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 138,
    "title": "親の金婚式・親孝行温泉旅行を招待",
    "desc": "両親の結婚50周年を祝い、高級老舗旅館へ家族全員をご招待！",
    "type": "money",
    "amount": -40,
    "icon": "♨️"
  },
  {
    "id": 139,
    "title": "地元テレビ番組で活動が特集される",
    "desc": "地方創生への取り組みがニュースで取り上げられ大反響！",
    "type": "money",
    "amount": 50,
    "icon": "📺"
  },
  {
    "id": 140,
    "title": "【お盆・正月の帰省マス】",
    "desc": "懐かしの生まれ故郷へ！出身県から手厚い仕送りと特産品が届く！",
    "type": "homecoming",
    "stop": true,
    "icon": "🗾"
  },
  {
    "id": 141,
    "title": "同窓会幹事・旧友と新ビジネス出資",
    "desc": "懐かしい同級生たちと旧交を温め、共同出資事業をスタート！",
    "type": "money",
    "amount": 60,
    "icon": "🤝"
  },
  {
    "id": 142,
    "title": "ゴルフで夢のホールインワン達成！",
    "desc": "奇跡の快挙！記念祝賀会で仲間全員に振る舞い酒と記念品。",
    "type": "money",
    "amount": -30,
    "icon": "⛳"
  },
  {
    "id": 143,
    "title": "SNS・情報発信が100万再生突破！",
    "desc": "趣味や専門知識の動画が大バズり！広告収入がザクザク。",
    "type": "money",
    "amount": 80,
    "icon": "📱"
  },
  {
    "id": 144,
    "title": "給料日！役員・部長クラス給与",
    "desc": "会社の中枢を担うトップリーダーとしての高額給与！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 145,
    "title": "夫婦で高級フレンチのフルコース",
    "desc": "子育てが一段落し、夫婦2人の記念日を豪華にお祝い！",
    "type": "money",
    "amount": -25,
    "icon": "🥂"
  },
  {
    "id": 146,
    "title": "夏のボーナス！大台突破の特別賞与",
    "desc": "年間の優れた業績により過去最高額のボーナスが支給！",
    "type": "payday",
    "icon": "💰"
  },
  {
    "id": 147,
    "title": "子供が就職活動で見事内定獲得！",
    "desc": "第一志望の大手企業に合格！自立した我が子に感無量。",
    "type": "money",
    "amount": 40,
    "icon": "👔"
  },
  {
    "id": 148,
    "title": "人間ドックで健康優良の太鼓判",
    "desc": "毎朝のウォーキングが実を結び、数値がすべて改善！",
    "type": "money",
    "amount": 20,
    "icon": "🏃"
  },
  {
    "id": 149,
    "title": "業界功労賞を受賞！表彰式登壇",
    "desc": "長年業界をリードしてきた功績が業界団体から讃えられる！",
    "type": "money",
    "amount": 70,
    "icon": "🏅"
  },
  {
    "id": 150,
    "title": "親の遺産・実家の土地を相続",
    "desc": "実家の手入れや相続手続き！遺産をしっかり承継。",
    "type": "money",
    "amount": 60,
    "icon": "📜"
  },
  {
    "id": 151,
    "title": "給料日！充実の現役終盤報酬",
    "desc": "長年のキャリアの集大成！安定した高収入。",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 152,
    "title": "高級時計・記念品の購入",
    "desc": "頑張ってきた自分への一生モノのご褒美！",
    "type": "money",
    "amount": -40,
    "icon": "⌚"
  },
  {
    "id": 153,
    "title": "冬のボーナス支給日！",
    "desc": "現役サラリーマン生活もいよいよ円熟味を増す！",
    "type": "payday",
    "icon": "💰"
  },
  {
    "id": 154,
    "title": "子供の結婚式・親としての旅立ち",
    "desc": "愛する我が子の晴れ舞台！涙のバージンロードと結婚祝い金。",
    "type": "money",
    "amount": -50,
    "icon": "💍"
  },
  {
    "id": 155,
    "title": "部長就任・重役就任！組織の頂点へ",
    "desc": "全社を統括する最高幹部へ昇進！昇給ボーナスが炸裂！",
    "type": "money",
    "amount": 80,
    "icon": "👑"
  },
  {
    "id": 156,
    "title": "後輩への業務引き継ぎ・マニュアル完成",
    "desc": "長年蓄積したノウハウを次世代へ完璧に伝承！感謝される。",
    "type": "money",
    "amount": 30,
    "icon": "📂"
  },
  {
    "id": 157,
    "title": "給料日！現役ラストスパート給与",
    "desc": "長年働き抜いた職場への感謝を胸に受け取る給与！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 158,
    "title": "現役最後のビッグプロジェクト完遂",
    "desc": "業界の歴史に残る大型案件を無事成功させ、全社から拍手喝采！",
    "type": "money",
    "amount": 90,
    "icon": "🏆"
  },
  {
    "id": 159,
    "title": "夫婦水入らずの国内湯治旅",
    "desc": "長年支えてくれた配偶者へ感謝を込めて名湯めぐり旅！",
    "type": "travel",
    "amount": -30,
    "icon": "🗻"
  },
  {
    "id": 160,
    "title": "社内送別会で感謝の記念品授与",
    "desc": "同僚や部下から心のこもった花束とメッセージ集を受け取る！",
    "type": "money",
    "amount": 30,
    "icon": "💐"
  },
  {
    "id": 161,
    "title": "現役最後の給料日！",
    "desc": "40年間勤め上げたサラリーマン人生最後の給与が振り込まれる！",
    "type": "payday",
    "icon": "💴"
  },
  {
    "id": 162,
    "title": "地域自治会長・ボランティア表彰",
    "desc": "地域の安心安全を守る活動で県知事から感謝状！",
    "type": "money",
    "amount": 30,
    "icon": "🏅"
  },
  {
    "id": 163,
    "title": "初孫誕生！おじいちゃんおばあちゃん",
    "desc": "可愛すぎる赤子に目尻が下がりっぱなし！幸せいっぱい！",
    "type": "money",
    "amount": 60,
    "icon": "👶"
  },
  {
    "id": 164,
    "title": "退職前有休消化で全国寺社巡り",
    "desc": "四国お遍路や全国の名刹を巡り、心の安らぎを得る。",
    "type": "travel",
    "amount": -25,
    "icon": "⛩️"
  },
  {
    "id": 165,
    "title": "趣味のカメラで写真コンテスト入賞",
    "desc": "旅先で撮影した美しい富士山の写真が見事入賞！",
    "type": "money",
    "amount": 30,
    "icon": "📷"
  },
  {
    "id": 166,
    "title": "長年の愛車をピカピカに整備",
    "desc": "思い出の詰まった車をコーティング！愛着深まる。",
    "type": "money",
    "amount": -15,
    "icon": "🚗"
  },
  {
    "id": 167,
    "title": "地域の子供たちに昔遊びを教える",
    "desc": "コマ回しや凧揚げを指導！子供たちの笑顔に元気を貰う。",
    "type": "money",
    "amount": 20,
    "icon": "🪁"
  },
  {
    "id": 168,
    "title": "家庭菜園の本格スタート",
    "desc": "庭に畝を作り、無農薬のトマトやナスを栽培！",
    "type": "money",
    "amount": -10,
    "icon": "🍆"
  },
  {
    "id": 169,
    "title": "孫のお宮参りとお祝いプレゼント",
    "desc": "「健やかに育てよ」と温かい気持ちでお祝い金を渡す。",
    "type": "money",
    "amount": -20,
    "icon": "🍼"
  },
  {
    "id": 170,
    "title": "シニア健康体操教室で仲間ができる",
    "desc": "毎朝ラジオ体操とストレッチ！生涯現役の健康体。",
    "type": "money",
    "amount": 15,
    "icon": "🧘"
  },
  {
    "id": 171,
    "title": "地域の歴史サークルで発表",
    "desc": "生まれ故郷の歴史を紐解く研究発表が大好評！",
    "type": "money",
    "amount": 20,
    "icon": "📚"
  },
  {
    "id": 172,
    "title": "孫たちと動物園・水族館ツアー",
    "desc": "「じいじ、ばあば大好き！」と抱きつかれ大散財。",
    "type": "travel",
    "amount": -25,
    "icon": "🐬"
  },
  {
    "id": 173,
    "title": "本格そば打ち・陶芸教室に熱中",
    "desc": "粉と水加減にこだわった十割そばを近所に振る舞う！",
    "type": "money",
    "amount": -20,
    "icon": "🍲"
  },
  {
    "id": 174,
    "title": "会社の特別顧問・相談役に就任",
    "desc": "豊富な経験を買われ、週2日の非常勤アドバイザーへ！",
    "type": "money",
    "amount": 50,
    "icon": "💼"
  },
  {
    "id": 175,
    "title": "【定年退職の日！人生の節目】",
    "desc": "長年のお勤め本当にお疲れ様でした！手厚い退職金を一括受取！",
    "type": "retirement",
    "stop": true,
    "icon": "🎖️"
  },
  {
    "id": 176,
    "title": "豪華世界一周クルーズの夢の船旅",
    "desc": "退職祝いに豪華客船で世界中の絶景遺産を巡る一生の船旅！",
    "type": "travel",
    "amount": -70,
    "icon": "🚢"
  },
  {
    "id": 177,
    "title": "【公的年金支給日】偶数月の振込",
    "desc": "国からの厚生年金・国民年金が満額振込！安心のライフライン。",
    "type": "pension",
    "icon": "🏦"
  },
  {
    "id": 178,
    "title": "庭の家庭菜園で無農薬野菜大豊作",
    "desc": "瑞々しいキュウリと立派なスイカが収穫！食卓が華やか。",
    "type": "money",
    "amount": 20,
    "icon": "🍅"
  },
  {
    "id": 179,
    "title": "町おこし・産業アドバイザー就任",
    "desc": "現役時代の知見を活かし、地方自治体の特産品開発を支援！",
    "type": "money",
    "amount": 50,
    "icon": "🌾"
  },
  {
    "id": 180,
    "title": "可愛い孫たちにお年玉を配る",
    "desc": "「ありがとう！」と喜ぶ可愛い笑顔にメロメロ。",
    "type": "money",
    "amount": -20,
    "icon": "🧧"
  },
  {
    "id": 181,
    "title": "シニア健康ゲートボール大会優勝",
    "desc": "地域の仲間たちと息の合ったプレーで見事優勝！賞金獲得。",
    "type": "money",
    "amount": 30,
    "icon": "🥇"
  },
  {
    "id": 182,
    "title": "【公的年金支給日】安定した老後",
    "desc": "毎偶数月の振込で日々の穏やかな暮らしをエンジョイ！",
    "type": "pension",
    "icon": "🏦"
  },
  {
    "id": 183,
    "title": "夫婦で全国の秘湯・名湯めぐり",
    "desc": "のんびり露天風呂に入って極楽気分！長年の内助に感謝。",
    "type": "travel",
    "amount": -30,
    "icon": "♨️"
  },
  {
    "id": 184,
    "title": "地域の伝統工芸の継承活動",
    "desc": "若者たちに伝統の技と心を教え、地域文化を守る！",
    "type": "money",
    "amount": 40,
    "icon": "🏺"
  },
  {
    "id": 185,
    "title": "祝・金婚式！夫婦の絆50周年",
    "desc": "半世紀を共に歩んだ夫婦の愛！子供や孫が集まり大盛大な祝宴！",
    "type": "money",
    "amount": 80,
    "icon": "🥂"
  },
  {
    "id": 186,
    "title": "【公的年金支給日】豊かな余生",
    "desc": "ゆったりとした時間の流れと確かな年金受給！",
    "type": "pension",
    "icon": "🏦"
  },
  {
    "id": 187,
    "title": "孫の大学合格祝い・新生活応援",
    "desc": "次世代の夢へ投資！希望に満ちた孫の旅立ちを応援。",
    "type": "money",
    "amount": -30,
    "icon": "💮"
  },
  {
    "id": 188,
    "title": "地域の名誉市民・特別顧問就任",
    "desc": "街の発展に尽くした功績が讃えられ、名誉ある称号を授与！",
    "type": "money",
    "amount": 90,
    "icon": "🏛️"
  },
  {
    "id": 189,
    "title": "故郷の小学校に記念桜を植樹",
    "desc": "生まれ育った学び舎に桜の苗木を寄贈！温かい感謝状。",
    "type": "money",
    "amount": 30,
    "icon": "🌸"
  },
  {
    "id": 190,
    "title": "【公的年金支給日】偶数月の振込",
    "desc": "老後の蓄えと公的年金で悠々自適の穏やかな生活！",
    "type": "pension",
    "icon": "🏦"
  },
  {
    "id": 191,
    "title": "趣味の囲碁・将棋で名人位獲得",
    "desc": "公民館の将棋大会で名人を破り見事優勝！",
    "type": "money",
    "amount": 30,
    "icon": "♟️"
  },
  {
    "id": 192,
    "title": "【年末ジャンボ宝くじ大勝負】",
    "desc": "人生最後の大勝負！ルーレットを回して億万長者ドリームを掴め！",
    "type": "lottery",
    "icon": "🎰"
  },
  {
    "id": 193,
    "title": "孫の結婚式・ひ孫の誕生！",
    "desc": "家族4世代が集う奇跡の幸せ！命のバトンが繋がる感動。",
    "type": "money",
    "amount": 60,
    "icon": "👶"
  },
  {
    "id": 194,
    "title": "【公的年金支給日】充実の年金",
    "desc": "生涯現役で積み立てた年金が満額支給！",
    "type": "pension",
    "icon": "🏦"
  },
  {
    "id": 195,
    "title": "波乱万丈の自叙伝を出版！",
    "desc": "これまでの激動の人生を綴った回顧録が地元でベストセラー！",
    "type": "money",
    "amount": 100,
    "icon": "📖"
  },
  {
    "id": 196,
    "title": "夫婦で豪華ディナークルーズ",
    "desc": "夕陽に輝く海を眺めながら優雅なひととき。",
    "type": "travel",
    "amount": -25,
    "icon": "🛳️"
  },
  {
    "id": 197,
    "title": "【公的年金支給日】人生の集大成",
    "desc": "穏やかな日々に感謝。平和で幸せなシルバーライフ。",
    "type": "pension",
    "icon": "🏦"
  },
  {
    "id": 198,
    "title": "故郷への恩返し・育英基金の設立",
    "desc": "恵まれない若者を支援する基金を設立し、感謝される！",
    "type": "money",
    "amount": 50,
    "icon": "🌟"
  },
  {
    "id": 199,
    "title": "人生の総決算・感謝と祈り",
    "desc": "家族と故郷、支えてくれたすべての人に心からのありがとう。",
    "type": "money",
    "amount": 60,
    "icon": "🙏"
  },
  {
    "id": 200,
    "title": "【億万長者の館（ゴール）】",
    "desc": "人生の終着駅！到着順ボーナス＋最終資産決算で大富豪が決定！",
    "type": "goal",
    "stop": true,
    "icon": "🏰"
  }
];

// 手番交代の共通処理（次のゴールしていないプレイヤーへ確実に交代）
export const advanceToNextTurn = (G, ctx, events) => {
  G.currentSpaceModal = null;
  G.rouletteValue = null;
  G.isSpinning = false;
  G.turnStep = 'spin';

  const allFinished = Object.values(G.players).every((p) => p.isGoal);
  if (allFinished) {
    JinseiGame.calculateFinalSettlement(G);
    G.gameState = 'game_over';
    G.logs.unshift(`🏆 全員がゴールしました！最終決算集計を行います！`);
    return;
  }

  // 次のゴールしていないプレイヤーを探す
  const numPlayers = ctx.numPlayers;
  const playOrder = ctx.playOrder || Object.keys(G.players);
  const currentPos = playOrder.indexOf(ctx.currentPlayer);
  let nextPid = ctx.currentPlayer;

  for (let i = 1; i <= numPlayers; i++) {
    const candidatePid = playOrder[(currentPos + i) % numPlayers];
    if (!G.players[candidatePid]?.isGoal) {
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
    p.souvenirs = p.souvenirs.filter((s) => s.id !== p.prefecture.souvenir.id);
    if (p.prefecture.passiveType === 'insurance_free') {
      p.insurance.life = false;
      p.insurance.fire = false;
    }
  }

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
      p.debt = Math.max(p.debt, 1); // 奨学金100万スタート
    }

    G.logs.unshift(`💀【出生地＆親ガチャ結果】Player ${playerID} は運命により【${pref.name}】に誕生！実家年収: ${parentTier.income}万円（${parentTier.title}）➔ 初期偏差値【${finalHensachi}】！`);
  }

  // 全員が出身地を選び終えたらゲーム開始
  const allSelected = Object.values(G.players).every((pl) => pl.prefecture !== null);
  if (allSelected) {
    G.gameState = 'playing';
    G.turnStep = 'spin';
    G.logs.unshift(`🎉 全員の出身地が決定！第1ターンのルーレットを回してください！`);
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
      gameState: 'lobby', // 'lobby' | 'select_prefecture' | 'playing' | 'game_over'
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

  turn: {
    activePlayers: { all: null },
    order: {
      first: () => 0,
      next: ({ G, ctx }) => {
        if (Object.values(G.players).every((p) => p.isGoal)) return ctx.playOrderPos;
        let nextPos = (ctx.playOrderPos + 1) % ctx.numPlayers;
        for (let i = 0; i < ctx.numPlayers; i++) {
          const nextPid = ctx.playOrder[nextPos];
          if (!G.players[nextPid]?.isGoal) {
            return nextPos;
          }
          nextPos = (nextPos + 1) % ctx.numPlayers;
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
        // ハードモード発動時は強制ガチャ移行のため、既存の選択をクリア
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
      // ハードモード時は手動選択不可（強制ランダムガチャ）
      if (G.isHardMode) return;
      applyPrefectureChoice(G, random, playerID, prefId);
    },

    // 1-B. 出身都道府県のランダム決定（通常モードのおまかせ / ハードモードの強制出生地ガチャ）
    choosePrefectureRandom: ({ G, random }, playerID) => {
      if (G.gameState !== 'select_prefecture') return;
      // ハードモードですでに決定済みの場合は再ロール不可（人は生まれ故郷を選べない）
      if (G.isHardMode && G.players[playerID]?.prefecture !== null) return;

      const randIdx = random ? (random.Die(PREFECTURES.length) - 1) : Math.floor(Math.random() * PREFECTURES.length);
      const chosenPref = PREFECTURES[randIdx];
      applyPrefectureChoice(G, random, playerID, chosenPref.id);
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

      // 確定ストップマスのチェック (進路分岐: 12, 就職: 14, 結婚: 28, マイホーム: 30, 中年分岐: 44, 帰省: 53, 定年退職: 64, ゴール: 82)
      // 確定ストップマスのチェック (進路分岐: 35, 就職面接: 37, 結婚式: 85, マイホーム: 95, 中年分岐: 125, 帰省: 140, 定年退職: 175, ゴール: 200)
      const stopPositions = [35, 37, 85, 95, 125, 140, 175, 200];
      for (const stop of stopPositions) {
        if (p.position < stop && targetPos >= stop) {
          targetPos = stop;
          break;
        }
      }

      // 就職は必ずする必要がある（未就職の場合はマス14を絶対に通過できない）
      // 就職は必ずする必要がある（未就職の場合はマス37を絶対に通過できない）
      if (!p.occupation && targetPos > 37) {
        targetPos = 37;
      }

      if (targetPos > 200) targetPos = 200;

      p.position = targetPos;
      G.turnStep = 'resolve_space';

      const space = BOARD_SPACES.find((s) => s.id === targetPos) || BOARD_SPACES[0];
      G.logs.unshift(`🎯 Player ${playerID} がルーレット【${roll}${bonus ? '+1' : ''}】を出し、【${space.title}】に止まりました！`);

      // マスイベント適用
      JinseiGame.resolveSpaceEffects(G, ctx, playerID, space, random);
    },

    // 3. 職業選択 (通常または学歴フィルター/逆転面接)
    chooseJob: ({ G, ctx, random, events }, playerID, jobId, tryGamble = false) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];
      const occ = OCCUPATIONS.find((o) => o.id === jobId) || OCCUPATIONS[OCCUPATIONS.length - 1];

      if (G.isHardMode) {
        if (tryGamble) {
          // 奇跡のコネ・大逆転面接チャレンジ (出目8以上で合格)
          const roll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
          if (roll >= 8) {
            p.occupation = occ;
            p.salary = occ.baseSalary;
            G.logs.unshift(`🔥【大逆転採用！】出目【${roll}】で面接官に熱意が刺さり奇跡の合格！【${occ.title}】に就任！（給料: ${occ.baseSalary}万円）`);
            advanceToNextTurn(G, ctx, events);
          } else {
            // 就職必須：不合格時は就活浪人費用 -30万円支払い、就活エリアの起点（マス13）へ戻る
            p.money -= 30;
            p.position = 36;
            p.occupation = null;
            G.logs.unshift(`❌【お祈りメール…不合格！】出目【${roll}】で落選！就活浪人費用 -30万円。就活エリアの起点【マス36】へ戻り次のターンで再挑戦！`);
            advanceToNextTurn(G, ctx, events);
          }
        } else {
          // 偏差値判定
          if ((p.hensachi || 50) >= occ.minHensachi) {
            p.occupation = occ;
            p.salary = occ.baseSalary;
            G.logs.unshift(`🎓【正規採用！】偏差値【${p.hensachi}】の実力で見事【${occ.title}】に合格！（初任給: ${occ.baseSalary}万円）`);
            advanceToNextTurn(G, ctx, events);
          } else {
            // 学歴不問職へ自動配属
            const fallbackOcc = OCCUPATIONS.find((o) => o.minHensachi === 0);
            p.occupation = fallbackOcc;
            p.salary = fallbackOcc.baseSalary;
            G.logs.unshift(`⚠️ 偏差値不足のため【${fallbackOcc.title}】に採用されました。（給料: ${fallbackOcc.baseSalary}万円）`);
            advanceToNextTurn(G, ctx, events);
          }
        }
      } else {
        // 通常モード：希望の職業に就任
        p.occupation = occ;
        p.salary = occ.baseSalary;
        G.logs.unshift(`🎓 Player ${playerID} が【${occ.title}】に就任！（給料: ${p.salary}万円）`);
        advanceToNextTurn(G, ctx, events);
      }
    },

    // 4. 分岐ルート選択 (進路分岐マス12 または 中年キャリア分岐マス44)
    chooseRoute: ({ G, ctx, events }, playerID, route) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];

      if (p.position === 35) {
        p.branchRoute = route; // 'tokyo' or 'local'
        if (route === 'tokyo') {
          p.money -= 20;
          if (G.isHardMode) p.hensachi = (p.hensachi || 50) + 2;
          G.logs.unshift(`🏙️ Player ${playerID} は【大都会コース】を選択！夢と希望を胸に上京！（偏差値+2、引越し費 -20万円）`);
        } else {
          p.money += 30;
          G.logs.unshift(`🌾 Player ${playerID} は【地元就職コース】を選択！地元定着祝い金 +30万円 獲得！`);
        }
      } else if (p.position === 125) {
        p.midlifeRoute = route; // 'venture' or 'steady'
        if (route === 'venture') {
          p.money += 80;
          G.logs.unshift(`🚀 Player ${playerID} は【ベンチャー起業・大勝負コース】を選択！特別出資金 +80万円 獲得！`);
        } else {
          p.money += 30;
          G.logs.unshift(`🛡️ Player ${playerID} は【堅実継続・安定コース】を選択！特別手当 +30万円 獲得！`);
        }
      }

      advanceToNextTurn(G, ctx, events);
    },

    // 5. マイホーム購入選択 (マス30)
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

    // 6. 手番終了
    endTurn: ({ G, ctx, events }, playerID) => {
      if (G.gameState !== 'playing') return;
      if (playerID && ctx.currentPlayer !== playerID) return;

      advanceToNextTurn(G, ctx, events);
    },

    // 7. ゲームリセット
    restartGame: ({ G, ctx }) => {
      const resetG = JinseiGame.setup({ ctx });
      resetG.isHardMode = G.isHardMode; // モード設定は引き継ぎ
      resetG.gameState = 'select_prefecture'; // リスタート時は即座に都道府県選択へ
      Object.assign(G, resetG);
    },
  },

  // マスイベントの自動解決ロジック
  resolveSpaceEffects: (G, ctx, playerID, space, random) => {
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

      case 'job_start':
        G.logs.unshift(`💼 Player ${playerID} は就職活動エリアのスタート地点に到着！次のマスで面接に挑もう！`);
        break;

      case 'choose_job':
      case 'job':
        // 職業選択モーダルを開く
        G.currentSpaceModal = {
          spaceId: space.id,
          title: G.isHardMode ? '💀【運命の就職面接・学歴フィルター】' : '🎓【運命の就職面接マス】職業を選択！',
          desc: G.isHardMode
            ? `就職必須マス！あなたの偏差値【${p.hensachi || 50}】を元に選考されます。学歴フィルターを突破するか、逆転面接に挑め！（※不合格時はマス13へ戻る）`
            : '就職必須マス！希望する職業を選択して内定を獲得してください！',
          type: 'choose_job',
        };
        break;

      case 'branch_career':
        G.currentSpaceModal = {
          spaceId: space.id,
          title: '🚩 【進路選択・未来への旅立ち】',
          desc: '人生最初の重大分岐！大都会へ飛び出して勝負するか、生まれ故郷で安定した基盤を築くか選択してください。',
          type: 'branch_career',
        };
        break;

      case 'branch_midlife':
        G.currentSpaceModal = {
          spaceId: space.id,
          title: '⚖️ 【人生中盤・キャリア大勝負】',
          desc: '40代の運命の分かれ道！「ベンチャー起業・大勝負」で一攫千金を狙うか、「堅実継続・安定生活」で退職金を手堅く積み立てるか選んでください。',
          type: 'branch_midlife',
        };
        break;

      case 'buy_house':
        G.currentSpaceModal = {
          spaceId: space.id,
          title: '🏡 【マイホーム購入チャンス】',
          desc: '夢のマイホームを手に入れよう！購入した不動産は最終決算で高額資産として換算されます。見送ることも可能です。',
          type: 'buy_house',
        };
        break;

      case 'health_check': {
        const isCovered = p.insurance?.life;
        const cost = isCovered ? 0 : 20;
        p.money -= cost;
        if (isCovered) {
          G.logs.unshift(`🏥 【健康診断】生命保険（${p.prefecture?.name || '加入済'}）が適用され、自己負担0円でした！`);
        } else {
          G.logs.unshift(`🏥 【健康診断】要精密検査！人間ドック費用として 20万円 を支払いました。`);
        }
        break;
      }

      case 'typhoon': {
        const isCovered = p.insurance?.fire;
        const cost = isCovered ? 0 : 50;
        p.money -= cost;
        if (isCovered) {
          G.logs.unshift(`🌀 【大型台風襲来】火災保険（${p.prefecture?.name || '加入済'}）が適用され、屋根修理代が全額補償されました！`);
        } else {
          G.logs.unshift(`🌀 【大型台風襲来】猛烈な暴風雨！屋根瓦の修理代として 50万円 を支払いました。`);
        }
        break;
      }

      case 'lottery': {
        const lRoll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
        if (lRoll >= 8) {
          p.money += 100;
          G.logs.unshift(`🎰 【宝くじ大勝負・大当たり！】ルーレット【${lRoll}】で見事1等100万円に当選！`);
        } else {
          p.money += 10;
          G.logs.unshift(`🎰 【宝くじ大勝負】ルーレット【${lRoll}】…末等当選で +10万円 獲得！`);
        }
        break;
      }

      case 'travel': {
        const cost = Math.abs(space.amount || 30);
        p.money -= cost;
        G.logs.unshift(`✈️ 【旅行】Player ${playerID} が極上の旅を満喫！（費用: ${cost}万円）`);
        break;
      }

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
