import { MedicationFormData } from '../../fhir/types';
import { FieldWithHelp } from '../common/FieldWithHelp';

const inputClass = 'border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

interface Props {
  data: MedicationFormData[];
  onChange: (data: MedicationFormData[]) => void;
  onFocus: (fieldId: string) => void;
}

const EMPTY_MED = (): MedicationFormData => ({
  id: crypto.randomUUID(),
  name: '',
  yjCode: '',
  dose: '',
  frequency: '',
});

export function MedicationSection({ data, onChange, onFocus }: Props) {
  const add = () => onChange([...data, EMPTY_MED()]);
  const remove = (id: string) => onChange(data.filter(m => m.id !== id));
  const update = (id: string, key: keyof MedicationFormData, value: string) =>
    onChange(data.map(m => m.id === id ? { ...m, [key]: value } : m));

  return (
    <div>
      {data.map((med, i) => (
        <div key={med.id} className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-500">処方 #{i + 1}</span>
            <button onClick={() => remove(med.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
          </div>
          <FieldWithHelp label="薬品名" fhirPath="MedicationRequest.medicationCodeableConcept.text">
            <input type="text" className={inputClass + ' w-full'} value={med.name}
              onChange={e => update(med.id, 'name', e.target.value)}
              onFocus={() => onFocus('medication.name')} placeholder="例: メトホルミン塩酸塩錠250mg" />
          </FieldWithHelp>
          <FieldWithHelp label="YJコード（薬価基準収載医薬品コード）" fhirPath="MedicationRequest.medicationCodeableConcept.coding[0].code">
            <input type="text" className={inputClass + ' w-full'} value={med.yjCode ?? ''}
              onChange={e => update(med.id, 'yjCode', e.target.value)}
              onFocus={() => onFocus('medication.name')} placeholder="例: 3961003F1022" />
          </FieldWithHelp>
          <div className="grid grid-cols-2 gap-2">
            <FieldWithHelp label="用量" fhirPath="MedicationRequest.dosageInstruction.text">
              <input type="text" className={inputClass + ' w-full'} value={med.dose ?? ''}
                onChange={e => update(med.id, 'dose', e.target.value)}
                onFocus={() => onFocus('medication.name')} placeholder="例: 250mg" />
            </FieldWithHelp>
            <FieldWithHelp label="用法" fhirPath="MedicationRequest.dosageInstruction.text">
              <input type="text" className={inputClass + ' w-full'} value={med.frequency ?? ''}
                onChange={e => update(med.id, 'frequency', e.target.value)}
                onFocus={() => onFocus('medication.name')} placeholder="例: 1日2回 朝夕食後" />
            </FieldWithHelp>
          </div>
        </div>
      ))}
      <button onClick={add}
        className="w-full py-2 border border-dashed border-blue-300 text-blue-400 hover:bg-blue-50 rounded-lg text-sm">
        ＋ 処方を追加
      </button>
    </div>
  );
}
