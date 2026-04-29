/**
 * Med-Well 診療情報提供書インポートセクション
 *
 * Med-Wellシステムが生成したPDFに含まれるフィールドを入力すると、
 * ReferralFormDataに変換してフォーム全体に反映する。
 *
 * PDFの各フィールド定義:
 *   - 紹介先: 医療機関名、担当医師名、診療科
 *   - 予約: 予約日時
 *   - 患者: 氏名（漢字/カナ）、性別、生年月日、連絡先、住所
 *   - 臨床: 紹介目的、既往歴、主訴、症状経過
 */

import { useState } from 'react';
import type { ReferralFormData } from '../../fhir/types';
import type { MedWellReferralData } from '../../fhir/importers/fromMedWell';
import { fromMedWell, MEDWELL_SAMPLE } from '../../fhir/importers/fromMedWell';
import { FieldWithHelp } from '../common/FieldWithHelp';

const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';
const textareaClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

const EMPTY: MedWellReferralData = {
  toOrganizationName: '',
  toDoctorName: '',
  toDepartment: '',
  toOrganizationCode: '',
  toOrganizationTel: '',
  toOrganizationAddress: '',
  appointmentDatetime: '',
  patientName: '',
  patientNameKana: '',
  patientGender: '',
  patientBirthDate: '',
  patientTel: '',
  patientAddress: '',
  patientVisitHistory: '',
  patientId: '',
  fromOrganizationName: '',
  fromDoctorName: '',
  fromOrganizationCode: '',
  purpose: '',
  pastHistory: '',
  chiefComplaint: '',
  historyOfPresentIllness: '',
  notes: '',
};

interface Props {
  onImport: (data: ReferralFormData) => void;
  onFocus: (fieldId: string) => void;
}

