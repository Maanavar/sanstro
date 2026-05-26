"use client";

import { useState } from "react";
import { getScoreBand, formatClockLabel } from "@/lib/format";
import { t, tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartCalculateResponseData,
  ChartSummaryData,
  DailyGuidanceData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  FamilyAggregateMember,
  FamilyVaultDetailData,
  FamilyVaultListItem,
  RelationshipAlertItem,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

import { MemberCard } from "./dashboard-member-card";
import { SynastryPanel } from "./dashboard-synastry-panel";
import { Button, Chip, Metric, Surface } from "./dashboard-ui";

type MemberChartData = {
  memberId: string;
  displayName: string;
  chart: ChartCalculateResponseData;
  summary: ChartSummaryData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  dailyGuidance: DailyGuidanceData | null;
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
};

type DashboardFamilyTabProps = {
  lang: Lang;
  selectedDate: string;
  selectedVaultId: string;
  ownerChartId: string;
  vaults: FamilyVaultListItem[];
  familyDetail: FamilyVaultDetailData | null;
  familyAggregate: FamilyAggregateData | null;
  memberCharts: MemberChartData[];
  relationshipAlerts: RelationshipAlertItem[];
  alertsLoading: boolean;
  busy: {
    family: boolean;
    vaults: boolean;
    deletingVaultId: string;
    deletingMemberId: string;
    memberCharts: boolean;
  };
  onRefreshFamily: () => void;
  onOpenSetup: () => void;
  onSelectVault: (item: FamilyVaultListItem) => void;
  onDeleteVault: (vaultId: string, name: string) => void;
  onDeleteMember: (memberId: string, name: string) => void;
  onEditMember: (member: FamilyAggregateMember) => void;
};

type FamilySubTab = "members" | "synastry";

function formatScoreLabel(score: number) {
  const band = getScoreBand(score);
  return `${score}/100 — ${band.label}`;
}

export function DashboardFamilyTab({
  lang,
  selectedDate,
  selectedVaultId,
  ownerChartId,
  vaults,
  familyDetail,
  familyAggregate,
  memberCharts,
  relationshipAlerts,
  alertsLoading,
  busy,
  onRefreshFamily,
  onOpenSetup,
  onSelectVault,
  onDeleteVault,
  onDeleteMember,
  onEditMember,
}: DashboardFamilyTabProps) {
  const [subTab, setSubTab] = useState<FamilySubTab>("members");

  const memberOptions = familyAggregate?.members.map((m) => ({
    memberId: m.familyMemberId,
    displayName: m.displayName,
  })) ?? [];

  const FAMILY_SUB_TABS: { key: FamilySubTab; label: string }[] = [
    { key: "members", label: lang === "ta" ? "உறுப்பினர்கள்" : "Members" },
    { key: "synastry", label: lang === "ta" ? "பொருத்தம் & அறிவிப்புகள்" : "Compatibility & Alerts" },
  ];

  return (
    <div className="tab-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <p className="section-kicker">{t("family_kicker", lang)}</p>
          <h2 className="section-title">{t("family_title", lang)}</h2>
          <p className="section-description">{t("family_desc", lang)}</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Button onClick={() => onRefreshFamily()} variant="ghost" disabled={!selectedVaultId || busy.family}>
            {busy.family ? t("btn_refreshing", lang) : t("btn_refresh_family", lang)}
          </Button>
          <Button onClick={onOpenSetup} variant="secondary">
            {t("btn_add_member", lang)}
          </Button>
        </div>
      </div>

      <div className="two-col two-col--wide" style={{ gridTemplateColumns: "0.65fr 1.35fr" }}>
        {/* Left column: Vault list + score summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Surface title={t("surface_vaults", lang)}>
            <div className="stack">
              {busy.vaults ? <p className="empty-state">{t("vaults_loading", lang)}</p> : null}
              {vaults.length === 0 && !busy.vaults ? <p className="empty-state">{t("vaults_empty", lang)}</p> : null}
              {vaults.map((item) => (
                <div key={item.familyVaultId}
                  className={`vault-row${item.familyVaultId === selectedVaultId ? " vault-row--active" : ""}`}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button type="button"
                    style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onClick={() => onSelectVault(item)}>
                    <span className="vault-row__name">{item.name}</span>
                    <span className="vault-row__meta">
                      {item.memberCount} {item.memberCount === 1 ? t("members_label", lang) : t("members_label_pl", lang)} · {item.latestAggregateDate ?? t("no_aggregate", lang)}
                    </span>
                  </button>
                  <button type="button" className="button button--ghost"
                    disabled={busy.deletingVaultId === item.familyVaultId}
                    onClick={() => onDeleteVault(item.familyVaultId, item.name)}
                    style={{ fontSize: "0.72rem", padding: "2px 8px", opacity: 0.55, color: "#f87171" }}
                    title="Delete vault">
                    {busy.deletingVaultId === item.familyVaultId ? "…" : t("btn_delete", lang)}
                  </button>
                </div>
              ))}
            </div>
          </Surface>

          {familyAggregate && familyDetail ? (
            <Surface title={t("surface_family_score", lang)}>
              <div className="stack">
                <div className="surface__metrics">
                  <Metric label={t("family_score_label", lang)} value={formatScoreLabel(familyAggregate.familyScore)}
                    hint={familyAggregate.familyLabel}
                    tone={getScoreBand(familyAggregate.familyScore).tone === "high" ? "high" : getScoreBand(familyAggregate.familyScore).tone === "low" ? "low" : "mid"} />
                  <Metric label={t("support_need", lang)} value={`${familyAggregate.aggregateBreakdown.supportNeedIndex}`} hint="0–100" tone="low" />
                  <Metric label={t("decision_ready", lang)} value={`${familyAggregate.aggregateBreakdown.decisionReadinessIndex}`} hint="0–100" tone="high" />
                </div>
                <div className="surface__textBlock">
                  <p className="surface__subhead">{familyDetail.name}</p>
                  <p className="surface__text">{tLang(familyAggregate.summary, lang)}</p>
                  <div className="chip-row">
                    <Chip tone="accent">{familyAggregate.familyLabel}</Chip>
                    {familyAggregate.aggregateBreakdown.chandrashtamaCount > 0 && (
                      <Chip tone="warning">⚠ {familyAggregate.aggregateBreakdown.chandrashtamaCount} {t("member_chandrashtamam", lang)}</Chip>
                    )}
                  </div>
                </div>
                <div className="surface__textBlock">
                  <p className="surface__subhead">{t("best_windows", lang)}</p>
                  <div className="chip-row">
                    {familyAggregate.bestFamilyWindows.map((w) => (
                      <Chip key={`${w.type}-${w.start}`} tone="success">{w.type} {formatClockLabel(w.start)}–{formatClockLabel(w.end)}</Chip>
                    ))}
                    {familyAggregate.avoidForFamilyDecisions.map((w) => (
                      <Chip key={`${w.type}-${w.start}`} tone="warning">{w.type} {formatClockLabel(w.start)}–{formatClockLabel(w.end)}</Chip>
                    ))}
                  </div>
                </div>
              </div>
            </Surface>
          ) : null}
        </div>

        {/* Right column: Members / Synastry sub-tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Sub-tab switcher */}
          {selectedVaultId && familyAggregate && familyAggregate.members.length > 0 && (
            <div style={{ display: "flex", gap: "6px" }}>
              {FAMILY_SUB_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSubTab(key)}
                  style={{
                    padding: "6px 14px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                    border: subTab === key ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.1)",
                    background: subTab === key ? "rgba(255,255,255,0.1)" : "transparent",
                    color: subTab === key ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Members sub-tab */}
          {subTab === "members" && (
            <>
              {!selectedVaultId ? (
                <p className="empty-state">{t("select_vault", lang)}</p>
              ) : busy.family ? (
                <p className="empty-state">{t("members_loading", lang)}</p>
              ) : familyAggregate && familyAggregate.members.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p className="surface__subhead" style={{ margin: 0 }}>
                      {familyAggregate.members.length} {familyAggregate.members.length === 1 ? t("members_label", lang) : t("members_label_pl", lang)}
                      {busy.memberCharts ? t("charts_loading", lang) : ""}
                    </p>
                  </div>
                  {familyAggregate.members.map((member) => (
                    <MemberCard
                      key={member.familyMemberId}
                      member={member}
                      memberChart={memberCharts.find((mc) => mc.memberId === member.familyMemberId)}
                      onDelete={onDeleteMember}
                      onEdit={onEditMember}
                      deletingId={busy.deletingMemberId}
                      today={selectedDate}
                      lang={lang}
                    />
                  ))}
                </div>
              ) : familyAggregate ? (
                <div style={{ textAlign: "center", padding: "48px 24px" }}>
                  <p className="empty-state">{t("no_members_yet", lang)}</p>
                  <Button onClick={onOpenSetup} variant="primary">{t("btn_add_first_member", lang)}</Button>
                </div>
              ) : (
                <p className="empty-state">{t("select_vault", lang)}</p>
              )}
            </>
          )}

          {/* Synastry + Relationship Alerts sub-tab */}
          {subTab === "synastry" && (
            <Surface title={t("synastry_panel_title", lang)}>
              <div className="surface__body">
                <SynastryPanel
                  lang={lang}
                  chartId={ownerChartId}
                  familyVaultId={selectedVaultId}
                  memberOptions={memberOptions}
                  relationshipAlerts={relationshipAlerts}
                  alertsLoading={alertsLoading}
                />
              </div>
            </Surface>
          )}
        </div>
      </div>
    </div>
  );
}
