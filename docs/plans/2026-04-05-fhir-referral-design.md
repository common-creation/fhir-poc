# 診療情報提供書 FHIR PoC 設計書

**作成日:** 2026-04-05
**目的:** FHIR JP-CLINSの仕様理解を主目的とした、診療情報提供書をFHIR形式で出力するWebツールのPoC実装

---

## 1. 概要

### 参照仕様

- **FHIR JP Core v1.2.0**: https://jpfhir.jp/fhir/core/1.2.0/index.html
- **JP-CLINS (電子カルテ情報共有サービス)**: https://jpfhir.jp/fhir/clins/igv1/index.html
- **HL7 FHIR R4.0.1**: https://hl7.org/fhir/R4/
- **厚生労働省標準規格 HS038**: 診療情報提供書HL7FHIR記述仕様

### 背景

JP-CLINSは厚生労働省が定める「3文書6情報」の一つとして診療情報提供書のFHIR記述仕様を定めている。
本PoCはその仕様に基づき、UIでフォーム入力した内容からFHIR R4形式のBundleリソース（JSONフォーマット）を生成する。

---

## 2. 技術スタック

| 項目 | 選定 | 理由 |
|---|---|---|
| フレームワーク | React + Vite | モダンSPA、高速開発環境 |
| 言語 | TypeScript | 型安全なFHIRリソース定義 |
| スタイリング | Tailwind CSS | 素早いUI構築 |
| JSONハイライト | react-json-view または highlight.js | シンタックスハイライト付きJSON表示 |
| ビルド | Vite | 高速HMR |

---

## 3. アーキテクチャ & ディレクトリ構成

```
fhir-poc/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── FormPanel.tsx        # 左側：入力フォーム
│   │   │   └── SidePanel.tsx        # 右側：FHIR仕様解説
│   │   ├── sections/                # 各セクション（フォーム単位）
│   │   │   ├── PatientSection.tsx   # 患者情報
│   │   │   ├── ReferralFromSection.tsx  # 紹介元情報
│   │   │   ├── ReferralToSection.tsx    # 紹介先情報
│   │   │   ├── PurposeSection.tsx   # 紹介目的
│   │   │   ├── ConditionSection.tsx # 傷病名・主訴・既往歴
│   │   │   ├── HistorySection.tsx   # 現病歴
│   │   │   ├── AllergySection.tsx   # アレルギー
│   │   │   ├── ObservationSection.tsx # 身体所見
│   │   │   └── MedicationSection.tsx  # 処方
│   │   ├── output/
│   │   │   └── FhirJsonViewer.tsx   # JSON表示（シンタックスハイライト）
│   │   └── common/
│   │       └── FieldWithHelp.tsx    # ラベル + FHIR要素名表示の共通コンポーネント
│   ├── fhir/
│   │   ├── builders/                # セクション別FHIR Bundle組み立て関数
│   │   │   ├── buildPatient.ts
│   │   │   ├── buildPractitioner.ts
│   │   │   ├── buildOrganization.ts
│   │   │   ├── buildCondition.ts
│   │   │   ├── buildAllergyIntolerance.ts
│   │   │   ├── buildObservation.ts
│   │   │   ├── buildMedicationRequest.ts
│   │   │   └── buildBundle.ts       # Bundle全体を組み立て
│   │   ├── types.ts                 # フォームデータの型定義
│   │   ├── references.ts            # FHIR仕様参照URL・解説テキスト（サイドパネル用）
│   │   └── sampleData.ts            # サンプルデータ定義
│   ├── App.tsx
│   └── main.tsx
└── docs/
    └── plans/
        └── 2026-04-05-fhir-referral-design.md  # 本設計書
```

### データフロー

```
フォーム入力(React state)
        ↓
  builders/*.ts（各リソース組み立て）
        ↓
  buildBundle.ts（Bundle全体を組み立て）
        ↓
  FhirJsonViewer（JSON表示）

フォームフィールドのフォーカスイベント
        ↓
  references.ts（仕様解説データ取得）
        ↓
  SidePanel（仕様解説表示）
```

---

## 4. UIレイアウト

