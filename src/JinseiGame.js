// JinseiGame.js - 47都道府県 ご当地人生ゲームのゲームロジック
// ニンテンドースイッチ風 5大時代（ライフステージ）＆ターン固定進行モデル
// 通常モード ＋ 隠しリアルハードモード（親ガチャ・偏差値・学歴フィルター）
import { PREFECTURES, getPrefectureById } from './data/prefecturesData.js';
import { LIFE_ERAS, getEraById, getAllSpacesFlat, getSpaceMoneyDetails, calculateNextPosition, calculateMovePath } from './data/lifeErasData.js';

export { LIFE_ERAS, getEraById, getSpaceMoneyDetails, calculateNextPosition, calculateMovePath };
export const BOARD_SPACES = getAllSpacesFlat();

export const OCCUPATIONS = [
  { id: 'doctor', title: '名医・ドクター', baseSalary: 220, maxSalary: 550, icon: '🩺', type: 'expert', minHensachi: 68, minStamina: 40, reqAcademic: 75, reqStamina: 40, tierDesc: '最難関医学部卒・極限の医学知性と夜勤に耐える体力' },
  { id: 'lawyer', title: '弁護士・検察官', baseSalary: 210, maxSalary: 520, icon: '📜', type: 'tokyo', minHensachi: 67, minStamina: 38, reqAcademic: 76, reqStamina: 38, tierDesc: '法曹界のエリート！膨大な法律知識と論理力の頂点' },
  { id: 'pilot', title: 'パイロット・航空機長', baseSalary: 200, maxSalary: 490, icon: '✈️', type: 'expert', minHensachi: 64, minStamina: 60, reqAcademic: 70, reqStamina: 62, tierDesc: '空の精鋭！高度な理系頭脳と強靭な身体能力の両立が必須' },
  { id: 'consultant', title: '外資系コンサル・高級官僚', baseSalary: 185, maxSalary: 480, icon: '⚖️', type: 'tokyo', minHensachi: 64, minStamina: 45, reqAcademic: 70, reqStamina: 45, tierDesc: '難関大卒・高度論理思考と激務に耐えるタフネス' },
  { id: 'athlete', title: 'プロアスリート・五輪選手', baseSalary: 170, maxSalary: 500, icon: '⚽', type: 'expert', minHensachi: 35, minStamina: 70, reqAcademic: 32, reqStamina: 74, tierDesc: '強靭な肉体と日々の鍛錬！極限の運動体力特化' },
  { id: 'researcher', title: '研究者・大学教授', baseSalary: 165, maxSalary: 420, icon: '🔬', type: 'expert', minHensachi: 63, minStamina: 30, reqAcademic: 72, reqStamina: 30, tierDesc: '知の探究者！体力控えめでも卓越した学力で目指せる専門職' },
  { id: 'architect', title: '建築家・一級設計士', baseSalary: 160, maxSalary: 430, icon: '📐', type: 'tokyo', minHensachi: 58, minStamina: 45, reqAcademic: 62, reqStamina: 48, tierDesc: '造形美と構造計算の融合！街のランドマークを創るクリエイター' },
  { id: 'it_engineer', title: 'ITベンチャー 起業家', baseSalary: 155, maxSalary: 450, icon: '💻', type: 'tokyo', minHensachi: 52, minStamina: 45, reqAcademic: 60, reqStamina: 48, tierDesc: '理系大卒・最先端IT技術と開発をやり抜く集中体力' },
  { id: 'pharmacist', title: '薬剤師・医療スペシャリスト', baseSalary: 150, maxSalary: 340, icon: '💊', type: 'general', minHensachi: 57, minStamina: 35, reqAcademic: 64, reqStamina: 35, tierDesc: '確かな薬学知識で地域の健康を支える安定専門職' },
  { id: 'firefighter', title: '消防士・レスキュー隊員', baseSalary: 140, maxSalary: 320, icon: '🚒', type: 'local', minHensachi: 40, minStamina: 65, reqAcademic: 38, reqStamina: 68, tierDesc: '街のヒーロー！燃え盛る現場へ飛び込む圧倒的フィジカル' },
  { id: 'salaryman', title: '大手企業 総合職', baseSalary: 130, maxSalary: 300, icon: '💼', type: 'general', minHensachi: 54, minStamina: 46, reqAcademic: 56, reqStamina: 46, tierDesc: '有名大卒・知性と通勤営業をこなす安定の体力' },
  { id: 'chef', title: 'トップシェフ・料理長', baseSalary: 125, maxSalary: 390, icon: '👨‍🍳', type: 'local', minHensachi: 0, minStamina: 54, reqAcademic: 40, reqStamina: 56, tierDesc: '学歴不問！立ち仕事と熱い厨房を仕切る美食の求道者' },
  { id: 'civil_servant', title: '安定の地方公務員', baseSalary: 115, maxSalary: 250, icon: '🏛️', type: 'local', minHensachi: 48, minStamina: 44, reqAcademic: 50, reqStamina: 44, tierDesc: '地元大短大卒・公務員試験突破と日々の奉仕体力' },
  { id: 'driver', title: '現場プロ・大型ドライバー', baseSalary: 115, maxSalary: 280, icon: '🚚', type: 'local', minHensachi: 0, minStamina: 56, reqAcademic: 34, reqStamina: 58, tierDesc: '学歴不問！全国輸送を支える頑強なタフネス体力' },
  { id: 'farmer', title: 'アグリビジネス・農業王', baseSalary: 105, maxSalary: 350, icon: '🚜', type: 'local', minHensachi: 0, minStamina: 50, reqAcademic: 36, reqStamina: 52, tierDesc: '学歴不問！自然を愛する知識と朝起きのバイタリティ' },
  { id: 'artisan', title: '伝統工芸・名匠職人', baseSalary: 100, maxSalary: 380, icon: '🏺', type: 'local', minHensachi: 0, minStamina: 44, reqAcademic: 46, reqStamina: 45, tierDesc: '学歴不問！繊細な美意識と一日中集中する持続体力' },
  { id: 'streamer', title: '人気動画クリエイター・配信者', baseSalary: 95, maxSalary: 520, icon: '📹', type: 'entertainment', minHensachi: 0, minStamina: 38, reqAcademic: 35, reqStamina: 40, tierDesc: '学歴不問！企画力と連日配信を続けるバイタリティでバズを狙う' },
  { id: 'idol', title: 'ご当地スター・アイドル', baseSalary: 85, maxSalary: 550, icon: '🎤', type: 'entertainment', minHensachi: 0, minStamina: 48, reqAcademic: 35, reqStamina: 48, tierDesc: '学歴不問！激しいダンスレッスンとステージをこなす体力' },
  { id: 'freeter', title: '自由人・フリーター', baseSalary: 60, maxSalary: 160, icon: '🎸', type: 'general', minHensachi: 0, minStamina: 0, reqAcademic: 0, reqStamina: 0, tierDesc: '学歴・体力不問！自由気ままなマイルート' },
  { id: 'unemployed', title: '無職・求職中', baseSalary: 0, maxSalary: 0, icon: '🏚️', type: 'general', minHensachi: 0, minStamina: 0, reqAcademic: 0, reqStamina: 0, tierDesc: '学歴・体力不問。充電期間で知性と体力を鍛え直そう' },
];

