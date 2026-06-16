import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ chatbotId: string }> }) {
  const { chatbotId } = await params

  const chatbot = await prisma.chatbot.findFirst({
    where: { id: chatbotId, status: "approved" },
    select: { id: true, name: true, welcomeMsg: true, themeColor: true, bgColor: true, textColor: true, position: true, logoUrl: true },
  })

  if (!chatbot) {
    return new NextResponse("console.error('DropBot: Chatbot not found')", {
      headers: { "Content-Type": "application/javascript" },
    })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const script = `(function(){
  var config = ${JSON.stringify({
    id: chatbot.id,
    name: chatbot.name,
    welcomeMsg: chatbot.welcomeMsg,
    themeColor: chatbot.themeColor,
    bgColor: chatbot.bgColor,
    textColor: chatbot.textColor,
    position: chatbot.position,
    apiUrl: origin + "/api/chat/" + chatbot.id,
    logoUrl: '${chatbot.logoUrl || ""}',
  })};

  var container = document.createElement("div");
  container.id = "dropbot-" + config.id;
  container.style.cssText = "all:initial;position:fixed;z-index:999999;font-family:system-ui,-apple-system,sans-serif;";

  var pos = config.position === "bottom-left"
    ? { right: "auto", left: "20px", bottom: "20px" }
    : { right: "20px", left: "auto", bottom: "20px" };

  container.style.cssText += ";right:" + pos.right + ";left:" + pos.left + ";bottom:" + pos.bottom;

  var shadow = container.attachShadow({ mode: "open" });

  shadow.innerHTML = '<style>' +
    '*{box-sizing:border-box;margin:0;padding:0}' +
    '.db-btn{width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.2);transition:transform 0.2s,box-shadow 0.2s}' +
    '.db-btn:hover{transform:scale(1.05);box-shadow:0 6px 28px rgba(0,0,0,0.25)}' +
    '.db-widget{width:380px;height:600px;max-height:calc(100vh - 40px);border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.15);animation:dbFadeIn 0.3s ease}' +
    '@keyframes dbFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}' +
    '.db-header{padding:16px;display:flex;align-items:center;justify-content:space-between;color:#fff}' +
    '.db-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px}' +
    '.db-msg{max-width:80%;padding:10px 16px;border-radius:16px;font-size:14px;line-height:1.5;animation:dbFadeIn 0.2s ease}' +
    '.db-msg.bot{border-bottom-left-radius:4px}' +
    '.db-msg.user{border-bottom-right-radius:4px}' +
    '.db-input-wrap{display:flex;gap:8px;padding:12px;border-top:1px solid #e5e7eb}' +
    '.db-input{flex:1;padding:10px 16px;border-radius:10px;border:1px solid #d1d5db;outline:none;font-size:14px;transition:border-color 0.2s}' +
    '.db-input:focus{border-color:' + config.themeColor + '}' +
    '.db-send{width:38px;height:38px;border-radius:10px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:opacity 0.2s}' +
    '.db-send:hover{opacity:0.9}' +
    '.db-send svg{width:16px;height:16px;fill:white}' +
  '</style>';

  var open = false;
  var msgs = [{ role:"bot", text: config.welcomeMsg }];
  var root = shadow;

  function render() {
    if (!open) {
      root.innerHTML = '<style>' + root.querySelector("style").textContent + '</style>' +
        '<button class="db-btn" style="background:' + config.themeColor + '" id="dbBtn">' +
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
        '</svg></button>';

      root.getElementById("dbBtn").onclick = function(){ open=true; render(); };
      return;
    }

    var html = '<style>' + root.querySelector("style").textContent + '</style>' +
      '<div class="db-widget" style="background:' + config.bgColor + '">' +
      '<div class="db-header" style="background:' + config.themeColor + '">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      (config.logoUrl ? '<img src="'+config.logoUrl+'" style="width:24px;height:24px;border-radius:4px;object-fit:contain" />' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>') +
      '<span style="font-weight:600;font-size:14px">' + config.name + '</span></div>' +
      '<button id="dbClose" style="background:none;border:none;color:white;cursor:pointer">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button></div>' +
      '<div class="db-msgs" id="dbMsgs">' +
      msgs.map(function(m){ return '<div style="display:flex;justify-content:' + (m.role==="user"?"flex-end":"flex-start") + '"><div class="db-msg ' + m.role + '" style="background:' + (m.role==="user"?config.themeColor:"#f3f4f6") + ';color:' + (m.role==="user"?"white":config.textColor) + '">' + m.text + '</div></div>'; }).join("") +
      '</div>' +
      '<div class="db-input-wrap"><input class="db-input" id="dbInput" placeholder="Type a message..." style="color:' + config.textColor + '" /><button class="db-send" id="dbSend" style="background:' + config.themeColor + '">' +
      '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
      '</button></div></div>';

    root.innerHTML = html;

    root.getElementById("dbClose").onclick = function(){ open=false; render(); };
    root.getElementById("dbSend").onclick = sendMsg;
    root.getElementById("dbInput").onkeydown = function(e){ if(e.key==="Enter") sendMsg(); };

    var dbMsgs = root.getElementById("dbMsgs");
    if (dbMsgs) dbMsgs.scrollTop = dbMsgs.scrollHeight;
  }

  function sendMsg() {
    var input = root.getElementById("dbInput");
    if (!input || !input.value.trim()) return;
    var text = input.value;
    input.value = "";
    msgs.push({ role:"user", text:text });
    render();
    fetch(config.apiUrl, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ message:text, history:msgs.slice(-10) }) })
      .then(function(r){ return r.json(); })
      .then(function(d){ msgs.push({ role:"bot", text:d.reply||"Thanks!" }); render(); })
      .catch(function(){ msgs.push({ role:"bot", text:"Sorry, something went wrong." }); render(); });
  }

  document.body.appendChild(container);
  render();
})();`

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
