import { HeyGenProvider } from "./heygen";
import { SeedanceProvider } from "./seedance";
import type { VideoProvider } from "./types";

export type {
  VideoProvider,
  VideoCapabilities,
  VideoSubmitInput,
  VideoStatusResult,
} from "./types";

/** Provider registry. Constructors are side-effect free (keys read lazily). */
const providers: Record<string, VideoProvider> = {
  heygen: new HeyGenProvider(),
  seedance: new SeedanceProvider(),
};

export const DEFAULT_VIDEO_PROVIDER = "heygen";

export function getVideoProvider(name: string = DEFAULT_VIDEO_PROVIDER): VideoProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown video provider "${name}". Available: ${Object.keys(providers).join(", ")}`);
  }
  return provider;
}

export function listVideoProviders(): VideoProvider[] {
  return Object.values(providers);
}
