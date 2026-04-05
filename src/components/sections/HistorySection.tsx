import { FieldWithHelp } from '../common/FieldWithHelp';

const textareaClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

interface Props {
  data: string;
  onChange: (data: string) => void;
  onFocus: (fieldId: string) => void;
}

export function HistorySection({ data, onChange, onFocus }: Props) {
  return (
    <FieldWithHelp label="現病歴" fhirPath="Composition.section[360].text.div">
      <textarea rows={5} className={textareaClass} value={data}
        onChange={e => onChange(e.target.value)}
        onFocus={() => onFocus('history')}
        placeholder="現在の疾患の発症から現在までの経過を記述してください。" />
    </FieldWithHelp>
  );
}
