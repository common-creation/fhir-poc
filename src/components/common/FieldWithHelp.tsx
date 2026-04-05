// フォームフィールドのラベル + FHIR要素名を表示する共通コンポーネント

interface FieldWithHelpProps {
  label: string;         // 日本語ラベル（例: 患者名）
  fhirPath: string;      // FHIRパス（例: Patient.name.text）
  required?: boolean;
  children: React.ReactNode;
}

export function FieldWithHelp({ label, fhirPath, required, children }: FieldWithHelpProps) {
  return (
    <div className="mb-4">
      <label className="block mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {required && <span className="text-red-500 ml-1">*</span>}
        <span className="ml-2 text-xs text-blue-500 font-mono">{fhirPath}</span>
      </label>
      {children}
    </div>
  );
}
