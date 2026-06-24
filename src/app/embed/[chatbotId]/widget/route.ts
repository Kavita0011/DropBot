import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function genScript(config: {
  chatbotId: string; themeColor: string; position: string; name: string; baseUrl: string
}) {
  const { chatbotId, themeColor, position, name } = config
  const defaultPos = position === "bottom-left" ? "left" : "right"
  const defaultColor = themeColor || "#2563eb"

  return `(function(){
var S=document.getElementsByTagName("script"),i,st=null;
for(i=0;i<S.length;i++){if(S[i].src&&S[i].src.indexOf("/embed/")!==-1&&S[i].src.indexOf("/widget")!==-1){st=S[i];break}}
if(!st)return;
var qp={},qs=st.src.split("?")[1]||"";
if(qs){qs.split("&").forEach(function(p){var a=p.split("=");qp[decodeURIComponent(a[0])]=decodeURIComponent(a.slice(1).join("="))||""})}
var ds=st.dataset||{},gc=window.DropBotConfig||{};
function cfg(k,d){return qp[k]!==undefined?qp[k]:gc[k]!==undefined?gc[k]:ds[k]!==undefined?ds[k]:d}
var c={
  chatbotId:cfg("chatbotId","${chatbotId}"),
  mode:cfg("mode","popup"),
  position:cfg("position","${defaultPos}"),
  buttonColor:cfg("buttonColor","${defaultColor}"),
  buttonSize:parseInt(cfg("buttonSize","60")),
  buttonIcon:cfg("buttonIcon","chat"),
  title:cfg("title","${name.replace(/"/g,'\\"')}"),
  welcomeMsg:cfg("welcomeMsg","Hi! How can I help?"),
  width:parseInt(cfg("width","400")),
  height:parseInt(cfg("height","600")),
  autoOpen:cfg("autoOpen","false")==="true",
  autoOpenDelay:parseInt(cfg("autoOpenDelay","3000")),
  apiUrl:cfg("apiUrl","${config.baseUrl}"),
  container:cfg("container",""),
  onOpen:typeof gc.onOpen==="function"?gc.onOpen:null,
  onClose:typeof gc.onClose==="function"?gc.onClose:null,
  onMessage:typeof gc.onMessage==="function"?gc.onMessage:null,
  onReady:typeof gc.onReady==="function"?gc.onReady:null,
  onError:typeof gc.onError==="function"?gc.onError:null
};
var id="db-"+c.chatbotId;
if(document.getElementById(id))return;
var z=99999;

function posCSS(){
  return c.position==="left"?"left:20px":"right:20px";
}

function iconSVG(){
  var t=c.buttonIcon;
  if(t==="message")return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  if(t==="help")return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  if(t.indexOf("<")===0)return t;
  return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
}

var ran=false;
function fire(ev,arg){if(c["on"+ev])try{c["on"+ev](arg)}catch(e){}}

// ---- INLINE MODE ----
if(c.mode==="inline"){
  var cont=c.container?document.querySelector(c.container):st.parentElement;
  if(!cont){fire("Error","Container not found");return}
  cont.id=id;
  var f=document.createElement("iframe");
  f.src=c.apiUrl+"/embed/"+c.chatbotId;
  f.style.cssText="border:none;width:100%;height:"+c.height+"px;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.08)";
  f.allow="clipboard-write";
  cont.appendChild(f);
  window.addEventListener("message",function(e){if(e.data&&e.data.type==="db-message"&&c.onMessage)fire("Message",e.data.payload)});
  fire("Ready");return
}

// ---- SLIDE-IN MODE ----
if(c.mode==="slide-in"){
  var panel=document.createElement("div");
  panel.id=id;
  var side=c.position==="left"?"left":"right";
  panel.innerHTML='<div id="db-panel-'+c.chatbotId+'" style="position:fixed;top:0;'+side+':0;width:'+c.width+'px;height:100%;z-index:'+z+';transform:translateX('+(side==="left"?"-100%":"100%")+');transition:transform 0.3s ease;display:flex;flex-direction:column;background:white;box-shadow:0 0 40px rgba(0,0,0,0.1)">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px;background:'+c.buttonColor+';color:white">'+
      '<span style="font-weight:600;font-size:16px">'+c.title+'</span>'+
      '<button id="db-close-'+c.chatbotId+'" style="background:none;border:none;color:white;cursor:pointer;padding:4px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>'+
    '</div>'+
    '<iframe src="'+c.apiUrl+'/embed/'+c.chatbotId+'" style="flex:1;border:none;width:100%" allow="clipboard-write"></iframe>'+
  '</div>'+
  '<button id="db-tab-'+c.chatbotId+'" style="position:fixed;top:50%;'+side+':0;transform:translateY(-50%);background:'+c.buttonColor+';color:white;border:none;cursor:pointer;padding:12px 8px;border-radius:'+(side==="left"?"0 8px 8px 0":"8px 0 0 8px")+';z-index:'+(z-1)+';writing-mode:vertical-lr;text-orientation:mixed;font-size:14px;font-weight:600;letter-spacing:1px">'+c.title+'</button>';
  document.body.appendChild(panel);
  var pOpen=false;
  document.getElementById("db-tab-"+c.chatbotId).onclick=function(){
    pOpen=!pOpen;
    document.getElementById("db-panel-"+c.chatbotId).style.transform=pOpen?"translateX(0)":(side==="left"?"translateX(-100%)":"translateX(100%)");
    if(pOpen)fire("Open");else fire("Close");
  };
  document.getElementById("db-close-"+c.chatbotId).onclick=function(){document.getElementById("db-tab-"+c.chatbotId).click()};
  window.addEventListener("message",function(e){if(e.data&&e.data.type==="db-message"&&c.onMessage)fire("Message",e.data.payload)});
  if(c.autoOpen)setTimeout(function(){document.getElementById("db-tab-"+c.chatbotId).click()},c.autoOpenDelay);
  fire("Ready");return
}

// ---- POPUP MODE (default) ----
var wrap=document.createElement("div");
wrap.id=id;
wrap.innerHTML='<button id="db-btn-'+c.chatbotId+'" style="position:fixed;'+posCSS()+';bottom:20px;width:'+c.buttonSize+'px;height:'+c.buttonSize+'px;border-radius:50%;background:'+c.buttonColor+';color:#fff;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;z-index:'+z+';transition:transform 0.2s" aria-label="Chat">'+iconSVG()+'</button>'+
  '<div id="db-frame-'+c.chatbotId+'" style="position:fixed;'+posCSS()+';bottom:'+(c.buttonSize+30)+'px;width:'+c.width+'px;height:'+c.height+'px;max-height:calc(100vh - '+(c.buttonSize+50)+'px);z-index:'+(z-1)+';display:none;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);animation:dbFadeIn 0.2s ease-out">'+
    '<iframe src="'+c.apiUrl+'/embed/'+c.chatbotId+'" style="width:100%;height:100%;border:none" allow="clipboard-write"></iframe>'+
  '</div>'+
  '<style>@keyframes dbFadeIn{from{opacity:0;transform:translateY(8px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}</style>';
document.body.appendChild(wrap);
var btn=document.getElementById("db-btn-"+c.chatbotId);
var frame=document.getElementById("db-frame-"+c.chatbotId);
var open=false;
btn.onclick=function(){
  open=!open;
  frame.style.display=open?"block":"none";
  btn.style.display=open?"none":"block";
  if(open)fire("Open");else fire("Close");
};
window.addEventListener("message",function(e){
  if(e.data&&e.data.type==="db-message"&&c.onMessage)fire("Message",e.data.payload)
});
if(c.autoOpen)setTimeout(function(){btn.click()},c.autoOpenDelay);
fire("Ready");
})()`
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ chatbotId: string }> }) {
  const { chatbotId } = await params
  const chatbot = await prisma.chatbot.findFirst({
    where: { id: chatbotId },
    select: { themeColor: true, position: true, name: true },
  })
  if (!chatbot) {
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
    const script = `(function(){
  var S=document.getElementsByTagName("script"),i,st=null;
  for(i=0;i<S.length;i++){if(S[i].src&&S[i].src.indexOf("/embed/")!==-1&&S[i].src.indexOf("/widget")!==-1){st=S[i];break}}
  if(!st)return;
  var qp={},qs=st.src.split("?")[1]||"";
  if(qs){qs.split("&").forEach(function(p){var a=p.split("=");qp[decodeURIComponent(a[0])]=decodeURIComponent(a.slice(1).join("="))||""})}
  var ds=st.dataset||{},gc=window.DropBotConfig||{};
  function cfg(k,d){return qp[k]!==undefined?qp[k]:gc[k]!==undefined?gc[k]:ds[k]!==undefined?ds[k]:d}
  var dashboardUrl=cfg("apiUrl","${dashboardUrl}");
  var btn=document.createElement("div");
  btn.innerHTML='<div style="position:fixed;right:20px;bottom:20px;z-index:99999;font-family:system-ui,sans-serif"><a href="'+dashboardUrl+'/dashboard/chatbots" target="_blank" style="display:flex;align-items:center;gap:8px;background:#2563eb;color:white;padding:12px 20px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;box-shadow:0 4px 16px rgba(37,99,235,0.35)">\\u26A1 Create Your Chatbot</a></div>';
  document.body.appendChild(btn);
})()`
    return new NextResponse(script, {
      headers: { "Content-Type": "application/javascript; charset=utf-8", "Access-Control-Allow-Origin": "*" },
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
  const script = genScript({
    chatbotId,
    themeColor: chatbot.themeColor || "#2563eb",
    position: chatbot.position || "bottom-right",
    name: chatbot.name || "Chat",
    baseUrl,
  })

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
