import { ExternalLink } from 'lucide-react'

export default function CommunityPage() {
  const widgetUrl = "https://e.widgetbot.io/channels/1536050258805522462/1536050259334013103"

  return (
    <div className="flex flex-col h-full w-full p-6 space-y-4">
      {/* Header & Fallback Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Community Chat</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Join as a guest or sign in with Discord.
          </p>
        </div>

        {/* Fallback button for strict browser extension blocks */}
        <a
          href={widgetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors w-fit"
        >
          <span>Having captcha issues? Open full screen</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Embedded WidgetBot Window with Captcha Permissions */}
      <div className="flex-grow w-full bg-[#313338] rounded-2xl overflow-hidden shadow-xl border border-slate-800">
        <iframe 
          src={widgetUrl}
          height="100%" 
          width="100%" 
          style={{ minHeight: '75vh' }}
          className="border-none w-full h-full"
          title="Discord Community Chat"
          // Enables media & clipboard permissions
          allow="clipboard-write; camera; microphone; geolocation"
          // CRITICAL: Enables Cloudflare / hCaptcha popups & modals to render
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        />
      </div>
    </div>
  )
}