import ConversationList from "@/components/conversations/ConversationList";

export default function ConversationsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Conversations</h2>
        <p className="text-slate-400 text-sm mt-1">All your agent chat history</p>
      </div>
      <ConversationList />
    </div>
  );
}
