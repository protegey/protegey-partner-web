type Lang = "en" | "fr";

const STR: Record<string, Record<Lang, string>> = {
  clientActor: { fr: "Client final", en: "End client" },
  clientActorSub: { fr: "app / portail du partenaire", en: "app / partner's dashboard" },
  backendActor: { fr: "Backend partenaire", en: "Partner backend" },
  backendActorSub: { fr: "votre système", en: "your system" },
  protegeyActorSub: { fr: "moteur de décision", en: "decision engine" },
  step1: { fr: "1 · Lance une transaction", en: "1 · Starts a transaction" },
  step2: { fr: "2 · POST /partner-api/transactions", en: "2 · POST /partner-api/transactions" },
  step2sub: { fr: "externalTransactionId, amount, currency…", en: "externalTransactionId, amount, currency…" },
  step3: { fr: "3 · Analyse en temps réel", en: "3 · Real-time analysis" },
  step3sub: { fr: "règles déclenchées + risk score", en: "matched rules + risk score" },
  step4: { fr: "4 · decision · riskScore · alerts[]", en: "4 · decision · riskScore · alerts[]" },
  step4sub: { fr: "— dans la même réponse HTTP, immédiatement —", en: "— in the same HTTP response, immediately —" },
  step5: { fr: "5 · Décision métier finale", en: "5 · Final business decision" },
  step5sub1: { fr: "suit ou ajuste le verdict selon", en: "follows or adjusts the verdict based" },
  step5sub2: { fr: "ses propres règles", en: "on its own rules" },
  step6: { fr: "6 · Résultat : autorisée / bloquée / vérification requise", en: "6 · Result: approved / blocked / verification required" },
  sep1: { fr: "EN PARALLÈLE · CANAL SÉPARÉ", en: "IN PARALLEL · SEPARATE CHANNEL" },
  step7: { fr: "7 · Webhook : alert.created / transaction.blocked", en: "7 · Webhook: alert.created / transaction.blocked" },
  step7sub: { fr: "même événement — utile si un autre système doit agir dessus", en: "same event — useful when a different system needs to act on it" },
  sep2: { fr: "PLUS TARD · AUCUN ÉQUIVALENT SYNCHRONE", en: "LATER · NO SYNCHRONOUS EQUIVALENT" },
  noteLine1: { fr: "Un analyste change un statut", en: "An analyst changes a status" },
  noteLine2: { fr: "dans le portail Protegey, ou une", en: "in the Protegey portal, or a" },
  noteLine3: { fr: "vérification KYC se termine", en: "hosted KYC check finishes" },
  step8: { fr: "8 · Webhook : alert.status_changed / kyc.status_changed", en: "8 · Webhook: alert.status_changed / kyc.status_changed" },
};

/** How a transaction decision actually reaches a partner's backend: one specific, real sequence
 * — not a generic diagramming primitive — covering the synchronous POST /partner-api/transactions
 * round-trip and the two webhook events that have no synchronous equivalent. Sized to be read on
 * its own dedicated page, not squeezed into a sidebar card. All labels follow the viewer's own
 * `lang`, same as every other string in the app — field/endpoint names stay identical in both
 * since those are literal API contract, not prose. */
