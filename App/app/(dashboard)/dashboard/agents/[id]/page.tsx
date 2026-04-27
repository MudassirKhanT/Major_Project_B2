import { auth } from "@clerk/nextjs/server";
import AgentDetail from "@/components/agents/AgentDetail";

interface PageProps {
  params: { id: string };
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { userId } = await auth();
  return <AgentDetail agentId={params.id} userId={userId!} />;
}
