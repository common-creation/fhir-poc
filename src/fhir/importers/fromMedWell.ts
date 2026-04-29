/**
 * Med-Well 診療情報提供書データ → ReferralFormData 変換
 *
 * Med-WellはPDFに以下のフィールドを出力する（PDFサンプルより確認済み）:
 *   - 医療機関名（紹介先）
 *   - 担当医師名
 *   - 診療科
 *   - 予約日時
 *   - フリガナ / 患者氏名 / 性別 / 生年月日
 *   - 連絡先 / 住所
 *   - 当院の受診歴 / 患者ID
 *   - 紹介目的
 *   - 既往歴
 *   - 主訴（症状）
 *   - 症状経過
 *   - 確認事項
 *
 * このモジュールはPDFから抽出したテキストデータ（またはCSVの各列）を
 * ReferralFormData に変換するマッパーを提供する。
 */

import type { ReferralFormData, ConditionFormData, ConditionClinicalStatus } from '../types';

// ----------------------------------------------------------------
// Med-Well データ構造の型定義
// PDFの各フィールドに対応するオブジェクト
// ----------------------------------------------------------------

/**
 * Med-Well から取得できる診療情報提供書の生データ
 * PDFに表示されるフィールドをそのままプロパティとして定義
 */
export interface MedWellReferralData {
  // 紹介先情報
  /** 紹介先医療機関名 例: "愛知医科大学病院" */
  toOrganizationName: string;
  /** 紹介先担当医師名 例: "橋本内科" */
  toDoctorName?: string;
  /** 紹介先診療科 例: "呼吸器内科" */
  toDepartment?: string;
  /** 紹介先医療機関コード（HOPDコード） 例: "2310000001" */
  toOrganizationCode?: string;
  /** 紹介先住所 */
  toOrganizationAddress?: string;
  /** 紹介先電話番号 */
  toOrganizationTel?: string;

  // 予約情報
  /** 予約日時 例: "2026年4月30日 11:30" */
  appointmentDatetime?: string;

  // 患者情報
  /** 患者氏名（漢字） 例: "牟田和貴" */
  patientName: string;
  /** 患者氏名（フリガナ） 例: "ムタカズキ" */
  patientNameKana?: string;
  /** 性別 例: "男性" | "女性" */
  patientGender?: string;
  /** 生年月日 例: "1987年02月01日" */
  patientBirthDate?: string;
  /** 連絡先電話番号 例: "08011112222" */
  patientTel?: string;
  /** 住所（郵便番号含む） 例: "〒1560041 東京都世田谷区大原1-32-11" */
  patientAddress?: string;
  /** 当院の受診歴 例: "わからない" | "あり" | "なし" */
  patientVisitHistory?: string;
  /** 患者ID（紹介先での患者番号） */
  patientId?: string;

  // 紹介元情報（Med-Wellシステム運営クリニック）
  /** 紹介元医療機関名 */
  fromOrganizationName?: string;
  /** 紹介元医師名 */
  fromDoctorName?: string;
  /** 紹介元医療機関コード */
  fromOrganizationCode?: string;

  // 臨床情報
  /** 紹介目的 例: "検査・診断" */
  purpose: string;
  /** 既往歴テキスト 例: "なし" | "高血圧症、糖尿病" */
  pastHistory?: string;
  /** 主訴・症状 例: "腹痛" */
  chiefComplaint?: string;
  /** 症状経過（現病歴） */
  historyOfPresentIllness?: string;
  /** 確認事項（備考） */
  notes?: string;
}

// ----------------------------------------------------------------
// 変換ユーティリティ関数
// ----------------------------------------------------------------

/**
 * 日本語の性別表記をFHIRのgenderコードに変換
 * FHIR AdministrativeGender: https://hl7.org/fhir/R4/valueset-administrative-gender.html
 */
function toFhirGender(gender?: string): 'male' | 'female' | 'other' | 'unknown' {
  if (!gender) return 'unknown';
  if (gender.includes('男')) return 'male';
  if (gender.includes('女')) return 'female';
  return 'unknown';
}

