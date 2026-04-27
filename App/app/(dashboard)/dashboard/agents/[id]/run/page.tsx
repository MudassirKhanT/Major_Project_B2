import AgentChat from "@/components/chat/AgentChat";

interface PageProps {
  params: { id: string };
}

export default function RunAgentPage({ params }: PageProps) {
  return <AgentChat agentId={params.id} />;
}
