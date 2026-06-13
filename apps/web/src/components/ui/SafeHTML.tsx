import DOMPurify from "isomorphic-dompurify";
import { cn } from "@oruclass/utils";

function decodeHTMLEntities(text: string) {
  if (!text) return text;
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  };
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (match) => entities[match] || match);
}

// Allowlist matches what the TipTap editor can produce. Anything else
// (scripts, event handlers, iframes, javascript: URLs) is stripped.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "span", "div",
    "strong", "b", "em", "i", "u", "s", "strike", "del", "mark",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "hr",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

// Force every surviving anchor to open safely (defends against tabnabbing).
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.hasAttribute("href")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer nofollow");
  }
});

interface SafeHTMLProps {
  html?: string | null;
  className?: string;
}

export function SafeHTML({ html, className }: SafeHTMLProps) {
  if (!html) return null;

  const decodedHtml = decodeHTMLEntities(html);
  const clean = DOMPurify.sanitize(decodedHtml, SANITIZE_CONFIG);
  if (!clean) return null;

  return (
    <div
      className={cn("prose prose-sm max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
