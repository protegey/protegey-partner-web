import type { Metadata } from "next";
import { getSessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { getPaginatedTeamMembers, getPendingInvitations, getAssignableRoles, getPartnerRoles, getPermissionsCatalogue } from "./actions";
import { InviteAgentDialogButton } from "./InviteAgentDialogButton";
import { TeamMemberActions } from "./TeamMemberActions";
import { ResendInvitationButton } from "./ResendInvitationButton";
import { EditInvitationDialogButton } from "./EditInvitationDialogButton";
import { RolesSection } from "./RolesSection";
import { PaginationControls } from "@/components/PaginationControls";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const TEAM_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Équipe",
    explanation:
      "Cette page gère qui a accès à ton organisation et ce que chacun a le droit de faire. Tu invites un collègue par email et lui assignes un rôle, et tu peux revoir ou renvoyer les invitations en attente.\n\nProtegey fournit 12 rôles fixes prêts à l'emploi (4 rôles d'analyste, 2 rôles technique/optimisation, 3 rôles de direction, et 3 rôles d'administration de la plateforme) — chacun avec un accès aux modules déjà défini et non modifiable. Si ces 12 rôles ne couvrent pas un poste précis de ton organisation, l'Administrateur de la plateforme ou le Super Admin peut créer un rôle personnalisé en choisissant exactement les permissions voulues.\n\nCe qu'un membre de l'équipe voit et peut faire ailleurs dans le produit — approuver une déclaration, gérer les clients KYB, changer les paramètres — dépend entièrement du rôle qui lui est assigné ici.",
  },
  en: {
    title: "Team",
    explanation:
      "This page manages who has access to your organization and what each person is allowed to do. You invite a colleague by email and assign them a role, and can review or resend pending invitations.\n\nProtegey ships with 12 ready-made fixed roles (4 analyst roles, 2 technical/optimization roles, 3 leadership roles, and 3 platform-administration roles) — each with its module access already defined and non-editable. If those 12 don't cover a specific position in your organization, the Platform Administrator or Super Admin can build a custom role by hand-picking exactly the permissions it needs.\n\nWhat a team member can see and do everywhere else in the product — approving a filing, managing KYB clients, changing settings — depends entirely on the role assigned to them here.",
  },
};

export const metadata: Metadata = {
  title: "Team — Protegey Partner",
};

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ membersPage?: string; invitationsPage?: string; rolesPage?: string }> }) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.manage_team", lang);
  if (denied) return denied;

  const params = await searchParams;
  const membersPage = Math.max(1, Number(params.membersPage) || 1);
  const invitationsPage = Math.max(1, Number(params.invitationsPage) || 1);
  const rolesPage = Math.max(1, Number(params.rolesPage) || 1);
  const canManageTeam = user?.permissions.includes("partners.manage_team") ?? false;
  const canViewRoles = user?.permissions.includes("roles.view") ?? false;
  const canManageRoles = user?.permissions.includes("roles.manage") ?? false;

  const [members, invitations, roles, partnerRoles, permissionsCatalogue] = await Promise.all([
    getPaginatedTeamMembers(membersPage),
    canManageTeam ? getPendingInvitations(invitationsPage) : Promise.resolve(null),
    canManageTeam ? getAssignableRoles() : Promise.resolve([]),
    canViewRoles ? getPartnerRoles(rolesPage) : Promise.resolve(null),
    canManageRoles ? getPermissionsCatalogue() : Promise.resolve([]),
  ]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{t(lang, "teamPageTitle")}</h1>
            <PageGuideButton content={TEAM_GUIDE[lang]} />
          </div>
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
