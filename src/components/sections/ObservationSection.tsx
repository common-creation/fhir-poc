import type { ObservationFormData } from '../../fhir/types';
import { OBSERVATION_PRESETS } from '../../fhir/sampleData';
import { FieldWithHelp } from '../common/FieldWithHelp';

const inputClass = 'border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

interface Props {
  data: ObservationFormData[];
  onChange: (data: ObservationFormData[]) => void;
  onFocus: (fieldId: string) => void;
}

const EMPTY_OBS = (): ObservationFormData => ({
  id: crypto.randomUUID(),
  loincCode: '',
  displayName: '',
  value: '',
  unit: '',
  ucumUnit: '',
});

export function ObservationSection({ data, onChange, onFocus }: Props) {
  const add = () => onChange([...data, EMPTY_OBS()]);
  const remove = (id: string) => onChange(data.filter(o => o.id !== id));
  const update = (id: string, key: keyof ObservationFormData, value: string) =>
    onChange(data.map(o => o.id === id ? { ...o, [key]: value } : o));
  const applyPreset = (id: string, loincCode: string) => {
    const preset = OBSERVATION_PRESETS.find(p => p.loincCode === loincCode);
    if (preset) {
      onChange(data.map(o => o.id === id ? { ...o, ...preset } : o));
    }
  };

  return (
    <div>
      {data.map((obs, i) => (
        <div key={obs.id} className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-500">所見 #{i + 1}</span>
            <button onClick={() => remove(obs.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
          </div>
          <FieldWithHelp label="項目（プリセット）" fhirPath="Observation.code (LOINC)">
            <select className={inputClass + ' w-full'} value={obs.loincCode}
              onChange={e => applyPreset(obs.id, e.target.value)}
              onFocus={() => onFocus('observation.value')}>
              <option value="">-- 選択してください --</option>
              {OBSERVATION_PRESETS.map(p => (
                <option key={p.loincCode} value={p.loincCode}>
                  {p.displayName} (LOINC: {p.loincCode})
                </option>
              ))}
            </select>
          </FieldWithHelp>
          <div className="grid grid-cols-2 gap-2">
            <FieldWithHelp label="値" fhirPath="Observation.valueQuantity.value">
              <input type="number" className={inputClass + ' w-full'} value={obs.value}
                onChange={e => update(obs.id, 'value', e.target.value)}
                onFocus={() => onFocus('observation.value')} placeholder="例: 68.5" />
            </FieldWithHelp>
            <FieldWithHelp label="単位" fhirPath="Observation.valueQuantity.unit">
              <input type="text" className={inputClass + ' w-full'} value={obs.unit}
                onChange={e => update(obs.id, 'unit', e.target.value)}
                onFocus={() => onFocus('observation.value')} placeholder="例: kg" />
            </FieldWithHelp>
          </div>
        </div>
      ))}
      <button onClick={add}
        className="w-full py-2 border border-dashed border-blue-300 text-blue-400 hover:bg-blue-50 rounded-lg text-sm">
        ＋ 身体所見を追加
      </button>
    </div>
  );
}
