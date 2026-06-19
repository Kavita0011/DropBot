import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ chatbotId: string }> }) {
  const { chatbotId } = await params
  const chatbot = await prisma.chatbot.findFirst({
    where: { id: chatbotId, status: { not: "draft" } },
    select: { themeColor: true, position: true, name: true },
  })
  if (!chatbot) {
    return new NextResponse('console.error("DropBot: Chatbot not found")', {
      headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=60" },
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("host")}`
  const position = chatbot.position === "bottom-left" ? "left:20px" : "right:20px"
  const color = chatbot.themeColor || "#2563eb"

  const script = `(function(){
  var id="db-${chatbotId}",exists=document.getElementById(id);
  if(exists)return;
  var btn=document.createElement("div");
  btn.id=id;
  btn.innerHTML='<button id="db-btn" style="position:fixed;${position};bottom:20px;width:60px;height:60px;border-radius:50%;background:${color};color:#fff;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;z-index:99999;transition:transform 0.2s" aria-label="Chat"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>';
  document.body.appendChild(btn);
  var iframe=null,open=false;
  document.getElementById("db-btn").onclick=function(){
    if(!iframe){
      iframe=document.createElement("iframe");
      iframe.src="${baseUrl}/embed/${chatbotId}";
      iframe.style.cssText="position:fixed;${position};bottom:90px;width:400px;height:600px;max-height:calc(100vh - 100px);border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.12);z-index:99998;display:none";
      document.body.appendChild(iframe);
    }
    open=!open;
    iframe.style.display=open?"block":"none";
    btn.style.display=open?"none":"block";
  };
})()`

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