// 47都道府県別・ご当地有名企業マスター（出身県に応じて就職・転職候補に追加）
const RAW_PREFECTURE_COMPANIES = {
  hokkaido: { title: 'ニトリ（北海道発・家具インテリア最大手）', icon: '🛋️', baseSalary: 175, maxSalary: 420, reqAcademic: 58, reqStamina: 46, minHensachi: 54, minStamina: 46, desc: '「お、ねだん以上。」で全国を席巻する北海道発の世界的インテリア企業！' },
  aomori: { title: 'プロクレアHD・青森みちのく銀行（青森）', icon: '🏦', baseSalary: 145, maxSalary: 320, reqAcademic: 54, reqStamina: 40, minHensachi: 52, minStamina: 40, desc: '青森県の地域経済と暮らしを最前線で支える名門金融グループ！' },
  iwate: { title: '小岩井乳業・小岩井農場（岩手発）', icon: '🥛', baseSalary: 155, maxSalary: 350, reqAcademic: 52, reqStamina: 50, minHensachi: 50, minStamina: 48, desc: '岩手山麓の歴史ある広大な農場から全国へ乳製品を届ける老舗ブランド！' },
  miyagi: { title: 'アイリスオーヤマ（宮城・仙台本社）', icon: '💡', baseSalary: 175, maxSalary: 410, reqAcademic: 56, reqStamina: 52, minHensachi: 53, minStamina: 50, desc: 'なるほど家電や生活用品を次々生み出す仙台発の革新的メーカー！' },
  akita: { title: 'TDK（秋田・由利本荘創業の世界的電子部品）', icon: '💿', baseSalary: 185, maxSalary: 440, reqAcademic: 62, reqStamina: 46, minHensachi: 58, minStamina: 46, desc: '秋田県で産声を上げ世界の先端エレクトロニクスを支える巨大テクノロジー企業！' },
  yamagata: { title: 'でん六（山形発・豆菓子メーカー大手）', icon: '🥜', baseSalary: 145, maxSalary: 320, reqAcademic: 46, reqStamina: 45, minHensachi: 45, minStamina: 44, desc: '「でん六豆」で全国に愛される山形県民の誇り・老舗食品メーカー！' },
  fukushima: { title: 'ゼビオHD（福島・郡山本社スポーツ大手）', icon: '👟', baseSalary: 160, maxSalary: 360, reqAcademic: 52, reqStamina: 55, minHensachi: 50, minStamina: 54, desc: '東北のスポーツ文化を牽引し全国展開する郡山本社の大型小売企業！' },
  ibaraki: { title: 'ケーズホールディングス（茨城・水戸本社）', icon: '📺', baseSalary: 170, maxSalary: 390, reqAcademic: 54, reqStamina: 48, minHensachi: 52, minStamina: 46, desc: '「新製品が安い」ケーズデンキを全国に広めた水戸発の家電量販大手！' },
  tochigi: { title: 'カワチ薬品（栃木・小山本社ドラッグ大手）', icon: '💊', baseSalary: 155, maxSalary: 340, reqAcademic: 50, reqStamina: 46, minHensachi: 48, minStamina: 44, desc: 'メガドラッグストア戦略で東日本の生活を支える栃木拠点の流通大手！' },
  gunma: { title: 'ヤマダホールディングス（群馬・高崎本社）', icon: '⚡', baseSalary: 180, maxSalary: 420, reqAcademic: 54, reqStamina: 50, minHensachi: 52, minStamina: 48, desc: '高崎駅前から全国47都道府県を制覇した日本最大の家電量販グループ！' },
  saitama: { title: 'しまむら（埼玉・さいたま市本社）', icon: '👕', baseSalary: 170, maxSalary: 380, reqAcademic: 52, reqStamina: 48, minHensachi: 50, minStamina: 46, desc: '驚異の物流網と高コスパで日本中のクローゼットを支えるアパレル大手！' },
  chiba: { title: 'オリエンタルランド（千葉・浦安本社）', icon: '🏰', baseSalary: 195, maxSalary: 450, reqAcademic: 62, reqStamina: 52, minHensachi: 60, minStamina: 50, desc: '日本屈指の巨大テーマパークを運営し夢と魔法を届ける人気No.1級企業！' },
  tokyo: { title: 'ソニーグループ（東京・港区本社）', icon: '🎮', baseSalary: 230, maxSalary: 560, reqAcademic: 72, reqStamina: 46, minHensachi: 66, minStamina: 45, desc: 'ゲーム・音楽・映画・半導体で世界を熱狂させる日本最高峰のメガ企業！' },
  kanagawa: { title: '日産自動車（神奈川・横浜本社）', icon: '🚗', baseSalary: 195, maxSalary: 460, reqAcademic: 62, reqStamina: 52, minHensachi: 58, minStamina: 50, desc: '横浜みなとみらいから世界のモビリティ改革に挑むグローバル自動車メーカー！' },
  niigata: { title: '亀田製菓（新潟・新潟市本社）', icon: '🍘', baseSalary: 160, maxSalary: 360, reqAcademic: 50, reqStamina: 48, minHensachi: 48, minStamina: 46, desc: '柿の種・ハッピーターンでおなじみ！米どころ新潟が誇る米菓トップ企業！' },
  toyama: { title: 'YKK（富山・黒部発 世界シェアNo.1）', icon: '🤐', baseSalary: 185, maxSalary: 430, reqAcademic: 60, reqStamina: 50, minHensachi: 56, minStamina: 48, desc: '黒部から世界中のファスナーと建材を供給する「善の巡環」グローバル企業！' },
  ishikawa: { title: 'コマツ（石川・小松発祥 建機世界大手）', icon: '🚜', baseSalary: 205, maxSalary: 480, reqAcademic: 62, reqStamina: 54, minHensachi: 58, minStamina: 52, desc: '石川県小松市で創業し世界中の鉱山・建設現場で活躍する建機メジャー！' },
  fukui: { title: 'セーレン（福井本社・先端素材メーカー）', icon: '🧵', baseSalary: 165, maxSalary: 380, reqAcademic: 56, reqStamina: 46, minHensachi: 53, minStamina: 44, desc: '老舗繊維業から自動車内装・宇宙・IT分野へ進化を遂げた福井の優良企業！' },
  yamanashi: { title: 'ファナック（山梨・忍野村 産業ロボ世界一）', icon: '🤖', baseSalary: 225, maxSalary: 540, reqAcademic: 70, reqStamina: 46, minHensachi: 64, minStamina: 45, desc: '富士山の麓の森から世界の工場ロボットを動かす超高収益テクノロジー企業！' },
  nagano: { title: 'セイコーエプソン（長野・諏訪本社）', icon: '🖨️', baseSalary: 185, maxSalary: 430, reqAcademic: 62, reqStamina: 46, minHensachi: 58, minStamina: 45, desc: '信州の精密時計技術からプリンタ・プロジェクタ世界大手へ羽ばたいた名門！' },
  gifu: { title: '西濃運輸（岐阜・大垣本社物流大手）', icon: '📦', baseSalary: 165, maxSalary: 370, reqAcademic: 48, reqStamina: 58, minHensachi: 46, minStamina: 56, desc: 'カンガルー便のシンボルで全国の商業物流の大動脈を担う大垣の巨星！' },
  shizuoka: { title: 'ヤマハ（静岡・浜松本社 楽器世界最大手）', icon: '🎹', baseSalary: 190, maxSalary: 440, reqAcademic: 60, reqStamina: 46, minHensachi: 56, minStamina: 45, desc: '音楽の街・浜松から世界中のステージと音文化を支える総合楽器メーカー！' },
  aichi: { title: 'トヨタ自動車（愛知・豊田本社）', icon: '🚘', baseSalary: 235, maxSalary: 580, reqAcademic: 68, reqStamina: 54, minHensachi: 64, minStamina: 52, desc: '日本経済の大黒柱！世界販売台数トップクラスを誇る愛知の超名門企業！' },
  mie: { title: '井村屋グループ（三重・津本社）', icon: '🍧', baseSalary: 155, maxSalary: 350, reqAcademic: 48, reqStamina: 48, minHensachi: 46, minStamina: 46, desc: '「あずきバー」と肉まん・あんまんで世代を超えて愛される三重の食品名門！' },
  shiga: { title: '平和堂（滋賀・彦根本社 小売王者）', icon: '🕊️', baseSalary: 155, maxSalary: 340, reqAcademic: 48, reqStamina: 50, minHensachi: 46, minStamina: 48, desc: '「かけっことびっこ」のテーマでおなじみ！滋賀県の生活インフラを担う名門！' },
  kyoto: { title: '任天堂（京都・京都市本社）', icon: '🕹️', baseSalary: 240, maxSalary: 600, reqAcademic: 72, reqStamina: 46, minHensachi: 66, minStamina: 45, desc: '京都花札の老舗から世界のエンタメの頂点へ！独創力で世界を笑顔にする超人気企業！' },
  osaka: { title: 'パナソニックHD（大阪・門真本社）', icon: '🔋', baseSalary: 205, maxSalary: 490, reqAcademic: 64, reqStamina: 48, minHensachi: 60, minStamina: 46, desc: '家電・車載電池・住宅設備で日本の暮らしを牽引し続ける大阪の巨大メーカー！' },
  hyogo: { title: 'アシックス（兵庫・神戸本社）', icon: '👟', baseSalary: 185, maxSalary: 430, reqAcademic: 58, reqStamina: 58, minHensachi: 55, minStamina: 56, desc: '「健全な身体に健全な精神」を掲げ世界のアスリートを支える神戸のスポーツ企業！' },
  nara: { title: '南都銀行（奈良・奈良市本店）', icon: '🏦', baseSalary: 155, maxSalary: 350, reqAcademic: 55, reqStamina: 40, minHensachi: 52, minStamina: 40, desc: '古都奈良の企業と文化財・地域社会を支える歴史あるトップ地方銀行！' },
  wakayama: { title: '島精機製作所（和歌山・横編機世界一）', icon: '🧶', baseSalary: 170, maxSalary: 400, reqAcademic: 56, reqStamina: 46, minHensachi: 53, minStamina: 45, desc: '無縫製ニット機械で世界圧倒的シェアを誇る和歌山のオンリーワン技術企業！' },
  tottori: { title: '大山乳業農協・白バラ牛乳（鳥取）', icon: '🥛', baseSalary: 150, maxSalary: 330, reqAcademic: 46, reqStamina: 48, minHensachi: 45, minStamina: 46, desc: '濃厚で美味しい「白バラ牛乳」で全国に熱狂的ファンを持つ鳥取の酪農ブランド！' },
  shimane: { title: '山陰合同銀行（島根・松江本店）', icon: '🏦', baseSalary: 160, maxSalary: 360, reqAcademic: 56, reqStamina: 42, minHensachi: 52, minStamina: 40, desc: '松江市に本店を構え山陰エリアの広域ビジネスをリードするリーディングバンク！' },
  okayama: { title: 'ベネッセコーポレーション（岡山本社）', icon: '✏️', baseSalary: 195, maxSalary: 450, reqAcademic: 66, reqStamina: 42, minHensachi: 60, minStamina: 42, desc: '進研ゼミ・こどもちゃれんじで全国の教育と学びを支える岡山発の教育最大手！' },
  hiroshima: { title: 'マツダ（広島・府中町本社）', icon: '🚙', baseSalary: 195, maxSalary: 460, reqAcademic: 60, reqStamina: 54, minHensachi: 56, minStamina: 52, desc: '魂動デザインと独自のエンジン技術で世界にファンを持つ広島の誇り！' },
  yamaguchi: { title: 'ファーストリテイリング・ユニクロ（山口本社）', icon: '🧥', baseSalary: 225, maxSalary: 560, reqAcademic: 68, reqStamina: 54, minHensachi: 63, minStamina: 52, desc: '山口県の一軒の洋品店から世界トップクラスのアパレル帝国を築いたグローバル企業！' },
  tokushima: { title: '大塚製薬（徳島・鳴門創業）', icon: '🥤', baseSalary: 200, maxSalary: 470, reqAcademic: 64, reqStamina: 52, minHensachi: 60, minStamina: 50, desc: 'ポカリスエットやカロリーメイトを生み出し世界の健康を支える徳島発の製薬大手！' },
  kagawa: { title: 'タダノ（香川・高松本社 クレーン大手）', icon: '🏗️', baseSalary: 175, maxSalary: 410, reqAcademic: 56, reqStamina: 52, minHensachi: 53, minStamina: 50, desc: '高松から世界のインフラ建設を支える建設用クレーン世界トップクラスメーカー！' },
  ehime: { title: '今治造船（愛媛・今治本社 日本一の造船）', icon: '🚢', baseSalary: 190, maxSalary: 450, reqAcademic: 56, reqStamina: 58, minHensachi: 53, minStamina: 56, desc: '日本最大の建造量を誇り世界の海上輸送を支える瀬戸内の造船王者！' },
  kochi: { title: '技研製作所（高知本社・世界一圧入機）', icon: '🔩', baseSalary: 175, maxSalary: 410, reqAcademic: 58, reqStamina: 50, minHensachi: 54, minStamina: 48, desc: '無振動杭圧入機「サイレントパイラー」で世界を席巻する高知の独自技術企業！' },
  fukuoka: { title: 'TOTO（福岡・北九州本社）', icon: '🚽', baseSalary: 190, maxSalary: 450, reqAcademic: 60, reqStamina: 48, minHensachi: 56, minStamina: 46, desc: 'ウォシュレットと衛生陶器技術で世界を驚かせる北九州発の住宅設備最大手！' },
  saga: { title: '久光製薬（佐賀・鳥栖本社）', icon: '🩹', baseSalary: 180, maxSalary: 420, reqAcademic: 60, reqStamina: 46, minHensachi: 56, minStamina: 45, desc: '「サロンパス」で世界の肩こりを癒やす佐賀県鳥栖発のグローバル製薬会社！' },
  nagasaki: { title: 'ジャパネットたかた（長崎・佐世保本社）', icon: '📣', baseSalary: 185, maxSalary: 440, reqAcademic: 54, reqStamina: 56, minHensachi: 52, minStamina: 54, desc: '通販・スポーツクラブ・地域創生で長崎を熱く盛り上げるエンタメ通信販売大手！' },
  kumamoto: { title: '再春館製薬所（熊本・益城町本社）', icon: '🧴', baseSalary: 175, maxSalary: 400, reqAcademic: 56, reqStamina: 46, minHensachi: 53, minStamina: 45, desc: 'ドモホルンリンクルでおなじみ！手厚い社員満足度と熊本の自然を大切にする名門！' },
  oita: { title: 'ジョイフル（大分・大分市本社）', icon: '🍽️', baseSalary: 155, maxSalary: 350, reqAcademic: 48, reqStamina: 50, minHensachi: 46, minStamina: 48, desc: '大分発で九州・全国に展開しみんなの憩いの場を提供するファミリーレストラン大手！' },
  miyazaki: { title: '霧島酒造（宮崎・都城本社 黒霧島）', icon: '🥃', baseSalary: 175, maxSalary: 410, reqAcademic: 52, reqStamina: 50, minHensachi: 50, minStamina: 48, desc: '本格芋焼酎「黒霧島」で売上日本一に君臨する宮崎県都城の国民的酒造メーカー！' },
  kagoshima: { title: 'セイカ食品（鹿児島・白くま＆ボンタンアメ）', icon: '🐻‍❄️', baseSalary: 145, maxSalary: 330, reqAcademic: 45, reqStamina: 46, minHensachi: 44, minStamina: 45, desc: '南国白くまとボンタンアメで全国に愛される鹿児島発の老舗食品メーカー！' },
  okinawa: { title: 'オリオンビール（沖縄・豊見城本社）', icon: '🍺', baseSalary: 170, maxSalary: 390, reqAcademic: 50, reqStamina: 52, minHensachi: 48, minStamina: 50, desc: '「あり、乾杯！」沖縄の太陽と乾杯シーンには欠かせない県民的シンボル企業！' },
};

export const PREFECTURE_FAMOUS_COMPANIES = Object.fromEntries(
  Object.entries(RAW_PREFECTURE_COMPANIES).map(([prefId, data]) => [
    prefId,
    {
      id: `pref_${prefId}`,
      title: data.title,
      baseSalary: data.baseSalary,
      maxSalary: data.maxSalary,
      icon: data.icon,
      type: 'local_company',
      prefId,
      isLocalCompany: true,
      minHensachi: data.minHensachi,
      minStamina: data.minStamina,
      reqAcademic: data.reqAcademic,
      reqStamina: data.reqStamina,
      tierDesc: `【出身県限定・ご当地有名企業】${data.desc}`,
    },
  ])
);

export const getPrefectureCompanyOcc = (prefOrId) => {
  const prefId = typeof prefOrId === 'string' ? prefOrId : prefOrId?.id;
  return prefId ? PREFECTURE_FAMOUS_COMPANIES[prefId] || null : null;
};

export const getAvailableOccupationsForPlayer = (player) => {
  const localComp = getPrefectureCompanyOcc(player?.prefecture);
  return localComp ? [localComp, ...OCCUPATIONS] : OCCUPATIONS;
};

export const findOccupationById = (jobId) => {
  if (!jobId) return null;
  if (jobId.startsWith('pref_')) {
    const prefId = jobId.slice(5);
    if (PREFECTURE_FAMOUS_COMPANIES[prefId]) return PREFECTURE_FAMOUS_COMPANIES[prefId];
  }
  return OCCUPATIONS.find((o) => o.id === jobId) || null;
};

// 就職ルーレット（基準10枠テーブル：フォールバック＆互換用）
export const JOB_ROULETTE_TABLE = {
  1: 'salaryman',
  2: 'civil_servant',
  3: 'driver',
  4: 'chef',
  5: 'artisan',
  6: 'streamer',
  7: 'it_engineer',
  8: 'consultant',
  9: 'doctor',
  10: 'athlete',
};

// プレイヤーが特定の職業に就く条件を満たしているか判定
export const isQualifiedForJob = (player, occ, isHardMode = false) => {
  if (!occ || occ.id === 'unemployed') return false;
  if (!player) return true;
  if (isHardMode) {
    const devOk = !occ.minHensachi || (player.hensachi ?? 50) >= occ.minHensachi;
    const stamOk = !occ.minStamina || (player.stamina ?? 50) >= occ.minStamina;
    return devOk && stamOk;
  }
  const acadOk = !occ.reqAcademic || (player.academic ?? 50) >= occ.reqAcademic;
  const stamOk = !occ.reqStamina || (player.stamina ?? 50) >= occ.reqStamina;
  return acadOk && stamOk;
};

