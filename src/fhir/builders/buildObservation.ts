// JP_Observation_VitalSigns プロファイルに基づくObservationリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-observation-vitalsigns.html
// LOINCコード体系: https://loinc.org/
// UCUM単位体系: http://unitsofmeasure.org

import type { ObservationFormData } from '../types';

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