export function TransactionSequenceDiagram({ lang }: { lang: Lang }) {
  const s = (key: keyof typeof STR) => STR[key][lang];

  return (
    <svg viewBox="0 0 1040 840" className="w-full max-w-[1040px]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="seqArrow" markerWidth="11" markerHeight="11" refX="8.5" refY="3.5" orient="auto">
          <path d="M0,0 L8,3.5 L0,7 Z" className="fill-foreground" />
        </marker>
        <marker id="seqArrowL" markerWidth="11" markerHeight="11" refX="2" refY="3.5" orient="auto">
          <path d="M8,0 L0,3.5 L8,7 Z" className="fill-foreground" />
        </marker>
        <marker id="seqArrowTeal" markerWidth="11" markerHeight="11" refX="2" refY="3.5" orient="auto">
          <path d="M8,0 L0,3.5 L8,7 Z" className="fill-primary" />
        </marker>
      </defs>

      {/* actor boxes */}
      <g fontWeight={700} fontSize={16}>
        <rect x="20" y="18" width="220" height="56" rx="11" className="fill-muted stroke-border" strokeWidth={1.2} />
        <text x="130" y="42" textAnchor="middle" className="fill-foreground">{s("clientActor")}</text>
        <text x="130" y="61" textAnchor="middle" fontSize={11.5} fontWeight={400} className="fill-muted-foreground">{s("clientActorSub")}</text>

        <rect x="390" y="18" width="220" height="56" rx="11" className="fill-muted stroke-border" strokeWidth={1.2} />
        <text x="500" y="42" textAnchor="middle" className="fill-foreground">{s("backendActor")}</text>
        <text x="500" y="61" textAnchor="middle" fontSize={11.5} fontWeight={400} className="fill-muted-foreground">{s("backendActorSub")}</text>

        <rect x="760" y="18" width="220" height="56" rx="11" className="fill-primary/10 stroke-primary" strokeWidth={1.4} />
        <text x="870" y="42" textAnchor="middle" className="fill-primary">Protegey</text>
        <text x="870" y="61" textAnchor="middle" fontSize={11.5} fontWeight={400} className="fill-primary">{s("protegeyActorSub")}</text>
      </g>

      {/* lifelines */}
      <line x1="130" y1="74" x2="130" y2="812" strokeWidth={1.3} strokeDasharray="4,4" className="stroke-border" />
      <line x1="500" y1="74" x2="500" y2="812" strokeWidth={1.3} strokeDasharray="4,4" className="stroke-border" />
      <line x1="870" y1="74" x2="870" y2="812" strokeWidth={1.3} strokeDasharray="4,4" className="stroke-border" />

      {/* 1 — client -> backend */}
      <text x="315" y="104" textAnchor="middle" fontSize={14} fontWeight={700} className="fill-foreground">{s("step1")}</text>
      <line x1="130" y1="120" x2="486" y2="120" strokeWidth={1.8} markerEnd="url(#seqArrow)" className="stroke-foreground" />

      {/* 2 — backend -> protegey */}
      <text x="685" y="156" textAnchor="middle" fontSize={14} fontWeight={700} className="fill-foreground">{s("step2")}</text>
      <text x="685" y="175" textAnchor="middle" fontSize={11.5} fontFamily="var(--font-mono, monospace)" className="fill-muted-foreground">{s("step2sub")}</text>
      <line x1="500" y1="188" x2="856" y2="188" strokeWidth={1.8} markerEnd="url(#seqArrow)" className="stroke-foreground" />

      {/* 3 — note: protegey self analysis */}
      <rect x="735" y="210" width="245" height="60" rx="10" className="fill-primary/10 stroke-primary" strokeWidth={1.2} />
      <text x="857" y="235" textAnchor="middle" fontSize={13} fontWeight={700} className="fill-primary">{s("step3")}</text>
      <text x="857" y="253" textAnchor="middle" fontSize={11.5} className="fill-primary">{s("step3sub")}</text>

      {/* 4 — protegey --> backend, dashed return, same response */}
      <text x="685" y="307" textAnchor="middle" fontSize={14.5} fontWeight={800} className="fill-primary">{s("step4")}</text>
      <text x="685" y="325" textAnchor="middle" fontSize={11.5} className="fill-muted-foreground">{s("step4sub")}</text>
      <line x1="856" y1="338" x2="500" y2="338" strokeWidth={2} strokeDasharray="7,5" markerEnd="url(#seqArrowTeal)" className="stroke-primary" />

      {/* 5 — note: backend self decision */}
      <rect x="380" y="362" width="240" height="68" rx="10" className="fill-amber-50 stroke-amber-400 dark:fill-amber-950 dark:stroke-amber-700" strokeWidth={1.2} />
      <text x="500" y="387" textAnchor="middle" fontSize={13} fontWeight={700} className="fill-amber-700 dark:fill-amber-400">{s("step5")}</text>
      <text x="500" y="405" textAnchor="middle" fontSize={11.5} className="fill-amber-700 dark:fill-amber-400">{s("step5sub1")}</text>
      <text x="500" y="420" textAnchor="middle" fontSize={11.5} className="fill-amber-700 dark:fill-amber-400">{s("step5sub2")}</text>

      {/* 6 — backend -> client */}
      <text x="315" y="470" textAnchor="middle" fontSize={14} fontWeight={700} className="fill-foreground">{s("step6")}</text>
      <line x1="486" y1="486" x2="130" y2="486" strokeWidth={1.8} markerEnd="url(#seqArrowL)" className="stroke-foreground" />

      {/* separator 1 */}
      <line x1="20" y1="532" x2="1020" y2="532" strokeWidth={1.2} strokeDasharray="2,5" className="stroke-border" />
      <rect x="350" y="516" width="300" height="32" rx="16" className="fill-background stroke-border" strokeWidth={1.2} />
      <text x="500" y="537" textAnchor="middle" fontSize={12} fontWeight={700} className="fill-muted-foreground">{s("sep1")}</text>

      {/* 7 — webhook alert.created / transaction.blocked */}
      <text x="685" y="580" textAnchor="middle" fontSize={14.5} fontWeight={800} className="fill-primary">{s("step7")}</text>
      <text x="685" y="598" textAnchor="middle" fontSize={11.5} className="fill-muted-foreground">{s("step7sub")}</text>
      <line x1="856" y1="611" x2="500" y2="611" strokeWidth={2} strokeDasharray="7,5" markerEnd="url(#seqArrowTeal)" className="stroke-primary" />

      {/* separator 2 */}
      <line x1="20" y1="656" x2="1020" y2="656" strokeWidth={1.2} strokeDasharray="2,5" className="stroke-border" />
      <rect x="290" y="640" width="420" height="32" rx="16" className="fill-background stroke-border" strokeWidth={1.2} />
      <text x="500" y="661" textAnchor="middle" fontSize={12} fontWeight={700} className="fill-muted-foreground">{s("sep2")}</text>

      {/* note: trigger context */}
      <rect x="745" y="686" width="235" height="76" rx="10" className="fill-muted stroke-border" strokeWidth={1.2} />
      <text x="862" y="709" textAnchor="middle" fontSize={11.8} fontWeight={600} className="fill-muted-foreground">{s("noteLine1")}</text>
      <text x="862" y="726" textAnchor="middle" fontSize={11.8} className="fill-muted-foreground">{s("noteLine2")}</text>
      <text x="862" y="743" textAnchor="middle" fontSize={11.8} className="fill-muted-foreground">{s("noteLine3")}</text>

      {/* 8 — webhook alert.status_changed / kyc.status_changed */}
      <text x="685" y="802" textAnchor="middle" fontSize={14.5} fontWeight={800} className="fill-primary">{s("step8")}</text>
      <line x1="856" y1="812" x2="500" y2="812" strokeWidth={2} strokeDasharray="7,5" markerEnd="url(#seqArrowTeal)" className="stroke-primary" />

      {/* lifeline end caps */}
      <circle cx="130" cy="812" r="3.2" className="fill-border" />
      <circle cx="500" cy="812" r="3.2" className="fill-border" />
      <circle cx="870" cy="812" r="3.2" className="fill-border" />
    </svg>
  );
}
