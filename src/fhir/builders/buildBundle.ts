// JP_Bundle_eReferral プロファイルに基づくBundle全体の組み立て
// 仕様: https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html
// Composition仕様: https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Composition-eReferral.html

import { v4 as uuidv4 } from 'uuid';
import type { ReferralFormData } from '../types';
import { buildPatient } from './buildPatient';
import { buildPractitioner } from './buildPractitioner';
import { buildOrganization } from './buildOrganization';
import { buildCondition } from './buildCondition';
import { buildAllergyIntolerance } from './buildAllergyIntolerance';
import { buildObservation } from './buildObservation';
import { buildMedicationRequest } from './buildMedicationRequest';

function makeNarrative(text: string, status: 'generated' | 'additional' = 'additional'): object {
  return {
    status,
    div: `<div xmlns="http://www.w3.org/1999/xhtml">${text}</div>`,
  };
}

// JP-CLINS Bundle識別子フォーマット: 医療機関番号10桁^西暦4桁^識別子(36文字以内)
// 例: 1319999999^2024^0001
// 正規表現: ^[0-4][0-9][1-3][0-9]{7}[\^]20[2-3][0-9][\^][A-Za-z0-9\-]{1,36}$
function makeBundleIdentifierValue(hopd: string, uuid: string): string {
  const year = new Date().getFullYear();
  // HOPDは10桁の保険医療機関番号（都道府県2桁+区分1桁+番号7桁）
  const hopdNormalized = hopd?.replace(/\D/g, '').slice(0, 10) || '1310000001';
  const shortId = uuid.replace(/-/g, '').slice(0, 20);
  return `${hopdNormalized}^${year}^${shortId}`;
}

