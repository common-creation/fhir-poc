import type { PatientFormData } from '../../fhir/types';
import { FieldWithHelp } from '../common/FieldWithHelp';

const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

interface Props {
  data: PatientFormData;
  onChange: (data: PatientFormData) => void;
  onFocus: (fieldId: string) => void;
}

export function PatientSection({ data, onChange, onFocus }: Props) {
  const update = (key: keyof PatientFormData, value: string) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="space-y-0">
      <FieldWithHelp label="患者名（漢字）" fhirPath="Patient.name[0].text" required>
        <input type="text" className={inputClass} value={data.nameText}
          onChange={e => update('nameText', e.target.value)}
          onFocus={() => onFocus('patient.nameText')} placeholder="例: 山田 太郎" />
      </FieldWithHelp>
      <FieldWithHelp label="患者名（カナ）" fhirPath="Patient.name[1].text">
        <input type="text" className={inputClass} value={data.nameKana}
          onChange={e => update('nameKana', e.target.value)}
          onFocus={() => onFocus('patient.nameKana')} placeholder="例: ヤマダ タロウ" />
      </FieldWithHelp>
      <FieldWithHelp label="生年月日" fhirPath="Patient.birthDate" required>
        <input type="date" className={inputClass} value={data.birthDate}
          onChange={e => update('birthDate', e.target.value)}
          onFocus={() => onFocus('patient.birthDate')} />
      </FieldWithHelp>
      <FieldWithHelp label="性別" fhirPath="Patient.gender" required>
        <select className={inputClass} value={data.gender}
          onChange={e => update('gender', e.target.value)}
          onFocus={() => onFocus('patient.gender')}>
          <option value="male">男性 (male)</option>
          <option value="female">女性 (female)</option>
          <option value="other">その他 (other)</option>
          <option value="unknown">不明 (unknown)</option>
        </select>
      </FieldWithHelp>
      <FieldWithHelp label="患者ID" fhirPath="Patient.identifier.value" required>
        <input type="text" className={inputClass} value={data.patientId}
          onChange={e => update('patientId', e.target.value)}
          onFocus={() => onFocus('patient.patientId')} placeholder="例: 12345678" />
      </FieldWithHelp>
    </div>
  );
}
