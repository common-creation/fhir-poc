// JP_Organization プロファイルに基づくOrganizationリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-organization.html
// HOPDコード(医療機関コード)仕様: http://jpfhir.jp/fhir/core/IdSystem/insurance-medical-institution-no

import type { OrganizationFormData } from '../types';

export function buildOrganization(data: OrganizationFormData, id: string): object {
  const now = new Date().toISOString();
  // JP_Organization_eCS必須: identifier（medicalInstitutionCode）と name の両方が必要
  // HOPDが未入力の場合はダミーの10桁コードを使用
  const hopd = data.hopd || '1310000001';

  return {
    resourceType: 'Organization',
    id,
    meta: {
      lastUpdated: now,
      profile: ['http://jpfhir.jp/fhir/eCS/StructureDefinition/JP_Organization_eCS'],
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">${data.name || '医療機関'}</div>`,
    },
    identifier: [{
      system: 'http://jpfhir.jp/fhir/core/IdSystem/insurance-medical-institution-no',
      value: hopd,
    }],
    name: data.name || '医療機関',
    ...(data.tel ? { telecom: [{ system: 'phone', value: data.tel }] } : {}),
    ...(data.address ? { address: [{ text: data.address }] } : {}),
  };
}
