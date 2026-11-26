// Brewpack mark (bold outline). Draws in currentColor so it follows the
// surrounding text color. Geometry and stroke match brewpack-logo-outline-bold.svg.
// Pass title="" when the logo is decorative (next to a "Brewpack" heading).
export default function BrewpackLogo({ size = 40, strokeWidth = 20, className, title = 'Brewpack' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="40 40 380 420"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <mask id="brewpack-pin-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
          <rect width="512" height="512" fill="#fff" stroke="none" />
          <path d="M233 232C215 205 176 172 176 121A57 57 0 0 1 290 121C290 172 251 205 233 232Z" fill="#000" stroke="#000" strokeWidth="42" />
        </mask>
      </defs>
      <g mask="url(#brewpack-pin-cut)">
        <path d="M142 214H130Q120 214 120 204V168Q120 154 134 154H158Q174 154 174 168V178" />
        <path d="M324 214H336Q346 214 346 204V168Q346 154 332 154H308Q292 154 292 168V178" />
        <path d="M140 226V404Q140 442 178 442H288Q326 442 326 404V226" />
        <ellipse cx="233" cy="226" rx="93" ry="18" />
        <path d="M326 262H350A56 56 0 0 1 350 374H326" />
        <path d="M140 326H126Q108 326 108 344V388Q108 406 126 406H140" />
        <rect x="174" y="316" width="118" height="96" rx="22" />
      </g>
      <path d="M233 232C215 205 176 172 176 121A57 57 0 0 1 290 121C290 172 251 205 233 232Z" />
      <circle cx="233" cy="122" r="17" />
    </svg>
  )
}
