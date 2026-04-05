# 診療情報提供書 FHIR PoC Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** React + Vite SPAで診療情報提供書のフォームを入力するとFHIR R4形式のBundleリソース（JSON）が生成され、右サイドパネルにFHIR仕様解説が表示されるWebツールを実装する。

**Architecture:** フォーム入力はReact stateで管理し、`src/fhir/builders/`配下の各builderがFHIRリソースを組み立て、`buildBundle.ts`がBundle全体を構築する。フィールドのフォーカスイベントで`references.ts`から対応するFHIR仕様解説を取得しSidePanelに表示する。

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, react-syntax-highlighter

---

## Task 1: プロジェクト初期化

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `index.html`

**Step 1: Vite + React + TypeScriptプロジェクトを作成**

```bash
cd /Users/kazukimuta/Development/fhir-poc
npm create vite@latest . -- --template react-ts
```

Expected: package.json, src/, index.html が生成される

**Step 2: 依存パッケージをインストール**

```bash
npm install
npm install tailwindcss @tailwindcss/vite react-syntax-highlighter
npm install -D @types/react-syntax-highlighter
```

**Step 3: Tailwind CSSを設定**

`vite.config.ts` を以下に更新:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

`src/index.css` の先頭に追加:
```css
@import "tailwindcss";
```

**Step 4: 動作確認**

```bash
npm run dev
```

Expected: http://localhost:5173 でViteデフォルト画面が表示される

**Step 5: Commit**

```bash
git init
git add .
git commit -m "feat: initialize React + Vite + TypeScript + Tailwind project"
```

---

## Task 2: FHIRデータ型定義 (`src/fhir/types.ts`)

**Files:**
- Create: `src/fhir/types.ts`

**Step 1: フォームデータの型を定義**

`src/fhir/types.ts` を作成:

```typescript
// フォームで管理するデータ構造（FHIR仕様に基づく）
// 参照: https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html

export interface PatientFormData {
  nameText: string;        // Patient.name[0].text - 漢字氏名
  nameKana: string;        // Patient.name[1].text - カナ氏名
  birthDate: string;       // Patient.birthDate - ISO8601形式 (YYYY-MM-DD)
  gender: 'male' | 'female' | 'other' | 'unknown'; // Patient.gender
  patientId: string;       // Patient.identifier.value
}

export interface PractitionerFormData {
  nameText: string;        // Practitioner.name.text
  nameKana?: string;       // Practitioner.name (カナ)
}

export interface OrganizationFormData {
  name: string;            // Organization.name
  hopd: string;            // Organization.identifier (HOPDコード: 医療機関コード)
  tel?: string;            // Organization.telecom
  address?: string;        // Organization.address.text
}

// Condition.clinicalStatus のコード値
// 参照: https://hl7.org/fhir/R4/valueset-condition-clinical.html
export type ConditionClinicalStatus = 'active' | 'resolved' | 'inactive';

// 傷病の種別（主病名 or 既往歴）
export type ConditionCategory = 'chief-complaint' | 'past-history';

export interface ConditionFormData {
  id: string;              // 内部管理用UUID
  name: string;            // Condition.code.text - 傷病名
  icd10Code?: string;      // Condition.code.coding[0].code - ICD-10コード
  clinicalStatus: ConditionClinicalStatus; // Condition.clinicalStatus
  category: ConditionCategory;
  onsetDate?: string;      // Condition.onsetDateTime
}

// AllergyIntolerance.criticality
// 参照: https://hl7.org/fhir/R4/valueset-allergy-intolerance-criticality.html
export type AllergyCriticality = 'low' | 'high' | 'unable-to-assess';

// AllergyIntolerance.reaction.severity
export type AllergySeverity = 'mild' | 'moderate' | 'severe';

export interface AllergyFormData {
  id: string;
  substance: string;       // AllergyIntolerance.code.text - 原因物質
  category: 'food' | 'medication' | 'environment' | 'biologic'; // AllergyIntolerance.category
  criticality: AllergyCriticality;
  severity?: AllergySeverity; // AllergyIntolerance.reaction.severity
  manifestation?: string;  // AllergyIntolerance.reaction.manifestation.text - 症状
}

// Observation用: LOINCコードと単位のペア
// 参照: https://loinc.org/
export interface ObservationFormData {
  id: string;
  loincCode: string;       // Observation.code.coding[0].code - LOINCコード
  displayName: string;     // Observation.code.text - 表示名
  value: string;           // Observation.valueQuantity.value
  unit: string;            // Observation.valueQuantity.unit
  ucumUnit: string;        // Observation.valueQuantity.system = "http://unitsofmeasure.org"
}

export interface MedicationFormData {
  id: string;
  name: string;            // MedicationRequest.medicationCodeableConcept.text - 薬品名
  yjCode?: string;         // MedicationRequest.medicationCodeableConcept.coding[0].code - YJコード
  dose?: string;           // MedicationRequest.dosageInstruction.text に含める
  frequency?: string;      // MedicationRequest.dosageInstruction.text
}

// フォーム全体のデータ構造
export interface ReferralFormData {
  patient: PatientFormData;
  referralFrom: {
    practitioner: PractitionerFormData;
    organization: OrganizationFormData;
  };
  referralTo: {
    practitioner: PractitionerFormData;
    organization: OrganizationFormData;
  };
  purpose: string;         // Composition.section[950].text.div - 紹介目的
  conditions: ConditionFormData[];    // 1件以上必須
  history: string;         // Composition.section[360].text.div - 現病歴テキスト
  allergies: AllergyFormData[];
  observations: ObservationFormData[];
  medications: MedicationFormData[];
}
```

**Step 2: Commit**

```bash
git add src/fhir/types.ts
git commit -m "feat: add FHIR form data type definitions"
```

---

## Task 3: サンプルデータ (`src/fhir/sampleData.ts`)

**Files:**
- Create: `src/fhir/sampleData.ts`

**Step 1: サンプルデータを定義**

`src/fhir/sampleData.ts` を作成:

