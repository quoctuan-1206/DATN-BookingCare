const ALLOWED_TAGS = new Set([
  "A", "B", "BLOCKQUOTE", "BR", "DIV", "EM", "H2", "H3", "I", "LI",
  "OL", "P", "SPAN", "STRONG", "U", "UL",
]);

export function sanitizeRichText(html = "") {
  if (!html || typeof window === "undefined") return html || "";

  const documentNode = new DOMParser().parseFromString(html, "text/html");
  const nodes = [...documentNode.body.querySelectorAll("*")];

  nodes.forEach((node) => {
    if (!ALLOWED_TAGS.has(node.tagName)) {
      if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED"].includes(node.tagName)) {
        node.remove();
      } else {
        node.replaceWith(...node.childNodes);
      }
      return;
    }

    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const isSafeLink =
        node.tagName === "A" && name === "href" && /^(https?:|mailto:|tel:|\/)/i.test(attribute.value);
      const isAlignment = name === "style" && /^text-align:\s*(left|center|right);?$/i.test(attribute.value);
      if (!isSafeLink && !isAlignment) node.removeAttribute(attribute.name);
    });

    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });

  return documentNode.body.innerHTML;
}

export function hasRichText(html = "") {
  if (!html) return false;
  if (typeof window === "undefined") return Boolean(html.trim());
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  return Boolean(documentNode.body.textContent.trim() || documentNode.body.querySelector("img"));
}
