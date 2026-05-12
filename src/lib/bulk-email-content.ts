const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i;

export function prepareBulkMailContent(body: string) {
  if (HTML_TAG_RE.test(body)) {
    return { html: body };
  }

  return { text: body };
}
