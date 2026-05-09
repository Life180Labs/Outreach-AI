/**
 * Wraps plain-text or HTML email body in properly formatted HTML.
 * The signature is added here to ensure all emails have it by default.
 */
export function formatEmailHTML(body: string): string {
  let innerHtml = body || "";
  
  // Basic check if it's already HTML (e.g. from Rich Text Editor)
  if (!innerHtml.trim().startsWith('<') && !innerHtml.includes('</p>')) {
    innerHtml = innerHtml
      .split(/\n\n+/)
      .filter(p => p.trim())
      .map(p => `<p style="margin:0 0 14px 0;line-height:1.6">${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  const signatureHtml = `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e4e4e7;">
      <p style="margin:0;font-weight:700;font-size:15px;color:#18181b;">GTM Team | Life180 Labs</p>
      <div style="margin:8px 0 0 0;font-size:12px;color:#71717a;">
        <p style="margin:0;"><a href="mailto:hello@life180labs.com" style="color:#0ea5e9;text-decoration:none;">hello@life180labs.com</a></p>
        <p style="margin:4px 0 0 0;">📞 +91 98765 43210</p>
      </div>
    </div>`;

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#18181b;max-width:600px">
    ${innerHtml}
    ${signatureHtml}
  </div>`;
}
