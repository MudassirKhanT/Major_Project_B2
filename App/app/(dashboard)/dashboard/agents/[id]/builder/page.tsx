import AgentBuilder from "@/components/builder/AgentBuilder";

interface PageProps {
  params: { id: string };
}

export default function BuilderPage({ params }: PageProps) {
  return <AgentBuilder agentId={params.id} />;
}