export function buildBundle(data: ReferralFormData): object {
  const now = new Date().toISOString();

  // リソースUUID（fullUrl用 & id用）
  const patientUuid = uuidv4();
  const fromPractUuid = uuidv4();
  const fromOrgUuid = uuidv4();
  const toPractUuid = uuidv4();
  const toOrgUuid = uuidv4();
  const compositionUuid = uuidv4();
  const bundleUuid = uuidv4();

  // 各リソースをビルド
  const patient = buildPatient(data.patient, patientUuid);
  const fromPract = buildPractitioner(data.referralFrom.practitioner, fromPractUuid);
  const fromOrg = buildOrganization(data.referralFrom.organization, fromOrgUuid);
  const toPract = buildPractitioner(data.referralTo.practitioner, toPractUuid);
  const toOrg = buildOrganization(data.referralTo.organization, toOrgUuid);
  const conditions = data.conditions.map(c => buildCondition(c, patientUuid));
  const allergies = data.allergies.map(a => buildAllergyIntolerance(a, patientUuid));
  const observations = data.observations.map(o => buildObservation(o, patientUuid));
  const medications = data.medications.map(m => buildMedicationRequest(m, patientUuid));

  // 既往歴エントリ（空の場合はentryプロパティ自体を省略）
  const pastHistoryEntries = data.conditions
    .filter(c => c.category === 'past-history')
    .map(c => ({ reference: `urn:uuid:${c.id}` }));

  // HOPDは保険医療機関番号10桁（都道府県2桁+区分1桁[1-3]+番号7桁）
  // 未設定時は東京都一般病院ダミー番号を使用（第3桁=1が必須）
  const hopdRaw = data.referralFrom.organization.hopd?.replace(/\D/g, '').slice(0, 10) || '';
  const hopd = hopdRaw || '1310000001';
  const year = new Date().getFullYear();

  const composition = {
    resourceType: 'Composition',
    id: compositionUuid,
    meta: {
      lastUpdated: now,
      profile: ['http://jpfhir.jp/fhir/eReferral/StructureDefinition/JP_Composition_eReferral'],
    },
    text: makeNarrative('診療情報提供書', 'generated'),
    // バージョン番号extension（JP_Composition_eReferral必須）
    // 正しいURL: http://hl7.org/fhir/StructureDefinition/composition-clinicaldocument-versionNumber
    extension: [
      {
        url: 'http://hl7.org/fhir/StructureDefinition/composition-clinicaldocument-versionNumber',
        valueString: '1.0',
      },
    ],
    // JP-CLINS文書識別子: 医療機関番号-年-識別子
    identifier: {
      system: 'http://jpfhir.jp/fhir/core/IdSystem/resourceInstance-identifier',
      value: `${hopd}-${year}-${compositionUuid.slice(0, 8)}`,
    },
    status: 'final',
    // JP-CLINS指定コードシステム
    type: {
      coding: [{
        system: 'http://jpfhir.jp/fhir/Common/CodeSystem/doc-typecodes',
        code: '57133-1',
        display: '診療情報提供書',
      }],
    },
    // 文書サブ区分（category必須）: doc-subtypecodes を使用
    category: [{
      coding: [{
        system: 'http://jpfhir.jp/fhir/Common/CodeSystem/doc-subtypecodes',
        code: 'OUTPATIENT',
        display: '外来文書',
      }],
    }],
    subject: { reference: `urn:uuid:${patientUuid}` },
    date: now,
    author: [
      { reference: `urn:uuid:${fromPractUuid}` },
      { reference: `urn:uuid:${fromOrgUuid}` },
    ],
    title: '診療情報提供書',
    custodian: { reference: `urn:uuid:${fromOrgUuid}` },
    // event（Composition.event必須）: codeとperiodの両方が必要
    event: [{
      code: [{ text: '診療情報提供書発行' }],
      period: {
        start: data.eventStart || now.slice(0, 10),
      },
    }],
    // JP_Composition_eReferral仕様:
    // トップレベルには code:910/920 の紹介元・紹介先セクションと
    // code:300（構造情報）または code:200（CDA）のどちらか一方が必須
    // 臨床情報サブセクションは code:300 配下に入れる
    section: [
      // 紹介先情報セクション (code: 910)
      {
        title: '紹介先情報',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '910', display: '紹介先情報セクション' }] },
        entry: [
          { reference: `urn:uuid:${toPractUuid}` },
          { reference: `urn:uuid:${toOrgUuid}` },
        ],
      },
      // 紹介元情報セクション (code: 920)
      {
        title: '紹介元情報',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '920', display: '紹介元情報セクション' }] },
        entry: [
          { reference: `urn:uuid:${fromPractUuid}` },
          { reference: `urn:uuid:${fromOrgUuid}` },
        ],
      },
      // 構造情報セクション (code: 300) - 臨床サブセクションの親
      {
        title: '構造情報',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '300', display: '構造情報セクション' }] },
        section: [
          // 紹介目的セクション (code: 950)
          {
            title: '紹介目的',
            code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '950', display: '紹介目的セクション' }] },
            text: makeNarrative(data.purpose),
          },
          // 傷病名・主訴セクション (code: 340)
          {
            title: '傷病名・主訴',
            code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '340', display: '傷病名・主訴セクション' }] },
            ...(data.conditions.filter(c => c.category === 'chief-complaint').length > 0
              ? { entry: data.conditions.filter(c => c.category === 'chief-complaint').map(c => ({ reference: `urn:uuid:${c.id}` })) }
              : { text: makeNarrative('記載なし') }),
          },
          // 現病歴セクション (code: 360)
          {
            title: '現病歴',
            code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '360', display: '現病歴セクション' }] },
            text: makeNarrative(data.history || '記載なし'),
          },
          // 既往歴セクション (code: 370)
          {
            title: '既往歴',
            code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '370', display: '既往歴セクション' }] },
            ...(pastHistoryEntries.length > 0 ? { entry: pastHistoryEntries } : { text: makeNarrative('特記なし') }),
          },
          // アレルギー・不耐性反応セクション (code: 510)
          ...(data.allergies.length > 0
            ? [{
                title: 'アレルギー・不耐性反応',
                code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '510', display: 'アレルギー・不耐性反応セクション' }] },
                entry: data.allergies.map(a => ({ reference: `urn:uuid:${a.id}` })),
              }]
            : []),
          // 身体所見セクション (code: 610)
          ...(data.observations.length > 0
            ? [{
                title: '身体所見',
                code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '610', display: '身体所見セクション' }] },
                entry: data.observations.map(o => ({ reference: `urn:uuid:${o.id}` })),
              }]
            : []),
          // 投薬指示セクション (code: 430)
          ...(data.medications.length > 0
            ? [{
                title: '投薬指示',
                code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '430', display: '投薬指示セクション' }] },
                entry: data.medications.map(m => ({ reference: `urn:uuid:${m.id}` })),
              }]
            : []),
        ],
      },
    ],
  };

  return {
    resourceType: 'Bundle',
    id: bundleUuid,
    meta: {
      lastUpdated: now,
      profile: ['http://jpfhir.jp/fhir/clins/StructureDefinition/JP_Bundle_eReferral|1.12.0'],
    },
    identifier: {
      system: 'http://jpfhir.jp/fhir/clins/bundle-identifier',
      value: makeBundleIdentifierValue(data.referralFrom.organization.hopd, bundleUuid),
    },
    type: 'document',
    timestamp: now,
    entry: [
      { fullUrl: `urn:uuid:${compositionUuid}`, resource: composition },
      { fullUrl: `urn:uuid:${patientUuid}`, resource: patient },
      { fullUrl: `urn:uuid:${fromPractUuid}`, resource: fromPract },
      { fullUrl: `urn:uuid:${fromOrgUuid}`, resource: fromOrg },
      { fullUrl: `urn:uuid:${toPractUuid}`, resource: toPract },
      { fullUrl: `urn:uuid:${toOrgUuid}`, resource: toOrg },
      ...conditions.map(r => ({ fullUrl: `urn:uuid:${(r as any).id}`, resource: r })),
      ...allergies.map(r => ({ fullUrl: `urn:uuid:${(r as any).id}`, resource: r })),
      ...observations.map(r => ({ fullUrl: `urn:uuid:${(r as any).id}`, resource: r })),
      ...medications.map(r => ({ fullUrl: `urn:uuid:${(r as any).id}`, resource: r })),
    ],
  };
}
