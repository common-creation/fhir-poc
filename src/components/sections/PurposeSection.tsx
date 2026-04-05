import { FieldWithHelp } from '../common/FieldWithHelp';

const textareaClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

interface Props {
  data: string;
  onChange: (data: string) => void;
  onFocus: (fieldId: string) => void;
}

export function PurposeSection({ data, onChange, onFocus }: Props) {
  return (
    <FieldWithHelp label="紹介目的" fhirPath="Composition.section[950].text.div" required>
      <textarea rows={4} className={textareaClass} value={data}
        onChange={e => onChange(e.target.value)}
        onFocus={() => onFocus('purpose')}
        placeholder="例: 2型糖尿病のコントロール不良により、専門的な治療・管理をお願いしたく紹介いたします。" />
    </FieldWithHelp>
  );
}