// プレイヤーの能力＋出身県に応じて10枠のパーソナライズされた就職ルーレットを構築
// 出身県の有名企業も候補に加え（※地方出身者が上京/大都会コースを選択した場合は除く）、なれる職業だけで10枠を埋める
export const buildJobRouletteInfo = (player, isHardMode = false) => {
  const rawLocalCompany = getPrefectureCompanyOcc(player?.prefecture);
  const isMovingToTokyo = !!(player?.prefecture && player.prefecture.id !== 'tokyo' && player?.branchRoute === 'tokyo');
  const localCompany = isMovingToTokyo ? null : rawLocalCompany;
  const baseRegularJobs = OCCUPATIONS.filter((o) => o.id !== 'unemployed' && o.id !== 'freeter');
  const regularJobs = localCompany ? [localCompany, ...baseRegularJobs] : baseRegularJobs;
  const freeterOcc = OCCUPATIONS.find((o) => o.id === 'freeter') || OCCUPATIONS[OCCUPATIONS.length - 2];

  const qualified = regularJobs.filter((o) => isQualifiedForJob(player, o, isHardMode));
  const unqualified = regularJobs.filter((o) => !isQualifiedForJob(player, o, isHardMode));

  // 出身県有名企業（資格ありなら最優先で1枠目に配置！）＋ 進路('tokyo' / 'local')・給料帯のバランスで並べ替え
  const routePref = player?.branchRoute;
  const scoreOcc = (occ) => {
    if (occ.isLocalCompany) return 9999; // 出身県の有名企業を最優先表示
    let score = occ.baseSalary;
    if (routePref === 'tokyo' && (occ.type === 'tokyo' || occ.type === 'expert')) score += 25;
    if (routePref === 'local' && (occ.type === 'local' || occ.type === 'entertainment')) score += 25;
    return score;
  };
  const prioritized = [...qualified].sort((a, b) => scoreOcc(b) - scoreOcc(a));

  const slots = [];
  if (prioritized.length === 0) {
    // 通常職に1つもなれない場合はフリーターで10枠を埋める
    for (let i = 0; i < 10; i++) {
      slots.push({ slot: i + 1, occ: freeterOcc, isFill: i > 0 });
    }
  } else {
    // 10種類以上なれる場合は上位6職（出身企業含む）＋多様な残り4職で10種を選出、10種未満なら循環させて穴埋め
    let chosenPool;
    if (prioritized.length >= 10) {
      const topPart = prioritized.slice(0, 6);
      const restPart = prioritized.slice(6);
      const spreadIdx = restPart.length >= 4
        ? [0, Math.floor(restPart.length / 3), Math.floor((restPart.length * 2) / 3), restPart.length - 1]
        : restPart.map((_, idx) => idx);
      const pickedRest = [...new Set(spreadIdx)].map((idx) => restPart[idx]).filter(Boolean);
      chosenPool = [...topPart, ...pickedRest];
      for (const occ of prioritized) {
        if (chosenPool.length >= 10) break;
        if (!chosenPool.some((x) => x.id === occ.id)) chosenPool.push(occ);
      }
    } else {
      chosenPool = [...prioritized];
    }

    for (let i = 0; i < 10; i++) {
      const isFill = i >= chosenPool.length;
      const occ = chosenPool[i % chosenPool.length];
      slots.push({ slot: i + 1, occ, isFill });
    }
  }

  return {
    slots,
    localCompany,
    rawLocalCompany,
    excludedByTokyoBranch: isMovingToTokyo && !!rawLocalCompany,
    localCompanyQualified: !!(localCompany && isQualifiedForJob(player, localCompany, isHardMode)),
    qualifiedCount: qualified.length,
    unqualifiedJobs: unqualified,
    totalRegularJobs: regularJobs.length,
    filledCount: slots.filter((s) => s.isFill).length,
  };
};

export const HOUSES = [
  { id: 'apartment', name: '都会のデザイナーズマンション', price: 2000, sellValue: 2400, icon: '🏢' },
  { id: 'suburb_house', name: '郊外の庭付き一軒家', price: 1500, sellValue: 1800, icon: '🏡' },
  { id: 'kominka', name: '地元のリノベ古民家屋敷', price: 900, sellValue: 1300, icon: '🏯' },
];

// プレイヤーの住宅購入価格（各種割引適用後）と最終評価額を計算
export const getHousePricingForPlayer = (house, player) => {
  if (!house) return { basePrice: 0, effectivePrice: 0, baseSell: 0, effectiveSell: 0, netGain: 0, discountLabels: [], sellBoostLabel: '' };
  let effectivePrice = house.price;
  const discountLabels = [];
  if (player?.prefecture?.passiveType === 'real_estate_discount') {
    effectivePrice = Math.round(effectivePrice * 0.7);
    discountLabels.push('出身地30%OFF');
  }
  if (player?.prefecture?.passiveType === 'negotiate_discount') {
    effectivePrice = Math.round(effectivePrice * 0.8);
    discountLabels.push('値切り20%OFF');
  }
  if (player?.occupation?.isLocalCompany) {
    effectivePrice = Math.round(effectivePrice * 0.9);
    discountLabels.push('ご当地企業社員10%OFF');
  }

  let effectiveSell = house.sellValue;
  let sellBoostLabel = '';
  if (player?.prefecture?.passiveType === 'kobe_estate_boost') {
    effectiveSell = Math.round(effectiveSell * 1.5);
    sellBoostLabel = '売却価値1.5倍';
  }
  return {
    basePrice: house.price,
    effectivePrice,
    baseSell: house.sellValue,
    effectiveSell,
    netGain: effectiveSell - effectivePrice,
    discountLabels,
    sellBoostLabel,
  };
};

// プレイヤーの保有資産（現金・不動産・名産品・家族・ご当地企業賞・借金）の見積もり内訳を計算
export const calculateCurrentAssets = (p) => {
  if (!p) {
    return { cash: 0, houseValue: 0, souvenirValue: 0, familyValue: 0, localCompanyBonus: 0, debtPenalty: 0, estimatedTotalAsset: 0 };
  }
  const cash = p.money || 0;
  let houseValue = 0;
  if (p.house) {
    houseValue = p.house.sellValue || 0;
    if (p.prefecture?.passiveType === 'kobe_estate_boost') {
      houseValue = Math.round(houseValue * 1.5);
    }
  }
  let souvenirValue = 0;
  (p.souvenirs || []).forEach((s) => {
    let sVal = s.value || 100;
    if (p.prefecture?.passiveType === 'souvenir_value_boost') {
      sVal = Math.round(sVal * 2.0);
    }
    souvenirValue += sVal;
  });
  const spouseVal = p.car?.spouse ? 500 : 0;
  const kidRate = p.prefecture?.passiveType === 'family_bonus_boost' ? 500 : 300;
  const familyValue = spouseVal + (p.car?.kids || 0) * kidRate;
  const localCompanyBonus = p.occupation?.isLocalCompany ? 300 : 0;
  const debtPenalty = (p.debt || 0) * 100;
  const estimatedTotalAsset = cash + houseValue + souvenirValue + familyValue + localCompanyBonus - debtPenalty;
  return { cash, houseValue, souvenirValue, familyValue, localCompanyBonus, debtPenalty, estimatedTotalAsset };
};

const calculatePlayerRetirementFund = (p) => {
  if (!p || p.occupation?.id === 'unemployed') return 0;
  if (p.occupation?.id === 'freeter') return 200;
  const mult = p.occupation?.isLocalCompany ? 10 : 8;
  return Math.round((p.salary || 100) * mult);
};

const OCCUPATION_RANK_TITLES = {
  doctor: ['研修医', '担当医', '医長', '診療部長', '名誉院長'],
  lawyer: ['アソシエイト', '担当弁護士', 'シニア弁護士', 'パートナー', '法律事務所代表'],
  pilot: ['訓練生', '副操縦士', '機長', '路線統括機長', '航空団総指揮官'],
  consultant: ['アナリスト', 'コンサルタント', 'マネージャー', 'プリンシパル', 'パートナー'],
  athlete: ['ルーキー', 'レギュラー選手', 'チームエース', '代表キャプテン', 'レジェンド選手'],
  researcher: ['研究員', '助教', '准教授', '主任教授', '名誉教授'],
  architect: ['設計アシスタント', '二級建築士', '一級建築士', 'チーフ建築家', '巨匠建築家'],
  it_engineer: ['ジュニア開発者', '開発リーダー', 'テックリード', 'CTO', 'IT帝国創業者'],
  pharmacist: ['調剤担当', '主任薬剤師', '薬局長', '統括薬剤師', '最高医療顧問'],
  firefighter: ['消防士', '消防副士長', '救助隊長', '消防署長', '消防総監'],
  salaryman: ['一般社員', '主任', '課長', '部長', '取締役・役員'],
  chef: ['見習いコック', '部門シェフ', '副料理長', '総料理長', '三つ星グランシェフ'],
  civil_servant: ['事務官・一般職', '主査・係長', '課長補佐', '部長', '副知事・幹部'],
  driver: ['新人ドライバー', 'ベテラン運転手', '運行管理者', '営業所長', '全国物流本部長'],
  farmer: ['新規就農者', '熟練農家', '農業法人代表', '地域アグリ王', '日本農業の巨匠'],
  artisan: ['弟子・見習い', '一人前職人', '親方', '現代の名工', '人間国宝級'],
  streamer: ['新人配信者', '登録者10万人', '人気クリエイター', 'ミリオン配信者', 'トップスター'],
  idol: ['研究生', '選抜メンバー', 'センター', '全国ツアー主役', '国民的アイドル'],
  freeter: ['バイト見習い', '熟練フリーター', 'バイトリーダー', 'カリスマ店員', '伝説の自由人'],
};

const DEFAULT_RANK_TITLES = ['新人', '中堅', 'リーダー', 'エキスパート', 'レジェンド'];

export const getOccupationRankTitle = (occ, rank = 0) => {
  if (!occ || occ.id === 'unemployed') return '';
  const clampedRank = Math.max(0, Math.min(4, Math.floor(rank || 0)));
  if (occ.isLocalCompany) {
    return OCCUPATION_RANK_TITLES.salaryman[clampedRank];
  }
  const titles = OCCUPATION_RANK_TITLES[occ.id] || DEFAULT_RANK_TITLES;
  return titles[clampedRank] || DEFAULT_RANK_TITLES[clampedRank];
};

export const getSalaryForRank = (occ, rank = 0, salaryBonus = 0) => {
  if (!occ || occ.id === 'unemployed' || (occ.baseSalary || 0) <= 0) return 0;
  const clampedRank = Math.max(0, Math.min(4, Math.floor(rank || 0)));
  const base = occ.baseSalary || 0;
  const max = Math.max(base, occ.maxSalary || base);
  const rankedSalary = Math.round(base + ((max - base) * clampedRank) / 4);
  return Math.max(40, rankedSalary + (salaryBonus || 0));
};

const promotePlayer = (G, p, playerID, levels = 1) => {
  if (!p || !p.occupation || p.occupation.id === 'unemployed') return null;
  const oldRank = Math.max(0, Math.min(4, Math.floor(p.jobRank || 0)));
  const occ = p.occupation;
  const oldRankTitle = getOccupationRankTitle(occ, oldRank);
  const oldSalary = p.salary || getSalaryForRank(occ, oldRank, p.salaryBonus || 0);

  if (oldRank >= 4) {
    const bonus = 50;
    p.money += bonus;
    G.logs.unshift(`👑 【最高位功労賞！】Player ${playerID} はすでに最高役職「${oldRankTitle}」のため特別功労賞与 +${bonus}万円 を獲得！`);
    return {
      alreadyMax: true,
      occTitle: occ.title,
      icon: occ.icon,
      oldRank,
      newRank: oldRank,
      oldRankTitle,
      newRankTitle: oldRankTitle,
      oldSalary,
      newSalary: oldSalary,
      salaryDelta: 0,
      maxBonus: bonus,
    };
  }

  const newRank = Math.min(4, oldRank + Math.max(1, levels));
  if ((p.salaryBonus || 0) < 0) {
    p.salaryBonus = 0;
  }
  const newRankTitle = getOccupationRankTitle(occ, newRank);
  const newSalary = getSalaryForRank(occ, newRank, p.salaryBonus || 0);
  p.jobRank = newRank;
  p.salary = newSalary;

  G.logs.unshift(
    `🎊 【昇進！】Player ${playerID}（${occ.icon} ${occ.title}）が「${oldRankTitle}」➔「${newRankTitle}」（ランク${newRank + 1}/5）へ昇進！（給料: ${oldSalary}万 ➔ ${newSalary}万円）`
  );

  return {
    alreadyMax: false,
    occTitle: occ.title,
    icon: occ.icon,
    oldRank,
    newRank,
    oldRankTitle,
    newRankTitle,
    oldSalary,
    newSalary,
    salaryDelta: newSalary - oldSalary,
    maxBonus: 0,
  };
};

// 親の年収・家庭環境テーブル（ハードモード親ガチャ：開始所持金差は150万〜850万の逆転可能バランスに調整）
export const PARENT_INCOME_TIERS = [
  { roll: 1, title: '困窮家庭（苦学生活）', income: 180, baseHensachi: 38, icon: '🏚️', startMoney: 150, desc: '生活に余裕がなく節約スタート。図書館や独学で地道に這い上がる。' },
  { roll: 2, title: 'ギリギリ庶民家庭', income: 300, baseHensachi: 44, icon: '🛖', startMoney: 220, desc: '塾には通えず、参考書は図書館で借りて独学。' },
  { roll: 3, title: '一般的な地方家庭', income: 420, baseHensachi: 49, icon: '🏠', startMoney: 280, desc: '公立小中高へ進学。部活中心ののびのび生活。' },
  { roll: 4, title: '平均的サラリーマン家庭', income: 540, baseHensachi: 53, icon: '🏡', startMoney: 350, desc: '高校受験の前に近所の個人塾へ通わせてもらう。' },
  { roll: 5, title: '安定の中流家庭', income: 680, baseHensachi: 57, icon: '🏘️', startMoney: 420, desc: '大手進学塾と通信教育。中堅大学への進学コース。' },
  { roll: 6, title: 'アッパーミドル家庭', income: 880, baseHensachi: 61, icon: '🏙️', startMoney: 500, desc: '私立中高一貫校または難関公立高。夏期講習完備。' },
  { roll: 7, title: 'エリート企業戦士家庭', income: 1150, baseHensachi: 65, icon: '🏢', startMoney: 580, desc: '英語教育と短期留学。難関早慶・旧帝大狙い。' },
  { roll: 8, title: '開業医・大企業役員家庭', income: 1700, baseHensachi: 69, icon: '💎', startMoney: 660, desc: '名門私立・医学部専門予備校へ手厚い教育課金！' },
  { roll: 9, title: '大企業オーナー一族', income: 3000, baseHensachi: 73, icon: '🏰', startMoney: 750, desc: '専属家庭教師軍団。旧帝大・医学部・海外名門大。' },
  { roll: 10, title: '雲の上の大富豪・名門財閥', income: 5500, baseHensachi: 77, icon: '👑', startMoney: 850, desc: '圧倒的財力とコネクション！有利な環境からスタート。' },
];

