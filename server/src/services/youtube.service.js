import { fetchTranscript as fetchYtTranscript } from "youtube-transcript";

export function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v") || u.pathname.split("/").pop() || null;
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] || null;
    }
  } catch {
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
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
  let current = { text: "", startTime: 0, endTime: 0 };

  for (const seg of segments) {
    const start = seg.offset / 1000;
    const end = (seg.offset + seg.duration) / 1000;

    if (!current.startTime) current.startTime = start;

    current.text += seg.text + " ";
    current.endTime = end;

    if (end - current.startTime >= chunkSeconds) {
      chunks.push({ ...current, text: current.text.trim() });
      current = { text: "", startTime: 0, endTime: 0 };
    }
  }

  if (current.text.trim()) {
    chunks.push({ ...current, text: current.text.trim() });
  }

  return chunks;
}

export function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
