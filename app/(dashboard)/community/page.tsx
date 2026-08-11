'use client'

import { useEffect } from 'react'

export default function CommunityPage() {
  useEffect(() => {
    // Import Crate dynamically on the client side
    import('@widgetbot/crate').then(({ default: Crate }) => {
      const crate = new Crate({
        server: '1536050258805522462',
        channel: '1536050259334013103',
      })
    })
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 p-6">
      <h1 className="text-2xl font-bold text-white">Community Chat</h1>
      <p className="text-slate-400 text-sm max-w-md">
        Click the chat bubble in the bottom right corner of your screen to open the community chat.
      </p>
    </div>
  )
}