```typescript
import { ReferralFormData } from './types';

// 医学知識の参照例として実際のデータを記載
// 傷病名ICD-10コード参照: https://www.mhlw.go.jp/toukei/sippei/
// LOINCコード参照: https://loinc.org/search/
// YJコード: 薬価基準収載医薬品コード（厚生労働省）

export const SAMPLE_DATA: ReferralFormData = {
  patient: {
    nameText: '山田 太郎',
    nameKana: 'ヤマダ タロウ',
    birthDate: '1958-04-15',
    gender: 'male',
    patientId: '12345678',
  },
  referralFrom: {
    practitioner: {
      nameText: '田中 一郎',
      nameKana: 'タナカ イチロウ',
    },
    organization: {
      name: 'さくら内科クリニック',
      hopd: '1310000001',
      tel: '03-1234-5678',
      address: '東京都千代田区丸の内1-1-1',
    },
  },
  referralTo: {
    practitioner: {
      nameText: '鈴木 花子',
      nameKana: 'スズキ ハナコ',
    },
    organization: {
      name: '東京大学医学部附属病院',
      hopd: '1310000002',
      tel: '03-3815-5411',
      address: '東京都文京区本郷7-3-1',
    },
  },
  purpose: '2型糖尿病のコントロール不良により、専門的な治療・管理をお願いしたく紹介いたします。HbA1cが7.2%と高値が持続しており、インスリン導入の検討をお願いいたします。',
  conditions: [
    {
      id: 'cond-1',
      name: '2型糖尿病',
      icd10Code: 'E11',
      clinicalStatus: 'active',
      category: 'chief-complaint',
      onsetDate: '2015-06-01',
    },
    {
      id: 'cond-2',
      name: '高血圧症',
      icd10Code: 'I10',
      clinicalStatus: 'active',
      category: 'chief-complaint',
      onsetDate: '2018-03-15',
    },
    {
      id: 'cond-3',
      name: '脂質異常症',
      icd10Code: 'E78.5',
      clinicalStatus: 'active',
      category: 'past-history',
      onsetDate: '2019-01-10',
    },
    {
      id: 'cond-4',
      name: '虫垂炎（手術済）',
      icd10Code: 'K37',
      clinicalStatus: 'resolved',
      category: 'past-history',
      onsetDate: '1985-08-20',
    },
  ],
  history: '2015年頃より健診で血糖高値を指摘。2015年6月当院初診、2型糖尿病と診断。食事療法・運動療法を指導するも改善乏しく、メトホルミンを開始。2018年に高血圧症合併、アムロジピン追加。2019年に脂質異常症と診断、アトルバスタチン追加。近年HbA1cのコントロールが7%台で推移しており、より専門的な管理が必要と判断した。',
  allergies: [
    {
      id: 'allergy-1',
      substance: 'ペニシリン系抗菌薬',
      category: 'medication',
      criticality: 'high',
      severity: 'severe',
      manifestation: '蕁麻疹・呼吸困難',
    },
    {
      id: 'allergy-2',
      substance: '卵',
      category: 'food',
      criticality: 'low',
      severity: 'mild',
      manifestation: '蕁麻疹',
    },
    {
      id: 'allergy-3',
      substance: 'アスピリン',
      category: 'medication',
      criticality: 'low',
      severity: 'moderate',
      manifestation: '胃腸障害',
    },
  ],
  observations: [
    // LOINC 29463-7: Body weight
    { id: 'obs-1', loincCode: '29463-7', displayName: '体重', value: '68.5', unit: 'kg', ucumUnit: 'kg' },
    // LOINC 8302-2: Body height
    { id: 'obs-2', loincCode: '8302-2', displayName: '身長', value: '168.0', unit: 'cm', ucumUnit: 'cm' },
    // LOINC 8480-6: Systolic blood pressure
    { id: 'obs-3', loincCode: '8480-6', displayName: '血圧（収縮期）', value: '138', unit: 'mmHg', ucumUnit: 'mm[Hg]' },
    // LOINC 8462-4: Diastolic blood pressure
    { id: 'obs-4', loincCode: '8462-4', displayName: '血圧（拡張期）', value: '86', unit: 'mmHg', ucumUnit: 'mm[Hg]' },
    // LOINC 8310-5: Body temperature
    { id: 'obs-5', loincCode: '8310-5', displayName: '体温', value: '36.8', unit: '℃', ucumUnit: 'Cel' },
    // LOINC 4548-4: Hemoglobin A1c/Hemoglobin.total in Blood
    { id: 'obs-6', loincCode: '4548-4', displayName: 'HbA1c', value: '7.2', unit: '%', ucumUnit: '%' },
  ],
  medications: [
    {
      id: 'med-1',
      name: 'メトホルミン塩酸塩錠250mg',
      yjCode: '3961003F1022',
      dose: '250mg',
      frequency: '1日2回 朝夕食後',
    },
    {
      id: 'med-2',
      name: 'アムロジピンOD錠5mg',
      yjCode: '2171013F1314',
      dose: '5mg',
      frequency: '1日1回 朝食後',
    },
    {
      id: 'med-3',
      name: 'アトルバスタチン錠10mg',
      yjCode: '2189013F1021',
      dose: '10mg',
      frequency: '1日1回 夕食後',
    },
  ],
};

// 身体所見の選択候補（LOINCコード付き）
export const OBSERVATION_PRESETS = [
  { loincCode: '29463-7', displayName: '体重', unit: 'kg', ucumUnit: 'kg' },
  { loincCode: '8302-2', displayName: '身長', unit: 'cm', ucumUnit: 'cm' },
  { loincCode: '8480-6', displayName: '血圧（収縮期）', unit: 'mmHg', ucumUnit: 'mm[Hg]' },
  { loincCode: '8462-4', displayName: '血圧（拡張期）', unit: 'mmHg', ucumUnit: 'mm[Hg]' },
  { loincCode: '8310-5', displayName: '体温', unit: '℃', ucumUnit: 'Cel' },
  { loincCode: '4548-4', displayName: 'HbA1c', unit: '%', ucumUnit: '%' },
  { loincCode: '2160-0', displayName: '血清クレアチニン', unit: 'mg/dL', ucumUnit: 'mg/dL' },
  { loincCode: '33914-3', displayName: '推算GFR', unit: 'mL/min/1.73m2', ucumUnit: 'mL/min/{1.73_m2}' },
];
```

**Step 2: Commit**

```bash
git add src/fhir/sampleData.ts
git commit -m "feat: add sample data for referral form"
```

---

## Task 4: FHIR仕様参照データ (`src/fhir/references.ts`)

**Files:**
- Create: `src/fhir/references.ts`

**Step 1: サイドパネル表示用の仕様解説データを定義**

`src/fhir/references.ts` を作成:

