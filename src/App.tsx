import { useState } from 'react';
import { FormPanel } from './components/layout/FormPanel';
import { SidePanel } from './components/layout/SidePanel';
import { FhirJsonViewer } from './components/output/FhirJsonViewer';
import { buildBundle } from './fhir/builders/buildBundle';
import { getFhirReference } from './fhir/references';
import type { FhirFieldReference } from './fhir/references';
import type { ReferralFormData } from './fhir/types';

export default function App() {
  const [activeRef, setActiveRef] = useState<FhirFieldReference | null>(null);
  const [bundle, setBundle] = useState<object | null>(null);

  const handleFocus = (fieldId: string) => {
    setActiveRef(getFhirReference(fieldId));
  };

  const handleGenerate = (data: ReferralFormData) => {
    setBundle(buildBundle(data));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-800">診療情報提供書 FHIR PoC</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          JP-CLINS eReferral FHIR Builder — 参照仕様:{' '}
          <a href="https://jpfhir.jp/fhir/clins/igv1/index.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            JP-CLINS igv1
          </a>
          {' / '}
          <a href="https://jpfhir.jp/fhir/core/1.2.0/index.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            JP Core v1.2.0
          </a>
        </p>
      </header>

      {/* メインレイアウト: 左フォーム / 右サイドパネル */}
      <div className="flex h-[calc(100vh-140px)]">
        <div className="w-1/2 p-4 overflow-hidden flex flex-col border-r border-gray-200">
          <FormPanel onFocus={handleFocus} onGenerate={handleGenerate} />
        </div>
        <div className="w-1/2 p-4 overflow-y-auto">
          <SidePanel reference={activeRef} />
        </div>
      </div>

      {/* 下部: FHIR JSON出力エリア */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-600">📄 生成されたFHIR JSON (Bundle)</h2>
          <span className="text-xs text-gray-400">
            JP_Bundle_eReferral — 仕様:{' '}
            <a href="https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              StructureDefinition
            </a>
          </span>
        </div>
        <FhirJsonViewer bundle={bundle} />
      </div>
    </div>
  );
}
