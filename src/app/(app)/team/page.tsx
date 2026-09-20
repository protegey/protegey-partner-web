import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getTeamMembers, getPendingInvitations, getAssignableRoles, getPartnerRoles, getPermissionsCatalogue } from "./actions";
import { InviteAgentDialogButton } from "./InviteAgentDialogButton";
import { TeamMemberActions } from "./TeamMemberActions";
import { ResendInvitationButton } from "./ResendInvitationButton";
import { EditInvitationDialogButton } from "./EditInvitationDialogButton";
import { RolesSection } from "./RolesSection";

export const metadata: Metadata = {
  title: "Team — Protegey Partner",
};

export default async function TeamPage() {
  const user = await getSessionUser();
  const canManageTeam = user?.permissions.includes("partners.manage_team") ?? false;
  const canViewRoles = user?.permissions.includes("roles.view") ?? false;
  const canManageRoles = user?.permissions.includes("roles.manage") ?? false;

  const [members, invitations, roles, partnerRoles, permissionsCatalogue, lang] = await Promise.all([
    getTeamMembers(),
    canManageTeam ? getPendingInvitations() : Promise.resolve([]),
    canManageTeam ? getAssignableRoles() : Promise.resolve([]),
    canViewRoles ? getPartnerRoles() : Promise.resolve([]),
    canManageRoles ? getPermissionsCatalogue() : Promise.resolve([]),
    getLang(),
  ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "teamPageTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t(lang, "teamPageSubtitle")}
          </p>
        </div>
        {canManageTeam ? <InviteAgentDialogButton roles={roles} /> : null}
      </div>

      {canManageTeam && invitations.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t(lang, "teamColPendingInvitation")}</th>
                <th className="px-4 py-2.5 font-medium">{t(lang, "teamColRole")}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t(lang, "teamColActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td className="px-4 py-2.5">
                    <p className="text-foreground">
                      {invitation.firstName} {invitation.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invitation.email}
                      {invitation.phone ? ` · ${invitation.phone}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {invitation.roles.map((role) => role.displayName).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-2">
                      <EditInvitationDialogButton invitation={invitation} roles={roles} />
                      <ResendInvitationButton invitationId={invitation.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">{t(lang, "teamColName")}</th>
              <th className="px-4 py-2.5 font-medium">{t(lang, "teamColEmail")}</th>
              <th className="px-4 py-2.5 font-medium">{t(lang, "teamColRole")}</th>
              <th className="px-4 py-2.5 font-medium">{t(lang, "teamColStatus")}</th>
              {canManageTeam ? <th className="px-4 py-2.5 font-medium text-right">{t(lang, "teamColActions")}</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-2.5 text-foreground">
                  {member.firstName} {member.lastName}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {member.email}
                  {member.phone ? <span className="block text-xs">{member.phone}</span> : null}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {member.roles.map((role) => role.displayName).join(", ") || "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      member.isActive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {member.isActive ? t(lang, "clientStatusActive") : t(lang, "teamStatusBlocked")}
                  </span>
                </td>
                {canManageTeam ? (
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end">
                      <TeamMemberActions userId={member.id} isActive={member.isActive} isSelf={member.id === user?.sub} />
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
            {members.length === 0 ? (
              <tr>
                <td colSpan={canManageTeam ? 5 : 4} className="px-4 py-6 text-center text-muted-foreground">
                  {t(lang, "teamNoAgentsYet")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {canViewRoles ? (
        <RolesSection roles={partnerRoles} permissions={permissionsCatalogue} canManageRoles={canManageRoles} />
      ) : null}
    </div>
  );
}
