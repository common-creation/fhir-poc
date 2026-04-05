import type { PractitionerFormData, OrganizationFormData } from '../../fhir/types';
import { FieldWithHelp } from '../common/FieldWithHelp';

const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

interface ReferralToData {
  practitioner: PractitionerFormData;
  organization: OrganizationFormData;
}

interface Props {
  data: ReferralToData;
  onChange: (data: ReferralToData) => void;
  onFocus: (fieldId: string) => void;
}

export function ReferralToSection({ data, onChange, onFocus }: Props) {
  const updatePract = (key: keyof PractitionerFormData, value: string) =>
    onChange({ ...data, practitioner: { ...data.practitioner, [key]: value } });
  const updateOrg = (key: keyof OrganizationFormData, value: string) =>
    onChange({ ...data, organization: { ...data.organization, [key]: value } });

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">医師情報 / Practitioner</p>
      <FieldWithHelp label="医師名" fhirPath="Practitioner.name.text">
        <input type="text" className={inputClass} value={data.practitioner.nameText}
          onChange={e => updatePract('nameText', e.target.value)}
          onFocus={() => onFocus('referralTo.practitioner.nameText')} placeholder="例: 田中 一郎" />
      </FieldWithHelp>
      <FieldWithHelp label="医師名（カナ）" fhirPath="Practitioner.name (SYL)">
        <input type="text" className={inputClass} value={data.practitioner.nameKana ?? ''}
          onChange={e => updatePract('nameKana', e.target.value)}
          onFocus={() => onFocus('referralTo.practitioner.nameText')} placeholder="例: タナカ イチロウ" />
      </FieldWithHelp>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-4">医療機関 / Organization</p>
      <FieldWithHelp label="医療機関名" fhirPath="Organization.name">
        <input type="text" className={inputClass} value={data.organization.name}
          onChange={e => updateOrg('name', e.target.value)}
          onFocus={() => onFocus('referralTo.organization.name')} placeholder="例: さくら内科クリニック" />
      </FieldWithHelp>
      <FieldWithHelp label="医療機関コード（HOPDコード）" fhirPath="Organization.identifier">
        <input type="text" className={inputClass} value={data.organization.hopd}
          onChange={e => updateOrg('hopd', e.target.value)}
          onFocus={() => onFocus('referralTo.organization.hopd')} placeholder="例: 1310000001（10桁）" />
      </FieldWithHelp>
      <FieldWithHelp label="電話番号" fhirPath="Organization.telecom">
        <input type="text" className={inputClass} value={data.organization.tel ?? ''}
          onChange={e => updateOrg('tel', e.target.value)}
          onFocus={() => onFocus('referralTo.organization.name')} placeholder="例: 03-1234-5678" />
      </FieldWithHelp>
      <FieldWithHelp label="住所" fhirPath="Organization.address.text">
        <input type="text" className={inputClass} value={data.organization.address ?? ''}
          onChange={e => updateOrg('address', e.target.value)}
          onFocus={() => onFocus('referralTo.organization.name')} placeholder="例: 東京都千代田区..." />
      </FieldWithHelp>
    </div>
  );
}
