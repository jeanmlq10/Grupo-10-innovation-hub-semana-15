import { ExploreView } from "@/components/ExploreView";
import { getPublishedProjects } from "@/lib/roble/projects";

export default async function Home() {
  const result = await getPublishedProjects();
  return <ExploreView result={result} />;
}
