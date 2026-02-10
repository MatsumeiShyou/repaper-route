-- Auto-generated CSV Import Script
-- Generated at: 2026-02-08T08:46:37.682Z

-- 1. Master Items
DO $$
DECLARE
  new_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '段ﾎﾞｰﾙ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('段ﾎﾞｰﾙ', 'kg', 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '臭付段') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('臭付段', 'kg', 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '雑がみ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('雑がみ', 'kg', 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '雑誌') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('雑誌', 'kg', 4);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '雑故紙') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('雑故紙', 'kg', 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = 'ﾍﾟｯﾄ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('ﾍﾟｯﾄ', 'kg', 6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '廃ﾌﾟﾗ軟質') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('廃ﾌﾟﾗ軟質', 'kg', 7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = 'ｽﾄﾚｯﾁ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('ｽﾄﾚｯﾁ', 'kg', 8);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = 'ﾋﾞﾆｰﾙﾊﾞﾗ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('ﾋﾞﾆｰﾙﾊﾞﾗ', 'kg', 9);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = 'ﾐｯｸｽ紙') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('ﾐｯｸｽ紙', 'kg', 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '紙管') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('紙管', 'kg', 11);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '上ｹﾝﾄ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('上ｹﾝﾄ', 'kg', 12);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = 'ｼｭﾚｯﾀﾞ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('ｼｭﾚｯﾀﾞ', 'kg', 13);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '雑袋') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('雑袋', 'kg', 14);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = 'R巻取') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('R巻取', 'kg', 15);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '模造ﾊﾞﾗ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('模造ﾊﾞﾗ', 'kg', 16);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = 'ﾏﾙﾁﾊﾟｯｸ･ﾊﾞﾗ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('ﾏﾙﾁﾊﾟｯｸ･ﾊﾞﾗ', 'kg', 17);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = 'ｱﾙﾐ缶') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('ｱﾙﾐ缶', 'kg', 18);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '機密書類') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('機密書類', 'kg', 19);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = 'PPﾊﾞﾝﾄﾞ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('PPﾊﾞﾝﾄﾞ', 'kg', 20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '新聞') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('新聞', 'kg', 21);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM master_items WHERE name = '雑誌/ｼｭﾚｯﾀﾞ') THEN
    INSERT INTO master_items (name, unit, display_order) VALUES ('雑誌/ｼｭﾚｯﾀﾞ', 'kg', 22);
  END IF;
END $$;