```typescript
// FHIR仕様参照データ
// フォームの各フィールドにフォーカスした際にサイドパネルに表示する情報
//
// 参照仕様:
//   JP Core v1.2.0: https://jpfhir.jp/fhir/core/1.2.0/index.html
//   JP-CLINS igv1: https://jpfhir.jp/fhir/clins/igv1/index.html
//   HL7 FHIR R4: https://hl7.org/fhir/R4/

export interface FhirFieldReference {
  fieldId: string;
  fhirPath: string;
  resourceType: string;
  profile: string;
  profileUrl: string;
  clinsUrl: string;
  cardinality: string;
  mustSupport: boolean;
  description: string;
  fhirType: string;
  example: object;
}

export const FHIR_REFERENCES: Record<string, FhirFieldReference> = {
  'patient.nameText': {
    fieldId: 'patient.nameText',
    fhirPath: 'Patient.name[0].text',
    resourceType: 'Patient',
    profile: 'JP_Patient',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-patient.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '1..*',
    mustSupport: true,
    fhirType: 'HumanName',
    description: '患者の氏名。HumanName型で表現し、漢字氏名はtextおよびfamily/givenで記述する。JP Coreでは漢字・カナ・ローマ字の3種類を登録可能。漢字氏名はuse="official"を指定する。',
    example: {
      use: 'official',
      text: '山田 太郎',
      family: '山田',
      given: ['太郎'],
    },
  },
  'patient.nameKana': {
    fieldId: 'patient.nameKana',
    fhirPath: 'Patient.name[1].text',
    resourceType: 'Patient',
    profile: 'JP_Patient',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-patient.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '0..1',
    mustSupport: true,
    fhirType: 'HumanName',
    description: '患者氏名のカナ読み。JP Coreの拡張「nameRepresentationUse」を使用し、use拡張にkanaを指定する。電子カルテでは漢字とカナを両方管理するのが一般的。',
    example: {
      extension: [{
        url: 'http://hl7.org/fhir/StructureDefinition/iso21090-EN-representation',
        valueCode: 'SYL',
      }],
      text: 'ヤマダ タロウ',
    },
  },
  'patient.birthDate': {
    fieldId: 'patient.birthDate',
    fhirPath: 'Patient.birthDate',
    resourceType: 'Patient',
    profile: 'JP_Patient',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-patient.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '1..1',
    mustSupport: true,
    fhirType: 'date',
    description: '患者の生年月日。ISO 8601形式（YYYY-MM-DD）で記述する。FHIRのdate型はタイムゾーン不要。',
    example: '1958-04-15',
  },
  'patient.gender': {
    fieldId: 'patient.gender',
    fhirPath: 'Patient.gender',
    resourceType: 'Patient',
    profile: 'JP_Patient',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-patient.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '1..1',
    mustSupport: true,
    fhirType: 'code',
    description: '患者の性別。HL7 FHIR AdministrativeGenderコード体系から選択: male（男性）, female（女性）, other（その他）, unknown（不明）。',
    example: 'male',
  },
  'patient.patientId': {
    fieldId: 'patient.patientId',
    fhirPath: 'Patient.identifier',
    resourceType: 'Patient',
    profile: 'JP_Patient',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-patient.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '1..*',
    mustSupport: true,
    fhirType: 'Identifier',
    description: '患者識別子。医療機関が付与する患者ID。system（識別子体系のURI）とvalue（ID値）で構成する。JP-CLINSでは医療機関の患者番号を登録する。',
    example: {
      system: 'urn:oid:1.2.392.100495.20.3.51.11310000001',
      value: '12345678',
    },
  },
  'referralFrom.practitioner.nameText': {
    fieldId: 'referralFrom.practitioner.nameText',
    fhirPath: 'Practitioner.name.text',
    resourceType: 'Practitioner',
    profile: 'JP_Practitioner',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-practitioner.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '1..1',
    mustSupport: true,
    fhirType: 'HumanName',
    description: '紹介元医師の氏名。Compositionのauthorに参照される。JP-CLINSでは文書作成責任者として登録される。',
    example: {
      text: '田中 一郎',
      family: '田中',
      given: ['一郎'],
    },
  },
  'referralFrom.organization.name': {
    fieldId: 'referralFrom.organization.name',
    fhirPath: 'Organization.name',
    resourceType: 'Organization',
    profile: 'JP_Organization',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-organization.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '1..1',
    mustSupport: true,
    fhirType: 'string',
    description: '紹介元医療機関の名称。JP-CLINSではCompositionのcustodianおよびauthorに参照される。',
    example: 'さくら内科クリニック',
  },
  'referralFrom.organization.hopd': {
    fieldId: 'referralFrom.organization.hopd',
    fhirPath: 'Organization.identifier',
    resourceType: 'Organization',
    profile: 'JP_Organization',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-organization.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '1..1',
    mustSupport: true,
    fhirType: 'Identifier',
    description: '医療機関コード（HOPDコード）。厚生労働省が付与する10桁の医療機関識別番号。system値は "http://jpfhir.jp/fhir/core/IdSystem/insurance-medical-institution-no" を使用。',
    example: {
      system: 'http://jpfhir.jp/fhir/core/IdSystem/insurance-medical-institution-no',
      value: '1310000001',
    },
  },
  'purpose': {
    fieldId: 'purpose',
    fhirPath: 'Composition.section[code=950].text.div',
    resourceType: 'Composition',
    profile: 'JP_Composition_eReferral',
    profileUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Composition-eReferral.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Composition-eReferral.html',
    cardinality: '1..1',
    mustSupport: true,
    fhirType: 'Narrative',
    description: '紹介目的セクション（コード: 950）。なぜこの患者を紹介するのかを記述する。Narrative型（XHTML）で格納される。JP-CLINSの必須セクション。',
    example: {
      status: 'generated',
      div: '<div xmlns="http://www.w3.org/1999/xhtml">2型糖尿病のコントロール不良により専門的治療をお願いします。</div>',
    },
  },
  'condition.name': {
    fieldId: 'condition.name',
    fhirPath: 'Condition.code.text',
    resourceType: 'Condition',
    profile: 'JP_Condition',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-condition.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '1..*',
    mustSupport: true,
    fhirType: 'CodeableConcept',
    description: '傷病名。Condition.code.textに病名テキストを記述し、coding[0]にICD-10コードを記述する。JP-CLINSでは傷病名セクション（コード: 340）に最低1件必須。',
    example: {
      coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'E11', display: '2型糖尿病' }],
      text: '2型糖尿病',
    },
  },
  'condition.clinicalStatus': {
    fieldId: 'condition.clinicalStatus',
    fhirPath: 'Condition.clinicalStatus',
    resourceType: 'Condition',
    profile: 'JP_Condition',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-condition.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '1..1',
    mustSupport: true,
    fhirType: 'CodeableConcept',
    description: '傷病の臨床状態。HL7の condition-clinical コード体系を使用。active（現在罹患中）, resolved（治癒/解消済）, inactive（非活動的）から選択。',
    example: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }],
    },
  },
  'allergy.substance': {
    fieldId: 'allergy.substance',
    fhirPath: 'AllergyIntolerance.code.text',
    resourceType: 'AllergyIntolerance',
    profile: 'JP_AllergyIntolerance',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-allergyintolerance.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '0..*',
    mustSupport: true,
    fhirType: 'CodeableConcept',
    description: 'アレルギーや不耐性の原因物質。CodeableConcept型で、textに物質名を記述する。薬剤はYJコードやHOTコード、食物はJFIC分類コードが使用できるが、PoCではテキストのみでも可。',
    example: { text: 'ペニシリン系抗菌薬' },
  },
  'allergy.criticality': {
    fieldId: 'allergy.criticality',
    fhirPath: 'AllergyIntolerance.criticality',
    resourceType: 'AllergyIntolerance',
    profile: 'JP_AllergyIntolerance',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-allergyintolerance.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '0..1',
    mustSupport: false,
    fhirType: 'code',
    description: 'アレルギー反応の重篤度リスク。low（軽微なリスク）, high（重篤なリスク/アナフィラキシー等）, unable-to-assess（評価不能）から選択。severityとは異なり、潜在的なリスクを示す。',
    example: 'high',
  },
  'observation.value': {
    fieldId: 'observation.value',
    fhirPath: 'Observation.valueQuantity',
    resourceType: 'Observation',
    profile: 'JP_Observation_VitalSigns',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-observation-vitalsigns.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '0..*',
    mustSupport: true,
    fhirType: 'Quantity',
    description: '身体所見の測定値。Quantity型で数値とunit（表示用単位）、system（UCUM）、code（UCUMコード）を記述する。LOINCコードで項目を識別し、UCUMで単位を統一する。',
    example: {
      value: 68.5,
      unit: 'kg',
      system: 'http://unitsofmeasure.org',
      code: 'kg',
    },
  },
  'medication.name': {
    fieldId: 'medication.name',
    fhirPath: 'MedicationRequest.medicationCodeableConcept.text',
    resourceType: 'MedicationRequest',
    profile: 'JP_MedicationRequest',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-medicationrequest.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '0..*',
    mustSupport: true,
    fhirType: 'CodeableConcept',
    description: '処方薬の名称。medicationCodeableConcept.textに薬品名を記述し、coding[0]にYJコード（薬価基準収載医薬品コード）を記述する。YJコードのsystemは "urn:oid:1.2.392.100495.20.1.73"。',
    example: {
      coding: [{ system: 'urn:oid:1.2.392.100495.20.1.73', code: '3961003F1022', display: 'メトホルミン塩酸塩錠250mg' }],
      text: 'メトホルミン塩酸塩錠250mg',
    },
  },
};

// フィールドIDからFHIR参照情報を取得するユーティリティ
export function getFhirReference(fieldId: string): FhirFieldReference | null {
  // 完全一致
  if (FHIR_REFERENCES[fieldId]) return FHIR_REFERENCES[fieldId];
  // プレフィックス一致（例: condition.name-0 → condition.name）
  const baseId = fieldId.replace(/-\d+$/, '');
  return FHIR_REFERENCES[baseId] ?? null;
}
```

