// JP_Practitioner プロファイルに基づくPractitionerリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-practitioner.html

import type { PractitionerFormData } from '../types';

export function buildPractitioner(data: PractitionerFormData, id: string): object {
  return {
    resourceType: 'Practitioner',
    id,
    meta: {
      profile: ['http://jpfhir.jp/fhir/core/StructureDefinition/JP_Practitioner'],
    },
    name: [
      {
        use: 'official',
        text: data.nameText,
        family: data.nameText.split(' ')[0] ?? data.nameText,
        given: [data.nameText.split(' ')[1] ?? ''],
      },
      ...(data.nameKana
        ? [
            {
              extension: [
                {
                  url: 'http://hl7.org/fhir/StructureDefinition/iso21090-EN-representation',
                  valueCode: 'SYL',
                },
              ],
              use: 'official',
              text: data.nameKana,
            },
          ]
        : []),
    ],
  };
}
