// JP_Patient_eCS プロファイルに基づくPatientリソース生成
// 仕様: https://jpfhir.jp/fhir/eCS/StructureDefinition/JP_Patient_eCS

import type { PatientFormData } from '../types';

function splitName(fullName: string): { family: string; given: string[] } {
  const parts = fullName.trim().split(/\s+/);
  const family = parts[0] ?? fullName;
  // given は必須（JP_Patient_eCS）。姓のみの場合は空文字を使わず姓全体をgivenにも入れる
  const given = parts[1] ? [parts[1]] : [family];
  return { family, given };
}

export function buildPatient(data: PatientFormData, patientId: string): object {
  const now = new Date().toISOString();

  // 公式サンプル準拠: name[0]にIDE(漢字)拡張を付与
  const officialName: Record<string, unknown> = {
    extension: [{
      url: 'http://hl7.org/fhir/StructureDefinition/iso21090-EN-representation',
      valueCode: 'IDE',
    }],
    use: 'official',
    text: data.nameText,
    ...splitName(data.nameText),
  };

  return {
    resourceType: 'Patient',
    id: patientId,
    meta: {
      lastUpdated: now,
      profile: ['http://jpfhir.jp/fhir/eCS/StructureDefinition/JP_Patient_eCS'],
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">${data.nameText}</div>`,
    },
    // JP_Patient_eCS必須: 被保険者識別子 (JP_Insurance_memberID)
    identifier: [{
      system: 'http://jpfhir.jp/fhir/clins/Idsystem/JP_Insurance_memberID',
      value: data.patientId || '99999999:999:999:99',
    }],
    active: true,
    name: [
      officialName,
      ...(data.nameKana
        ? [{
            extension: [{
              url: 'http://hl7.org/fhir/StructureDefinition/iso21090-EN-representation',
              valueCode: 'SYL',
            }],
            use: 'official',
            text: data.nameKana,
            given: [data.nameKana],
          }]
        : []),
    ],
    gender: data.gender,
    birthDate: data.birthDate,
    // JP_Patient_eCS必須: address
    address: data.address
      ? [{
          text: data.address,
          ...(data.postalCode ? { postalCode: data.postalCode } : {}),
          country: 'JP',
        }]
      : [{ text: '不明', country: 'JP' }],
  };
}
