const LOGO_URL =
  "https://protegey-bucket.s3.eu-north-1.amazonaws.com/public/constant/protegey_logo.svg";

/** The logo's wordmark is white, so it always needs a dark backdrop regardless of the active theme. */
export function Logo({ className = "h-7" }: { className?: string }) {
  return (
    <div className="inline-flex rounded-md bg-[#0B1741] px-4 py-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_URL} alt="Protegey" className={`w-auto ${className}`} />
    </div>
  );
}