// 手番交代の共通処理（ニンテンドースイッチ風 時代進行連動）
export const advanceToNextTurn = (G, ctx, events) => {
  G.currentSpaceModal = null;
  G.rouletteValue = null;
  G.isSpinning = false;
  G.turnStep = 'spin';

  if (G.gameState === 'playing') {
    recordMoneySnapshots(G);
  }

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
        retiringPlayer.hasCheckedEra4Career = true;
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

      // 全員に熟年期突入前の定期「キャリア見直し・転職チャンス」を保証！
      const careerReviewPlayer = Object.values(G.players).find((p) => !p.hasCheckedEra4Career);
      if (careerReviewPlayer) {
        G.currentSpaceModal = {
          spaceId: careerReviewPlayer.position,
          type: 'job_change',
          isForced: false,
          isEra4CareerReview: true,
          beforeMoney: careerReviewPlayer.money,
          afterMoney: careerReviewPlayer.money,
          deltaMoney: 0,
          title: '💼【40代のキャリア見直し・転職チャンス！】',
          desc: `壮年期を終え、熟年期へ進む節目の転職チャンスです！これまで育てた学力(${careerReviewPlayer.academic || 50})・体力(${careerReviewPlayer.stamina || 50})を活かして、憧れの職や地元有名企業へ転職するか、現職を継続するか選べます！`,
          details: '資格を満たしている職業へ転職可能！（そのまま現在の職業を続けることもできます）',
        };
        G.currentTurnPlayer = careerReviewPlayer.id;
        if (events && events.endTurn) {
          events.endTurn({ next: careerReviewPlayer.id });
        }
        G.logs.unshift(`💼 【節目の転職チャンス！】Player ${careerReviewPlayer.id} に40代のキャリア見直し（転職 or 継続）チャンスが訪れました！`);
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
          const retMoney = calculatePlayerRetirementFund(p);
          p.money += retMoney;
          const localNote = p.occupation?.isLocalCompany ? '（🏠 ご当地企業功労1.25倍！）' : '';
          addLifeEvent(p, 4, {
            icon: '🎖️',
            title: '定年退職',
            detail: `【${p.occupation?.title || '無職'}】を勤め上げ退職金 +${retMoney}万円 受領${localNote}`,
          });
          G.logs.unshift(`🎖️ 【定年退職式典】Player ${p.id} が定年退職！職業【${p.occupation?.title || '無職'}】の功績に応じた退職金 +${retMoney}万円 支給！${localNote}`);
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

const clampStat = (val, min = 15, max = 100) => Math.max(min, Math.min(max, Math.round(val)));
const clampHensachi = (val, min = 30, max = 85) => Math.max(min, Math.min(max, Math.round(val)));

const applyStatDeltas = (p, { academic = 0, stamina = 0, hensachi = 0 } = {}) => {
  const prevAcad = p.academic ?? 50;
  const prevStam = p.stamina ?? 50;
  const prevHen = p.hensachi ?? 50;

  if (academic !== 0) p.academic = clampStat(prevAcad + academic);
  if (stamina !== 0) p.stamina = clampStat(prevStam + stamina);
  if (hensachi !== 0) p.hensachi = clampHensachi(prevHen + hensachi);

  return {
    acadDelta: (p.academic ?? 50) - prevAcad,
    stamDelta: (p.stamina ?? 50) - prevStam,
    henDelta: (p.hensachi ?? 50) - prevHen,
  };
};

// 結婚・出産ルーレットが発生する一定区間（第3時代・壮年期の #1〜#60）
export const FAMILY_EVENT_ZONE = { era: 3, minSpaceId: 1, maxSpaceId: 60 };

export const isFamilyRouletteZoneSpace = (era, space) => {
  if (era !== FAMILY_EVENT_ZONE.era || !space) return false;
  if (space.id < FAMILY_EVENT_ZONE.minSpaceId || space.id > FAMILY_EVENT_ZONE.maxSpaceId) return false;
  return !['branch_route', 'house', 'buy_house', 'job_change', 'era_goal', 'goal_standby', 'marriage', 'baby', 'child'].includes(space.type);
};

// 他プレイヤー全員から祝い金を徴収する共通ヘルパー
const collectGiftFromOthers = (G, receiverId, perPlayerAmount) => {
  let total = 0;
  const contributors = [];
  Object.keys(G.players).forEach((otherPid) => {
    if (otherPid !== receiverId) {
      G.players[otherPid].money -= perPlayerAmount;
      total += perPlayerAmount;
      contributors.push(`P${otherPid}:-${perPlayerAmount}万`);
    }
  });
  G.players[receiverId].money += total;
  return { total, contributors };
};

// 結婚・出産イベント解決（できちゃった婚20% / 双子1% / プレイヤー徴収）
const resolveFamilyEventOutcome = (G, p, playerID, kind, random, spaceAmount = 120) => {
  const roll100 = () => (random ? random.Die(100) : (Math.floor(Math.random() * 100) + 1));

  let weddingPerPlayer = 50;
  let weddingPerk = null;
  if (p.prefecture?.passiveType === 'wedding_bonus') {
    weddingPerPlayer = 75;
    weddingPerk = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: '参列者全員からのご祝儀が1.5倍（1人あたり75万円）！' };
  } else if (p.prefecture?.passiveType === 'izumo_marriage_bless') {
    weddingPerPlayer = 100;
    weddingPerk = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: '出雲大社の縁結びにより他プレイヤーからの結婚祝い金が2倍（1人あたり100万円）！' };
  }

  let babyPerPlayer = spaceAmount >= 150 ? 50 : 40;
  let babyPerk = null;
  if (p.prefecture?.passiveType === 'child_bonus') {
    babyPerPlayer = Math.round(babyPerPlayer * 1.5);
    babyPerk = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: `郷土の祝福により他プレイヤーからの出産祝い金が1.5倍（1人あたり${babyPerPlayer}万円）に増額！` };
  }

  const runMarriageAndMaybeShotgun = () => {
    p.car.spouse = true;
    const wCollect = collectGiftFromOthers(G, playerID, weddingPerPlayer);
    const isShotgun = roll100() <= 20; // 2割（20%）でできちゃった婚！

    if (isShotgun) {
      const isTwins = roll100() === 1; // 1%で双子！
      const kidsAdded = isTwins ? 2 : 1;
      p.car.kids = (p.car.kids || 0) + kidsAdded;
      const bCollect = collectGiftFromOthers(G, playerID, babyPerPlayer * kidsAdded);
      const total = wCollect.total + bCollect.total;
      const title = isTwins ? '💘👶👶【奇跡！できちゃった婚＆双子誕生！！】' : '💘👶【おめでた！できちゃった婚（結婚＆出産同時発生）！】';
      const twinText = isTwins ? 'さらに確率1%の【双子】が誕生（子ども+2人）！！' : '元気な赤ちゃんも同時に誕生（子ども+1人）！';
      const detailsText = `${twinText}他プレイヤー全員から結婚祝(${weddingPerPlayer}万×他人数=${wCollect.total}万)＋出産祝(${babyPerPlayer * kidsAdded}万×他人数=${bCollect.total}万)で合計 +${total}万円 徴収！（計 ${p.car.kids}人）`;
      const logText = `${isTwins ? '👶👶💍' : '💘👶'} ${title} Player ${playerID} に配偶者＋子ども+${kidsAdded}人追加！全員から祝い金計 +${total}万円 徴収！`;
      return {
        eventType: isTwins ? 'shotgun_twins' : 'shotgun_wedding',
        title,
        isShotgun: true,
        isTwins,
        kidsAdded,
        totalCollected: total,
        detailsText,
        logText,
        perk: babyPerk || weddingPerk,
      };
    }

    const detailsText = wCollect.contributors.length > 0
      ? `他プレイヤー全員から結婚祝い金（1人${weddingPerPlayer}万円）を徴収！合計 +${wCollect.total}万円（${wCollect.contributors.join(', ')}）`
      : '結婚しました！（配偶者ピン追加）';
    const logText = `💍 祝・結婚！Player ${playerID} に配偶者ピン追加！他プレイヤー全員からご祝儀（1人${weddingPerPlayer}万）計 +${wCollect.total}万円 徴収！`;
    return {
      eventType: 'marriage',
      title: '💍【祝・ご結婚！】',
      isShotgun: false,
      isTwins: false,
      kidsAdded: 0,
      totalCollected: wCollect.total,
      detailsText,
      logText,
      perk: weddingPerk,
    };
  };

  const runChildbirth = () => {
    const isTwins = roll100() === 1; // 1%で双子！
    const kidsAdded = isTwins ? 2 : 1;
    p.car.kids = (p.car.kids || 0) + kidsAdded;
    const bCollect = collectGiftFromOthers(G, playerID, babyPerPlayer * kidsAdded);
    const kidLabel = isTwins
      ? `双子（計${p.car.kids}人）`
      : (p.car.kids === 1 ? '第1子' : (p.car.kids === 2 ? '第2子' : `第${p.car.kids}子`));
    const title = isTwins ? '👶👶✨【確率1%の奇跡！双子ちゃん誕生！！】' : `👶【祝・${kidLabel}誕生！】`;
    const detailsText = `${isTwins ? '奇跡の双子が誕生し子どもピン+2人！' : '元気な赤ちゃんが誕生し子どもピン+1人！'}他プレイヤー全員から出産祝い金（1人${babyPerPlayer * kidsAdded}万円）を徴収！合計 +${bCollect.total}万円（給料手当毎月+${p.car.kids * 15}万＆決算資産+${p.car.kids * 300}万）`;
    const logText = `${isTwins ? '👶👶✨' : '👶'} ${title} Player ${playerID}（計${p.car.kids}人）！全員から出産祝い金（1人${babyPerPlayer * kidsAdded}万）計 +${bCollect.total}万円 徴収！`;
    return {
      eventType: isTwins ? 'twins' : 'baby',
      title,
      isShotgun: false,
      isTwins,
      kidsAdded,
      totalCollected: bCollect.total,
      detailsText,
      logText,
      perk: babyPerk,
    };
  };

  if (kind === 'marriage') {
    if (p.car.spouse) {
      return {
        eventType: 'already_married',
        title: '💐【仲良し夫婦の日常】',
        isShotgun: false,
        isTwins: false,
        kidsAdded: 0,
        totalCollected: 0,
        detailsText: 'すでに既婚のため結婚祝い金の徴収はスキップされました',
        logText: `💐 Player ${playerID} はすでに既婚のため結婚イベントを通過しました。`,
        perk: null,
      };
    }
    return runMarriageAndMaybeShotgun();
  }

  // kind === 'baby'
  if (p.car.spouse) {
    return runChildbirth();
  }
  // 未婚で出産に止まった場合も2割（20%）でできちゃった婚！
  if (roll100() <= 20) {
    p.car.spouse = true;
    const wCollect = collectGiftFromOthers(G, playerID, weddingPerPlayer);
    const isTwins = roll100() === 1;
    const kidsAdded = isTwins ? 2 : 1;
    p.car.kids = (p.car.kids || 0) + kidsAdded;
    const bCollect = collectGiftFromOthers(G, playerID, babyPerPlayer * kidsAdded);
    const total = wCollect.total + bCollect.total;
    const title = isTwins ? '💘👶👶【奇跡！できちゃった婚＆双子誕生！！】' : '💘👶【おめでた！できちゃった婚（結婚＆出産同時発生）！】';
    const detailsText = `${isTwins ? '未婚からの電撃できちゃった婚＋奇跡の双子(1%)！' : '未婚からの電撃できちゃった婚！'}結婚祝(${wCollect.total}万)＋出産祝(${bCollect.total}万)で合計 +${total}万円 徴収！（計 ${p.car.kids}人）`;
    const logText = `${isTwins ? '👶👶💘' : '💘👶'} ${title} Player ${playerID} に配偶者＋子ども+${kidsAdded}人追加！全員から祝い金計 +${total}万円 徴収！`;
    return {
      eventType: isTwins ? 'shotgun_twins' : 'shotgun_wedding',
      title,
      isShotgun: true,
      isTwins,
      kidsAdded,
      totalCollected: total,
      detailsText,
      logText,
      perk: babyPerk || weddingPerk,
    };
  }

  return {
    eventType: 'unmarried_skip',
    title: '💭【出産マス通過（未婚）】',
    isShotgun: false,
    isTwins: false,
    kidsAdded: 0,
    totalCollected: 0,
    detailsText: 'まだ未婚のため出産イベントは見送りとなりました（子どもピン・祝い金徴収なし）',
    logText: `💭 Player ${playerID} は未婚のため出産イベントを見送りました。`,
    perk: null,
  };
};

// 所持金履歴スナップショットを全プレイヤーに記録（終了後のグラフ描画用）
const recordMoneySnapshots = (G, customLabel = null) => {
  const eraObj = getEraById(G.era || 1);
  Object.values(G.players).forEach((pl) => {
    if (!Array.isArray(pl.moneyHistory)) pl.moneyHistory = [];
    const step = pl.moneyHistory.length;
    pl.moneyHistory.push({
      step,
      era: G.era || 1,
      label: customLabel || eraObj?.name || `第${G.era || 1}時代`,
      money: pl.money,
    });
  });
};