export function MedWellImportSection({ onImport, onFocus }: Props) {
  const [form, setForm] = useState<MedWellReferralData>(EMPTY);
  const [imported, setImported] = useState(false);

  const update = (key: keyof MedWellReferralData, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleImport = () => {
    const converted = fromMedWell(form);
    onImport(converted);
    setImported(true);
    setTimeout(() => setImported(false), 3000);
  };

  const handleLoadSample = () => {
    setForm(MEDWELL_SAMPLE);
  };

  return (
    <div className="space-y-2">
      {/* 説明バナー */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
        <p className="font-semibold mb-1">📄 Med-Well 診療情報提供書インポート</p>
        <p>
          Med-WellのPDF（かかりつけ医の紹介予約取得機能で生成）に記載されているフィールドを入力すると、
          FHIR形式の診療情報提供書に自動変換します。
        </p>
        <p className="mt-1 text-amber-600">
          変換後のデータはフォーム全体に反映されます。アレルギー・身体所見・処方は別途フォームで追加してください。
        </p>
      </div>

      {/* サンプル読み込みボタン */}
      <button
        onClick={handleLoadSample}
        className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm rounded-lg border border-amber-300"
      >
        📋 PDFサンプルデータを読み込む（愛知医大 サンプル）
      </button>

      {/* 紹介先情報 */}
      <div className="pt-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">紹介先情報（PDF上部）</p>
        <FieldWithHelp label="医療機関名" fhirPath="Organization.name (referralTo)">
          <input type="text" className={inputClass} value={form.toOrganizationName}
            onChange={e => update('toOrganizationName', e.target.value)}
            onFocus={() => onFocus('referralTo.organization.name')}
            placeholder="例: 愛知医科大学病院" />
        </FieldWithHelp>
        <div className="grid grid-cols-2 gap-2">
          <FieldWithHelp label="担当医師名" fhirPath="Practitioner.name (referralTo)">
            <input type="text" className={inputClass} value={form.toDoctorName ?? ''}
              onChange={e => update('toDoctorName', e.target.value)}
              onFocus={() => onFocus('referralTo.practitioner.nameText')}
              placeholder="例: 橋本内科" />
          </FieldWithHelp>
          <FieldWithHelp label="診療科" fhirPath="Practitioner.qualification">
            <input type="text" className={inputClass} value={form.toDepartment ?? ''}
              onChange={e => update('toDepartment', e.target.value)}
              onFocus={() => onFocus('referralTo.practitioner.nameText')}
              placeholder="例: 呼吸器内科" />
          </FieldWithHelp>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FieldWithHelp label="医療機関コード（HOPD）" fhirPath="Organization.identifier">
            <input type="text" className={inputClass} value={form.toOrganizationCode ?? ''}
              onChange={e => update('toOrganizationCode', e.target.value)}
              onFocus={() => onFocus('referralTo.organization.hopd')}
              placeholder="例: 2310000001" />
          </FieldWithHelp>
          <FieldWithHelp label="予約日時" fhirPath="Composition.date">
            <input type="text" className={inputClass} value={form.appointmentDatetime ?? ''}
              onChange={e => update('appointmentDatetime', e.target.value)}
              onFocus={() => onFocus('purpose')}
              placeholder="例: 2026年4月30日 11:30" />
          </FieldWithHelp>
        </div>
      </div>

      {/* 患者情報 */}
      <div className="pt-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">患者情報（PDF中段）</p>
        <div className="grid grid-cols-2 gap-2">
          <FieldWithHelp label="患者氏名（漢字）" fhirPath="Patient.name[0].text">
            <input type="text" className={inputClass} value={form.patientName}
              onChange={e => update('patientName', e.target.value)}
              onFocus={() => onFocus('patient.nameText')}
              placeholder="例: 牟田和貴" />
          </FieldWithHelp>
          <FieldWithHelp label="フリガナ" fhirPath="Patient.name[1].text (SYL)">
            <input type="text" className={inputClass} value={form.patientNameKana ?? ''}
              onChange={e => update('patientNameKana', e.target.value)}
              onFocus={() => onFocus('patient.nameKana')}
              placeholder="例: ムタカズキ" />
          </FieldWithHelp>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FieldWithHelp label="性別" fhirPath="Patient.gender">
            <select className={inputClass} value={form.patientGender ?? ''}
              onChange={e => update('patientGender', e.target.value)}
              onFocus={() => onFocus('patient.gender')}>
              <option value="">未選択</option>
              <option value="男性">男性 → male</option>
              <option value="女性">女性 → female</option>
            </select>
          </FieldWithHelp>
          <FieldWithHelp label="生年月日" fhirPath="Patient.birthDate">
            <input type="text" className={inputClass} value={form.patientBirthDate ?? ''}
              onChange={e => update('patientBirthDate', e.target.value)}
              onFocus={() => onFocus('patient.birthDate')}
              placeholder="例: 1987年02月01日（ISO変換済）" />
          </FieldWithHelp>
        </div>
        <FieldWithHelp label="連絡先" fhirPath="Patient.telecom">
          <input type="text" className={inputClass} value={form.patientTel ?? ''}
            onChange={e => update('patientTel', e.target.value)}
            onFocus={() => onFocus('patient.patientId')}
            placeholder="例: 08011112222" />
        </FieldWithHelp>
        <FieldWithHelp label="住所" fhirPath="Patient.address.text">
          <input type="text" className={inputClass} value={form.patientAddress ?? ''}
            onChange={e => update('patientAddress', e.target.value)}
            onFocus={() => onFocus('patient.nameText')}
            placeholder="例: 〒1560041 東京都世田谷区大原1-32-11" />
        </FieldWithHelp>
      </div>

      {/* 紹介元情報 */}
      <div className="pt-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">紹介元情報（かかりつけ医クリニック）</p>
        <div className="grid grid-cols-2 gap-2">
          <FieldWithHelp label="紹介元医療機関名" fhirPath="Organization.name (referralFrom)">
            <input type="text" className={inputClass} value={form.fromOrganizationName ?? ''}
              onChange={e => update('fromOrganizationName', e.target.value)}
              onFocus={() => onFocus('referralFrom.organization.name')}
              placeholder="例: Med-Wellクリニック" />
          </FieldWithHelp>
          <FieldWithHelp label="紹介元医師名" fhirPath="Practitioner.name (referralFrom)">
            <input type="text" className={inputClass} value={form.fromDoctorName ?? ''}
              onChange={e => update('fromDoctorName', e.target.value)}
              onFocus={() => onFocus('referralFrom.practitioner.nameText')}
              placeholder="例: 田中 一郎" />
          </FieldWithHelp>
        </div>
        <FieldWithHelp label="紹介元医療機関コード（HOPD）" fhirPath="Organization.identifier (referralFrom)">
          <input type="text" className={inputClass} value={form.fromOrganizationCode ?? ''}
            onChange={e => update('fromOrganizationCode', e.target.value)}
            onFocus={() => onFocus('referralFrom.organization.hopd')}
            placeholder="例: 1310000001（10桁）" />
        </FieldWithHelp>
      </div>

      {/* 臨床情報 */}
      <div className="pt-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">臨床情報（PDF下段）</p>
        <FieldWithHelp label="紹介目的" fhirPath="Composition.section[950].text.div" required>
          <input type="text" className={inputClass} value={form.purpose}
            onChange={e => update('purpose', e.target.value)}
            onFocus={() => onFocus('purpose')}
            placeholder="例: 検査・診断" />
        </FieldWithHelp>
        <FieldWithHelp label="主訴（症状）" fhirPath="Condition.code.text (chief-complaint)">
          <input type="text" className={inputClass} value={form.chiefComplaint ?? ''}
            onChange={e => update('chiefComplaint', e.target.value)}
            onFocus={() => onFocus('condition.name')}
            placeholder="例: 腹痛" />
        </FieldWithHelp>
        <FieldWithHelp label="既往歴" fhirPath="Condition.code.text (past-history)">
          <input type="text" className={inputClass} value={form.pastHistory ?? ''}
            onChange={e => update('pastHistory', e.target.value)}
            onFocus={() => onFocus('condition.clinicalStatus')}
            placeholder="例: なし ／ 高血圧症、糖尿病（カンマ区切りで複数入力可）" />
        </FieldWithHelp>
        <FieldWithHelp label="症状経過（現病歴）" fhirPath="Composition.section[360].text.div">
          <textarea rows={3} className={textareaClass} value={form.historyOfPresentIllness ?? ''}
            onChange={e => update('historyOfPresentIllness', e.target.value)}
            onFocus={() => onFocus('history')}
            placeholder="例: 腹痛のため薬を処方しましたが要検査の懸念あり" />
        </FieldWithHelp>
        <FieldWithHelp label="確認事項（備考）" fhirPath="Composition.section[950].text.div">
          <textarea rows={2} className={textareaClass} value={form.notes ?? ''}
            onChange={e => update('notes', e.target.value)}
            onFocus={() => onFocus('purpose')}
            placeholder="例: 確認事項があれば記入" />
        </FieldWithHelp>
      </div>

      {/* 変換ボタン */}
      <div className="pt-2">
        <button
          onClick={handleImport}
          className={`w-full py-3 font-medium rounded-lg text-sm transition-colors ${
            imported
              ? 'bg-green-500 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {imported ? '✅ フォームに反映しました' : '🔄 FHIR フォームに変換・反映'}
        </button>
        <p className="text-xs text-gray-400 mt-1 text-center">
          変換後、各セクションで内容を確認・編集できます
        </p>
      </div>
    </div>
  );
}
