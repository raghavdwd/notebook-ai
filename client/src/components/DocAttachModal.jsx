import React, { useEffect, useMemo, useState } from "react";
import { FileText, Video, X, Upload, Link } from "lucide-react";
import { axiosInstance } from "../utils/axiosInstance";
import { notify } from "../utils/notify";

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

const extractYouTubeVideoId = (input) => {
  const value = input.trim();
  if (YOUTUBE_VIDEO_ID_REGEX.test(value)) return value;
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");
    if (hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return YOUTUBE_VIDEO_ID_REGEX.test(id) ? id : null;
    }
    if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "music.youtube.com") {
      let id = null;
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v");
      } else if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/v/")) {
        id = url.pathname.split("/")[2];
      }
      return YOUTUBE_VIDEO_ID_REGEX.test(id || "") ? id : null;
    }
  } catch {
    return null;
  }
  return null;
};

const DocAttachModal = ({ onClose, activeSessionId, onSuccess }) => {
  const [tab, setTab] = useState("pdf");
  const [ytUrl, setYtUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedYtUrl = ytUrl.trim();
  const isValidYtUrl = useMemo(() => !!extractYouTubeVideoId(trimmedYtUrl), [trimmedYtUrl]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handlePdfUpload = (e) => {
    const input = e.target;
    const file = e.target.files[0];
    input.value = "";
    if (!file) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("pdfFile", file);
    const uploadPath = activeSessionId
      ? `/upload?sessionId=${activeSessionId}`
      : "/upload";
    axiosInstance
      .post(uploadPath, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        if (res.data.success) {
          notify("PDF uploaded successfully!", "success");
          onSuccess?.();
          onClose();
          return;
        }
        notify(res.data.message || "PDF upload failed!", "error");
      })
      .catch((err) => notify(err.response?.data?.message || err.message || "PDF upload failed!", "error"))
      .finally(() => setIsSubmitting(false));
  };

  const handleYtAttach = () => {
    if (!trimmedYtUrl) return;
    if (!isValidYtUrl) {
      notify("Please enter a valid YouTube URL", "error");
      return;
    }
    setIsSubmitting(true);
    axiosInstance
      .post("/youtube/attach", {
        url: trimmedYtUrl,
        sessionId: activeSessionId,
      })
      .then((res) => {
        if (res.data.success) {
          notify("YouTube video attached successfully!", "success");
          onSuccess?.();
          onClose();
          return;
        }
        notify(res.data.message || "Failed to attach YouTube video", "error");
      })
      .catch((err) => {
        notify(err.response?.data?.message || "Failed to attach YouTube video", "error");
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white border-2 border-black w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-black">
          <h2 className="font-bold text-lg">Attach Document</h2>
          <button onClick={onClose} className="p-1 hover:bg-black hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-black">
          <button
            className={`flex-1 p-3 font-semibold text-center transition-colors flex items-center justify-center gap-2 ${
              tab === "pdf" ? "bg-black text-white" : "hover:bg-gray-100"
            }`}
            onClick={() => setTab("pdf")}
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
          <button
            className={`flex-1 p-3 font-semibold text-center transition-colors flex items-center justify-center gap-2 ${
              tab === "youtube" ? "bg-black text-white" : "hover:bg-gray-100"
            }`}
            onClick={() => setTab("youtube")}
          >
            <Video className="h-4 w-4" />
            YouTube
          </button>
        </div>

        <div className="p-6">
          {tab === "pdf" ? (
            <div>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-black p-8 cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="h-8 w-8 mb-2" />
                <span className="font-semibold">Click to upload PDF</span>
                <span className="text-sm text-gray-500 mt-1">or drag and drop</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>
              {isSubmitting && (
                <div className="mt-3 text-center text-sm text-gray-600">Uploading...</div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center border-2 border-black p-2 mb-4">
                <Link className="h-5 w-5 text-gray-400 ml-2" />
                <input
                  type="text"
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 px-3 py-2 outline-none"
                  disabled={isSubmitting}
                />
              </div>
              {trimmedYtUrl && !isValidYtUrl && (
                <div className="mb-3 text-sm text-red-600">Enter a valid YouTube video URL or video ID.</div>
              )}
              <button
                onClick={handleYtAttach}
                disabled={!trimmedYtUrl || !isValidYtUrl || isSubmitting}
                className="w-full p-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Attach YouTube Video
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocAttachModal;
