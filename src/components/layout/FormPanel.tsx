import { useState } from 'react';
import type { ReferralFormData } from '../../fhir/types';
import { SAMPLE_DATA } from '../../fhir/sampleData';
import { PatientSection } from '../sections/PatientSection';
import { ReferralFromSection } from '../sections/ReferralFromSection';
import { ReferralToSection } from '../sections/ReferralToSection';
import { PurposeSection } from '../sections/PurposeSection';
import { ConditionSection } from '../sections/ConditionSection';
import { HistorySection } from '../sections/HistorySection';
import { AllergySection } from '../sections/AllergySection';
import { ObservationSection } from '../sections/ObservationSection';
import { MedicationSection } from '../sections/MedicationSection';
import { MedWellImportSection } from '../sections/MedWellImportSection';

// アコーディオンセクション共通コンポーネント
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-lg mb-3">
      <button
        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 font-medium text-sm flex justify-between items-center rounded-lg"
        onClick={() => setOpen(o => !o)}
      >
        {title}
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 py-4">{children}</div>}
    </div>
  );
}

const EMPTY_FORM: ReferralFormData = {
  patient: { nameText: '', nameKana: '', birthDate: '', gender: 'male', patientId: '' },
  referralFrom: {
    practitioner: { nameText: '', nameKana: '' },
    organization: { name: '', hopd: '', tel: '', address: '' },
  },
  referralTo: {
    practitioner: { nameText: '', nameKana: '' },
    organization: { name: '', hopd: '', tel: '', address: '' },
  },
  purpose: '',
  conditions: [],
  history: '',
  allergies: [],
  observations: [],
  medications: [],
};

interface Props {
  onFocus: (fieldId: string) => void;
  onGenerate: (data: ReferralFormData) => void;
}

export function FormPanel({ onFocus, onGenerate }: Props) {
  const [form, setForm] = useState<ReferralFormData>(EMPTY_FORM);

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setForm(SAMPLE_DATA)}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
        >
          📋 サンプル読み込み
        </button>
        <button
          onClick={() => setForm(EMPTY_FORM)}
          className="px-3 py-2 text-sm bg-white hover:bg-gray-50 rounded-md border border-gray-300 text-gray-500"
        >
          クリア
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Section title="📄 Med-Well インポート（PDFデータから変換）">
          <MedWellImportSection
            onImport={data => setForm(data)}
            onFocus={onFocus}
          />
        </Section>
        <Section title="患者情報 / Patient">
          <PatientSection data={form.patient} onChange={p => setForm(f => ({ ...f, patient: p }))} onFocus={onFocus} />
        </Section>
        <Section title="紹介元情報 / ReferralFrom (Practitioner + Organization)">
          <ReferralFromSection data={form.referralFrom} onChange={v => setForm(f => ({ ...f, referralFrom: v }))} onFocus={onFocus} />
        </Section>
        <Section title="紹介先情報 / ReferralTo (Practitioner + Organization)">
          <ReferralToSection data={form.referralTo} onChange={v => setForm(f => ({ ...f, referralTo: v }))} onFocus={onFocus} />
        </Section>
        <Section title="紹介目的 / Purpose (Composition.section[950])">
          <PurposeSection data={form.purpose} onChange={v => setForm(f => ({ ...f, purpose: v }))} onFocus={onFocus} />
        </Section>
        <Section title="傷病名・既往歴 / Condition (1件以上必須)">
          <ConditionSection data={form.conditions} onChange={v => setForm(f => ({ ...f, conditions: v }))} onFocus={onFocus} />
        </Section>
        <Section title="現病歴 / History (Composition.section[360])">
          <HistorySection data={form.history} onChange={v => setForm(f => ({ ...f, history: v }))} onFocus={onFocus} />
        </Section>
        <Section title="アレルギー / AllergyIntolerance">
          <AllergySection data={form.allergies} onChange={v => setForm(f => ({ ...f, allergies: v }))} onFocus={onFocus} />
        </Section>
        <Section title="身体所見 / Observation (LOINCコード付き)">
          <ObservationSection data={form.observations} onChange={v => setForm(f => ({ ...f, observations: v }))} onFocus={onFocus} />
        </Section>
        <Section title="処方 / MedicationRequest (YJコード付き)">
          <MedicationSection data={form.medications} onChange={v => setForm(f => ({ ...f, medications: v }))} onFocus={onFocus} />
        </Section>
      </div>
      <div className="pt-4 border-t border-gray-200 mt-4">
        <button
          onClick={() => onGenerate(form)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm"
        >
          🔄 FHIR JSON生成
        </button>
      </div>
    </div>
  );
}
