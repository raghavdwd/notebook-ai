import { jsPDF } from "jspdf";

const formatDate = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split("T")[0];
};

const cleanMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => code.trim())
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^### (.+)$/gm, "$1")
    .replace(/^## (.+)$/gm, "$1")
    .replace(/^# (.+)$/gm, "$1")
    .replace(/^\- (.+)$/gm, "• $1")
    .replace(/^\d+\. (.+)$/gm, "• $1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
};

export const generateChatPDF = (session, messages) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const checkNewPage = (needed = 20) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setTextColor(20);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(session?.title || "Chat", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text(`Generated on: ${formatDate()}`, margin, y);
  y += 15;

  doc.setDrawColor(180);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setTextColor(20);

  messages.forEach((msg) => {
    checkNewPage(40);

    const isUser = msg.type === "user";
    const speaker = isUser ? "You" : "AI";
    const time = msg.timestamp || "";

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20);
    doc.text(speaker, margin, y);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(time, margin + 20, y);
    y += 7;

    doc.setTextColor(20);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const content = isUser ? msg.content : cleanMarkdown(msg.content);
    const lines = doc.splitTextToSize(content, contentWidth);

    lines.forEach((line) => {
      checkNewPage(7);
      doc.text(line, margin, y);
      y += 7;
    });

    y += 10;
  });

  const filename = `${session?.title || "chat"}_${formatDate()}.pdf`;
  doc.save(filename);
};
