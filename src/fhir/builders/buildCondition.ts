// JP_Condition プロファイルに基づくConditionリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-condition.html
// ICD-10コード体系: http://hl7.org/fhir/sid/icd-10

import type { ConditionFormData } from '../types';

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
