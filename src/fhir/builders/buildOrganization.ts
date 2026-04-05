// JP_Organization プロファイルに基づくOrganizationリソース生成
// 仕様: https://jpfhir.jp/fhir/core/1.2.0/StructureDefinition-jp-organization.html
// HOPDコード(医療機関コード)仕様: http://jpfhir.jp/fhir/core/IdSystem/insurance-medical-institution-no

import type { OrganizationFormData } from '../types';

export function buildOrganization(data: OrganizationFormData, id: string): object {
  return {
    resourceType: 'Organization',
    id,
    meta: {
      profile: ['http://jpfhir.jp/fhir/core/StructureDefinition/JP_Organization'],
    },
    identifier: [
      {
        // 保険医療機関番号（HOPDコード）- 10桁
        system: 'http://jpfhir.jp/fhir/core/IdSystem/insurance-medical-institution-no',
        value: data.hopd,
      },
    ],
    name: data.name,
    ...(data.tel ? { telecom: [{ system: 'phone', value: data.tel }] } : {}),
    ...(data.address ? { address: [{ text: data.address }] } : {}),
  };
}