**Step 2: Commit**

```bash
git add src/fhir/references.ts
git commit -m "feat: add FHIR field reference data for side panel"
```

---

## Task 5: FHIRリソースBuilders

**Files:**
- Create: `src/fhir/builders/buildPatient.ts`
- Create: `src/fhir/builders/buildPractitioner.ts`
- Create: `src/fhir/builders/buildOrganization.ts`
- Create: `src/fhir/builders/buildCondition.ts`
- Create: `src/fhir/builders/buildAllergyIntolerance.ts`
- Create: `src/fhir/builders/buildObservation.ts`
- Create: `src/fhir/builders/buildMedicationRequest.ts`
- Create: `src/fhir/builders/buildBundle.ts`

**Step 1: buildPatient.ts を作成**

```typescript
// src/fhir/builders/buildPatient.ts
// JP_Patient プロファイルに基づくPatientリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-patient.html

import { PatientFormData } from '../types';

export function buildPatient(data: PatientFormData, patientId: string): object {
  return {
    resourceType: 'Patient',
    id: patientId,
    meta: {
      profile: ['http://jpfhir.jp/fhir/core/StructureDefinition/JP_Patient'],
    },
    identifier: [
      {
        // 医療機関の患者番号。systemはOID形式で医療機関コードを含む
        system: `urn:oid:1.2.392.100495.20.3.51.1${data.patientId}`,
        value: data.patientId,
      },
    ],
    name: [
      {
        // 漢字氏名 (use: official)
        use: 'official',
        text: data.nameText,
        family: data.nameText.split(' ')[0] ?? data.nameText,
        given: [data.nameText.split(' ')[1] ?? ''],
      },
      ...(data.nameKana
        ? [
            {
              // カナ氏名: iso21090-EN-representation拡張でSYL(Syllabic)を指定
              extension: [
                {
                  url: 'http://hl7.org/fhir/StructureDefinition/iso21090-EN-representation',
                  valueCode: 'SYL',
                },
              ],
              use: 'official',
              text: data.nameKana,
            },
          ]
        : []),
    ],
    gender: data.gender,
    birthDate: data.birthDate,
  };
}
```

**Step 2: buildPractitioner.ts を作成**

```typescript
// src/fhir/builders/buildPractitioner.ts
// JP_Practitioner プロファイルに基づくPractitionerリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-practitioner.html

import { PractitionerFormData } from '../types';

export function buildPractitioner(data: PractitionerFormData, id: string): object {
  return {
    resourceType: 'Practitioner',
    id,
    meta: {
      profile: ['http://jpfhir.jp/fhir/core/StructureDefinition/JP_Practitioner'],
    },
    name: [
      {
        use: 'official',
        text: data.nameText,
        family: data.nameText.split(' ')[0] ?? data.nameText,
        given: [data.nameText.split(' ')[1] ?? ''],
      },
      ...(data.nameKana
        ? [
            {
              extension: [
                {
                  url: 'http://hl7.org/fhir/StructureDefinition/iso21090-EN-representation',
                  valueCode: 'SYL',
                },
              ],
              use: 'official',
              text: data.nameKana,
            },
          ]
        : []),
    ],
  };
}
```

**Step 3: buildOrganization.ts を作成**

```typescript
// src/fhir/builders/buildOrganization.ts
// JP_Organization プロファイルに基づくOrganizationリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-organization.html
// HOPDコード(医療機関コード)仕様: http://jpfhir.jp/fhir/core/IdSystem/insurance-medical-institution-no

import { OrganizationFormData } from '../types';

export function buildOrganization(data: OrganizationFormData, id: string): object {
  return {
    resourceType: 'Organization',
    id,
    meta: {
      profile: ['http://jpfhir.jp/fhir/core/StructureDefinition/JP_Organization'],
    },
    identifier: [
      {
        // 保険医療機関番号（HOPDコード）- 10桁
        system: 'http://jpfhir.jp/fhir/core/IdSystem/insurance-medical-institution-no',
        value: data.hopd,
      },
    ],
    name: data.name,
    ...(data.tel ? { telecom: [{ system: 'phone', value: data.tel }] } : {}),
    ...(data.address ? { address: [{ text: data.address }] } : {}),
  };
}
```

**Step 4: buildCondition.ts を作成**