-- 2. Master Payees
INSERT INTO master_payees (payee_id, name) VALUES ('1709000', '(合)ポジティブ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1075000', '㈲ダイコー商事') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1161000', '㈱田丸') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('2000', '㈱アークル海老名営業所') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('455000', 'カナキン㈱') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('384000', '大本紙料㈱') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('621000', '㈱クリーンサービス') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1203000', 'ティーエスエンバイロ㈱') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('437000', '㈱カスタム電子') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1205000', '㈱ＤＳＰ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('2042000', '㈱ロジスティクス・ネットワーク') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1968000', 'ﾕｱｻﾌﾅｼｮｸ㈱厚木物流ｾﾝﾀｰ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('346000', '㈱大久保') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1036000', '㈱セフティ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1130000', 'タキゲン製造㈱厚木支店') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1038000', 'ＪＳＲ－ＮＥＴ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('863000', '敷島製パン㈱') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1535000', '㈱パルシステム電力') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1551000', '㈱ビートレーディング') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('50000', '㈱旭運送') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('523000', '関包スチール㈱') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1784000', '丸駒運輸㈱') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1946000', '㈱山崎歯車製作所') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1533000', '㈱春うららかな書房') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('774000', '㈱サティスファクトリー') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('530000', '㈲鍛代商事') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1556000', '東日本協同パレット㈱') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1352000', '㈱ナカダイ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('903000', 'ｼﾞｬｸｿﾝ･ﾗﾎﾞﾗﾄﾘｰ･ｼﾞｬﾊﾟﾝ㈱') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1420000', 'ニッポンロジ㈱') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('33000', '㈱アオイ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1975000', '㈱裕源') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('1253000', '東京ロジファクトリー㈱') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('794000', 'サンインテルネット厚木第三ｾﾝﾀｰ') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('382000', '㈱大本組') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('753000', '㈲坂田亮作商店') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO master_payees (payee_id, name) VALUES ('2095000', '㈱上神谷運送厚木') ON CONFLICT (payee_id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Master Contractors
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709032', 'ﾁｸﾌﾞP上溝事業所(ﾎﾟｼﾞﾃｨﾌﾞ)', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709031', 'ﾁｸﾌﾞP上依知事業所(ﾎﾟｼﾞﾃｨﾌﾞ)', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1075001', '㈱一全(ダイコー商事)', '1075000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1161004', 'ＥＳＰＯＴ（ﾊﾞｯｸﾔｰﾄﾞ）(田丸)', '1161000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1161003', 'ＥＳＰＯＴ（ﾎﾟｲﾝﾄ）(田丸)', '1161000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('2000', '㈱アークル海老名営業所', '2000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('455001', 'ヴァレオカペック(カナキン)', '455000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('384055', 'ウエルシア相模原田名店(大本)', '384000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('621001', 'ｵｰﾄﾊﾞｯｸｽ伊勢原店(ｸﾘｰﾝｻｰﾋﾞｽ)', '621000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1203001', 'オートバックス座間店(ﾃｨｰｴｽ)', '1203000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('437000', '㈱カスタム電子', '437000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205023', 'カンナミアクアシステム(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('2042000', '㈱ロジスティクス・ネットワーク', '2042000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205027', 'クリナップ南関東テクノ(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1161006', 'ザ・ビッグ厚木旭町店(田丸)', '1161000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1968000', 'ﾕｱｻﾌﾅｼｮｸ㈱厚木物流ｾﾝﾀｰ', '1968000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709022', 'ｼｬｰﾌﾟｼﾞｬｽﾀﾞﾛｼﾞｽﾃｨｸｽ(ﾎﾟｼﾞﾃｨﾌﾞ)', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('346004', 'ﾄﾞﾗｯｸｾｲﾑｽ本町田薬局(大久保)', '346000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1036000', '㈱セフティ', '1036000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1130000', 'タキゲン製造㈱厚木支店', '1130000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('621002', 'ﾀｷﾛﾝｼｰｱｲ㈱(ｸﾘｰﾝｻｰﾋﾞｽ)', '621000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1038002', 'デジタルプロセス(JSE-NET)', '1038000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709041', 'ハートロジスティクス(ﾎﾟｼﾞﾃｨﾌﾞ)', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('863000', '敷島製パン㈱', '863000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1535003', 'パルシステム相模センター', '1535000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1535002', 'パルシステム相模青果センター', '1535000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205065', 'ピアノ運送厚木共配(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1551001', 'ビギ(ビートレーディング)', '1551000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205069', '㈱ブリヂストン横浜工場(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1161007', 'ﾏｯｸｽﾊﾞﾘｭ秦野渋沢店(田丸)', '1161000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205093', 'ﾕﾆﾏｯﾄﾗｲﾌ厚木営業所(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205097', 'ﾕﾆﾏｯﾄﾚﾝﾀﾙ厚木(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205098', 'ユニマットレンタル藤沢(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('50000', '㈱旭運送', '50000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('523000', '関包スチール㈱', '523000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1784000', '丸駒運輸㈱', '1784000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205030', '鴻池運輸㈱(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709068', '三井倉庫ﾛｼﾞｽﾃｨｸｽ㈱(ﾎﾟｼﾞﾃｨﾌﾞ)', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1946000', '㈱山崎歯車製作所', '1946000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1533000', '㈱春うららかな書房', '1533000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205034', '小山㈱(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1203003', '上州屋座間店(ﾃｨｰｴｽ)', '1203000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205057', '西多摩運送㈱(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('774062', '早稲田アカデミー本厚木校(SFI)', '774000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('530000', '㈲鍛代商事', '530000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205052', '東京研文社(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1556000', '東日本協同パレット㈱', '1556000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1352017', '東京冷機湘南(ナカダイ)', '1352000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1352011', '東京冷機神奈川ＳＳ(ナカダイ)', '1352000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1352016', '東京冷機相模(ナカダイ)', '1352000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('903000', 'ｼﾞｬｸｿﾝ･ﾗﾎﾞﾗﾄﾘｰ･ｼﾞｬﾊﾟﾝ㈱', '903000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1420000', 'ニッポンロジ㈱', '1420000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709064', '富士ロジ横浜町田(ﾎﾟｼﾞﾃｨﾌﾞ)', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709043', '富士ロジ厚木金田(ﾎﾟｼﾞﾃｨﾌﾞ)', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709054', '富士ロジ長沼/神奈川(ﾎﾟｼﾞﾃｨﾌﾞ)', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1709053', '富士ロジ東名厚木(ﾎﾟｼﾞﾃｨﾌﾞ)', '1709000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1038015', '富士通ﾈｯﾄﾜｰｸｿﾘｭｰｼｮﾝｽﾞ(JSE-NET)', '1038000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('33001', '冨士電線(アオイ)', '33000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205075', '本間ゴルフ藤沢店(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1205084', '有隣堂(ＤＳＰ)', '1205000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1975000', '㈱裕源', '1975000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('1253000', '東京ロジファクトリー㈱', '1253000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('794000', 'サンインテルネット厚木第三ｾﾝﾀｰ', '794000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('382001', 'ﾂｲﾝｼﾃｨ大神地区枝線(大本組)', '382000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('753000', '㈲坂田亮作商店', '753000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;
INSERT INTO master_contractors (contractor_id, name, payee_id) VALUES ('2095000', '㈱上神谷運送厚木', '2095000') ON CONFLICT (contractor_id) DO UPDATE SET name = EXCLUDED.name, payee_id = EXCLUDED.payee_id;

-- 4. Master Collection Points
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('1', '(株)ﾁｸﾌﾞﾊﾟｯｹｰｼﾞ上溝事業所', '相模原市中央区上溝323', '1709032', '上溝事業所 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('2', '(株)ﾁｸﾌﾞﾊﾟｯｹｰｼﾞ上依知事業所', '厚木市上依知1495-1', '1709031', '上依知事業所 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('3', '(株)一全', '平塚市四之宮4-18-14', '1075001', '(月火水木金土) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('4', 'ESPOT(ﾊﾞｯｸﾔｰﾄﾞ)㏂', '伊勢原市桜台2-28-36', '1161004', '(毎日) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('5', 'ESPOT(ﾎﾟｲﾝﾄｼｽﾃﾑ)㏂', '伊勢原市桜台2-28-36', '1161003', '(毎日) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('6', 'ESPOT(ﾊﾞｯｸﾔｰﾄﾞ)㏘', '伊勢原市桜台2-28-36', '1161004', '(毎日) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('7', 'ESPOT(ﾎﾟｲﾝﾄｼｽﾃﾑ)㏘', '伊勢原市桜台2-28-36', '1161003', '(毎日) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('8', 'LIXIL厚木', '厚木市恩名1-8-1', NULL, '弟3火 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('9', 'ｱｰｸﾙ', '海老名市門沢橋6-13-25', '2000', '(月~土) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('10', 'ｲｼﾀﾞ製作所', '平塚市東豊田480-51', NULL, 'ｽﾎﾟｯﾄ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('11', 'ｳﾞｧﾚｵｶﾍﾟｯｸｼﾞｬﾊﾟﾝ', '厚木市飯山2585', '455001', '(金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('12', 'ｳｪﾙｼｱ相模田名店', '相模原市中央区田名4757', '384055', '（月･水･金） / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('13', 'ｵｰﾄﾊﾞｯｸｽ伊勢原店', '伊勢原市歌川１丁目４番地１０', '621001', '(土) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('14', 'ｵｰﾄﾊﾞｯｸｽ座間店', '座間市西栗原１丁目７−７', '1203001', '（土） / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('15', 'ｶｰﾚﾝﾄｻｰﾋﾞｽ', '厚木市戸田2024?1', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('16', 'ｶｽﾀﾑ電子', '町田市木曽西2-5-20', '437000', '（隔週水） / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('17', 'ｶﾝﾅﾐｱｸｱｼｽﾃﾑ', '鎌倉市手広1-10-25', '1205023', '(月) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('18', 'ﾛｼﾞｽﾃｨｯｸﾈｯﾄﾜｰｸ(ｷｮｸﾚｲ)', '厚木市長沼245', '2042000', '（木） / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('19', 'ｸﾘﾅｯﾌﾟ', '厚木市旭町4-11-5', '1205027', '(火･金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('20', 'ザ・ビッグ厚木旭町店', '厚木市旭町5-35-8', '1161006', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('21', 'ﾕｱｻ･ﾌﾅｼｮｸ㈱', '厚木市酒井1740', '1968000', '(月~土) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('22', 'ｻﾝｲﾝﾃﾙﾈｯﾄ海老名', '海老名市今里3-26-11', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('23', 'ｼｬｰﾌﾟｼﾞｬｽﾀﾞﾛｼﾞｽﾃｨｸｽ', '大和市中央林間7-12-2', '1709022', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('24', 'ｾｲﾑｽ町田木曽店', '町田市木曽町493-2', NULL, '(月･水･金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('25', 'ｾｲﾑｽ本町田薬局', '町田市本町田2943-1', '346004', '(月･水･金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('26', 'ｾﾌﾃｨ', '寒川町倉見2212', '1036000', '(月) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('27', 'ﾀｷｹﾞﾝ製造', '厚木市船子580-1', '1130000', '(月･水･金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('28', 'ﾀｷﾛﾝｼｰｱｲ', '平塚市田村3-2-1', '621002', '(火･木) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('29', 'ﾃﾞｼﾞﾀﾙﾌﾟﾛｾｽ', '厚木市中町2-9-6    ぱく', '1038002', '(第1月曜日) 13:00台指定 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('30', 'ﾃﾞﾝｿｰﾃﾝ', '横浜市都筑区茅ヶ崎中央24-4', NULL, '（不定期） / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('31', 'ﾊｰﾄﾛｼﾞ相模原', '相模原市緑区橋本台3-13', '1709041', '担当者　サイトウ様 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('32', '敷島製ﾊﾟﾝ(ﾊﾟｽｺ)', '寒川町一之宮７丁目９−１', '863000', '(土) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('33', 'ﾊﾏｷｮｳﾚｯｸｽ', '綾瀬市吉岡2668-4', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('34', 'ﾊﾟﾙｼｽﾃﾑ相模ｾﾝﾀｰ', '愛川町中津4036-7', '1535003', '(火) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('35', 'ﾊﾟﾙｼｽﾃﾑ相模青果ｾﾝﾀｰ', '愛川町中津4081', '1535002', '(火) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('36', 'ﾋﾟｱﾉ運送 厚木共配', '厚木市酒井3193', '1205065', '(金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('37', 'ﾋﾞｷﾞ', '厚木市岡田3105', '1551001', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('38', 'ﾌﾞﾘﾁﾞｽﾄﾝ横浜工場', '横浜市戸塚区柏尾町1番地', '1205069', '(火･木) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('39', 'ﾍﾟｱ', '横浜市瀬谷区五貫目町23-10', NULL, '諸口伝票を作り手書きで『ﾍﾟｱ』と記入 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('40', 'ﾏｯｸｽﾊﾞﾘｭ秦野渋沢店', '神奈川県秦野市堀川119-1', '1161007', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('41', 'ﾏﾙｲﾁ', '厚木市酒井3162', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('42', 'ﾕﾆﾏｯﾄﾗｲﾌ厚木営業所', '厚木市岡田3117', '1205093', '(月･水･金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('43', 'ﾕﾆﾏｯﾄﾚﾝﾀﾙ厚木', '厚木市栄2-4-18', '1205097', '(金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('44', 'ﾕﾆﾏｯﾄ藤沢', '藤沢市柄沢221-3', '1205098', '(月) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('45', '旭運送', '平塚市下島1022-4', '50000', '（木） / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('46', '宇都宮螺子(第3木曜)', '神奈川県伊勢原市鈴川30', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('47', 'ﾈｸｽﾄｴﾅｼﾞ⁻ｱﾝﾄﾞﾘｿｰｽ', '相模原市中央区白雨台3532-9', NULL, '㈱浜田 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('48', '関包ｽﾁｰﾙ', '伊勢原市鈴川23', '523000', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('49', '丸駒運輸', '平塚市下島1022-11', '1784000', '（木） / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('50', '熊谷組DPL平塚', '平塚市大神3-1', NULL, '(木) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('51', '広陽', '藤沢市土棚664-2', NULL, '(第2月曜) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('52', '鴻池運輸', '愛川町中津4009-3　GLP厚木6F', '1205030', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('53', '三井倉庫', '相模原市中央区田名赤坂3700-１', '1709068', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('54', '山崎歯車 伊勢原工場', '伊勢原市歌川', '1946000', '(ｽﾎﾟｯﾄ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('55', '山崎歯車　戸田', '厚木市戸田674', '1946000', '(ｽﾎﾟｯﾄ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('56', '春うららかな書房', '伊勢原市小稲葉458', '1533000', '(月) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('57', '小山', '厚木市岡田4-5-10', '1205034', '(月･水･金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('58', '湘南倉庫', '厚木市長沼248', NULL, '(火) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('59', '上州屋座間店', '座間市東原1-12-39', '1203003', '(月) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('60', '西多摩運送', '藤沢市宮原1389', '1205057', '(土) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('61', '早稲田ｱｶﾃﾞﾐｰ本厚木校', '厚木中町3-11-20本厚木ｹｲﾋﾞﾙ3F', '774062', '(火)　14:00台指定 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('62', '大西金属', '横浜市瀬谷区阿久和南3-36-7', NULL, '出荷 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('63', '鍛代商事', '厚木市酒井2045-1?', '530000', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('64', '東京ｽﾁｰﾙｾﾝﾀｰ', '愛川町4020-6', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('65', '東京研文社 国吉倉庫', '横浜市緑区青砥町348-3', '1205052', '東京研文社 配送ｾﾝﾀｰ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('66', '東京冷機(厚木)', '厚木市妻田南1-24-25', NULL, 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('67', '東日本協同ﾊﾟﾚｯﾄ', '厚木市酒井2045-1?ICB 7号', '1556000', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('68', '東冷･湘南営業所', '藤沢市辻堂神台2-12-15', '1352017', '(月) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('69', '東冷･神奈川SS', '藤沢市白旗2-1-8', '1352011', '(月) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('70', '東冷･相模営業所', '相模原市中央区淵野辺本町2-17-27', '1352016', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('71', 'ｼﾞｬｸｿﾝ･ﾗﾎﾞﾗﾄﾘｰ･ｼﾞｬﾊﾟﾝ', '厚木市下古沢794', '903000', 'ｽﾎﾟｯﾄ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('72', 'ﾆｯﾎﾟﾝﾛｼﾞ', '伊勢原市下落合352-10', '1420000', '(土) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('73', '富士ﾛｼﾞ横浜町田', '座間市東原5-1-32', '1709064', '(月･水･金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('74', '富士ﾛｼﾞ金田', '30分前電話046-297-1705', '1709043', '(月･火･水･木･金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('75', '富士ﾛｼﾞ長沼', '厚木市長沼242', '1709054', '(月･水･金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('76', '富士ﾛｼﾞ長沼(事務所)', '厚木市長沼242', '1709054', '(火･金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('77', '富士ﾛｼﾞ東名厚木', '厚木市長谷6-19', '1709053', '(月･木) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('78', '富士通ﾈｯﾄﾜｰｸｿﾘｭｰｼｮﾝ', '横浜市西区高島1-1-2', '1038015', '（水） / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('79', '富士通ﾐﾄﾞﾙｳｪｱ', '横浜市港北区新横浜2-15-16', NULL, '(ｽﾎﾟｯﾄ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('80', '冨士電線', '伊勢原市鈴川10', '33001', '(金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('81', '本間ｺﾞﾙﾌ藤沢店', '藤沢市湘南台7-37-8', '1205075', '(月) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('82', '有隣堂', '厚木市中町2-6', '1205084', '(火･金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('83', '裕源', '相模原市中央区田名塩田1-14-18', '1975000', 'FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('84', 'ﾌﾗｲｽﾀｰ物流株式会社', '厚木市長谷376-1', NULL, '(ｽﾎﾟｯﾄ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('85', '有限会社ジースカイ', '平塚市西真土1-6-74', NULL, '(ｽﾎﾟｯﾄ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('86', 'ﾈｸｽﾄｴﾅｼﾞ⁻ｱﾝﾄﾞﾘｿｰｽ', '厚木市森の里土地区画整理事業地内', NULL, '㈱浜田 / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('87', 'ｾｲﾐﾂ平塚工場', '平塚市四之宮7-3-1', NULL, '(ｽﾎﾟｯﾄ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('88', '東京ﾛｼﾞﾌｧｸﾄﾘｰ', '厚木市上依知1043-1', '1253000', '（水） / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('89', '㈲小林運送店', '平塚市東八幡3-2-12', NULL, '(ｽﾎﾟｯﾄ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('90', 'ｻﾝｲﾝﾃﾙﾈｯﾄJPR', '厚木市酒井1740', '794000', 'ｽﾎﾟｯﾄ / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('91', '神奈川ﾊﾏﾀｲﾔ㈱', '厚木市戸田259-3', NULL, '(ｽﾎﾟｯﾄ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('92', '㈱大本組', '平塚市大神', '382001', '(ｽﾎﾟｯﾄ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('93', '坂田良作商店', '綾瀬市小園841', '753000', '(ｽﾎﾟｯﾄ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('94', 'ｺ‐ﾅﾝ大船ﾓｰﾙ', '鎌倉市大船1188-1', NULL, '(ｽﾎﾟｯﾄ) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;
INSERT INTO master_collection_points (location_id, name, address, contractor_id, note) VALUES ('95', '上神谷運送厚木', '厚木市上依知1086', '2095000', '(金) / FALSE') ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, contractor_id = EXCLUDED.contractor_id, note = EXCLUDED.note;

-- 5. Customer Item Defaults
DO $$
DECLARE
  target_item_id UUID;
BEGIN
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('1', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑がみ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('1', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｽﾄﾚｯﾁ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('1', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('2', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '臭付段' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('2', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('2', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('3', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('4', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑故紙' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('5', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('6', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('6', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑故紙' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('7', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('8', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('9', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('10', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('11', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('12', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('13', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('14', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('15', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('16', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('17', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('18', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('19', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '模造ﾊﾞﾗ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('19', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑故紙' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('20', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ﾍﾟｯﾄ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('20', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('21', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑故紙' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('21', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('22', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑故紙' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('22', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('22', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('23', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('24', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('25', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('26', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('27', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('27', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('28', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('28', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('29', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｱﾙﾐ缶' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('29', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '廃ﾌﾟﾗ軟質' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('30', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('31', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '廃ﾌﾟﾗ軟質' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('31', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑袋' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('32', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('33', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ﾐｯｸｽ紙' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('34', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｽﾄﾚｯﾁ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('34', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ﾐｯｸｽ紙' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('35', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑袋' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('35', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('36', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('37', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('38', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('39', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑故紙' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('40', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('41', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('42', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('43', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｼｭﾚｯﾀﾞ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('43', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('44', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｽﾄﾚｯﾁ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('44', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('45', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('45', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｽﾄﾚｯﾁ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('45', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('46', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('46', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('47', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('48', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('49', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('49', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑がみ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('49', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('50', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('51', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('52', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('53', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('54', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑がみ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('54', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('55', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('56', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('56', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('57', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('57', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('58', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('59', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('60', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('61', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｱﾙﾐ缶' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('62', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('63', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('64', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '上ｹﾝﾄ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('65', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '紙管' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('65', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('66', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('66', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('67', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('68', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('69', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('69', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('70', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('70', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('71', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ﾐｯｸｽ紙' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('71', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('72', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｽﾄﾚｯﾁ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('72', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('73', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑がみ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('73', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('74', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑がみ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('74', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｽﾄﾚｯﾁ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('74', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('75', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑がみ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('75', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑がみ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('75', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('76', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｽﾄﾚｯﾁ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('76', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('77', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('77', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('78', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('79', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('80', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('81', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ﾍﾟｯﾄ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('81', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('82', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑がみ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('82', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('83', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｽﾄﾚｯﾁ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('83', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('84', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ﾋﾞﾆｰﾙﾊﾞﾗ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('84', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('85', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑がみ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('85', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('86', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑がみ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('86', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('87', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('88', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('89', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('90', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('91', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '段ﾎﾞｰﾙ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('92', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｼｭﾚｯﾀﾞｰ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('92', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ﾏﾙﾁP･ﾊﾞﾗ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('93', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑がみ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('93', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '機密書類' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('94', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = 'ｽﾄﾚｯﾁ' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('95', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
  target_item_id := (SELECT id FROM master_items WHERE name = '雑誌' LIMIT 1);
  IF target_item_id IS NOT NULL THEN
    INSERT INTO customer_item_defaults (customer_id, item_id) VALUES ('95', target_item_id) ON CONFLICT DO NOTHING;
  END IF;
END $$;
