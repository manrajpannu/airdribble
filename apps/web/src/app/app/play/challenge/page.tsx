import PlayScenarios from "@/components/play-scenarios";
import { WebGLHeroBanner } from "@/components/webgl-hero-banner";

export default function PlayChallengePage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-8">
      <WebGLHeroBanner />
      <PlayScenarios />
    </div>
  );
}
