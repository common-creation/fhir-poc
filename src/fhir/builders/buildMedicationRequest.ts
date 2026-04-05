// JP_MedicationRequest プロファイルに基づくMedicationRequestリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-medicationrequest.html
// YJコード(薬価基準収載医薬品コード): urn:oid:1.2.392.100495.20.1.73

import type { MedicationFormData } from '../types';

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
