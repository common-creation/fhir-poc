// JP_AllergyIntolerance プロファイルに基づくAllergyIntoleranceリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-allergyintolerance.html

import type { AllergyFormData } from '../types';

export function buildAllergyIntolerance(data: AllergyFormData, patientRef: string): object {
  const now = new Date().toISOString();
  return {
    resourceType: 'AllergyIntolerance',
    id: data.id,
    meta: {
      lastUpdated: now,
      profile: ['http://jpfhir.jp/fhir/eCS/StructureDefinition/JP_AllergyIntolerance_eCS'],
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">${data.substance}</div>`,
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
    patient: { reference: `urn:uuid:${patientRef}` },
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
