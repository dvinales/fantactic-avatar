import { Badge } from "./ui/badge";
import type { VideoStatus } from "@/lib/types";

/** Video status in studio language: Queued / Rolling / Ready / Failed. */
export function StatusBadge({ status }: { status: VideoStatus }) {
  switch (status) {
    case "completed":
      return (
        <Badge tone="ready">
          <span aria-hidden>●</span> Ready
        </Badge>
      );
    case "failed":
      return (
        <Badge tone="danger">
          <span aria-hidden>●</span> Failed
        </Badge>
      );
    case "processing":
      return (
        <Badge tone="key">
          <span aria-hidden className="tally">
            ●
          </span>{" "}
          Rolling
        </Badge>
      );
    default:
      return (
        <Badge tone="neutral">
          <span aria-hidden>●</span> Queued
        </Badge>
      );
  }
}
