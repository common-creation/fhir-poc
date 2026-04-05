// フォームフィールドにフォーカスした際にFHIR仕様解説を表示するサイドパネル

import type { FhirFieldReference } from '../../fhir/references';

interface SidePanelProps {
  reference: FhirFieldReference | null;
}

export function SidePanel({ reference }: SidePanelProps) {
  if (!reference) {
    return (
      <div className="h-full flex items-start justify-center pt-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <div className="text-center text-gray-400">
          <p className="text-sm">フォームのフィールドをクリックすると</p>
          <p className="text-sm">FHIR仕様の解説が表示されます</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden text-sm">
      {/* ヘッダー */}
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
        <div className="font-mono text-blue-700 font-semibold">{reference.fhirPath}</div>
        <div className="text-blue-500 text-xs mt-0.5">{reference.resourceType} › {reference.profile}</div>
      </div>

      {/* メタ情報 */}
      <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-400">カーディナリティ</span>
          <div className="font-mono font-semibold text-gray-700">{reference.cardinality}</div>
        </div>
        <div>
          <span className="text-gray-400">FHIR型</span>
          <div className="font-mono font-semibold text-gray-700">{reference.fhirType}</div>
        </div>
        <div>
          <span className="text-gray-400">Must Support</span>
          <div className={`font-semibold ${reference.mustSupport ? 'text-green-600' : 'text-gray-400'}`}>
            {reference.mustSupport ? '✓ あり' : '－'}
          </div>
        </div>
      </div>

      {/* カーディナリティの意味説明 */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
        <span className="font-mono text-gray-600">{reference.cardinality}</span>
        {reference.cardinality === '1..1' && ' → 必須・1件のみ'}
        {reference.cardinality === '1..*' && ' → 必須・1件以上'}
        {reference.cardinality === '0..1' && ' → 任意・最大1件'}
        {reference.cardinality === '0..*' && ' → 任意・複数可'}
      </div>

      {/* 説明 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-xs text-gray-400 mb-1">説明</div>
        <div className="text-gray-700 leading-relaxed">{reference.description}</div>
      </div>

      {/* JSON例 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-xs text-gray-400 mb-1">FHIR JSON例</div>
        <pre className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-600 overflow-x-auto">
          {JSON.stringify(reference.example, null, 2)}
        </pre>
      </div>

      {/* 参照リンク */}
      <div className="px-4 py-3 space-y-1">
        <div className="text-xs text-gray-400 mb-1">参照仕様</div>
        <a
          href={reference.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
        >
          🔗 JP Core - {reference.profile}
        </a>
        <a
          href={reference.clinsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs"
        >
          🔗 JP-CLINS - Bundle eReferral
        </a>
      </div>
    </div>
  );
}