```typescript
// src/fhir/builders/buildCondition.ts
// JP_Condition プロファイルに基づくConditionリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-condition.html
// ICD-10コード体系: http://hl7.org/fhir/sid/icd-10

import { ConditionFormData } from '../types';

const CLINICAL_STATUS_SYSTEM = 'http://terminology.hl7.org/CodeSystem/condition-clinical';

// 傷病カテゴリコード（JP-CLINS定義）
const CATEGORY_CODES: Record<string, { code: string; display: string }> = {
  'chief-complaint': { code: 'chief-complaint', display: '主訴・主病名' },
  'past-history': { code: 'past-history', display: '既往歴' },
};

export function buildCondition(data: ConditionFormData, patientRef: string): object {
  return {
    resourceType: 'Condition',
    id: data.id,
    meta: {
      profile: ['http://jpfhir.jp/fhir/core/StructureDefinition/JP_Condition'],
    },
    clinicalStatus: {
      coding: [
        {
          system: CLINICAL_STATUS_SYSTEM,
          code: data.clinicalStatus,
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: 'http://jpfhir.jp/fhir/clins/CodeSystem/condition-category',
            ...CATEGORY_CODES[data.category],
          },
        ],
      },
    ],
    code: {
      ...(data.icd10Code
        ? {
            coding: [
              {
                // ICD-10コード体系
                system: 'http://hl7.org/fhir/sid/icd-10',
                code: data.icd10Code,
                display: data.name,
              },
            ],
          }
        : {}),
      text: data.name,
    },
    subject: { reference: `Patient/${patientRef}` },
    ...(data.onsetDate ? { onsetDateTime: data.onsetDate } : {}),
  };
}
```

**Step 5: buildAllergyIntolerance.ts を作成**

```typescript
// src/fhir/builders/buildAllergyIntolerance.ts
// JP_AllergyIntolerance プロファイルに基づくAllergyIntoleranceリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-allergyintolerance.html

import { AllergyFormData } from '../types';

export function buildAllergyIntolerance(data: AllergyFormData, patientRef: string): object {
  return {
    resourceType: 'AllergyIntolerance',
    id: data.id,
    meta: {
      profile: ['http://jpfhir.jp/fhir/core/StructureDefinition/JP_AllergyIntolerance'],
    },
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
          code: 'active',
        },
      ],
    },
    // category: food | medication | environment | biologic
    category: [data.category],
    // criticality: low | high | unable-to-assess
    criticality: data.criticality,
    code: { text: data.substance },
    patient: { reference: `Patient/${patientRef}` },
    ...(data.manifestation || data.severity
      ? {
          reaction: [
            {
              ...(data.manifestation
                ? { manifestation: [{ text: data.manifestation }] }
                : {}),
              ...(data.severity ? { severity: data.severity } : {}),
            },
          ],
        }
      : {}),
  };
}
```

**Step 6: buildObservation.ts を作成**

```typescript
// src/fhir/builders/buildObservation.ts
// JP_Observation_VitalSigns プロファイルに基づくObservationリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-observation-vitalsigns.html
// LOINCコード体系: https://loinc.org/
// UCUM単位体系: http://unitsofmeasure.org

import { ObservationFormData } from '../types';

export function buildObservation(data: ObservationFormData, patientRef: string): object {
  return {
    resourceType: 'Observation',
    id: data.id,
    meta: {
      profile: ['http://jpfhir.jp/fhir/core/StructureDefinition/JP_Observation_VitalSigns'],
    },
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          // LOINCコードで身体所見の種類を識別
          system: 'http://loinc.org',
          code: data.loincCode,
          display: data.displayName,
        },
      ],
      text: data.displayName,
    },
    subject: { reference: `Patient/${patientRef}` },
    valueQuantity: {
      value: parseFloat(data.value),
      unit: data.unit,
      // UCUM: Unified Code for Units of Measure - 国際標準単位体系
      system: 'http://unitsofmeasure.org',
      code: data.ucumUnit,
    },
  };
}
```

**Step 7: buildMedicationRequest.ts を作成**

```typescript
// src/fhir/builders/buildMedicationRequest.ts
// JP_MedicationRequest プロファイルに基づくMedicationRequestリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-medicationrequest.html
// YJコード(薬価基準収載医薬品コード): urn:oid:1.2.392.100495.20.1.73

import { MedicationFormData } from '../types';

export function buildMedicationRequest(data: MedicationFormData, patientRef: string): object {
  return {
    resourceType: 'MedicationRequest',
    id: data.id,
    meta: {
      profile: ['http://jpfhir.jp/fhir/core/StructureDefinition/JP_MedicationRequest'],
    },
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      ...(data.yjCode
        ? {
            coding: [
              {
                // YJコード（薬価基準収載医薬品コード）
                system: 'urn:oid:1.2.392.100495.20.1.73',
                code: data.yjCode,
                display: data.name,
              },
            ],
          }
        : {}),
      text: data.name,
    },
    subject: { reference: `Patient/${patientRef}` },
    dosageInstruction: [
      {
        text: [data.dose, data.frequency].filter(Boolean).join(' '),
      },
    ],
  };
}
```

**Step 8: buildBundle.ts を作成**

