"use client"

interface EmptyStateProps {
  title: string
  description: string
  illustration: "contracts" | "notes" | "workers" | "visits" | "reminders" | "calendar" | "history"
  action?: React.ReactNode
}

const ILLUSTRATIONS = {
  contracts: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="20" y="10" width="55" height="70" rx="6" fill="currentColor" opacity="0.08"/>
      <rect x="28" y="10" width="55" height="70" rx="6" fill="currentColor" opacity="0.12"/>
      <rect x="36" y="10" width="55" height="70" rx="6" fill="currentColor" opacity="0.18"/>
      <rect x="42" y="22" width="35" height="4" rx="2" fill="currentColor" opacity="0.5"/>
      <rect x="42" y="34" width="28" height="3" rx="1.5" fill="currentColor" opacity="0.3"/>
      <rect x="42" y="43" width="32" height="3" rx="1.5" fill="currentColor" opacity="0.3"/>
      <rect x="42" y="52" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.3"/>
      <circle cx="88" cy="72" r="14" fill="currentColor" opacity="0.15"/>
      <path d="M84 72h8M88 68v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="15" y="15" width="65" height="72" rx="8" fill="currentColor" opacity="0.1"/>
      <rect x="22" y="22" width="51" height="58" rx="6" fill="currentColor" opacity="0.15"/>
      <path d="M30 36h35M30 46h35M30 56h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.35"/>
      <circle cx="85" cy="30" r="18" fill="currentColor" opacity="0.1"/>
      <path d="M79 30l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  ),
  workers: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="40" cy="32" r="14" fill="currentColor" opacity="0.15"/>
      <circle cx="40" cy="32" r="9" fill="currentColor" opacity="0.2"/>
      <path d="M18 72c0-12 10-20 22-20s22 8 22 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3"/>
      <circle cx="80" cy="36" r="11" fill="currentColor" opacity="0.1"/>
      <circle cx="80" cy="36" r="7" fill="currentColor" opacity="0.15"/>
      <path d="M63 72c0-9 8-15 17-15s17 6 17 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.2"/>
      <circle cx="88" cy="76" r="12" fill="currentColor" opacity="0.15"/>
      <path d="M84 76h8M88 72v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  visits: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="15" y="20" width="90" height="65" rx="10" fill="currentColor" opacity="0.08"/>
      <rect x="15" y="20" width="90" height="20" rx="10" fill="currentColor" opacity="0.12"/>
      <rect x="15" y="30" width="90" height="10" fill="currentColor" opacity="0.12"/>
      <line x1="38" y1="12" x2="38" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
      <line x1="82" y1="12" x2="82" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
      <circle cx="37" cy="60" r="7" fill="currentColor" opacity="0.2"/>
      <circle cx="60" cy="60" r="7" fill="currentColor" opacity="0.15"/>
      <circle cx="83" cy="60" r="7" fill="currentColor" opacity="0.1"/>
      <path d="M34 60l2.5 2.5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    </svg>
  ),
  reminders: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M60 20C45 20 35 30 35 45c0 20-8 28-8 28h66s-8-8-8-28c0-15-10-25-25-25z" fill="currentColor" opacity="0.12"/>
      <path d="M60 20C45 20 35 30 35 45c0 20-8 28-8 28h66s-8-8-8-28c0-15-10-25-25-25z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" opacity="0.3"/>
      <path d="M54 73a6 6 0 0012 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
      <line x1="60" y1="12" x2="60" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
      <circle cx="88" cy="22" r="8" fill="currentColor" opacity="0.3"/>
      <path d="M86 22h4M88 20v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="15" y="18" width="90" height="68" rx="10" fill="currentColor" opacity="0.08"/>
      <rect x="15" y="18" width="90" height="22" rx="10" fill="currentColor" opacity="0.14"/>
      <rect x="15" y="30" width="90" height="10" fill="currentColor" opacity="0.14"/>
      <line x1="40" y1="10" x2="40" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
      <line x1="80" y1="10" x2="80" y2="26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
      {[0,1,2,3,4,5,6].map(i => (
        <circle key={i} cx={27 + (i % 7) * 11} cy={55 + Math.floor(i/7) * 14} r="4" fill="currentColor" opacity={0.1 + i*0.03}/>
      ))}
      {[7,8,9,10,11,12,13].map(i => (
        <circle key={i} cx={27 + (i % 7) * 11} cy={55 + Math.floor((i)/7) * 14} r="4" fill="currentColor" opacity={0.05 + (i-7)*0.03}/>
      ))}
    </svg>
  ),
  history: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <line x1="42" y1="10" x2="42" y2="90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.15"/>
      {[18,38,58,78].map((y, i) => (
        <g key={y}>
          <circle cx="42" cy={y} r="6" fill="currentColor" opacity={0.15 + i*0.05}/>
          <rect x="56" y={y-6} width="40" height="12" rx="4" fill="currentColor" opacity={0.08 + i*0.03}/>
          <rect x="22" y={y-3} width="12" height="6" rx="3" fill="currentColor" opacity={0.15 + i*0.04}/>
        </g>
      ))}
    </svg>
  ),
}

export function EmptyState({ title, description, illustration, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center animate-fade-up">
      <div className="w-28 h-24 text-primary mb-5">
        {ILLUSTRATIONS[illustration]}
      </div>
      <p className="text-base font-bold text-foreground tracking-tight">{title}</p>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-[220px] leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
