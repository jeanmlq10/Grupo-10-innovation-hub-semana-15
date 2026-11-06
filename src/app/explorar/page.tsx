import { ExploreView } from "@/components/ExploreView";
import { getPublishedProjects } from "@/lib/roble/projects";

export default async function ExplorePage() {
  const result = await getPublishedProjects();
  return <ExploreView result={result} />;
}
