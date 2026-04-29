// JP_Practitioner プロファイルに基づくPractitionerリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-practitioner.html

import type { PractitionerFormData } from '../types';

function splitName(fullName: string): { family?: string; given?: string[] } {
  const parts = fullName.trim().split(/\s+/);
  const family = parts[0];
  const givenPart = parts[1];
  const result: { family?: string; given?: string[] } = {};
  if (family) result.family = family;
  if (givenPart) result.given = [givenPart];
  return result;
}

export function buildPractitioner(data: PractitionerFormData, id: string): object {
  const now = new Date().toISOString();

  const base = {
    resourceType: 'Practitioner',
    id,
    meta: {
      lastUpdated: now,
      profile: ['http://jpfhir.jp/fhir/eCS/StructureDefinition/JP_Practitioner_eCS'],
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">${data.nameText || '医師'}</div>`,
    },
  };

  if (!data.nameText) return base;

  return {
    ...base,
    name: [
      {
        use: 'official',
        text: data.nameText,
        ...splitName(data.nameText),
      },
      ...(data.nameKana
        ? [{
            extension: [{
              url: 'http://hl7.org/fhir/StructureDefinition/iso21090-EN-representation',
              valueCode: 'SYL',
            }],
            use: 'official',
            text: data.nameKana,
          }]
        : []),
    ],
  };
}