```typescript
// src/fhir/builders/buildBundle.ts
// JP_Bundle_eReferral プロファイルに基づくBundle全体の組み立て
// 仕様: https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html
// Composition仕様: https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Composition-eReferral.html

import { ReferralFormData } from '../types';
import { buildPatient } from './buildPatient';
import { buildPractitioner } from './buildPractitioner';
import { buildOrganization } from './buildOrganization';
import { buildCondition } from './buildCondition';
import { buildAllergyIntolerance } from './buildAllergyIntolerance';
import { buildObservation } from './buildObservation';
import { buildMedicationRequest } from './buildMedicationRequest';

function makeNarrative(text: string): object {
  return {
    status: 'generated',
    div: `<div xmlns="http://www.w3.org/1999/xhtml">${text}</div>`,
  };
}

export function buildBundle(data: ReferralFormData): object {
  const now = new Date().toISOString();
  const bundleId = `bundle-${Date.now()}`;

  // リソースID定義
  const patientId = 'patient-1';
  const fromPractId = 'pract-from-1';
  const fromOrgId = 'org-from-1';
  const toPractId = 'pract-to-1';
  const toOrgId = 'org-to-1';
  const compositionId = 'composition-1';

  // 各リソースをビルド
  const patient = buildPatient(data.patient, patientId);
  const fromPract = buildPractitioner(data.referralFrom.practitioner, fromPractId);
  const fromOrg = buildOrganization(data.referralFrom.organization, fromOrgId);
  const toPract = buildPractitioner(data.referralTo.practitioner, toPractId);
  const toOrg = buildOrganization(data.referralTo.organization, toOrgId);
  const conditions = data.conditions.map(c => buildCondition(c, patientId));
  const allergies = data.allergies.map(a => buildAllergyIntolerance(a, patientId));
  const observations = data.observations.map(o => buildObservation(o, patientId));
  const medications = data.medications.map(m => buildMedicationRequest(m, patientId));

  // Compositionを組み立て
  // 参照: https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Composition-eReferral.html
  const composition = {
    resourceType: 'Composition',
    id: compositionId,
    meta: {
      profile: ['http://jpfhir.jp/fhir/eReferral/StructureDefinition/JP_Composition_eReferral'],
    },
    // 文書ステータス: 確定文書はfinal
    status: 'final',
    // 診療情報提供書を示すLOINCコード
    type: {
      coding: [{ system: 'http://loinc.org', code: '57133-1', display: 'Referral note' }],
    },
    subject: { reference: `Patient/${patientId}` },
    date: now,
    author: [
      { reference: `Practitioner/${fromPractId}` },
      { reference: `Organization/${fromOrgId}` },
    ],
    title: '診療情報提供書',
    custodian: { reference: `Organization/${fromOrgId}` },
    section: [
      // 紹介元情報セクション (code: 920)
      {
        title: '紹介元情報',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '920' }] },
        entry: [
          { reference: `Practitioner/${fromPractId}` },
          { reference: `Organization/${fromOrgId}` },
        ],
      },
      // 紹介先情報セクション (code: 910)
      {
        title: '紹介先情報',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '910' }] },
        entry: [
          { reference: `Practitioner/${toPractId}` },
          { reference: `Organization/${toOrgId}` },
        ],
      },
      // 紹介目的セクション (code: 950) - 必須
      {
        title: '紹介目的',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '950' }] },
        text: makeNarrative(data.purpose),
      },
      // 傷病名・主訴セクション (code: 340) - 1件以上必須
      {
        title: '傷病名・主訴',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '340' }] },
        entry: data.conditions
          .filter(c => c.category === 'chief-complaint')
          .map(c => ({ reference: `Condition/${c.id}` })),
      },
      // 現病歴セクション (code: 360)
      {
        title: '現病歴',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '360' }] },
        text: makeNarrative(data.history),
      },
      // 既往歴セクション (code: 370)
      {
        title: '既往歴',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '370' }] },
        entry: data.conditions
          .filter(c => c.category === 'past-history')
          .map(c => ({ reference: `Condition/${c.id}` })),
      },
      // アレルギー・不耐性反応セクション (code: 510)
      ...(data.allergies.length > 0
        ? [{
            title: 'アレルギー・不耐性反応',
            code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '510' }] },
            entry: data.allergies.map(a => ({ reference: `AllergyIntolerance/${a.id}` })),
          }]
        : []),
      // 身体所見セクション
      ...(data.observations.length > 0
        ? [{
            title: '身体所見',
            code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '610' }] },
            entry: data.observations.map(o => ({ reference: `Observation/${o.id}` })),
          }]
        : []),
      // 処方セクション
      ...(data.medications.length > 0
        ? [{
            title: '処方情報',
            code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '430' }] },
            entry: data.medications.map(m => ({ reference: `MedicationRequest/${m.id}` })),
          }]
        : []),
    ],
  };

  // Bundle組み立て
  // type: document - ドキュメント型Bundle（先頭エントリはCompositionである必要がある）
  return {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      lastUpdated: now,
      profile: ['http://jpfhir.jp/fhir/clins/StructureDefinition/JP_Bundle_eReferral'],
    },
    identifier: {
      // JP-CLINSのBundle識別子体系
      system: 'http://jpfhir.jp/fhir/clins/bundle-identifier',
      value: bundleId,
    },
    type: 'document',
    timestamp: now,
    entry: [
      { fullUrl: `urn:uuid:${compositionId}`, resource: composition },
      { fullUrl: `urn:uuid:${patientId}`, resource: patient },
      { fullUrl: `urn:uuid:${fromPractId}`, resource: fromPract },
      { fullUrl: `urn:uuid:${fromOrgId}`, resource: fromOrg },
      { fullUrl: `urn:uuid:${toPractId}`, resource: toPract },
      { fullUrl: `urn:uuid:${toOrgId}`, resource: toOrg },
      ...conditions.map(r => ({ fullUrl: `urn:uuid:${(r as any).id}`, resource: r })),
      ...allergies.map(r => ({ fullUrl: `urn:uuid:${(r as any).id}`, resource: r })),
      ...observations.map(r => ({ fullUrl: `urn:uuid:${(r as any).id}`, resource: r })),
      ...medications.map(r => ({ fullUrl: `urn:uuid:${(r as any).id}`, resource: r })),
    ],
  };
}
```

**Step 9: Commit**

```bash
git add src/fhir/builders/
git commit -m "feat: add FHIR resource builders for all entry types"
```

---

## Task 6: 共通UIコンポーネント

**Files:**
- Create: `src/components/common/FieldWithHelp.tsx`
- Create: `src/components/output/FhirJsonViewer.tsx`
- Create: `src/components/layout/SidePanel.tsx`

**Step 1: FieldWithHelp.tsx を作成**

```tsx
// src/components/common/FieldWithHelp.tsx
// フォームフィールドのラベル + FHIR要素名を表示する共通コンポーネント

interface FieldWithHelpProps {
  label: string;         // 日本語ラベル（例: 患者名）
  fhirPath: string;      // FHIRパス（例: Patient.name.text）
  required?: boolean;
  children: React.ReactNode;
}

export function FieldWithHelp({ label, fhirPath, required, children }: FieldWithHelpProps) {
  return (
    <div className="mb-4">
      <label className="block mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {required && <span className="text-red-500 ml-1">*</span>}
        <span className="ml-2 text-xs text-blue-500 font-mono">{fhirPath}</span>
      </label>
      {children}
    </div>
  );
}
```

**Step 2: FhirJsonViewer.tsx を作成**

```tsx
// src/components/output/FhirJsonViewer.tsx
// FHIR Bundle JSONをシンタックスハイライト付きで表示するコンポーネント

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('json', json);

interface FhirJsonViewerProps {
  bundle: object | null;
}

export function FhirJsonViewer({ bundle }: FhirJsonViewerProps) {
  if (!bundle) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-400 text-sm">「FHIR JSON生成」ボタンを押すとここにFHIR Bundleが表示されます</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b border-gray-200">
        <span className="text-sm font-medium text-gray-600">Bundle (type: document)</span>
        <span className="text-xs text-gray-400">JP-CLINS JP_Bundle_eReferral</span>
      </div>
      <SyntaxHighlighter
        language="json"
        style={githubGist}
        customStyle={{ margin: 0, maxHeight: '500px', fontSize: '12px' }}
      >
        {JSON.stringify(bundle, null, 2)}
      </SyntaxHighlighter>
    </div>
  );
}
```

**Step 3: SidePanel.tsx を作成**

