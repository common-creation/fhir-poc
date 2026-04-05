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
