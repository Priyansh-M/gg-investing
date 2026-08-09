export default function CommunityPage() {
  return (
    <div className="flex flex-col h-full w-full p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Community Chat</h1>
      
      {/* Embedded WidgetBot Window */}
      <div className="flex-grow w-full bg-[#313338] rounded-lg overflow-hidden shadow-lg border border-gray-800">
        <iframe 
          src="https://e.widgetbot.io/channels/1536050258805522462/1536050259334013103" 
          height="100%" 
          width="100%" 
          style={{ minHeight: '75vh' }}
          className="border-none"
          title="Discord Community Chat"
        />
      </div>
    </div>
  )
}