```tsx
// src/components/layout/SidePanel.tsx
// フォームフィールドにフォーカスした際にFHIR仕様解説を表示するサイドパネル

import { FhirFieldReference } from '../../fhir/references';

interface SidePanelProps {
  reference: FhirFieldReference | null;
}

export function SidePanel({ reference }: SidePanelProps) {
  if (!reference) {
    return (
      <div className="h-full flex items-start justify-center pt-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <div className="text-center text-gray-400">
          <p className="text-sm">フォームのフィールドをクリックすると</p>
          <p className="text-sm">FHIR仕様の解説が表示されます</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden text-sm">
      {/* ヘッダー */}
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
        <div className="font-mono text-blue-700 font-semibold">{reference.fhirPath}</div>
        <div className="text-blue-500 text-xs mt-0.5">{reference.resourceType} › {reference.profile}</div>
      </div>

      {/* メタ情報 */}
      <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-400">カーディナリティ</span>
          <div className="font-mono font-semibold text-gray-700">{reference.cardinality}</div>
        </div>
        <div>
          <span className="text-gray-400">FHIR型</span>
          <div className="font-mono font-semibold text-gray-700">{reference.fhirType}</div>
        </div>
        <div>
          <span className="text-gray-400">Must Support</span>
          <div className={`font-semibold ${reference.mustSupport ? 'text-green-600' : 'text-gray-400'}`}>
            {reference.mustSupport ? '✓ あり' : '－'}
          </div>
        </div>
      </div>

      {/* カーディナリティの意味説明 */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
        <span className="font-mono text-gray-600">{reference.cardinality}</span>
        {reference.cardinality === '1..1' && ' → 必須・1件のみ'}
        {reference.cardinality === '1..*' && ' → 必須・1件以上'}
        {reference.cardinality === '0..1' && ' → 任意・最大1件'}
        {reference.cardinality === '0..*' && ' → 任意・複数可'}
      </div>

      {/* 説明 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-xs text-gray-400 mb-1">説明</div>
        <div className="text-gray-700 leading-relaxed">{reference.description}</div>
      </div>

      {/* JSON例 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-xs text-gray-400 mb-1">FHIR JSON例</div>
        <pre className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-600 overflow-x-auto">
          {JSON.stringify(reference.example, null, 2)}
        </pre>
      </div>

      {/* 参照リンク */}
      <div className="px-4 py-3 space-y-1">
        <div className="text-xs text-gray-400 mb-1">参照仕様</div>
        <a
          href={reference.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
        >
          🔗 JP Core - {reference.profile}
        </a>
        <a
          href={reference.clinsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
        >
          🔗 JP-CLINS - Bundle eReferral
        </a>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/
git commit -m "feat: add common UI components (FieldWithHelp, FhirJsonViewer, SidePanel)"
```

---

## Task 7: フォームセクション実装

**Files:**
- Create: `src/components/sections/PatientSection.tsx`
- Create: `src/components/sections/ReferralFromSection.tsx`
- Create: `src/components/sections/ReferralToSection.tsx`
- Create: `src/components/sections/PurposeSection.tsx`
- Create: `src/components/sections/ConditionSection.tsx`
- Create: `src/components/sections/HistorySection.tsx`
- Create: `src/components/sections/AllergySection.tsx`
- Create: `src/components/sections/ObservationSection.tsx`
- Create: `src/components/sections/MedicationSection.tsx`

各セクションは同じパターンに従う:
1. `SectionAccordion` でアコーディオン表示
2. `FieldWithHelp` で各フィールドをラップ
3. `onFocus` イベントで `setActiveFieldId` を呼ぶ（SidePanelを更新するため）

**Step 1: PatientSection.tsx を作成**

```tsx
// src/components/sections/PatientSection.tsx
import { PatientFormData } from '../../fhir/types';
import { FieldWithHelp } from '../common/FieldWithHelp';

const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

interface Props {
  data: PatientFormData;
  onChange: (data: PatientFormData) => void;
  onFocus: (fieldId: string) => void;
}

export function PatientSection({ data, onChange, onFocus }: Props) {
  const update = (key: keyof PatientFormData, value: string) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="space-y-0">
      <FieldWithHelp label="患者名（漢字）" fhirPath="Patient.name[0].text" required>
        <input
          type="text"
          className={inputClass}
          value={data.nameText}
          onChange={e => update('nameText', e.target.value)}
          onFocus={() => onFocus('patient.nameText')}
          placeholder="例: 山田 太郎"
        />
      </FieldWithHelp>
      <FieldWithHelp label="患者名（カナ）" fhirPath="Patient.name[1].text">
        <input
          type="text"
          className={inputClass}
          value={data.nameKana}
          onChange={e => update('nameKana', e.target.value)}
          onFocus={() => onFocus('patient.nameKana')}
          placeholder="例: ヤマダ タロウ"
        />
      </FieldWithHelp>
      <FieldWithHelp label="生年月日" fhirPath="Patient.birthDate" required>
        <input
          type="date"
          className={inputClass}
          value={data.birthDate}
          onChange={e => update('birthDate', e.target.value)}
          onFocus={() => onFocus('patient.birthDate')}
        />
      </FieldWithHelp>
      <FieldWithHelp label="性別 / Patient.gender" fhirPath="Patient.gender" required>
        <select
          className={inputClass}
          value={data.gender}
          onChange={e => update('gender', e.target.value)}
          onFocus={() => onFocus('patient.gender')}
        >
          <option value="male">男性 (male)</option>
          <option value="female">女性 (female)</option>
          <option value="other">その他 (other)</option>
          <option value="unknown">不明 (unknown)</option>
        </select>
      </FieldWithHelp>
      <FieldWithHelp label="患者ID" fhirPath="Patient.identifier.value" required>
        <input
          type="text"
          className={inputClass}
          value={data.patientId}
          onChange={e => update('patientId', e.target.value)}
          onFocus={() => onFocus('patient.patientId')}
          placeholder="例: 12345678"
        />
      </FieldWithHelp>
    </div>
  );
}
```

残りのセクション（ReferralFromSection, ReferralToSection, PurposeSection, ConditionSection, HistorySection, AllergySection, ObservationSection, MedicationSection）も同じパターンで作成する。各セクションの実装上の注意点:

- **ConditionSection / AllergySection / ObservationSection / MedicationSection**: 複数件管理のため `+追加` / `削除` ボタンを実装。`uuid` パッケージでIDを生成。
- **ObservationSection**: LOINCプリセット（`OBSERVATION_PRESETS`）をドロップダウンで選択可能にする。
- **ConditionSection**: 種別（主病名/既往歴）と臨床状態（active/resolved/inactive）をセレクトボックスで選択。

**Step 2: Commit**

```bash
git add src/components/sections/
git commit -m "feat: add all form section components"
```

---

## Task 8: FormPanel とApp組み上げ

**Files:**
- Create: `src/components/layout/FormPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`

**Step 1: FormPanel.tsx を作成**

