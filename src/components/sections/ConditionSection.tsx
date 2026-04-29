import type { ConditionFormData } from '../../fhir/types';
import { FieldWithHelp } from '../common/FieldWithHelp';

const inputClass = 'border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

const MEDIS_EXAMPLES: { code: string; display: string }[] = [
  { code: '20075383', display: '腹痛症' },
  { code: '20061593', display: '高血圧症' },
  { code: '20071549', display: '糖尿病' },
  { code: '20083904', display: '脳梗塞' },
  { code: '20057913', display: '気管支喘息' },
  { code: '20073542', display: '肺炎' },
  { code: '20065604', display: '心不全' },
  { code: '20058911', display: '狭心症' },
  { code: '20076630', display: '慢性閉塞性肺疾患' },
];

interface Props {
  data: ConditionFormData[];
  onChange: (data: ConditionFormData[]) => void;
  onFocus: (fieldId: string) => void;
}

const EMPTY_CONDITION = (): ConditionFormData => ({
  id: crypto.randomUUID(),
  name: '',
  icd10Code: '',
  medisCode: '',
  clinicalStatus: 'active',
  category: 'chief-complaint',
  onsetDate: '',
});

export function ConditionSection({ data, onChange, onFocus }: Props) {
  const add = () => onChange([...data, EMPTY_CONDITION()]);
  const remove = (id: string) => onChange(data.filter(c => c.id !== id));
  const update = (id: string, key: keyof ConditionFormData, value: string) =>
    onChange(data.map(c => c.id === id ? { ...c, [key]: value } : c));

  return (
    <div>
      {data.map((cond, i) => (
        <div key={cond.id} className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-500">傷病 #{i + 1}</span>
            <button onClick={() => remove(cond.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
          </div>
          <FieldWithHelp label="傷病名" fhirPath="Condition.code.text" required>
            <input type="text" className={inputClass + ' w-full'} value={cond.name}
              onChange={e => update(cond.id, 'name', e.target.value)}
              onFocus={() => onFocus('condition.name')} placeholder="例: 2型糖尿病" />
          </FieldWithHelp>
          <FieldWithHelp label="MEDISコード" fhirPath="Condition.code.coding[medisRecordNo].code">
            <input type="text" className={inputClass + ' w-full'} value={cond.medisCode ?? ''}
              onChange={e => update(cond.id, 'medisCode', e.target.value)}
              onFocus={() => onFocus('condition.name')} placeholder="例: 20075383" />
            <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <span className="font-semibold">MEDIS標準病名マスタ5.16版の例：</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {MEDIS_EXAMPLES.map(ex => (
                  <button
                    key={ex.code}
                    type="button"
                    onClick={() => {
                      update(cond.id, 'medisCode', ex.code);
                      update(cond.id, 'name', ex.display);
                    }}
                    className="px-1.5 py-0.5 bg-white border border-amber-300 rounded hover:bg-amber-100 font-mono whitespace-nowrap"
                    title={ex.display}
                  >
                    {ex.code} {ex.display}
                  </button>
                ))}
              </div>
            </div>
          </FieldWithHelp>
          <div className="grid grid-cols-2 gap-2">
            <FieldWithHelp label="ICD-10コード" fhirPath="Condition.code.coding[1].code">
              <input type="text" className={inputClass + ' w-full'} value={cond.icd10Code ?? ''}
                onChange={e => update(cond.id, 'icd10Code', e.target.value)}
                onFocus={() => onFocus('condition.name')} placeholder="例: E11" />
            </FieldWithHelp>
            <FieldWithHelp label="発症日" fhirPath="Condition.onsetDateTime">
              <input type="date" className={inputClass + ' w-full'} value={cond.onsetDate ?? ''}
                onChange={e => update(cond.id, 'onsetDate', e.target.value)}
                onFocus={() => onFocus('condition.name')} />
            </FieldWithHelp>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FieldWithHelp label="臨床状態" fhirPath="Condition.clinicalStatus">
              <select className={inputClass + ' w-full'} value={cond.clinicalStatus}
                onChange={e => update(cond.id, 'clinicalStatus', e.target.value)}
                onFocus={() => onFocus('condition.clinicalStatus')}>
                <option value="active">現在罹患中 (active)</option>
                <option value="resolved">治癒済 (resolved)</option>
                <option value="inactive">非活動的 (inactive)</option>
              </select>
            </FieldWithHelp>
            <FieldWithHelp label="種別" fhirPath="Condition.category">
              <select className={inputClass + ' w-full'} value={cond.category}
                onChange={e => update(cond.id, 'category', e.target.value)}
                onFocus={() => onFocus('condition.name')}>
                <option value="chief-complaint">主病名・主訴</option>
                <option value="past-history">既往歴</option>
              </select>
            </FieldWithHelp>
          </div>
        </div>
      ))}
      <button onClick={add}
        className="w-full py-2 border border-dashed border-blue-300 text-blue-400 hover:bg-blue-50 rounded-lg text-sm">
        ＋ 傷病を追加
      </button>
    </div>
  );
}
