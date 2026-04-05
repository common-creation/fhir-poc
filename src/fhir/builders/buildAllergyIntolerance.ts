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