```tsx
// src/components/layout/FormPanel.tsx
import { useState } from 'react';
import { ReferralFormData } from '../../fhir/types';
import { SAMPLE_DATA } from '../../fhir/sampleData';
import { PatientSection } from '../sections/PatientSection';
import { ReferralFromSection } from '../sections/ReferralFromSection';
import { ReferralToSection } from '../sections/ReferralToSection';
import { PurposeSection } from '../sections/PurposeSection';
import { ConditionSection } from '../sections/ConditionSection';
import { HistorySection } from '../sections/HistorySection';
import { AllergySection } from '../sections/AllergySection';
import { ObservationSection } from '../sections/ObservationSection';
import { MedicationSection } from '../sections/MedicationSection';

// アコーディオンセクション共通コンポーネント
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-lg mb-3">
      <button
        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 font-medium text-sm flex justify-between items-center rounded-lg"
        onClick={() => setOpen(o => !o)}
      >
        {title}
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 py-4">{children}</div>}
    </div>
  );
}

const EMPTY_FORM: ReferralFormData = {
  patient: { nameText: '', nameKana: '', birthDate: '', gender: 'male', patientId: '' },
  referralFrom: {
    practitioner: { nameText: '', nameKana: '' },
    organization: { name: '', hopd: '', tel: '', address: '' },
  },
  referralTo: {
    practitioner: { nameText: '', nameKana: '' },
    organization: { name: '', hopd: '', tel: '', address: '' },
  },
  purpose: '',
  conditions: [],
  history: '',
  allergies: [],
  observations: [],
  medications: [],
};

interface Props {
  onFocus: (fieldId: string) => void;
  onGenerate: (data: ReferralFormData) => void;
}

export function FormPanel({ onFocus, onGenerate }: Props) {
  const [form, setForm] = useState<ReferralFormData>(EMPTY_FORM);

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setForm(SAMPLE_DATA)}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
        >
          📋 サンプル読み込み
        </button>
        <button
          onClick={() => setForm(EMPTY_FORM)}
          className="px-3 py-2 text-sm bg-white hover:bg-gray-50 rounded-md border border-gray-300 text-gray-500"
        >
          クリア
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Section title="患者情報 / Patient">
          <PatientSection data={form.patient} onChange={p => setForm(f => ({ ...f, patient: p }))} onFocus={onFocus} />
        </Section>
        <Section title="紹介元情報 / ReferralFrom">
          <ReferralFromSection data={form.referralFrom} onChange={v => setForm(f => ({ ...f, referralFrom: v }))} onFocus={onFocus} />
        </Section>
        <Section title="紹介先情報 / ReferralTo">
          <ReferralToSection data={form.referralTo} onChange={v => setForm(f => ({ ...f, referralTo: v }))} onFocus={onFocus} />
        </Section>
        <Section title="紹介目的 / Purpose (Composition.section[950])">
          <PurposeSection data={form.purpose} onChange={v => setForm(f => ({ ...f, purpose: v }))} onFocus={onFocus} />
        </Section>
        <Section title="傷病名・既往歴 / Condition">
          <ConditionSection data={form.conditions} onChange={v => setForm(f => ({ ...f, conditions: v }))} onFocus={onFocus} />
        </Section>
        <Section title="現病歴 / History (Composition.section[360])">
          <HistorySection data={form.history} onChange={v => setForm(f => ({ ...f, history: v }))} onFocus={onFocus} />
        </Section>
        <Section title="アレルギー / AllergyIntolerance">
          <AllergySection data={form.allergies} onChange={v => setForm(f => ({ ...f, allergies: v }))} onFocus={onFocus} />
        </Section>
        <Section title="身体所見 / Observation">
          <ObservationSection data={form.observations} onChange={v => setForm(f => ({ ...f, observations: v }))} onFocus={onFocus} />
        </Section>
        <Section title="処方 / MedicationRequest">
          <MedicationSection data={form.medications} onChange={v => setForm(f => ({ ...f, medications: v }))} onFocus={onFocus} />
        </Section>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => onGenerate(form)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm"
        >
          🔄 FHIR JSON生成
        </button>
      </div>
    </div>
  );
}
```

**Step 2: App.tsx を更新**

```tsx
// src/App.tsx
import { useState } from 'react';
import { FormPanel } from './components/layout/FormPanel';
import { SidePanel } from './components/layout/SidePanel';
import { FhirJsonViewer } from './components/output/FhirJsonViewer';
import { buildBundle } from './fhir/builders/buildBundle';
import { getFhirReference, FhirFieldReference } from './fhir/references';
import { ReferralFormData } from './fhir/types';

export default function App() {
  const [activeRef, setActiveRef] = useState<FhirFieldReference | null>(null);
  const [bundle, setBundle] = useState<object | null>(null);

  const handleFocus = (fieldId: string) => {
    setActiveRef(getFhirReference(fieldId));
  };

  const handleGenerate = (data: ReferralFormData) => {
    setBundle(buildBundle(data));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-800">診療情報提供書 FHIR PoC</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          JP-CLINS eReferral FHIR Builder — 参照仕様:{' '}
          <a href="https://jpfhir.jp/fhir/clins/igv1/index.html" target="_blank" className="text-blue-400 hover:underline">
            JP-CLINS igv1
          </a>
          {' / '}
          <a href="https://jpfhir.jp/fhir/core/1.2.0/index.html" target="_blank" className="text-blue-400 hover:underline">
            JP Core v1.2.0
          </a>
        </p>
      </header>

      {/* メインレイアウト: 左フォーム / 右サイドパネル */}
      <div className="flex h-[calc(100vh-120px)]">
        <div className="w-1/2 p-4 overflow-hidden flex flex-col">
          <FormPanel onFocus={handleFocus} onGenerate={handleGenerate} />
        </div>
        <div className="w-1/2 p-4 overflow-y-auto border-l border-gray-200">
          <SidePanel reference={activeRef} />
        </div>
      </div>

      {/* 下部: FHIR JSON出力エリア */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-600">📄 生成されたFHIR JSON (Bundle)</h2>
          <span className="text-xs text-gray-400">JP_Bundle_eReferral</span>
        </div>
        <FhirJsonViewer bundle={bundle} />
      </div>
    </div>
  );
}
```

**Step 3: 動作確認**

```bash
npm run dev
```

Expected: フォーム入力 → FHIR JSON生成が動作する

**Step 4: Commit**

```bash
git add src/
git commit -m "feat: wire up FormPanel, SidePanel, and FHIR JSON viewer in App"
```

---

## Task 9: uuid パッケージ追加と動的ID生成

**Files:**
- Modify: `package.json`
- Modify: `src/components/sections/ConditionSection.tsx` (他の複数件セクションも同様)

**Step 1: uuid をインストール**

```bash
npm install uuid
npm install -D @types/uuid
```

**Step 2: 複数件セクションのID生成に使用**

各セクションの `+追加` ボタンの実装で `uuid` を使う:

```typescript
import { v4 as uuidv4 } from 'uuid';

const addItem = () => {
  onChange([...data, { id: uuidv4(), /* 他フィールド初期値 */ }]);
};
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add uuid for dynamic resource ID generation"
```

---

## Task 10: 最終動作確認とポリッシュ

**Step 1: サンプルデータでエンドツーエンド動作確認**

1. `npm run dev` で起動
2. 「📋 サンプル読み込み」をクリック
3. 各フィールドをクリックしてサイドパネルの仕様解説が表示されることを確認
4. 「🔄 FHIR JSON生成」をクリック
5. 生成されたJSONが正しいBundle構造になっていることを確認:
   - `resourceType: "Bundle"`
   - `type: "document"`
   - `entry[0].resource.resourceType: "Composition"`
   - 各セクションにentryが含まれること

**Step 2: TypeScriptコンパイルエラーがないことを確認**

```bash
npm run build
```

Expected: エラーなし

**Step 3: Final Commit**

```bash
git add .
git commit -m "feat: complete FHIR referral PoC implementation"
```
