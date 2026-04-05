// JP_Bundle_eReferral プロファイルに基づくBundle全体の組み立て
// 仕様: https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Bundle-eReferral.html
// Composition仕様: https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Composition-eReferral.html

import { ReferralFormData } from '../types';
import { buildPatient } from './buildPatient';
import { buildPractitioner } from './buildPractitioner';
import { buildOrganization } from './buildOrganization';
import { buildCondition } from './buildCondition';
import { buildAllergyIntolerance } from './buildAllergyIntolerance';
import { buildObservation } from './buildObservation';
import { buildMedicationRequest } from './buildMedicationRequest';

function makeNarrative(text: string): object {
  return {
    status: 'generated',
    div: `<div xmlns="http://www.w3.org/1999/xhtml">${text}</div>`,
  };
}

export function buildBundle(data: ReferralFormData): object {
  const now = new Date().toISOString();
  const bundleId = `bundle-${Date.now()}`;

  // リソースID定義
  const patientId = 'patient-1';
  const fromPractId = 'pract-from-1';
  const fromOrgId = 'org-from-1';
  const toPractId = 'pract-to-1';
  const toOrgId = 'org-to-1';
  const compositionId = 'composition-1';

  // 各リソースをビルド
  const patient = buildPatient(data.patient, patientId);
  const fromPract = buildPractitioner(data.referralFrom.practitioner, fromPractId);
  const fromOrg = buildOrganization(data.referralFrom.organization, fromOrgId);
  const toPract = buildPractitioner(data.referralTo.practitioner, toPractId);
  const toOrg = buildOrganization(data.referralTo.organization, toOrgId);
  const conditions = data.conditions.map(c => buildCondition(c, patientId));
  const allergies = data.allergies.map(a => buildAllergyIntolerance(a, patientId));
  const observations = data.observations.map(o => buildObservation(o, patientId));
  const medications = data.medications.map(m => buildMedicationRequest(m, patientId));

  // Compositionを組み立て
  // 参照: https://jpfhir.jp/fhir/clins/igv1/StructureDefinition-JP-Composition-eReferral.html
  const composition = {
    resourceType: 'Composition',
    id: compositionId,
    meta: {
      profile: ['http://jpfhir.jp/fhir/eReferral/StructureDefinition/JP_Composition_eReferral'],
    },
    // 文書ステータス: 確定文書はfinal
    status: 'final',
    // 診療情報提供書を示すLOINCコード
    type: {
      coding: [{ system: 'http://loinc.org', code: '57133-1', display: 'Referral note' }],
    },
    subject: { reference: `Patient/${patientId}` },
    date: now,
    author: [
      { reference: `Practitioner/${fromPractId}` },
      { reference: `Organization/${fromOrgId}` },
    ],
    title: '診療情報提供書',
    custodian: { reference: `Organization/${fromOrgId}` },
    section: [
      // 紹介元情報セクション (code: 920)
      {
        title: '紹介元情報',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '920' }] },
        entry: [
          { reference: `Practitioner/${fromPractId}` },
          { reference: `Organization/${fromOrgId}` },
        ],
      },
      // 紹介先情報セクション (code: 910)
      {
        title: '紹介先情報',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '910' }] },
        entry: [
          { reference: `Practitioner/${toPractId}` },
          { reference: `Organization/${toOrgId}` },
        ],
      },
      // 紹介目的セクション (code: 950) - 必須
      {
        title: '紹介目的',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '950' }] },
        text: makeNarrative(data.purpose),
      },
      // 傷病名・主訴セクション (code: 340) - 1件以上必須
      {
        title: '傷病名・主訴',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '340' }] },
        entry: data.conditions
          .filter(c => c.category === 'chief-complaint')
          .map(c => ({ reference: `Condition/${c.id}` })),
      },
      // 現病歴セクション (code: 360)
      {
        title: '現病歴',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '360' }] },
        text: makeNarrative(data.history),
      },
      // 既往歴セクション (code: 370)
      {
        title: '既往歴',
        code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '370' }] },
        entry: data.conditions
          .filter(c => c.category === 'past-history')
          .map(c => ({ reference: `Condition/${c.id}` })),
      },
      // アレルギー・不耐性反応セクション (code: 510)
      ...(data.allergies.length > 0
        ? [{
            title: 'アレルギー・不耐性反応',
            code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '510' }] },
            entry: data.allergies.map(a => ({ reference: `AllergyIntolerance/${a.id}` })),
          }]
        : []),
      // 身体所見セクション
      ...(data.observations.length > 0
        ? [{
            title: '身体所見',
            code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '610' }] },
            entry: data.observations.map(o => ({ reference: `Observation/${o.id}` })),
          }]
        : []),
      // 処方セクション
      ...(data.medications.length > 0
        ? [{
            title: '処方情報',
            code: { coding: [{ system: 'http://jpfhir.jp/fhir/clins/CodeSystem/document-section', code: '430' }] },
            entry: data.medications.map(m => ({ reference: `MedicationRequest/${m.id}` })),
          }]
        : []),
    ],
  };

  // Bundle組み立て
  // type: document - ドキュメント型Bundle（先頭エントリはCompositionである必要がある）
  return {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      lastUpdated: now,
      profile: ['http://jpfhir.jp/fhir/clins/StructureDefinition/JP_Bundle_eReferral'],
    },
    identifier: {
      // JP-CLINSのBundle識別子体系
      system: 'http://jpfhir.jp/fhir/clins/bundle-identifier',
      value: bundleId,
    },
    type: 'document',
    timestamp: now,
    entry: [
      { fullUrl: `urn:uuid:${compositionId}`, resource: composition },
      { fullUrl: `urn:uuid:${patientId}`, resource: patient },
      { fullUrl: `urn:uuid:${fromPractId}`, resource: fromPract },
      { fullUrl: `urn:uuid:${fromOrgId}`, resource: fromOrg },
      { fullUrl: `urn:uuid:${toPractId}`, resource: toPract },
      { fullUrl: `urn:uuid:${toOrgId}`, resource: toOrg },
      ...conditions.map(r => ({ fullUrl: `urn:uuid:${(r as any).id}`, resource: r })),
      ...allergies.map(r => ({ fullUrl: `urn:uuid:${(r as any).id}`, resource: r })),
      ...observations.map(r => ({ fullUrl: `urn:uuid:${(r as any).id}`, resource: r })),
      ...medications.map(r => ({ fullUrl: `urn:uuid:${(r as any).id}`, resource: r })),
    ],
  };
}