/**
 * 日本語の生年月日表記をISO 8601形式（YYYY-MM-DD）に変換
 * 例: "1987年02月01日" → "1987-02-01"
 * 例: "1987年2月1日（39歳）" → "1987-02-01"
 *
 * FHIR date型: https://hl7.org/fhir/R4/datatypes.html#date
 */
function toFhirDate(dateStr?: string): string {
  if (!dateStr) return '';
  // 括弧内の年齢部分を除去
  const cleaned = dateStr.replace(/（.*?）/, '').replace(/\(.*?\)/, '').trim();
  const match = cleaned.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

/**
 * 既往歴テキストをConditionFormDataの配列に変換
 * "なし" の場合は空配列を返す
 * カンマ・読点区切りで複数病名を分割する
 *
 * 参照: JP_Condition https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-condition.html
 */
function parsePastHistory(pastHistory?: string): ConditionFormData[] {
  if (!pastHistory || pastHistory === 'なし' || pastHistory.trim() === '') {
    return [];
  }
  // カンマ・読点・改行で分割
  const names = pastHistory.split(/[、,，\n]/).map(s => s.trim()).filter(Boolean);
  return names.map(name => ({
    id: crypto.randomUUID(),
    name,
    clinicalStatus: 'resolved' as ConditionClinicalStatus, // 既往歴は resolved が一般的
    category: 'past-history' as const,
  }));
}

/**
 * 主訴テキストをConditionFormDataに変換
 *
 * 参照: JP_Condition https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-condition.html
 * 傷病名セクション(code:340)に最低1件必須
 */
function parseChiefComplaint(chiefComplaint?: string): ConditionFormData[] {
  if (!chiefComplaint || chiefComplaint.trim() === '') return [];
  return [{
    id: crypto.randomUUID(),
    name: chiefComplaint.trim(),
    clinicalStatus: 'active' as ConditionClinicalStatus,
    category: 'chief-complaint' as const,
  }];
}

// ----------------------------------------------------------------
// メイン変換関数
// ----------------------------------------------------------------

/**
 * Med-Well の診療情報提供書データを FHIR 用フォームデータ (ReferralFormData) に変換する
 *
 * 変換後のデータはそのまま buildBundle() に渡してFHIR Bundleを生成できる。
 *
 * @param data Med-Wellから取得した診療情報提供書の生データ
 * @returns ReferralFormData FHIRフォームデータ
 *
 * 参照仕様:
 *   JP-CLINS Bundle eReferral: https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html
 *   JP-CLINS Composition eReferral: https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Composition-eReferral.html
 */
export function fromMedWell(data: MedWellReferralData): ReferralFormData {
  // 主訴（chief-complaint）と既往歴（past-history）を結合してconditions配列を構築
  // JP-CLINSでは傷病名セクション(340)に1件以上必須
  const conditions: ConditionFormData[] = [
    ...parseChiefComplaint(data.chiefComplaint),
    ...parsePastHistory(data.pastHistory),
  ];

  return {
    // ----------------------------------------------------------------
    // 患者情報 / Patient
    // JP_Patient: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-patient.html
    // ----------------------------------------------------------------
    patient: {
      nameText: data.patientName.replace(/\s*様\s*$/, '').trim(), // "牟田和貴 様" → "牟田和貴"
      nameKana: data.patientNameKana ?? '',
      birthDate: toFhirDate(data.patientBirthDate),              // "1987年02月01日" → "1987-02-01"
      gender: toFhirGender(data.patientGender),                  // "男性" → "male"
      patientId: data.patientId ?? '',
    },

    // ----------------------------------------------------------------
    // 紹介元情報 / ReferralFrom (Practitioner + Organization)
    // Med-Wellシステムを運営するクリニックが紹介元
    // JP_Practitioner: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-practitioner.html
    // JP_Organization: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-organization.html
    // ----------------------------------------------------------------
    referralFrom: {
      practitioner: {
        nameText: data.fromDoctorName ?? '',
      },
      organization: {
        name: data.fromOrganizationName ?? '',
        hopd: data.fromOrganizationCode ?? '',
      },
    },

    // ----------------------------------------------------------------
    // 紹介先情報 / ReferralTo (Practitioner + Organization)
    // PDFの「医療機関名」「担当医師名」「診療科」が対応
    // Compositionの紹介先情報セクション(code:910)に格納
    // ----------------------------------------------------------------
    referralTo: {
      practitioner: {
        // 担当医師名が未指定の場合は診療科名を使用
        nameText: data.toDoctorName ?? data.toDepartment ?? '',
      },
      organization: {
        name: data.toOrganizationName,
        hopd: data.toOrganizationCode ?? '',
        tel: data.toOrganizationTel,
        address: data.toOrganizationAddress,
      },
    },

    // ----------------------------------------------------------------
    // 紹介目的 / Composition.section[950]
    // JP-CLINSの必須セクション(コード:950)
    // 予約日時・診療科・紹介目的を組み合わせてテキスト生成
    // ----------------------------------------------------------------
    purpose: buildPurposeText(data),

    // ----------------------------------------------------------------
    // 傷病名・既往歴 / Condition
    // JP_Condition: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-condition.html
    // 主訴 → chief-complaint、既往歴 → past-history として分類
    // ----------------------------------------------------------------
    conditions,

    // ----------------------------------------------------------------
    // 現病歴 / Composition.section[360]
    // 症状経過テキストをそのまま格納
    // ----------------------------------------------------------------
    history: data.historyOfPresentIllness ?? '',

    // アレルギー・身体所見・処方はMed-Wellデータに含まれないため空配列
    // 必要に応じてフォームで手動追加する
    allergies: [],
    observations: [],
    medications: [],
  };
}

/**
 * 紹介目的セクションのテキストを組み立てる
 * PDF上の複数フィールドを統合して読みやすい文章に変換する
 *
 * Narrative型(XHTML)に変換される前のプレーンテキスト
 * 参照: Composition.section[950] https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Composition-eReferral.html
 */
function buildPurposeText(data: MedWellReferralData): string {
  const parts: string[] = [];

  if (data.purpose) {
    parts.push(`【紹介目的】${data.purpose}`);
  }
  if (data.toDepartment) {
    parts.push(`【紹介先診療科】${data.toDepartment}`);
  }
  if (data.appointmentDatetime) {
    parts.push(`【予約日時】${data.appointmentDatetime}`);
  }
  if (data.notes) {
    parts.push(`【確認事項】${data.notes}`);
  }

  return parts.join('\n');
}

// ----------------------------------------------------------------
// サンプルデータ（PDFから抽出した実データ）
// ----------------------------------------------------------------

/**
 * PDFサンプル（愛知医大_診療情報提供書）から抽出したデータ
 * フィールドの対応関係を確認するための参照用サンプル
 */
export const MEDWELL_SAMPLE: MedWellReferralData = {
  // 紹介先
  toOrganizationName: '愛知医科大学病院',
  toDoctorName: '橋本内科',
  toDepartment: '呼吸器内科',
  toOrganizationCode: '',

  // 予約
  appointmentDatetime: '2026年4月30日 11:30',

  // 患者情報
  patientName: '牟田和貴',
  patientNameKana: 'ムタカズキ',
  patientGender: '男性',
  patientBirthDate: '1987年02月01日',
  patientTel: '08011112222',
  patientAddress: '〒1560041 東京都世田谷区大原1-32-11',
  patientVisitHistory: 'わからない',
  patientId: '',

  // 紹介元（Med-Wellシステム運営元 - PDFには記載なし、システムから補完する想定）
  fromOrganizationName: '',
  fromDoctorName: '',
  fromOrganizationCode: '',

  // 臨床情報
  purpose: '検査・診断',
  pastHistory: 'なし',
  chiefComplaint: '腹痛',
  historyOfPresentIllness: '腹痛のため薬を処方しましたが要検査の懸念あり',
  notes: 'Med-Well（本システム）から診療情報提供書を作成・印刷する',
};
