// JP_Condition_eCS プロファイルに基づくConditionリソース生成
// 仕様: https://jpfhir.jp/fhir/eCS/StructureDefinition/JP_Condition_eCS

import type { ConditionFormData } from '../types';

const CLINICAL_STATUS_SYSTEM = 'http://terminology.hl7.org/CodeSystem/condition-clinical';

const CLINICAL_STATUS_DISPLAY: Record<string, string> = {
  active: 'Active',
  resolved: 'Resolved',
  inactive: 'Inactive',
};

export function buildCondition(data: ConditionFormData, patientRef: string): object {
  const now = new Date().toISOString();

  // JP_Condition_eCS必須: code.coding:medisRecordNo（MEDISキー番号）が必須
  // ICD-10コードもある場合は追加、ない場合はMEDISのみ
  // MEDISコード未知の場合は病名テキスト検索キー "ZZZ99999" を使用
  const codeCoding = [
    {
      system: 'http://medis.or.jp/CodeSystem/master-disease-keyNumber',
      code: data.medisCode ?? 'ZZZ99999',
      display: data.name,
    },
    ...(data.icd10Code
      ? [{
          system: 'http://hl7.org/fhir/sid/icd-10',
          code: data.icd10Code,
          display: data.name,
        }]
      : []),
  ];

  return {
    resourceType: 'Condition',
    id: data.id,
    meta: {
      lastUpdated: now,
      profile: ['http://jpfhir.jp/fhir/eCS/StructureDefinition/JP_Condition_eCS'],
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">${data.name}</div>`,
    },
    // JP_Condition_eCS必須: identifier
    identifier: [{
      system: 'http://jpfhir.jp/fhir/core/IdSystem/resourceInstance-identifier',
      value: data.id,
    }],
    clinicalStatus: {
      coding: [{
        system: CLINICAL_STATUS_SYSTEM,
        code: data.clinicalStatus,
        display: CLINICAL_STATUS_DISPLAY[data.clinicalStatus] ?? data.clinicalStatus,
      }],
    },
    // JP_Condition_eCS必須: verificationStatus（displayも必須）
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed',
        display: 'Confirmed',
      }],
    },
    // categoryはHL7標準のcondition-categoryを使用（公式サンプル準拠）
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-category',
        code: 'encounter-diagnosis',
      }],
    }],
    code: {
      coding: codeCoding,
      text: data.name,
    },
    subject: { reference: `urn:uuid:${patientRef}` },
    ...(data.onsetDate ? { onsetDateTime: data.onsetDate } : {}),
  };
}
