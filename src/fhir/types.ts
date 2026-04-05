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
