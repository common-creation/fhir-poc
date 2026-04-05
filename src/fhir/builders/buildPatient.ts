// JP_Patient プロファイルに基づくPatientリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-patient.html

import type { PatientFormData } from '../types';

export function buildPatient(data: PatientFormData, patientId: string): object {
  return {
    resourceType: 'Patient',
    id: patientId,
    meta: {
      profile: ['http://jpfhir.jp/fhir/core/StructureDefinition/JP_Patient'],
    },
    identifier: [
      {
        // 医療機関の患者番号。systemはOID形式で医療機関コードを含む
        system: `urn:oid:1.2.392.100495.20.3.51.1${data.patientId}`,
        value: data.patientId,
      },
    ],
    name: [
      {
        // 漢字氏名 (use: official)
        use: 'official',
        text: data.nameText,
        family: data.nameText.split(' ')[0] ?? data.nameText,
        given: [data.nameText.split(' ')[1] ?? ''],
      },
      ...(data.nameKana
        ? [
            {
              // カナ氏名: iso21090-EN-representation拡張でSYL(Syllabic)を指定
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
    gender: data.gender,
    birthDate: data.birthDate,
  };
}
