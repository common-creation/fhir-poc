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
  example: object | string;
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
  'referralTo.practitioner.nameText': {
    fieldId: 'referralTo.practitioner.nameText',
    fhirPath: 'Practitioner.name.text',
    resourceType: 'Practitioner',
    profile: 'JP_Practitioner',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-practitioner.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '0..1',
    mustSupport: false,
    fhirType: 'HumanName',
    description: '紹介先医師の氏名。任意項目。紹介先が特定の医師宛の場合に記入する。',
    example: {
      text: '鈴木 花子',
      family: '鈴木',
      given: ['花子'],
    },
  },
  'referralTo.organization.name': {
    fieldId: 'referralTo.organization.name',
    fhirPath: 'Organization.name',
    resourceType: 'Organization',
    profile: 'JP_Organization',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-organization.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '0..1',
    mustSupport: false,
    fhirType: 'string',
    description: '紹介先医療機関の名称。任意項目。Compositionの紹介先情報セクション（コード: 910）に登録される。',
    example: '東京大学医学部附属病院',
  },
  'referralTo.organization.hopd': {
    fieldId: 'referralTo.organization.hopd',
    fhirPath: 'Organization.identifier',
    resourceType: 'Organization',
    profile: 'JP_Organization',
    profileUrl: 'https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-organization.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html',
    cardinality: '0..1',
    mustSupport: false,
    fhirType: 'Identifier',
    description: '紹介先医療機関コード（HOPDコード）。任意項目。',
    example: {
      system: 'http://jpfhir.jp/fhir/core/IdSystem/insurance-medical-institution-no',
      value: '1310000002',
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
  'history': {
    fieldId: 'history',
    fhirPath: 'Composition.section[code=360].text.div',
    resourceType: 'Composition',
    profile: 'JP_Composition_eReferral',
    profileUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Composition-eReferral.html',
    clinsUrl: 'https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Composition-eReferral.html',
    cardinality: '0..1',
    mustSupport: false,
    fhirType: 'Narrative',
    description: '現病歴セクション（コード: 360）。現在の疾患の発症から現在までの経過をフリーテキストで記述する。Narrative型（XHTML）で格納される。',
    example: {
      status: 'generated',
      div: '<div xmlns="http://www.w3.org/1999/xhtml">2015年より2型糖尿病で加療中。近年HbA1c高値が持続。</div>',
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
