// FHIR Bundle JSONをシンタックスハイライト付きで表示するコンポーネント

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('json', json);

interface FhirJsonViewerProps {
  bundle: object | null;
}

export function FhirJsonViewer({ bundle }: FhirJsonViewerProps) {
  if (!bundle) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-400 text-sm">「FHIR JSON生成」ボタンを押すとここにFHIR Bundleが表示されます</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b border-gray-200">
        <span className="text-sm font-medium text-gray-600">Bundle (type: document)</span>
        <span className="text-xs text-gray-400">JP-CLINS JP_Bundle_eReferral</span>
      </div>
      <SyntaxHighlighter
        language="json"
        style={githubGist}
        customStyle={{ margin: 0, maxHeight: '500px', fontSize: '12px' }}
      >
        {JSON.stringify(bundle, null, 2)}
      </SyntaxHighlighter>
    </div>
  );
}