```
┌─────────────────────────────────────────────────────────────────┐
│  診療情報提供書 FHIR PoC                                          │
│  JP-CLINS eReferral FHIR Builder                                 │
├──────────────────────────┬──────────────────────────────────────┤
│  📋 入力フォーム           │  📖 FHIR仕様解説                      │
│                          │                                      │
│  [患者情報]               │  ┌─ 現在のフィールド ──────────────┐  │
│    患者名 / Patient.name  │  │ リソース: Patient                │  │
│    [____________]        │  │ プロファイル: JP_Patient          │  │
│                          │  │ カーディナリティ: 1..*            │  │
│    生年月日 / birthDate   │  │ 型: HumanName                   │  │
│    [____________]        │  │ Must Support: ✓                 │  │
│                          │  ├──────────────────────────────────┤  │
│  [紹介元情報]             │  │ 説明: HumanName型で表現し、      │  │
│    ...                   │  │ 漢字氏名はtext+family/given、    │  │
│                          │  │ カナはextensionのkana拡張を使用  │  │
│                          │  ├──────────────────────────────────┤  │
│                          │  │ FHIR JSON例                      │  │
│                          │  │ { "use": "official",             │  │
│                          │  │   "text": "山田 太郎", ... }     │  │
│                          │  ├──────────────────────────────────┤  │
│  [🔄 FHIR JSON生成]      │  │ 🔗 JP Core仕様                  │  │
│  [📋 サンプル読み込み]    │  │ 🔗 JP-CLINS仕様                 │  │
│                          │  └──────────────────────────────────┘  │
├──────────────────────────┴──────────────────────────────────────┤
│  📄 生成されたFHIR JSON (Bundle)                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ { "resourceType": "Bundle", "type": "document", ... }    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**インタラクション:**
- フィールドにフォーカス → サイドパネルが対応するFHIR仕様解説に切り替わる
- 「FHIR JSON生成」ボタン → 下部JSONビューアが更新される
- 「サンプル読み込み」ボタン → フォーム全体にサンプルデータが入力される
- セクションはアコーディオン形式で折りたためる

---

## 5. FHIR Bundle構造

JP-CLINS仕様 (`JP_Bundle_eReferral`) に基づく構造:
- **仕様URL**: https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html

```
Bundle (type: document)
├── entry[0]: Composition          # 文書構造の目次
│   ├── section: 紹介元情報 (code: 920)
│   ├── section: 紹介先情報 (code: 910)
│   ├── section: 紹介目的 (code: 950)
│   ├── section: 傷病名・主訴 (code: 340)  → ref: Condition[]
│   ├── section: 現病歴 (code: 360)
│   ├── section: 既往歴 (code: 370)        → ref: Condition[]
│   ├── section: アレルギー (code: 510)    → ref: AllergyIntolerance[]
│   ├── section: 身体所見 (code: その他)   → ref: Observation[]
│   └── section: 処方 (code: その他)       → ref: MedicationRequest[]
├── entry[1]: Patient              # JP_Patient プロファイル
├── entry[2]: Practitioner         # 紹介元医師
├── entry[3]: Organization         # 紹介元医療機関
├── entry[4]: Practitioner         # 紹介先医師（任意）
├── entry[5]: Organization         # 紹介先医療機関
├── entry[6..]: Condition          # 傷病名・既往歴（1件以上必須）
├── entry[n..]: AllergyIntolerance # アレルギー
├── entry[n..]: Observation        # 身体所見
└── entry[n..]: MedicationRequest  # 処方
```

---

## 6. フォームフィールド → FHIRマッピング

| フォーム入力 | FHIRパス | カーディナリティ | JP-CLINS制約 |
|---|---|---|---|
| 患者名（漢字） | `Patient.name[0].text` | 1..1 | 必須 |
| 患者名（カナ） | `Patient.name[1].text` | 0..1 | 推奨 |
| 生年月日 | `Patient.birthDate` | 1..1 | 必須 |
| 性別 | `Patient.gender` | 1..1 | 必須 |
| 患者ID | `Patient.identifier` | 1..* | 必須 |
| 紹介元医師名 | `Practitioner.name.text` | 1..1 | 必須 |
| 紹介元医療機関名 | `Organization.name` | 1..1 | 必須 |
| 紹介元医療機関ID | `Organization.identifier` (HOPDコード) | 1..1 | 必須 |
| 紹介先医師名 | `Practitioner.name.text` | 0..1 | 任意 |
| 紹介先医療機関名 | `Organization.name` | 0..1 | 任意 |
| 紹介目的 | `Composition.section[950].text` | 1..1 | 必須 |
| 傷病名 | `Condition.code.text` | 1..* | 最低1件必須 |
| 傷病名ICD-10コード | `Condition.code.coding[0].code` | 0..1 | 推奨 |
| 傷病の状態 | `Condition.clinicalStatus` | 1..1 | 必須 |
| 現病歴（テキスト） | `Composition.section[360].text` | 0..1 | 任意 |
| アレルギー原因物質 | `AllergyIntolerance.code.text` | 0..* | 任意 |
| アレルギー重症度 | `AllergyIntolerance.reaction.severity` | 0..1 | 任意 |
| 身体所見 | `Observation.code` + `Observation.valueQuantity` | 0..* | 任意 |
| 処方薬名 | `MedicationRequest.medicationCodeableConcept.text` | 0..* | 任意 |

### カーディナリティの意味

| 記法 | 意味 |
|---|---|
| `1..1` | 必須・1件のみ |
| `1..*` | 必須・1件以上 |
| `0..1` | 任意・最大1件 |
| `0..*` | 任意・複数可 |

---

## 7. サンプルデータ

`src/fhir/sampleData.ts` に定義し、「サンプル読み込み」ボタンでフォームに流し込む。

### 患者情報
```
氏名（漢字）: 山田 太郎
氏名（カナ）: ヤマダ タロウ
生年月日: 1958-04-15
性別: 男性
患者ID: 12345678
```

### 傷病名サンプル（Condition）
| # | 傷病名 | ICD-10コード | 状態 | 種別 |
|---|---|---|---|---|
| 1 | 2型糖尿病 | E11 | 現在罹患中 | 主病名 |
| 2 | 高血圧症 | I10 | 現在罹患中 | 主病名 |
| 3 | 脂質異常症 | E78.5 | 現在罹患中 | 既往歴 |
| 4 | 虫垂炎（手術済） | K37 | 寛解 | 既往歴 |

### アレルギーサンプル（AllergyIntolerance）
| # | 原因物質 | 種別 | 重症度 | 症状 |
|---|---|---|---|---|
| 1 | ペニシリン系抗菌薬 | 薬物アレルギー | 重篤 (severe) | 蕁麻疹・呼吸困難 |
| 2 | 卵 | 食物アレルギー | 軽度 (mild) | 蕁麻疹 |
| 3 | アスピリン | 薬物不耐性 | 中等度 (moderate) | 胃腸障害 |

### 身体所見サンプル（Observation + LOINCコード）
| # | 項目名 | LOINCコード | 値 | 単位 |
|---|---|---|---|---|
| 1 | 体重 | 29463-7 | 68.5 | kg |
| 2 | 身長 | 8302-2 | 168.0 | cm |
| 3 | 血圧（収縮期） | 8480-6 | 138 | mmHg |
| 4 | 血圧（拡張期） | 8462-4 | 86 | mmHg |
| 5 | 体温 | 8310-5 | 36.8 | ℃ |
| 6 | HbA1c | 4548-4 | 7.2 | % |

### 処方サンプル（MedicationRequest）
| # | 薬品名 | YJコード | 用量 | 用法 |
|---|---|---|---|---|
| 1 | メトホルミン塩酸塩錠250mg | 3961003F1022 | 250mg | 1日2回 朝夕食後 |
| 2 | アムロジピンOD錠5mg | 2171013F1314 | 5mg | 1日1回 朝食後 |
| 3 | アトルバスタチン錠10mg | 2189013F1021 | 10mg | 1日1回 夕食後 |

---

## 8. サイドパネル FHIR仕様解説コンテンツ

`src/fhir/references.ts` に定義。各フィールドにフォーカスすると対応する解説を表示。

```typescript
interface FhirFieldReference {
  fieldId: string;        // フォームフィールドのID
  fhirPath: string;       // FHIRパス (例: "Patient.name.text")
  resourceType: string;   // リソース種別
  profile: string;        // JP Coreプロファイル名
  profileUrl: string;     // JP Core仕様ページURL
  clinsUrl: string;       // JP-CLINS仕様ページURL
  cardinality: string;    // カーディナリティ (例: "1..1", "0..*")
  mustSupport: boolean;   // Must Support フラグ
  description: string;    // 日本語説明
  fhirType: string;       // FHIR型 (例: "HumanName", "string")
  example: object;        // JSON例
}
```

---

## 9. 実装スコープ（フェーズ1 PoC）

### 含むもの
- 患者情報（Patient）
- 紹介元・紹介先情報（Practitioner + Organization）
- 紹介目的（Composition.section）
- 傷病名・主訴・既往歴（Condition）
- 現病歴（Composition.section テキスト）
- アレルギー（AllergyIntolerance）
- 身体所見（Observation）
- 処方（MedicationRequest）

### 含まないもの（スコープ外）
- FHIRバリデーション
- 家族歴（FamilyMemberHistory）
- 手術・処置（Procedure）
- 検査結果レポート（DiagnosticReport）
- サーバー送信・保存機能
