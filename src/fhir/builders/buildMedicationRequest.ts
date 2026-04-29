// JP_MedicationRequest プロファイルに基づくMedicationRequestリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-medicationrequest.html
// YJコード(薬価基準収載医薬品コード): urn:oid:1.2.392.100495.20.1.73

import type { MedicationFormData } from '../types';

export function buildMedicationRequest(data: MedicationFormData, patientRef: string): object {
  const now = new Date().toISOString();
  return {
    resourceType: 'MedicationRequest',
    id: data.id,
    meta: {
      lastUpdated: now,
      profile: ['http://jpfhir.jp/fhir/eCS/StructureDefinition/JP_MedicationRequest_eCS'],
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">${data.name}</div>`,
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
    subject: { reference: `urn:uuid:${patientRef}` },
    dosageInstruction: [
      {
        text: [data.dose, data.frequency].filter(Boolean).join(' '),
      },
    ],
  };
}
