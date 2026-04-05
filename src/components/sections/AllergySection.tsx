import type { AllergyFormData } from '../../fhir/types';
import { FieldWithHelp } from '../common/FieldWithHelp';

const inputClass = 'border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

interface Props {
  data: AllergyFormData[];
  onChange: (data: AllergyFormData[]) => void;
  onFocus: (fieldId: string) => void;
}

const EMPTY_ALLERGY = (): AllergyFormData => ({
  id: crypto.randomUUID(),
  substance: '',
  category: 'medication',
  criticality: 'low',
  severity: undefined,
  manifestation: '',
});

export function AllergySection({ data, onChange, onFocus }: Props) {
  const add = () => onChange([...data, EMPTY_ALLERGY()]);
  const remove = (id: string) => onChange(data.filter(a => a.id !== id));
  const update = (id: string, key: keyof AllergyFormData, value: string) =>
    onChange(data.map(a => a.id === id ? { ...a, [key]: value } : a));

  return (
    <div>
      {data.map((allergy, i) => (
        <div key={allergy.id} className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-500">アレルギー #{i + 1}</span>
            <button onClick={() => remove(allergy.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
          </div>
          <FieldWithHelp label="原因物質" fhirPath="AllergyIntolerance.code.text">
            <input type="text" className={inputClass + ' w-full'} value={allergy.substance}
              onChange={e => update(allergy.id, 'substance', e.target.value)}
              onFocus={() => onFocus('allergy.substance')} placeholder="例: ペニシリン系抗菌薬" />
          </FieldWithHelp>
          <div className="grid grid-cols-2 gap-2">
            <FieldWithHelp label="種別" fhirPath="AllergyIntolerance.category">
              <select className={inputClass + ' w-full'} value={allergy.category}
                onChange={e => update(allergy.id, 'category', e.target.value)}
                onFocus={() => onFocus('allergy.substance')}>
                <option value="medication">薬物 (medication)</option>
                <option value="food">食物 (food)</option>
                <option value="environment">環境 (environment)</option>
                <option value="biologic">生物製剤 (biologic)</option>
              </select>
            </FieldWithHelp>
            <FieldWithHelp label="重篤度リスク" fhirPath="AllergyIntolerance.criticality">
              <select className={inputClass + ' w-full'} value={allergy.criticality}
                onChange={e => update(allergy.id, 'criticality', e.target.value)}
                onFocus={() => onFocus('allergy.criticality')}>
                <option value="low">低 (low)</option>
                <option value="high">高 (high)</option>
                <option value="unable-to-assess">評価不能</option>
              </select>
            </FieldWithHelp>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FieldWithHelp label="反応の重症度" fhirPath="AllergyIntolerance.reaction.severity">
              <select className={inputClass + ' w-full'} value={allergy.severity ?? ''}
                onChange={e => update(allergy.id, 'severity', e.target.value)}
                onFocus={() => onFocus('allergy.criticality')}>
                <option value="">未設定</option>
                <option value="mild">軽度 (mild)</option>
                <option value="moderate">中等度 (moderate)</option>
                <option value="severe">重篤 (severe)</option>
              </select>
            </FieldWithHelp>
            <FieldWithHelp label="症状" fhirPath="AllergyIntolerance.reaction.manifestation">
              <input type="text" className={inputClass + ' w-full'} value={allergy.manifestation ?? ''}
                onChange={e => update(allergy.id, 'manifestation', e.target.value)}
                onFocus={() => onFocus('allergy.substance')} placeholder="例: 蕁麻疹" />
            </FieldWithHelp>
          </div>
        </div>
      ))}
      <button onClick={add}
        className="w-full py-2 border border-dashed border-blue-300 text-blue-400 hover:bg-blue-50 rounded-lg text-sm">
        ＋ アレルギーを追加
      </button>
    </div>
  );
}