// 給料日・年金の支給額算出ヘルパー（通過時・停止時で共通利用）
const calculatePaydayDetails = (p) => {
  if (!p?.occupation || p.occupation.id === 'unemployed' || !(p.salary > 0)) {
    return {
      pay: 20,
      detailsText: '無職のため定例給与なし（日雇いバイト代 +20万円 のみ受給）',
      perk: null,
      isUnemployed: true,
    };
  }

  let pay = p.salary;
  const bonusItems = [];
  let perk = null;
  const pAcad = p.academic || 50;
  const pStam = p.stamina || 50;

  if (pAcad >= 90) {
    pay += 50;
    bonusItems.push(`知性エリート手当(学力${pAcad})+50万`);
  } else if (pAcad >= 75) {
    pay += 30;
    bonusItems.push(`専門スキル手当(学力${pAcad})+30万`);
  }
  if (pStam >= 90) {
    pay += 45;
    bonusItems.push(`鉄人皆勤手当(体力${pStam})+45万`);
  } else if (pStam >= 75) {
    pay += 25;
    bonusItems.push(`タフネス手当(体力${pStam})+25万`);
  }

  if (p.prefecture?.passiveType === 'salary_boost_heavy') {
    pay += 50;
    bonusItems.push('東京メガロポリス+50万');
    perk = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: '首都特別手当 +50万円' };
  }
  if (p.prefecture?.passiveType === 'toyota_saving') {
    pay += 50;
    bonusItems.push('愛知堅実貯蓄+50万');
    perk = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: 'ものづくり王国・堅実貯蓄ボーナス +50万円' };
  }
  if (p.prefecture?.passiveType === 'salary_boost') {
    pay += 20;
    bonusItems.push('岩手南部鉄器+20万');
    perk = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: '粘り強さボーナス +20万円' };
  }
  if (p.car?.spouse) {
    pay += 20;
    bonusItems.push('配偶者手当+20万');
  }
  if (p.car?.kids) {
    const kidRate = p.prefecture?.passiveType === 'kibidango_family' ? 30 : 15;
    const kAllowance = p.car.kids * kidRate;
    pay += kAllowance;
    bonusItems.push(`子供手当(${p.car.kids}人)+${kAllowance}万`);
    if (p.prefecture?.passiveType === 'kibidango_family') {
      perk = { prefName: p.prefecture.name, emoji: p.prefecture.emoji, traitName: p.prefecture.traitName, effect: '桃太郎の吉備団子により子供手当が2倍！' };
    }
  }

  if (p.occupation?.isLocalCompany) {
    const localCompanyPayBonus = Math.max(30, Math.round(p.salary * 0.2));
    pay += localCompanyPayBonus;
    bonusItems.push(`🏠ご当地企業愛社手当(給料+20%)+${localCompanyPayBonus}万`);
    if (!perk && p.prefecture) {
      perk = {
        prefName: p.prefecture.name,
        emoji: p.prefecture.emoji,
        traitName: 'ご当地名門企業・地域定着ボーナス',
        effect: `出身県企業勤務により毎回の給料 +${localCompanyPayBonus}万円（+20%）上乗せ！`,
      };
    }
  }

  return {
    pay,
    detailsText: `基本給: ${p.salary}万 ${bonusItems.length > 0 ? `(${bonusItems.join(', ')})` : ''} ➔ 給料受取 +${pay}万円`,
    perk,
    isUnemployed: false,
  };
};

// 2ターン（2周）に1回の定期給料・年金自動支給ヘルパー
const applyPeriodicPaydayIfDue = (G, p, playerID) => {
  if ((G.era === 3 || G.era === 4) && (p.eraTurns || 0) > 0 && p.eraTurns % 2 === 0) {
    const pd = calculatePaydayDetails(p);
    p.money += pd.pay;
    addLifeEvent(p, G.era, {
      icon: '💵',
      title: `定期給料日（2ターン毎・${p.eraTurns / 2}回目）`,
      detail: pd.detailsText,
    });
    G.logs.unshift(`💵 【隔ターン給料日（2週に1回）】Player ${playerID} に給料 +${pd.pay}万円 が振り込まれました！`);
    return { amount: pd.pay, note: `💵 定期給料日（2週に1回）: +${pd.pay}万円` };
  }
  if (G.era === 5 && (p.eraTurns || 0) > 0 && p.eraTurns % 2 === 0) {
    const pensionAmt = p.prefecture?.passiveType === 'pension_boost' ? 150 : 100;
    p.money += pensionAmt;
    addLifeEvent(p, G.era, {
      icon: '👵',
      title: `定期年金支給日（2ターン毎）`,
      detail: `公的年金 +${pensionAmt}万円 受給`,
    });
    G.logs.unshift(`👵 【隔ターン年金日】Player ${playerID} に年金 +${pensionAmt}万円 が支給されました！`);
    return { amount: pensionAmt, note: `👵 定期年金支給（2週に1回）: +${pensionAmt}万円` };
  }
  return { amount: 0, note: '' };
};

// プレイヤーの人生史イベントを記録
const addLifeEvent = (p, era, { icon = '📌', title = '', detail = '' } = {}) => {
  if (!p) return;
  if (!Array.isArray(p.lifeHistory)) p.lifeHistory = [];
  const eraObj = getEraById(era || 1);
  p.lifeHistory.push({
    era: era || 1,
    eraName: eraObj?.name || `第${era || 1}時代`,
    eraColor: eraObj?.color || '#38bdf8',
    icon,
    title,
    detail,
    moneyAfter: p.money,
    academic: p.academic ?? 50,
    stamina: p.stamina ?? 50,
    hensachi: p.hensachi ?? 50,
  });
};

// 出身都道府県ごとの初期パラメータ補正（通常モード・ハードモード共通の地域個性）
const getPrefectureStatModifiers = (pref) => {
  if (!pref) return { academic: 0, stamina: 0, hensachi: 0 };
  switch (pref.passiveType) {
    case 'salary_boost_heavy': // 東京など都市・学術圏
    case 'artisan_bonus':      // 岐阜・匠系
    case 'toyota_saving':      // 愛知など産業技術
      return { academic: 7, stamina: -2, hensachi: 3 };
    case 'insurance_free':     // 雪国・自然タフネス系
    case 'onsen_heal_bonus':   // 大分など温泉・健康
    case 'nankurunaisa_shield':// 沖縄など南国・おおらか
    case 'udon_cost_saver':
      return { academic: -2, stamina: 7, hensachi: -1 };
    case 'kobe_estate_boost':
    case 'souvenir_value_boost':
    case 'buddha_peace':
      return { academic: 5, stamina: 0, hensachi: 2 };
    case 'real_estate_discount': // 北海道など広大・体育会
    case 'rice_double':          // 新潟など農業・体力
    case 'salary_boost':
      return { academic: 0, stamina: 6, hensachi: 0 };
    default:
      if (pref.region === 'kanto' || pref.region === 'kinki') {
        return { academic: 5, stamina: -1, hensachi: 2 };
      }
      if (pref.region === 'hokkaido' || pref.region === 'tohoku' || pref.region === 'shikoku' || pref.region === 'kyushu_okinawa') {
        return { academic: -1, stamina: 5, hensachi: 0 };
      }
      return { academic: 3, stamina: 3, hensachi: 1 };
  }
};

