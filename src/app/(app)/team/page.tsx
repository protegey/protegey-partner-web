import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getPaginatedTeamMembers, getPendingInvitations, getAssignableRoles, getPartnerRoles, getPermissionsCatalogue } from "./actions";
import { InviteAgentDialogButton } from "./InviteAgentDialogButton";
import { TeamMemberActions } from "./TeamMemberActions";
import { ResendInvitationButton } from "./ResendInvitationButton";
import { EditInvitationDialogButton } from "./EditInvitationDialogButton";
import { RolesSection } from "./RolesSection";
import { PaginationControls } from "@/components/PaginationControls";

export const metadata: Metadata = {
  title: "Team — Protegey Partner",
};

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ membersPage?: string; invitationsPage?: string; rolesPage?: string }> }) {
  const params = await searchParams;
  const membersPage = Math.max(1, Number(params.membersPage) || 1);
  const invitationsPage = Math.max(1, Number(params.invitationsPage) || 1);
  const rolesPage = Math.max(1, Number(params.rolesPage) || 1);
  const user = await getSessionUser();
  const canManageTeam = user?.permissions.includes("partners.manage_team") ?? false;
  const canViewRoles = user?.permissions.includes("roles.view") ?? false;
  const canManageRoles = user?.permissions.includes("roles.manage") ?? false;

  const [members, invitations, roles, partnerRoles, permissionsCatalogue, lang] = await Promise.all([
    getPaginatedTeamMembers(membersPage),
    canManageTeam ? getPendingInvitations(invitationsPage) : Promise.resolve(null),
    canManageTeam ? getAssignableRoles() : Promise.resolve([]),
    canViewRoles ? getPartnerRoles(rolesPage) : Promise.resolve(null),
    canManageRoles ? getPermissionsCatalogue() : Promise.resolve([]),
    getLang(),
  ]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "teamPageTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t(lang, "teamPageSubtitle")}
          </p>
        </div>
        {canManageTeam ? <InviteAgentDialogButton roles={roles} /> : null}
      </div>

       {canManageTeam && invitations && invitations.data.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t(lang, "teamColPendingInvitation")}</th>
                <th className="px-4 py-2.5 font-medium">{t(lang, "teamColRole")}</th>
                <th className="px-4 py-2.5 font-medium">{t(lang, "teamColExpires")}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t(lang, "teamColActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
               {invitations.data.map((invitation) => (
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
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(invitation.expiresAt).toLocaleDateString()}</td>
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
       {canManageTeam && invitations ? <PaginationControls page={invitations.page} totalPages={invitations.totalPages} total={invitations.total} href={(page) => `/team?invitationsPage=${page}&membersPage=${membersPage}&rolesPage=${rolesPage}`} /> : null}

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">{t(lang, "teamColName")}</th>
              <th className="px-4 py-2.5 font-medium">{t(lang, "teamColEmail")}</th>
              <th className="px-4 py-2.5 font-medium">{t(lang, "teamColRole")}</th>
              <th className="px-4 py-2.5 font-medium">{t(lang, "teamColStatus")}</th>
              <th className="px-4 py-2.5 font-medium">{t(lang, "teamColJoined")}</th>
              {canManageTeam ? <th className="px-4 py-2.5 font-medium text-right">{t(lang, "teamColActions")}</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.data.map((member) => (
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
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(member.createdAt).toLocaleDateString()}</td>
                {canManageTeam ? (
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end">
                      <TeamMemberActions userId={member.id} isActive={member.isActive} isSelf={member.id === user?.sub} />
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
            {members.data.length === 0 ? (
              <tr>
                <td colSpan={canManageTeam ? 5 : 4} className="px-4 py-6 text-center text-muted-foreground">
                  {t(lang, "teamNoAgentsYet")}
                </td>
              </tr>
            ) : null}
          </tbody>
         </table>
       </div>
       <PaginationControls page={members.page} totalPages={members.totalPages} total={members.total} href={(page) => `/team?membersPage=${page}&invitationsPage=${invitationsPage}&rolesPage=${rolesPage}`} />

       {canViewRoles ? (
         <>
           {partnerRoles ? <RolesSection roles={partnerRoles.data} permissions={permissionsCatalogue} canManageRoles={canManageRoles} /> : null}
           {partnerRoles ? <PaginationControls page={partnerRoles.page} totalPages={partnerRoles.totalPages} total={partnerRoles.total} href={(page) => `/team?membersPage=${membersPage}&invitationsPage=${invitationsPage}&rolesPage=${page}`} /> : null}
         </>
       ) : null}
    </div>
  );
}
