export function WovenMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M7 13c5 0 5 22 11 22 5 0 5-14 8-14s3 14 8 14c6 0 6-22 8-22"
        fill="none"
        stroke="#fcfaf5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <circle cx="7" cy="13" r="4" fill="#b7f522" />
      <circle cx="42" cy="13" r="4.5" fill="#fcfaf5" />
      <circle cx="42" cy="13" r="2.75" fill="#1545e8" />
    </svg>
  );
}
