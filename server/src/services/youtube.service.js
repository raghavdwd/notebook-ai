import { fetchTranscript as fetchYtTranscript } from "youtube-transcript";

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

const isValidVideoId = (value) => YOUTUBE_VIDEO_ID_REGEX.test(value || "");

export function extractVideoId(url) {
  const rawValue = String(url || "").trim();
  if (isValidVideoId(rawValue)) return rawValue;

  try {
    const u = new URL(rawValue);
    const hostname = u.hostname.replace(/^www\./, "");
    let candidate = null;

    if (hostname === "youtu.be") {
      candidate = u.pathname.slice(1).split("/")[0] || null;
    } else if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "music.youtube.com") {
      if (u.pathname === "/watch") {
        candidate = u.searchParams.get("v");
      } else if (u.pathname.startsWith("/embed/") || u.pathname.startsWith("/shorts/") || u.pathname.startsWith("/v/")) {
        candidate = u.pathname.split("/")[2] || null;
      }
    }

    return isValidVideoId(candidate) ? candidate : null;
  } catch {
    if (isValidVideoId(rawValue)) return rawValue;
  }
  return null;
}

export async function fetchTranscript(videoId) {
  const transcript = await fetchYtTranscript(videoId);
  return transcript
    .filter((s) => s.text?.trim())
    .map((s) => ({
      text: s.text.trim(),
      offset: s.offset,
      duration: s.duration,
    }));
}

export function chunkTranscriptByTime(segments, chunkSeconds = 60) {
  const chunks = [];
  let current = { text: "", startTime: null, endTime: 0 };

  for (const seg of segments) {
    const start = seg.offset / 1000;
    const end = (seg.offset + seg.duration) / 1000;

    if (current.startTime === null) current.startTime = start;

    current.text += seg.text + " ";
    current.endTime = end;

    if (end - current.startTime >= chunkSeconds) {
      chunks.push({ ...current, text: current.text.trim() });
      current = { text: "", startTime: null, endTime: 0 };
    }
  }

  if (current.text.trim()) {
    chunks.push({ ...current, text: current.text.trim() });
  }

  return chunks;
}

export function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
