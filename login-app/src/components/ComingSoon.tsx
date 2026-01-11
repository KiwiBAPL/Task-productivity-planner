interface ComingSoonProps {
  title: string
  description: string
  icon?: JSX.Element
}

function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-auro-bg0">
        <div className="absolute inset-0 gradient-radial-top-left" />
        <div className="absolute inset-0 gradient-radial-mid-left" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="glass-panel p-12 rounded-[32px] max-w-2xl w-full">
          <div className="text-center space-y-6">
            {/* Icon */}
            {icon && (
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 rounded-full bg-auro-accent-soft border border-auro-accent/35 flex items-center justify-center shadow-glow-accent">
                  {icon}
                </div>
              </div>
            )}

            {/* Sparkles decoration */}
            <div className="flex justify-center gap-3 mb-6">
              <svg className="w-6 h-6 text-auro-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <svg className="w-5 h-5 text-auro-accent opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <svg className="w-4 h-4 text-auro-accent opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-semibold text-auro-text-primary leading-tight tracking-tight">
              {title}
            </h1>

            {/* Coming Soon badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-auro-accent-soft border border-auro-accent/35 text-auro-text-primary text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-auro-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-auro-accent"></span>
              </span>
              Coming Soon
            </div>

            {/* Description */}
            <p className="text-auro-text-tertiary leading-normal max-w-lg mx-auto">
              {description}
            </p>

            {/* Additional info */}
            <div className="pt-6 text-xs text-auro-text-tertiary">
              We're working hard to bring you this exciting new feature
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComingSoon
