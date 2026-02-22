"use client";

import { useState, useEffect, useRef } from "react";

interface UseJobPollingOptions {
  initialData: Record<string, unknown> | undefined;
  enabled: boolean;
  /** Formatter type (e.g. "image", "video", "audio") — used to produce the right field names */
  formatterType?: string;
}

interface UseJobPollingResult {
  data: Record<string, unknown> | undefined;
  isPolling: boolean;
}

/**
 * Polls a job endpoint when tool result data indicates an async job is processing.
 * Returns updated data that transitions renderers from spinner → result in-place.
 */
export function useJobPolling({
  initialData,
  enabled,
  formatterType,
}: UseJobPollingOptions): UseJobPollingResult {
  const [polledData, setPolledData] = useState<
    Record<string, unknown> | undefined
  >(undefined);
  const [isPolling, setIsPolling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldPoll =
    enabled &&
    initialData !== undefined &&
    initialData.status === "processing" &&
    (typeof initialData.job_id === "string" ||
      typeof initialData.poll_url === "string");

  useEffect(() => {
    if (!shouldPoll || !initialData) return;

    const jobId = initialData.job_id as string | undefined;
    if (!jobId) return;

    let attempt = 0;
    const maxAttempts = 60;
    const controller = new AbortController();
    abortRef.current = controller;
    setIsPolling(true);

    function getDelay(n: number): number {
      // 2s → 4s → 8s → 10s cap
      return Math.min(2000 * Math.pow(2, n), 10000);
    }

    async function poll() {
      if (controller.signal.aborted || attempt >= maxAttempts) {
        setIsPolling(false);
        return;
      }

      try {
        const res = await fetch(`/api/jobs/${jobId}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          attempt++;
          timeoutRef.current = setTimeout(poll, getDelay(attempt));
          return;
        }

        const json = await res.json();
        const normalized = normalizeJobData(json, initialData, formatterType);

        setPolledData(normalized);

        if (normalized.status !== "processing") {
          setIsPolling(false);
          return;
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }

      attempt++;
      timeoutRef.current = setTimeout(poll, getDelay(attempt));
    }

    timeoutRef.current = setTimeout(poll, 2000);

    return () => {
      controller.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsPolling(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldPoll, initialData?.job_id]);

  return {
    data: polledData ?? initialData,
    isPolling,
  };
}

/**
 * Extracts a URL from a job result object.
 * Job results from providers like Replicate store the URL in `output`, `url`,
 * or a media-specific key like `image_url` / `audio_url` / `video_url`.
 */
function extractUrlFromResult(
  result: Record<string, unknown>
): string | undefined {
  for (const key of [
    "output",
    "url",
    "image_url",
    "audio_url",
    "video_url",
  ]) {
    if (typeof result[key] === "string") return result[key] as string;
  }
  return undefined;
}

/**
 * Normalizes job API responses so existing renderers can consume them directly.
 *
 * The job polling API returns: `{ ok, data: { status, result: { output: "https://..." } } }`
 *
 * But renderers expect specific top-level keys:
 * - image.tsx checks `d.image_url`
 * - audio.tsx checks `d.audio_url`
 * - video.tsx checks `d.result.output` (already works with raw shape)
 *
 * Without this normalization, `d.poll_url && !d.image_url` stays true and
 * the image renderer shows the spinner forever.
 */
function normalizeJobData(
  json: Record<string, unknown>,
  initial: Record<string, unknown>,
  formatterType?: string
): Record<string, unknown> {
  // Unwrap { ok, data } envelope
  let payload =
    json.ok !== undefined && typeof json.data === "object" && json.data !== null
      ? (json.data as Record<string, unknown>)
      : json;

  // Merge with initial data so fields like poll_url, job_id carry through
  payload = { ...initial, ...payload };

  // If completed and result has a URL, set the renderer-specific field
  if (
    payload.status !== "processing" &&
    payload.result &&
    typeof payload.result === "object"
  ) {
    const result = payload.result as Record<string, unknown>;
    const url = extractUrlFromResult(result);

    if (url) {
      switch (formatterType) {
        case "image":
          if (!payload.image_url) payload = { ...payload, image_url: url };
          break;
        case "audio":
          if (!payload.audio_url) payload = { ...payload, audio_url: url };
          break;
        // video renderer already reads d.result.output — no top-level field needed
      }
    }
  }

  return payload;
}
