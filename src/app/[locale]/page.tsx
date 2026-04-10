import { getFeatureFlags } from "@/lib/feature-flags";
import { HomeClient } from "@/components/HomeClient";

export default function Home() {
  const flags = getFeatureFlags();
  return <HomeClient flags={flags} />;
}
