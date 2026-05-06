import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { headers } from "next/headers"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const agent = await db.agent.findFirst({
    where: { widgetToken: token, isPublished: true },
    select: { name: true },
  })

  if (!agent) {
    return new NextResponse("// Agent not found", {
      status: 404,
      headers: { "Content-Type": "application/javascript" },
    })
  }

  const headersList = await headers()
  const host = headersList.get("host") || ""
  const proto = process.env.NODE_ENV === "production" ? "https" : "http"
  const origin = `${proto}://${host}`
  const chatUrl = `${origin}/chat/${token}`

  const CHAT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.7 0-3.28-.46-4.65-1.26l-.33-.2-3.47.97.97-3.47-.2-.33C3.46 15.28 3 13.7 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9z"/></svg>`
  const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`

  const script = `
(function() {
  if (window.__everydayai_loaded) return;
  window.__everydayai_loaded = true;

  var CHAT_URL = '${chatUrl}';
  var isOpen = false;
  var iframe = null;

  var btn = document.createElement('div');
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#ff5500;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2147483647;box-shadow:0 4px 24px rgba(255,85,0,0.45);transition:transform 0.18s ease,box-shadow 0.18s ease;';
  btn.innerHTML = '${CHAT_ICON}';
  document.body.appendChild(btn);

  btn.addEventListener('mouseenter', function() {
    btn.style.transform = 'scale(1.09)';
    btn.style.boxShadow = '0 6px 32px rgba(255,85,0,0.6)';
  });
  btn.addEventListener('mouseleave', function() {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 24px rgba(255,85,0,0.45)';
  });

  function openChat() {
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.src = CHAT_URL;
      iframe.allow = 'microphone';
      iframe.style.cssText = 'position:fixed;bottom:96px;right:24px;width:380px;height:600px;border:none;border-radius:16px;box-shadow:0 8px 48px rgba(0,0,0,0.55);z-index:2147483646;transform:translateY(14px) scale(0.97);opacity:0;transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);';
      document.body.appendChild(iframe);
      setTimeout(function() {
        iframe.style.transform = 'translateY(0) scale(1)';
        iframe.style.opacity = '1';
      }, 10);
    } else {
      iframe.style.display = 'block';
      iframe.style.transform = 'translateY(0) scale(1)';
      iframe.style.opacity = '1';
    }
    isOpen = true;
    btn.innerHTML = '${CLOSE_ICON}';
  }

  function closeChat() {
    if (iframe) {
      iframe.style.transform = 'translateY(14px) scale(0.97)';
      iframe.style.opacity = '0';
      setTimeout(function() {
        if (iframe) iframe.style.display = 'none';
      }, 240);
    }
    isOpen = false;
    btn.innerHTML = '${CHAT_ICON}';
  }

  btn.addEventListener('click', function() {
    isOpen ? closeChat() : openChat();
  });

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) closeChat();
  });
})();
`.trim()

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
