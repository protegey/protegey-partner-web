/** How a transaction decision actually reaches a partner's backend: one specific, real sequence
 * — not a generic diagramming primitive — covering the synchronous POST /partner-api/transactions
 * round-trip and the two webhook events that have no synchronous equivalent. See the "transactions"
 * and "webhooks" sections of the Documentation page for the prose this illustrates. */
export function TransactionSequenceDiagram() {
  return (
    <svg viewBox="0 0 820 700" className="w-full max-w-[820px]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="seqArrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" className="fill-foreground" />
        </marker>
        <marker id="seqArrowL" markerWidth="9" markerHeight="9" refX="2" refY="3" orient="auto">
          <path d="M7,0 L0,3 L7,6 Z" className="fill-foreground" />
        </marker>
        <marker id="seqArrowTeal" markerWidth="9" markerHeight="9" refX="2" refY="3" orient="auto">
          <path d="M7,0 L0,3 L7,6 Z" className="fill-primary" />
        </marker>
      </defs>

      {/* actor boxes */}
      <g fontWeight={600} fontSize={12.5}>
        <rect x="20" y="16" width="170" height="42" rx="9" className="fill-muted stroke-border" />
        <text x="105" y="33" textAnchor="middle" className="fill-foreground">Client final</text>
        <text x="105" y="48" textAnchor="middle" fontSize={9.5} fontWeight={400} className="fill-muted-foreground">app / portail du partenaire</text>

        <rect x="325" y="16" width="170" height="42" rx="9" className="fill-muted stroke-border" />
        <text x="410" y="33" textAnchor="middle" className="fill-foreground">Backend partenaire</text>
        <text x="410" y="48" textAnchor="middle" fontSize={9.5} fontWeight={400} className="fill-muted-foreground">votre système</text>

        <rect x="630" y="16" width="170" height="42" rx="9" className="fill-primary/10 stroke-primary" />
        <text x="715" y="33" textAnchor="middle" className="fill-primary">Protegey</text>
        <text x="715" y="48" textAnchor="middle" fontSize={9.5} fontWeight={400} className="fill-primary">moteur de décision</text>
      </g>

      {/* lifelines */}
      <line x1="105" y1="58" x2="105" y2="672" strokeWidth={1} strokeDasharray="3,3" className="stroke-border" />
      <line x1="410" y1="58" x2="410" y2="672" strokeWidth={1} strokeDasharray="3,3" className="stroke-border" />
      <line x1="715" y1="58" x2="715" y2="672" strokeWidth={1} strokeDasharray="3,3" className="stroke-border" />

      {/* 1 — client -> backend */}
      <text x="257" y="86" textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">1 · Lance une transaction</text>
      <line x1="105" y1="98" x2="403" y2="98" strokeWidth={1.4} markerEnd="url(#seqArrow)" className="stroke-foreground" />

      {/* 2 — backend -> protegey */}
      <text x="562" y="126" textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">2 · POST /partner-api/transactions</text>
      <text x="562" y="140" textAnchor="middle" fontSize={9.5} fontFamily="var(--font-mono, monospace)" className="fill-muted-foreground">externalTransactionId, amount, currency…</text>
      <line x1="410" y1="150" x2="708" y2="150" strokeWidth={1.4} markerEnd="url(#seqArrow)" className="stroke-foreground" />

      {/* 3 — note: protegey self analysis */}
      <rect x="610" y="170" width="190" height="46" rx="8" className="fill-primary/10 stroke-primary" />
      <text x="705" y="189" textAnchor="middle" fontSize={10.3} fontWeight={600} className="fill-primary">3 · Analyse en temps réel</text>
      <text x="705" y="203" textAnchor="middle" fontSize={9.3} className="fill-primary">règles déclenchées + risk score</text>

      {/* 4 — protegey --> backend, dashed return, same response */}
      <text x="562" y="245" textAnchor="middle" fontSize={11} fontWeight={700} className="fill-primary">4 · decision · riskScore · alerts[]</text>
      <text x="562" y="259" textAnchor="middle" fontSize={9.5} className="fill-muted-foreground">— dans la même réponse HTTP, immédiatement —</text>
      <line x1="708" y1="269" x2="410" y2="269" strokeWidth={1.6} strokeDasharray="6,4" markerEnd="url(#seqArrowTeal)" className="stroke-primary" />

      {/* 5 — note: backend self decision */}
      <rect x="315" y="289" width="190" height="52" rx="8" className="fill-amber-50 stroke-amber-400 dark:fill-amber-950 dark:stroke-amber-700" />
      <text x="410" y="308" textAnchor="middle" fontSize={10.3} fontWeight={600} className="fill-amber-700 dark:fill-amber-400">5 · Décision métier finale</text>
      <text x="410" y="322" textAnchor="middle" fontSize={9.3} className="fill-amber-700 dark:fill-amber-400">suit ou ajuste le verdict selon</text>
      <text x="410" y="334" textAnchor="middle" fontSize={9.3} className="fill-amber-700 dark:fill-amber-400">ses propres règles</text>

      {/* 6 — backend -> client */}
      <text x="257" y="373" textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">6 · Résultat : autorisée / bloquée / vérification requise</text>
      <line x1="403" y1="385" x2="105" y2="385" strokeWidth={1.4} markerEnd="url(#seqArrowL)" className="stroke-foreground" />

      {/* separator 1 */}
      <line x1="20" y1="418" x2="800" y2="418" strokeWidth={1} strokeDasharray="2,4" className="stroke-border" />
      <rect x="300" y="406" width="220" height="24" rx="12" className="fill-background stroke-border" />
      <text x="410" y="422" textAnchor="middle" fontSize={9.5} fontWeight={600} className="fill-muted-foreground">EN PARALLÈLE · CANAL SÉPARÉ</text>

      {/* 7 — webhook alert.created / transaction.blocked */}
      <text x="562" y="458" textAnchor="middle" fontSize={11} fontWeight={700} className="fill-primary">7 · Webhook : alert.created / transaction.blocked</text>
      <text x="562" y="472" textAnchor="middle" fontSize={9.5} className="fill-muted-foreground">même événement — utile si un autre système doit agir dessus</text>
      <line x1="708" y1="482" x2="410" y2="482" strokeWidth={1.6} strokeDasharray="6,4" markerEnd="url(#seqArrowTeal)" className="stroke-primary" />

      {/* separator 2 */}
      <line x1="20" y1="515" x2="800" y2="515" strokeWidth={1} strokeDasharray="2,4" className="stroke-border" />
      <rect x="250" y="503" width="320" height="24" rx="12" className="fill-background stroke-border" />
      <text x="410" y="519" textAnchor="middle" fontSize={9.5} fontWeight={600} className="fill-muted-foreground">PLUS TARD · AUCUN ÉQUIVALENT SYNCHRONE</text>

      {/* note: trigger context */}
      <rect x="595" y="538" width="205" height="56" rx="8" className="fill-muted stroke-border" />
      <text x="697" y="556" textAnchor="middle" fontSize={9.6} fontWeight={600} className="fill-muted-foreground">Un analyste change un statut</text>
      <text x="697" y="569" textAnchor="middle" fontSize={9.6} className="fill-muted-foreground">dans le portail Protegey, ou une</text>
      <text x="697" y="582" textAnchor="middle" fontSize={9.6} className="fill-muted-foreground">vérification KYC se termine</text>

      {/* 8 — webhook alert.status_changed / kyc.status_changed */}
      <text x="562" y="620" textAnchor="middle" fontSize={11} fontWeight={700} className="fill-primary">8 · Webhook : alert.status_changed / kyc.status_changed</text>
      <line x1="708" y1="630" x2="410" y2="630" strokeWidth={1.6} strokeDasharray="6,4" markerEnd="url(#seqArrowTeal)" className="stroke-primary" />

      {/* lifeline end caps */}
      <circle cx="105" cy="672" r="2.5" className="fill-border" />
      <circle cx="410" cy="672" r="2.5" className="fill-border" />
      <circle cx="715" cy="672" r="2.5" className="fill-border" />
    </svg>
  );
}