// 都道府県確定処理の共通ヘルパー
export const applyPrefectureChoice = (G, random, playerID, prefId, ctx = null, events = null) => {
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

  const prefMod = getPrefectureStatModifiers(pref);

  // ハードモード時：親ガチャルーレット＆偏差値・体力決定（＋出身地微調整）
  if (G.isHardMode) {
    const pRoll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
    const parentTier = PARENT_INCOME_TIERS[pRoll - 1];
    const luckDelta = random ? (random.Die(9) - 4) : (Math.floor(Math.random() * 9) - 4);
    const finalHensachi = clampHensachi(parentTier.baseHensachi + luckDelta + Math.round(prefMod.hensachi / 2));

    // 体力も生まれ持った運動素質・バイタリティとして決定！（32〜85）
    const stamRoll = random ? (random.Die(11) - 6) : (Math.floor(Math.random() * 11) - 6);
    const finalStamina = clampStat(50 + stamRoll * 3 + Math.round(prefMod.stamina / 2));
    p.stamina = finalStamina;
    p.academic = clampStat(Math.round(finalHensachi * 1.05 - 8) + Math.round(prefMod.academic / 2));

    p.parentIncome = parentTier;
    p.hensachi = finalHensachi;
    p.money = parentTier.startMoney !== undefined ? parentTier.startMoney : 100;
    if (parentTier.startDebt) {
      p.debt = parentTier.startDebt;
    }

    G.logs.unshift(`💀【出生地＆親ガチャ結果】Player ${playerID} は運命により【${pref.name}】に誕生！実家年収: ${parentTier.income}万円（${parentTier.title}）➔ 初期資金【${p.money}万円】${p.debt > 0 ? `（借金${p.debt * 100}万）` : ''} ＆ 🎓偏差値【${finalHensachi}】 ＆ 🏃体力【${finalStamina}】！`);
  } else {
    // 通常モードでも出身県ごとの気質で初期学力・体力・偏差値に個性をつける
    p.academic = clampStat(50 + prefMod.academic);
    p.stamina = clampStat(50 + prefMod.stamina);
    p.hensachi = clampHensachi(50 + prefMod.hensachi);
    G.logs.unshift(`📊 【県民性パラメータ】Player ${playerID}（${pref.name}）➔ 学力:${p.academic} / 体力:${p.stamina} / 偏差値:${p.hensachi}`);
  }

  // 全員が出身地を選び終えたらゲーム開始（スタートプレイヤーをランダム決定）
  const allSelected = Object.values(G.players).every((pl) => pl.prefecture !== null);
  if (allSelected) {
    Object.values(G.players).forEach((pl) => {
      pl.moneyHistory = [];
      pl.lifeHistory = [];
      addLifeEvent(pl, 1, {
        icon: pl.prefecture?.emoji || '👶',
        title: `【${pl.prefecture?.name}】に誕生！`,
        detail: G.isHardMode && pl.parentIncome
          ? `実家: ${pl.parentIncome.title}(年収${pl.parentIncome.income}万) / 学力:${pl.academic} / 体力:${pl.stamina} / 偏差値:${pl.hensachi}`
          : `県民性「${pl.prefecture?.traitName}」/ 学力:${pl.academic} / 体力:${pl.stamina} / 初期資金:${pl.money}万`,
      });
    });
    recordMoneySnapshots(G, '誕生');

    const numPlayers = (ctx && ctx.numPlayers) ? ctx.numPlayers : Object.keys(G.players).length;
    const firstPid = (random ? random.Die(numPlayers) - 1 : Math.floor(Math.random() * numPlayers)).toString();
    G.gameState = 'playing';
    G.turnStep = 'spin';
    G.currentTurnPlayer = firstPid;
    if (events && events.endTurn) {
      events.endTurn({ next: firstPid });
    }
    G.logs.unshift(`🎉 全員の出身地が決定！ランダム抽選により Player ${firstPid} から第1時代スタート！`);
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
        jobRank: 0,
        salaryBonus: 0,
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
        moneyHistory: [],
        lifeHistory: [],
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
    choosePrefecture: ({ G, ctx, random, events }, playerID, prefId) => {
      if (G.gameState !== 'select_prefecture') return;
      if (G.isHardMode) return;
      applyPrefectureChoice(G, random, playerID, prefId, ctx, events);
    },

    // 1-B. 出身都道府県のランダム決定（通常モードのおまかせ / ハードモードの強制出生地ガチャ）
    choosePrefectureRandom: ({ G, ctx, random, events }, playerID) => {
      if (G.gameState !== 'select_prefecture') return;
      if (G.isHardMode && G.players[playerID]?.prefecture !== null) return;

      const randIdx = random ? (random.Die(PREFECTURES.length) - 1) : Math.floor(Math.random() * PREFECTURES.length);
      const chosenPref = PREFECTURES[randIdx];
      applyPrefectureChoice(G, random, playerID, chosenPref.id, ctx, events);
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
        const turnStartMoney = p.money;
        p.eraTurns = (p.eraTurns || 0) + 1;
        p.totalTurns = (p.totalTurns || 0) + 1;
        const standbyBonus = 30;
        p.money += standbyBonus;
        const periodicPay = applyPeriodicPaydayIfDue(G, p, playerID);
        G.turnStep = 'resolve_space';
        const remainingTurns = Math.max(0, G.eraMaxTurns - p.eraTurns);
        G.logs.unshift(`🌟 Player ${playerID} は既に【${currentEra.name}・ゴール】に到達しています！優雅なバカンス待機ボーナス +${standbyBonus}万円 獲得！（残り${remainingTurns}ターン）`);
        G.currentSpaceModal = {
          spaceId: lastSpaceId,
          title: `🌟 【${currentEra.name}・ゴール待機中】`,
          desc: `すでに時代のゴールに到達しています！他のプレイヤーの進行を待つ間、優雅に過ごして特別待機ボーナス +${standbyBonus}万円 を獲得しました！`,
          type: 'goal_standby',
          beforeMoney: turnStartMoney,
          afterMoney: p.money,
          deltaMoney: p.money - turnStartMoney,
          details: periodicPay.amount > 0
            ? `${periodicPay.note} ｜ ゴール待機ボーナス: +${standbyBonus}万円`
            : `ゴール待機ボーナス: +${standbyBonus}万円 を受領しました！`,
          hometownPerk: null,
          travelData: null,
        };
        return;
      }

      // 分岐点ストップ判定：まだコース未選択の状態で分岐点に到達・通過する場合は必ず分岐点でストップ
      const prevPos = p.position;
      let targetPos;
      if (branchInfo && prevPos < branchInfo.branchSpaceId && prevPos + totalSteps >= branchInfo.branchSpaceId && !p.eraRoute) {
        targetPos = branchInfo.branchSpaceId;
      } else {
        targetPos = calculateNextPosition(prevPos, totalSteps, p.eraRoute, branchInfo, eraSpaces.length);
      }

      const turnStartMoney = p.money;
      p.position = targetPos;
      p.eraTurns = (p.eraTurns || 0) + 1;
      p.totalTurns = (p.totalTurns || 0) + 1;
      const periodicPay = applyPeriodicPaydayIfDue(G, p, playerID);
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

      // 2ターンに1回の定期給料・年金があればモーダルの収支・詳細にも合算表示
      if (periodicPay.amount > 0 && G.currentSpaceModal) {
        G.currentSpaceModal.beforeMoney = turnStartMoney;
        G.currentSpaceModal.afterMoney = p.money;
        G.currentSpaceModal.deltaMoney = p.money - turnStartMoney;
        G.currentSpaceModal.details = G.currentSpaceModal.details
          ? `${periodicPay.note} ｜ 到着マス: ${G.currentSpaceModal.details}`
          : periodicPay.note;
      }
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

      let statBonus = { academic: 0, stamina: 0, hensachi: 0 };
      let moneyBonus = 0;

      if (G.era === 1) {
        if (routeKey === 'A') {
          statBonus = { academic: 10, stamina: 2, hensachi: 4 };
        } else {
          statBonus = { academic: -4, stamina: 10, hensachi: -1 };
          moneyBonus = 30;
        }
      } else if (G.era === 2) {
        if (routeKey === 'A') {
          statBonus = { academic: 12, stamina: -3, hensachi: 5 };
        } else {
          statBonus = { academic: -4, stamina: 10, hensachi: -2 };
          moneyBonus = 40;
        }
      } else if (G.era === 3) {
        statBonus = routeKey === 'A'
          ? { academic: 2, stamina: 6, hensachi: 0 }
          : { academic: 6, stamina: -3, hensachi: 3 };
      } else if (G.era === 4) {
        statBonus = routeKey === 'A'
          ? { academic: 6, stamina: -3, hensachi: 2 }
          : { academic: 5, stamina: 4, hensachi: 2 };
      } else {
        statBonus = routeKey === 'A'
          ? { academic: 2, stamina: 6, hensachi: 0 }
          : { academic: 6, stamina: 4, hensachi: 2 };
      }

      const d = applyStatDeltas(p, statBonus);
      if (moneyBonus !== 0) p.money += moneyBonus;

      const changeParts = [];
      if (d.acadDelta) changeParts.push(`学力${d.acadDelta >= 0 ? '+' : ''}${d.acadDelta}`);
      if (d.stamDelta) changeParts.push(`体力${d.stamDelta >= 0 ? '+' : ''}${d.stamDelta}`);
      if (d.henDelta) changeParts.push(`偏差値${d.henDelta >= 0 ? '+' : ''}${d.henDelta}`);
      if (moneyBonus) changeParts.push(`資金+${moneyBonus}万`);

      G.logs.unshift(`🛤️ Player ${playerID} は【${chosenRoute.name}】を選択！${changeParts.length > 0 ? `（${changeParts.join(' / ')}）` : ''}`);
      addLifeEvent(p, G.era, {
        icon: chosenRoute.icon || '🛤️',
        title: `コース選択: ${chosenRoute.name}`,
        detail: changeParts.length > 0 ? changeParts.join(' / ') : chosenRoute.desc,
      });
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
        p.jobRank = 0;
        p.salaryBonus = 0;
        p.salary = 0;
        G.logs.unshift(`🏚️ Player ${playerID} は就職を断念し、【無職・求職中】として人生を続行します！（給料: 0万円）`);
        advanceToNextTurn(G, ctx, events);
        return;
      }

      const occ = findOccupationById(jobId) || OCCUPATIONS[OCCUPATIONS.length - 1];

      if (G.isHardMode) {
        if (tryGamble) {
          const roll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
          if (roll >= 8) {
            p.occupation = occ;
            p.jobRank = 0;
            p.salaryBonus = 0;
            p.salary = getSalaryForRank(occ, 0, 0);
            G.logs.unshift(`🔥【大逆転採用！】出目【${roll}】で面接官に熱意が刺さり奇跡の合格！【${occ.title}（${getOccupationRankTitle(occ, 0)}）】に就任！（給料: ${p.salary}万円）`);
            advanceToNextTurn(G, ctx, events);
          } else {
            p.money -= 30;
            const unempOcc = OCCUPATIONS.find((o) => o.id === 'unemployed') || { id: 'unemployed', title: '無職・求職中', baseSalary: 0, maxSalary: 0, icon: '🏚️' };
            p.occupation = unempOcc;
            p.jobRank = 0;
            p.salaryBonus = 0;
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
            p.jobRank = 0;
            p.salaryBonus = 0;
            p.salary = getSalaryForRank(occ, 0, 0);
            G.logs.unshift(`🎓【正規採用！】偏差値【${p.hensachi || 50}】＆ 体力【${p.stamina || 50}】の実力で見事【${occ.title}（${getOccupationRankTitle(occ, 0)}）】に合格！（初任給: ${p.salary}万円）`);
            advanceToNextTurn(G, ctx, events);
          } else {
            p.money -= 30;
            const unempOcc = OCCUPATIONS.find((o) => o.id === 'unemployed') || { id: 'unemployed', title: '無職・求職中', baseSalary: 0, maxSalary: 0, icon: '🏚️' };
            p.occupation = unempOcc;
            p.jobRank = 0;
            p.salaryBonus = 0;
            p.salary = 0;
            const reasons = [];
            if (!devPass) reasons.push(`要偏差値【${devReq}】に対し偏差値【${p.hensachi || 50}】`);
            if (!stamPass) reasons.push(`要体力【${stamReq}】に対し体力【${p.stamina || 50}】`);
            G.logs.unshift(`⚠️ ${reasons.join(' ＆ ')}が不足のため採用見送り！就活費用 -30万円。【無職】として人生を続行します。`);
            advanceToNextTurn(G, ctx, events);
          }
        }
      } else {
        // 通常モード：就職は可能だが、学力・体力の水準で優遇採用・通常採用・見習いスタートに分かれる
        const reqAcad = occ.reqAcademic || 0;
        const reqStam = occ.reqStamina || 0;
        const pAcad = p.academic || 50;
        const pStam = p.stamina || 50;
        const margin = (pAcad - reqAcad) + (pStam - reqStam);

        p.occupation = occ;
        p.jobRank = 0;
        if (pAcad >= reqAcad && pStam >= reqStam && margin >= 20) {
          p.salaryBonus = 30;
          p.salary = getSalaryForRank(occ, 0, 30);
          p.money += 50;
          G.logs.unshift(`🌟【特待優遇採用！】Player ${playerID} は圧倒的な学力(${pAcad})・体力(${pStam})が評価され【${occ.title}（${getOccupationRankTitle(occ, 0)}）】に優遇就任！（給料:${p.salary}万円＋支度金+50万円）`);
        } else if (pAcad >= reqAcad && pStam >= reqStam) {
          p.salaryBonus = 0;
          p.salary = getSalaryForRank(occ, 0, 0);
          p.money += 20;
          G.logs.unshift(`🎓 Player ${playerID} が【${occ.title}（${getOccupationRankTitle(occ, 0)}）】に正社員採用！（給料:${p.salary}万円＋支度金+20万円）`);
        } else {
          const apprenticeSal = Math.max(40, Math.round(occ.baseSalary * 0.85));
          p.salaryBonus = apprenticeSal - occ.baseSalary;
          p.salary = apprenticeSal;
          G.logs.unshift(`📝 Player ${playerID} が【${occ.title}（${getOccupationRankTitle(occ, 0)}）】に見習い採用！（必要能力未達のため初任給:${p.salary}万円）`);
        }
        advanceToNextTurn(G, ctx, events);
      }
    },

    // 3-B. 就職ルーレット（1〜10のパーソナライズされた職業枠で決定）
    spinJobRoulette: ({ G, ctx, random }, playerID) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];
      if (!p) return;

      const rouletteInfo = G.currentSpaceModal?.rouletteInfo || buildJobRouletteInfo(p, G.isHardMode);
      const roll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
      const rolledSlot = rouletteInfo.slots[roll - 1] || rouletteInfo.slots[0];
      const candidateOcc = rolledSlot?.occ || OCCUPATIONS.find((o) => o.id === 'freeter') || OCCUPATIONS[0];
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
        isFillSlot: !!rolledSlot?.isFill,
      };

      if (G.isHardMode) {
        const devReq = candidateOcc.minHensachi || 0;
        const stamReq = candidateOcc.minStamina || 0;
        const devPass = devReq === 0 || pDev >= devReq;
        const stamPass = stamReq === 0 || pStam >= stamReq;

        if (devPass && stamPass) {
          p.occupation = candidateOcc;
          p.jobRank = 0;
          p.salaryBonus = 0;
          p.salary = getSalaryForRank(candidateOcc, 0, 0);
          const localHireBonus = candidateOcc.isLocalCompany ? 80 : 0;
          if (localHireBonus > 0) p.money += localHireBonus;
          resultData.passed = true;
          resultData.finalOcc = candidateOcc;
          resultData.localHireBonus = localHireBonus;
          G.logs.unshift(`🎓【就職ルーレット】出目【${roll}】！偏差値【${pDev}】(要:${devReq}) ＆ 体力【${pStam}】(要:${stamReq})で見事【${candidateOcc.title}（${getOccupationRankTitle(candidateOcc, 0)}）】に正規採用！（初任給: ${p.salary}万円${localHireBonus > 0 ? ` ＋ 🏠ご当地企業凱旋祝い金 +${localHireBonus}万円！` : ''}）`);
        } else {
          // 万一フォールバック時でも整合を保つ安全弁
          p.money -= 30;
          const unempOcc = OCCUPATIONS.find((o) => o.id === 'unemployed') || { id: 'unemployed', title: '無職・求職中', baseSalary: 0, maxSalary: 0, icon: '🏚️' };
          p.occupation = unempOcc;
          p.jobRank = 0;
          p.salaryBonus = 0;
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
        // 通常モード：なれる職業で埋めたルーレットから決定し、余裕度に応じて優遇採用！
        const reqAcad = candidateOcc.reqAcademic || 0;
        const reqStam = candidateOcc.reqStamina || 0;
        const pAcad = p.academic || 50;
        const pStam = p.stamina || 50;
        const margin = (pAcad - reqAcad) + (pStam - reqStam);

        p.occupation = candidateOcc;
        p.jobRank = 0;
        let evalLabel = '正規採用（支度金+20万）';
        if (margin >= 20) {
          p.salaryBonus = 30;
          p.salary = getSalaryForRank(candidateOcc, 0, 30);
          p.money += 50;
          evalLabel = '🌟特待優遇採用（給料+30万＆支度金+50万）';
        } else {
          p.salaryBonus = 0;
          p.salary = getSalaryForRank(candidateOcc, 0, 0);
          p.money += 20;
        }
        const localHireBonus = candidateOcc.isLocalCompany ? 80 : 0;
        if (localHireBonus > 0) {
          p.money += localHireBonus;
          evalLabel += ` ＋ 🏠地元凱旋祝金+${localHireBonus}万`;
        }
        resultData.passed = true;
        resultData.finalOcc = { ...candidateOcc, baseSalary: p.salary };
        resultData.localHireBonus = localHireBonus;
        resultData.evalLabel = evalLabel;
        G.logs.unshift(`🎉【就職ルーレット】出目【${roll}】！Player ${playerID} は【${candidateOcc.title}】に決定！【${evalLabel}】`);
      }

      addLifeEvent(p, 2, {
        icon: resultData.finalOcc?.icon || '💼',
        title: resultData.passed ? `就職決定: ${resultData.finalOcc.title}` : `就活結果: ${resultData.finalOcc.title}`,
        detail: `初任給 ${p.salary}万円 ${resultData.evalLabel ? `(${resultData.evalLabel})` : ''}`,
      });

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

    // 3-C. 転職チャンス（職業を選択して 2分の1（50%）で成功・失敗のルーレット抽選！）
    changeJob: ({ G, ctx, events, random }, playerID, jobId) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      const p = G.players[playerID];
      if (!p) return;

      const modal = G.currentSpaceModal;
      const isForced = !!modal?.isForced;
      const currentOcc = p.occupation;

      // 現状維持（転職しない・現在の職業を継続）
      if (!jobId || jobId === 'keep' || jobId === currentOcc?.id) {
        if (isForced) {
          G.logs.unshift(`⚠️ 年齢・引退規定により現在の職業【${currentOcc?.title}】を維持することはできません！別のセカンドキャリアを選択してください。`);
          return;
        }
        if (modal?.isEra4CareerReview) p.hasCheckedEra4Career = true;
        G.logs.unshift(`💼 Player ${playerID} は転職を見送り、現在の職業【${currentOcc?.icon || ''} ${currentOcc?.title || '無職'}】（給料:${p.salary}万円）を誇りを持って継続します！`);
        advanceToNextTurn(G, ctx, events);
        return;
      }

      const targetOcc = findOccupationById(jobId);
      if (!targetOcc) {
        if (modal?.isEra4CareerReview) p.hasCheckedEra4Career = true;
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

      if (pAcad < reqAcad || pStam < reqStam) {
        G.logs.unshift(`⚠️ 学力または体力の要件を満たしていないため、挑戦できません。（必要学力:${reqAcad}/現在:${pAcad}, 必要体力:${reqStam}/現在:${pStam}）`);
        return;
      }

      // 2分の1（50%）の転職ルーレット（1〜10のうち 6〜10 で合格！）
      const roll = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
      const isSuccess = roll >= 6;
      const oldOcc = currentOcc;
      const oldTitle = oldOcc ? `${oldOcc.icon} ${oldOcc.title}` : '無職';
      const oldRankTitle = getOccupationRankTitle(oldOcc, p.jobRank || 0);
      const oldSalary = p.salary || 0;

      if (modal?.isEra4CareerReview) p.hasCheckedEra4Career = true;

      if (isSuccess) {
        const carriedRank = (oldOcc && oldOcc.id !== 'unemployed' && targetOcc.id !== 'unemployed')
          ? Math.floor((p.jobRank || 0) / 2)
          : 0;
        p.occupation = targetOcc;
        p.jobRank = carriedRank;
        p.salaryBonus = 0;
        p.salary = getSalaryForRank(targetOcc, carriedRank, 0);
        const localHireBonus = targetOcc.isLocalCompany ? 80 : 0;
        if (localHireBonus > 0) p.money += localHireBonus;
        const newRankTitle = getOccupationRankTitle(targetOcc, carriedRank);
        const rankSuffix = newRankTitle ? `（役職:${newRankTitle}）` : '';

        addLifeEvent(p, G.era, {
          icon: targetOcc.icon || '💼',
          title: `転職成功(1/2): ${targetOcc.title}${rankSuffix}`,
          detail: `転職ルーレット【${roll}】で内定！${oldTitle} ➔ ${targetOcc.title}（新給料: ${p.salary}万円${localHireBonus > 0 ? ` / 🏠地元凱旋祝金+${localHireBonus}万` : ''}）`,
        });
        G.logs.unshift(`🎉 ✨【転職ルーレット大成功！（出目:${roll}）】Player ${playerID} は【${oldTitle}】から【${targetOcc.icon} ${targetOcc.title}${rankSuffix}】へ見事転職！（給料: ${p.salary}万円${localHireBonus > 0 ? ` ＋ 🏠ご当地企業凱旋祝い金 +${localHireBonus}万円！` : ''}）`);

        G.currentSpaceModal = {
          spaceId: modal?.spaceId ?? p.position,
          type: 'job_change_result',
          title: '🎉 【内定獲得！】転職ルーレット大成功！',
          desc: `運命の転職ルーレット（成功率50%）で出目【${roll}】を引き当て、【${targetOcc.icon} ${targetOcc.title}】への転職に成功しました！`,
          changeResultData: {
            roll,
            passed: true,
            targetOcc,
            oldOcc,
            oldRankTitle,
            newRankTitle,
            carriedRank,
            oldSalary,
            newSalary: p.salary,
            localHireBonus,
            isForced,
            fallbackOcc: null,
          },
        };
      } else {
        let fallbackOcc = null;
        let newRankTitle = oldRankTitle;
        if (isForced) {
          fallbackOcc = OCCUPATIONS.find((o) => o.id === 'freeter') || OCCUPATIONS[OCCUPATIONS.length - 1];
          p.occupation = fallbackOcc;
          p.jobRank = 0;
          p.salaryBonus = 0;
          p.salary = getSalaryForRank(fallbackOcc, 0, 0);
          newRankTitle = getOccupationRankTitle(fallbackOcc, 0);
          addLifeEvent(p, G.era, {
            icon: fallbackOcc.icon || '🎸',
            title: `転職選考不採用(1/2): ${targetOcc.title}`,
            detail: `転職ルーレット【${roll}】で不採用…引退に伴い【${fallbackOcc.title}】へ転身（給料: ${p.salary}万円）`,
          });
          G.logs.unshift(`💧 【転職ルーレット不採用…（出目:${roll}）】Player ${playerID} は【${targetOcc.icon} ${targetOcc.title}】への転職に失敗…現役引退のため【${fallbackOcc.icon} ${fallbackOcc.title}】（給料:${p.salary}万円）へ転身しました。`);
        } else {
          addLifeEvent(p, G.era, {
            icon: '💧',
            title: `転職見送り(選考不採用): ${targetOcc.title}`,
            detail: `転職ルーレット【${roll}】で不採用…現職(${oldTitle} / 給料:${p.salary}万円)を継続`,
          });
          G.logs.unshift(`💧 【転職ルーレット不採用…（出目:${roll}）】Player ${playerID} の【${targetOcc.icon} ${targetOcc.title}】挑戦は惜しくも不採用！現在の【${oldTitle}】（給料:${p.salary}万円）を継続します。`);
        }

        G.currentSpaceModal = {
          spaceId: modal?.spaceId ?? p.position,
          type: 'job_change_result',
          title: '💧 【惜しくも不採用…】転職ルーレット結果',
          desc: isForced
            ? `運命の転職ルーレット（成功率50%）で出目【${roll}】となり、【${targetOcc.icon} ${targetOcc.title}】への転職は不採用…規定により【${fallbackOcc?.title}】として再出発します！`
            : `運命の転職ルーレット（成功率50%）で出目【${roll}】となり、【${targetOcc.icon} ${targetOcc.title}】への転職は不採用…現在の職業を継続します！`,
          changeResultData: {
            roll,
            passed: false,
            targetOcc,
            oldOcc,
            oldRankTitle,
            newRankTitle,
            carriedRank: p.jobRank || 0,
            oldSalary,
            newSalary: p.salary,
            isForced,
            fallbackOcc,
          },
        };
      }

      G.turnStep = 'end_turn';
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
          const d = applyStatDeltas(p, { academic: 4, hensachi: 2 });
          const statMsg = `学力+${d.acadDelta}・偏差値+${d.henDelta}・以降マスのお金増減が1.2倍！`;
          addLifeEvent(p, 2, {
            icon: isTokyo ? '🗼' : '🏙️',
            title: isTokyo ? '都心エリート・都内自立コースへ' : '上京・大都会コースへ',
            detail: statMsg,
          });
          if (isTokyo) {
            G.logs.unshift(`🗼 Player ${playerID} は生粋の東京人！【都心エリート・都内自立コース】を選択！（${statMsg}、自立生活費 -20万円）`);
          } else {
            G.logs.unshift(`🏙️ Player ${playerID} は【大都会コース】を選択！夢と希望を胸に上京！（${statMsg}、引越し費 -20万円）`);
          }
        } else {
          p.money += 30;
          addLifeEvent(p, 2, {
            icon: '🌾',
            title: isTokyo ? '地方移住・UIターンコースへ' : '地元就職コースへ',
            detail: '定着祝い金 +30万円 獲得',
          });
          if (isTokyo) {
            G.logs.unshift(`🌾 Player ${playerID} は東京を飛び出し【地方移住・UIターンコース】を選択！（地方移住定着金 +30万円）`);
          } else {
            G.logs.unshift(`🌾 Player ${playerID} は生まれ故郷の【地元就職コース】を選択！地元定着祝い金 +30万円 獲得！`);
          }
        }

        // 直ちに運命の就職ルーレットモーダルを開く（なれる職業だけで10枠を構成・穴埋め）
        const rouletteInfo = buildJobRouletteInfo(p, G.isHardMode);
        G.currentSpaceModal = {
          spaceId: p.position,
          title: G.isHardMode ? '💀【運命の就職ルーレット・偏差値＆体力適性枠】' : '🎡【運命の就職ルーレット】就職先を決定！',
          desc: G.isHardMode
            ? `進路決定！現在の偏差値【${p.hensachi || 50}】＆ 体力【${p.stamina || 50}】で採用資格のある職業（${rouletteInfo.qualifiedCount}種）をもとに10枠のルーレットを作成しました！`
            : `進路決定！現在の学力【${p.academic || 50}】＆ 体力【${p.stamina || 50}】で就ける職業（${rouletteInfo.qualifiedCount}種）だけで10枠のルーレットを作成しました！`,
          type: 'choose_job',
          rouletteInfo,
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
        const pricing = getHousePricingForPlayer(house, p);
        const price = pricing.effectivePrice;

        p.money -= price;
        p.house = { ...house, purchasePrice: price };
        addLifeEvent(p, G.era, {
          icon: house.icon || '🏡',
          title: `マイホーム購入: ${house.name}`,
          detail: `購入額 -${price}万円（最終資産価値 ${pricing.effectiveSell}万円${pricing.discountLabels.length > 0 ? ` / ${pricing.discountLabels.join('・')}` : ''}）`,
        });
        G.logs.unshift(`🏡 Player ${playerID} が【${house.name}】を ${price}万円 で購入しました！（最終資産価値: ${pricing.effectiveSell}万円）`);
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

    // 5-C. 適齢期区間（第3時代 #1〜#60）結婚・出産ルーレット（10分の1で結婚か出産）
    spinFamilyRoulette: ({ G, ctx, random }, playerID) => {
      if (G.gameState !== 'playing') return;
      if (ctx.currentPlayer !== playerID) return;
      if (G.turnStep !== 'family_roulette') return;
      const p = G.players[playerID];
      if (!p) return;

      const roll10 = random ? random.Die(10) : (Math.floor(Math.random() * 10) + 1);
      const hit = roll10 === 10; // 10分の1（10%）で結婚または出産！

      if (!hit) {
        G.logs.unshift(`🎡 【結婚・出産ルーレット】Player ${playerID} の出目は【${roll10}】（1〜9: ハズレ）…今回は平穏な日々でした。`);
        G.currentSpaceModal = {
          spaceId: p.position,
          type: 'family_roulette_result',
          familyRouletteDone: true,
          roll10,
          hit: false,
          title: '🌿【結婚・出産ルーレット結果】',
          desc: `ルーレット出目は【${roll10}】（ハズレ：1〜9）でした。今回はご縁がなく穏やかな日常が続きます！`,
          details: '当選枠は出目【10】（確率1/10）！また次のチャンスに期待しましょう！',
          deltaMoney: 0,
        };
        G.turnStep = 'end_turn';
        return;
      }

      // 1/10 当選時：未婚なら結婚イベント（50%結婚 / 50%出産としても可だが、両方とも2割できちゃった婚・結婚優先でハズレ無し）
      const kindRoll = random ? random.Die(2) : (Math.floor(Math.random() * 2) + 1);
      const chosenKind = p.car.spouse ? 'baby' : (kindRoll === 1 ? 'marriage' : 'baby');
      const beforeMoney = p.money;
      const outcome = resolveFamilyEventOutcome(G, p, playerID, chosenKind, random, 120);

      if (p.branchRoute === 'tokyo' && outcome.totalCollected > 0) {
        const rawDelta = p.money - beforeMoney;
        const scaledDelta = Math.round(rawDelta * 1.2);
        if (scaledDelta !== rawDelta) {
          p.money = beforeMoney + scaledDelta;
          outcome.detailsText += ` ｜ 🏙️【大都会経済効果×1.2倍】+${rawDelta}万 ➔ +${scaledDelta}万`;
        }
      }

      G.logs.unshift(`🎡🎯 【結婚・出産ルーレット出目10大当たり！】${outcome.logText}`);
      addLifeEvent(p, G.era, {
        icon: outcome.isTwins ? '👶👶' : (outcome.isShotgun ? '💘' : (chosenKind === 'marriage' ? '💍' : '👶')),
        title: outcome.title.replace(/【|】/g, ''),
        detail: outcome.detailsText,
      });
      G.currentSpaceModal = {
        spaceId: p.position,
        type: 'family_roulette_result',
        familyRouletteDone: true,
        roll10,
        hit: true,
        chosenKind,
        outcome,
        title: outcome.title,
        desc: `ルーレット出目【10】（10分の1）を引き当て、【${chosenKind === 'marriage' ? '💍 結婚' : '👶 出産'}】イベントに突入！`,
        details: outcome.detailsText,
        beforeMoney,
        afterMoney: p.money,
        deltaMoney: p.money - beforeMoney,
        hometownPerk: outcome.perk,
      };
      G.turnStep = 'end_turn';
    },

    // 6. 手番終了
    endTurn: ({ G, ctx, events }, playerID) => {
      if (G.gameState !== 'playing') return;
      if (playerID && ctx.currentPlayer !== playerID) return;

      // 一定区間内の場合、通常マス確認後に結婚・出産ルーレットフェーズへ遷移
      if (G.currentSpaceModal?.eligibleForFamilyRoulette && !G.currentSpaceModal?.familyRouletteDone) {
        const p = G.players[ctx.currentPlayer];
        G.currentSpaceModal = {
          spaceId: p?.position || 0,
          type: 'family_roulette',
          title: '🎡【適齢期ゾーン・結婚＆出産ルーレット】',
          desc: p?.car?.spouse
            ? 'ライフイベント区間（#1〜#60）に停止しました！10分の1（出目10）で【👶 出産】イベントが発生！（双子確率 1%）'
            : 'ライフイベント区間（#1〜#60）に停止しました！10分の1（出目10）で【💍 結婚・👶 出産】イベントが発生！（できちゃった婚 2割 / 双子 1%）',
        };
        G.turnStep = 'family_roulette';
        return;
      }

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
      case 'stat_down':
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
        const acadGain = space.academicDelta ?? 8;
        const henGain = space.hensachiDelta ?? 3;
        const stamDelta = space.staminaDelta ?? 0;
        const d = applyStatDeltas(p, { academic: acadGain, stamina: stamDelta, hensachi: henGain });

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

        const statParts = [];
        if (d.acadDelta) statParts.push(`学力 ${d.acadDelta >= 0 ? '+' : ''}${d.acadDelta}（現在:${p.academic}）`);
        if (d.henDelta) statParts.push(`偏差値 ${d.henDelta >= 0 ? '+' : ''}${d.henDelta}（現在:${p.hensachi}）`);
        if (d.stamDelta) statParts.push(`体力 ${d.stamDelta >= 0 ? '+' : ''}${d.stamDelta}（現在:${p.stamina}）`);
        const statText = statParts.join(' / ');

        if (G.isHardMode) {
          p.money += (studyAmt - (space.amount || 20));
          detailsText = `知性と教養がUP！${statText}${studyAmt > (space.amount || 20) ? `（名工奨励金 +${studyAmt - (space.amount || 20)}万）` : ''}`;
          G.logs.unshift(`📖 【猛勉強の成果！】${statText}！`);
        } else {
          p.money += studyAmt;
          detailsText = `知性と教養がUP！${statText} ＆ 特別奨励金 +${studyAmt}万円 獲得！`;
          G.logs.unshift(`📖 【学問と教養】${statText} ＆ 猛勉強の成果で特別奨励金 +${studyAmt}万円 獲得！`);
        }
        break;
      }

      case 'sports': {
        const stamGain = space.staminaDelta ?? 8;
        const acadDelta = space.academicDelta ?? 0;
        const henGain = space.hensachiDelta ?? (G.isHardMode ? 1 : 1);
        const d = applyStatDeltas(p, { academic: acadDelta, stamina: stamGain, hensachi: henGain });
        p.money += (space.amount || 20);

        const statParts = [];
        if (d.stamDelta) statParts.push(`体力 ${d.stamDelta >= 0 ? '+' : ''}${d.stamDelta}（現在:${p.stamina}）`);
        if (d.acadDelta) statParts.push(`学力 ${d.acadDelta >= 0 ? '+' : ''}${d.acadDelta}（現在:${p.academic}）`);
        if (d.henDelta) statParts.push(`偏差値 ${d.henDelta >= 0 ? '+' : ''}${d.henDelta}`);
        const statText = statParts.join(' / ');

        detailsText = `${statText} ＆ 大会賞金 +${space.amount || 20}万円 獲得！`;
        G.logs.unshift(`🏃 【スポーツ躍動！】${statText} ＆ 大会賞金 +${space.amount || 20}万円 獲得！`);
        break;
      }

      case 'salary':
      case 'payday': {
        const pd = calculatePaydayDetails(p);
        p.money += pd.pay;
        if (pd.perk) hometownPerkTriggered = pd.perk;
        detailsText = pd.detailsText;
        G.logs.unshift(
          pd.isUnemployed
            ? `💵 【定期給料日】Player ${playerID} は無職のため定例給与なし（日雇いバイト代 20万円 のみ受給）`
            : `💵 【定期給料日】Player ${playerID} が給料 ${pd.pay}万円 を受給しました！`
        );
        break;
      }

      case 'marriage': {
        const outcome = resolveFamilyEventOutcome(G, p, playerID, 'marriage', random, space.amount || 150);
        detailsText = outcome.detailsText;
        if (outcome.perk) hometownPerkTriggered = outcome.perk;
        G.logs.unshift(outcome.logText);
        break;
      }

      case 'child':
      case 'baby': {
        const outcome = resolveFamilyEventOutcome(G, p, playerID, 'baby', random, space.amount || 120);
        detailsText = outcome.detailsText;
        if (outcome.perk) hometownPerkTriggered = outcome.perk;
        G.logs.unshift(outcome.logText);
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

      case 'house':
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
        detailsText = '大都会・都心コース（以降マスのお金増減1.2倍＆学力+4/偏差値+2・上京費 -20万）または 地元・地方コース（定着祝い金 +30万）';
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
          const d = applyStatDeltas(p, { stamina: 4 });
          hometownPerkTriggered = {
            prefName: p.prefecture.name,
            emoji: p.prefecture.emoji,
            traitName: p.prefecture.traitName,
            effect: '愛媛みかんジュースの柑橘パワーで体調万全・健診費用0円！'
          };
          detailsText = `愛媛の柑橘パワーで体調万全！自己負担 0円！${d.stamDelta ? `（体力+${d.stamDelta}）` : ''}`;
          G.logs.unshift(`🏥 【健康診断】愛媛みかんパワーで体調万全！自己負担0円＆体力+${d.stamDelta}でした！`);
        } else if (isCovered) {
          const d = applyStatDeltas(p, { stamina: 3 });
          detailsText = `生命保険（加入済）が適用され、自己負担 0円！${d.stamDelta ? `（体力+${d.stamDelta}）` : ''}`;
          G.logs.unshift(`🏥 【健康診断】生命保険（${p.prefecture?.name || '加入済'}）が適用され自己負担0円＆体力+${d.stamDelta}でした！`);
        } else {
          p.money -= 20;
          const d = applyStatDeltas(p, { stamina: -5 });
          detailsText = `保険未加入のため人間ドック費用 20万円 を支払いました。（不摂生発覚: 体力${d.stamDelta}）`;
          G.logs.unshift(`🏥 【健康診断】人間ドック費用 20万円 を支払い＆体力${d.stamDelta}…。`);
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
          const retirementFund = calculatePlayerRetirementFund(p);
          p.money += retirementFund;
          const localNote = p.occupation?.isLocalCompany ? '（🏠 ご当地企業功労1.25倍！）' : '';
          detailsText = `長年の功績を讃え、退職金 +${retirementFund}万円 支給！${localNote}`;
          G.logs.unshift(`🎖️ 【定年退職】長年のお勤めお疲れ様でした！職業【${p.occupation?.title || '無職'}】の功績に応じた退職金 +${retirementFund}万円 支給！${localNote}`);
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

      case 'promotion': {
        const amt = space.amount || 0;
        if (amt > 0) {
          p.money += amt;
          detailsText = `昇進・表彰祝い金 +${amt}万円 獲得！`;
          G.logs.unshift(`🎖️ 【表彰＆昇進祝い金】Player ${playerID} が +${amt}万円 獲得！`);
        }
        break;
      }

      default:
        break;
    }

    // study / sports 以外のマスでも設定されたパラメータ増減（サボり・遊びすぎ・体調不良・運動効果など）を反映
    if (space.type !== 'study' && space.type !== 'sports') {
      const extraAcad = space.academicDelta || 0;
      const extraStam = space.staminaDelta || 0;
      const extraHen = space.hensachiDelta || 0;
      if (extraAcad !== 0 || extraStam !== 0 || extraHen !== 0) {
        const d = applyStatDeltas(p, { academic: extraAcad, stamina: extraStam, hensachi: extraHen });
        const parts = [];
        if (d.acadDelta) parts.push(`学力${d.acadDelta >= 0 ? '+' : ''}${d.acadDelta}(現在:${p.academic})`);
        if (d.stamDelta) parts.push(`体力${d.stamDelta >= 0 ? '+' : ''}${d.stamDelta}(現在:${p.stamina})`);
        if (d.henDelta) parts.push(`偏差値${d.henDelta >= 0 ? '+' : ''}${d.henDelta}(現在:${p.hensachi})`);
        if (parts.length > 0) {
          const statSummary = parts.join(' / ');
          detailsText = detailsText ? `${detailsText} ｜ 能力変動: ${statSummary}` : `能力変動: ${statSummary}`;
          G.logs.unshift(`📊 【能力変動】Player ${playerID}: ${statSummary}`);
        }
      }
    }

    // 役職昇進判定（promotion マスまたは promoteDelta 付き功績マス）
    let promotionData = null;
    const promoteLevels = space.promoteDelta || (space.type === 'promotion' ? 1 : 0);
    if (promoteLevels > 0) {
      promotionData = promotePlayer(G, p, playerID, promoteLevels);
      if (promotionData) {
        if (promotionData.alreadyMax) {
          const promoNote = `👑 最高役職「${promotionData.newRankTitle}」極み賞与 +${promotionData.maxBonus}万円`;
          detailsText = detailsText ? `${detailsText} ｜ ${promoNote}` : promoNote;
        } else {
          const promoNote = `🎊 昇進！「${promotionData.oldRankTitle}」➔「${promotionData.newRankTitle}」(給料:${promotionData.oldSalary}万➔${promotionData.newSalary}万)`;
          detailsText = detailsText ? `${detailsText} ｜ ${promoNote}` : promoNote;
        }
      } else if (space.type === 'promotion') {
        const promoNote = '💼 現在無職のため昇進はスキップされました';
        detailsText = detailsText ? `${detailsText} ｜ ${promoNote}` : promoNote;
      }
    }

    if (hometownPerkTriggered) {
      G.logs.unshift(`✨ 【出身地恩恵: ${hometownPerkTriggered.emoji || ''} ${hometownPerkTriggered.prefName}「${hometownPerkTriggered.traitName}」発動！】${hometownPerkTriggered.effect}`);
    }

    // 大都会コース（branchRoute === 'tokyo'）選択中はマスのお金増減を1.2倍にスケール
    const rawDelta = p.money - beforeMoney;
    if (p.branchRoute === 'tokyo' && rawDelta !== 0) {
      const scaledDelta = Math.round(rawDelta * 1.2);
      if (scaledDelta !== rawDelta) {
        p.money = beforeMoney + scaledDelta;
        const cityNote = `🏙️【大都会経済効果×1.2倍】${rawDelta >= 0 ? '+' : ''}${rawDelta}万 ➔ ${scaledDelta >= 0 ? '+' : ''}${scaledDelta}万`;
        detailsText = detailsText ? `${detailsText} ｜ ${cityNote}` : cityNote;
        G.logs.unshift(`🏙️ 【大都会効果×1.2倍】Player ${playerID}: ${rawDelta >= 0 ? '+' : ''}${rawDelta}万 ➔ ${scaledDelta >= 0 ? '+' : ''}${scaledDelta}万`);
      }
    }

    const afterMoney = p.money;
    const deltaMoney = afterMoney - beforeMoney;

    if (space.type !== 'branch_route' && space.type !== 'house' && space.type !== 'buy_house' && space.type !== 'job_change') {
      addLifeEvent(p, G.era, {
        icon: space.icon || '📌',
        title: space.title.replace(/【|】/g, ''),
        detail: `${deltaMoney !== 0 ? `収支:${deltaMoney >= 0 ? '+' : ''}${deltaMoney}万 / ` : ''}${detailsText || space.desc}`,
      });
    }

    // モーダル情報（'house' タイプは UI 側の 'buy_house' と揃える）
    G.currentSpaceModal = {
      spaceId: space.id,
      title: space.title,
      desc: space.desc,
      type: space.type === 'house' ? 'buy_house' : space.type,
      beforeMoney,
      afterMoney,
      deltaMoney,
      details: detailsText,
      hometownPerk: hometownPerkTriggered,
      travelData,
      promotionData,
      eligibleForFamilyRoulette: isFamilyRouletteZoneSpace(G.era, space),
    };
  },

  // 最終決算（ファイナルアセットジャッジ）
  calculateFinalSettlement: (G) => {
    const allPlayers = Object.values(G.players);
    const maxAcademic = Math.max(...allPlayers.map((pl) => pl.academic || 50));
    const minAcademic = Math.min(...allPlayers.map((pl) => pl.academic || 50));
    const maxStamina = Math.max(...allPlayers.map((pl) => pl.stamina || 50));
    const minStamina = Math.min(...allPlayers.map((pl) => pl.stamina || 50));

    allPlayers.forEach((p) => {
      const assets = calculateCurrentAssets(p);
      let awardsBonus = 0;

      if (assets.localCompanyBonus > 0) {
        G.logs.unshift(`🏠 🏆【ふるさと貢献・ご当地企業ボーナス！】Player ${p.id} は地元の誇り【${p.occupation.title}】に在籍！特別ボーナス +${assets.localCompanyBonus}万円！`);
      }

      // 全国トラベラー賞ボーナス
      if (p.souvenirs.length >= 5) {
        awardsBonus += 500;
        G.logs.unshift(`🗾 🏆【日本一周グランドトラベラー賞！】Player ${p.id} は全国の名産品を${p.souvenirs.length}品収集！特別ボーナス +500万円！`);
      } else if (p.souvenirs.length >= 3) {
        awardsBonus += 250;
        G.logs.unshift(`🗾 🎖️【全国旅行マスター賞！】Player ${p.id} は全国の名産品を${p.souvenirs.length}品収集！特別ボーナス +250万円！`);
      }

      // 文武両道・学力賞・体力賞ボーナス
      const acad = p.academic || 50;
      const stam = p.stamina || 50;
      if (acad >= 75 && stam >= 75) {
        awardsBonus += 400;
        G.logs.unshift(`🏅 🏆【文武両道マスター賞！】Player ${p.id} は学力【${acad}】＆体力【${stam}】を共に極めた！特別ボーナス +400万円！`);
      } else if (acad >= 80) {
        awardsBonus += 200;
        G.logs.unshift(`📚 🎖️【知性マスター賞！】Player ${p.id} は学力【${acad}】に到達！特別学術ボーナス +200万円！`);
      } else if (stam >= 80) {
        awardsBonus += 200;
        G.logs.unshift(`🏃 🎖️【健康バイタリティ賞！】Player ${p.id} は体力【${stam}】に到達！特別健康ボーナス +200万円！`);
      }

      // 相対ランキング賞（プレイヤー間で差がついたときにトップに特別表彰）
      if (maxAcademic > minAcademic && acad === maxAcademic) {
        awardsBonus += 300;
        G.logs.unshift(`🎓 👑【学力ナンバーワン賞！】Player ${p.id} が全プレイヤー中トップの学力【${acad}】！特別報奨金 +300万円！`);
      }
      if (maxStamina > minStamina && stam === maxStamina) {
        awardsBonus += 300;
        G.logs.unshift(`💪 👑【体力ナンバーワン賞！】Player ${p.id} が全プレイヤー中トップの体力【${stam}】！特別報奨金 +300万円！`);
      }

      p.finalBreakdown = { ...assets, awardsBonus };
      p.finalAsset = assets.estimatedTotalAsset + awardsBonus;
    });

    recordMoneySnapshots(G, 'ゴール');
    const sorted = Object.values(G.players).sort((a, b) => b.finalAsset - a.finalAsset);
    G.winner = sorted[0];
    G.ranking = sorted;
    G.logs.unshift(`👑 【最終優勝者決定！】優勝は総資産 ${sorted[0].finalAsset}万円 の Player ${sorted[0].id}（出身: ${sorted[0].prefecture?.name || '不明'}）です！おめでとうございます！`);
  },
};
