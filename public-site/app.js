/* Public guest interface. No backend is needed to render the initial HTML. */
(() => {
"use strict";
const API = window.__PUBLIC_API_BASE__ || "https://cha-panela-pedro-larissa.onrender.com";
const main = document.getElementById("page-content");
const home = main.innerHTML;
let data = null, loading = null, photoMap = {}, sector = "all", photoList = null, photoFiles = [], currentGift = null, refreshing = false;
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = amount => amount == null || amount === "" ? "" : new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(amount));
const safeHref = input => {
  if (!input) return "";
  try {
    const u = new URL(String(input), location.origin);
    if (u.protocol !== "https:" && !(u.protocol === "http:" && u.origin === location.origin)) return "";
    return esc(u.href);
  } catch { return ""; }
};
const fullApi = path => path.startsWith("https://") ? path : API + path;
function notice(msg, type = "") { return '<div class="notice '+type+'" role="status">'+esc(msg)+'</div>'; }
function h(title, eyebrow, description = "") {
  return '<div class="shell page-header"><span class="eyebrow">'+esc(eyebrow)+'</span><h1>'+esc(title)+'</h1><p>'+esc(description)+'</p></div>';
}
function waitCard(text = "Buscando informações atualizadas…") {
  return '<div class="panel"><p class="loading" role="status">'+esc(text)+'</p><p>A página já está disponível. Se o servidor estiver em repouso, os dados podem levar um pouco mais para aparecer.</p><button class="pill secondary" data-action="retry">Tentar novamente</button></div>';
}
function problemCard() { return '<div class="panel">'+notice("Não foi possível consultar os dados agora. O site continua aberto; tente novamente em instantes.","error")+'<button class="pill secondary" data-action="retry">Tentar novamente</button></div>'; }
function pageShell(title, eyebrow, desc, contents) {
  main.innerHTML = h(title, eyebrow, desc)+'<section class="shell content-section">'+contents+'</section>';
}
function fetchJSON(path, options = {}, onWait, timeout = 65000) {
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), timeout);
  const slow = setTimeout(() => {
    if (onWait) onWait("O servidor de dados pode estar reativando. Aguarde a confirmação antes de tentar novamente.");
  }, 7000);
  return fetch(fullApi(path), { ...options, credentials:"omit", cache:"no-store", signal:controller.signal })
    .then(async response => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const e = new Error(result.error || "Não foi possível concluir. Tente novamente.");
        e.status = response.status; throw e;
      }
      return result;
    })
    .catch(err => { if (err.name === "AbortError") throw new Error("A operação demorou além do esperado. Confira sua conexão e tente novamente."); throw err; })
    .finally(() => { clearTimeout(deadline); clearTimeout(slow); });
}
async function boot(force = false) {
  if (loading && !force) return loading;
  loading = Promise.all([
    fetchJSON("/api/public/bootstrap"),
    fetch("/photo-map.json").then(r => r.ok ? r.json() : {}).catch(() => ({}))
  ]).then(([payload, map]) => {
    data = payload;
    photoMap = map;
    refreshing = false;
    render();
    return data;
  }).catch(() => {
    refreshing = false;
    if (!data) render();
    return null;
  }).finally(() => { loading = null; });
  return loading;
}
function onRetry() {
  refreshing = true;
  render();
  boot(true);
}
function updateHome() {
  if (!data || !data.event) return;
  const event = data.event;
  const time = main.querySelector("#event-time");
  const venue = main.querySelector("#event-venue");
  const address = main.querySelector("#event-address");
  const map = main.querySelector("#event-map");
  if (time && event.showerTime) time.textContent = event.showerTime;
  if (venue && event.venue) venue.textContent = event.venue;
  if (address && event.address) address.textContent = event.address;
  if (map && safeHref(event.mapsUrl)) { map.href = event.mapsUrl; map.hidden = false; }
}
function remaining(g) {
  return g.acceptsInstallments
    ? (g.installments || []).filter(i => i.status === "AVAILABLE").length
    : Math.max(0, Number(g.desiredQuantity || 0) - Number(g.reservedQuantity || 0));
}
function imageFor(g) {
  const original = String(g.imageUrl || "").trim();
  const bundled = photoMap[original];
  if (bundled && bundled.startsWith("/gift-photos/")) return bundled;
  if (original.startsWith("/gift-photos/")) return original;
  return safeHref(original) ? original : "";
}
function giftHTML(g) {
  const rem = remaining(g), img = imageFor(g), cost = money(g.approximateValue);
  const status = rem <= 0 ? "Já escolhido 💛" : g.acceptsInstallments ? rem + " cotas disponíveis" :
    Number(g.desiredQuantity) > 1 ? rem + " unidades disponíveis" : "Disponível";
  return '<article class="gift"><div class="gift-visual">'+
    (img ? '<img src="'+esc(img)+'" loading="lazy" decoding="async" alt="'+esc(g.name)+'">' : '<span class="empty-art">'+esc(g.name)+'</span>') +
    '</div><div class="gift-body"><span class="tag">'+esc(g.category?.name||"Presente")+'</span><h3>'+esc(g.name)+'</h3>'+
    (g.description ? '<p>'+esc(g.description)+'</p>' : "") +
    (cost ? '<strong>'+cost+' <small>aprox.</small></strong>' : "") +
    (g.brand ? '<p>Sugestão: '+esc(g.brand)+(g.model ? " · "+esc(g.model) : "")+'</p>' : "") +
    '<p class="availability '+(rem<=0?"out":"")+'">'+esc(status)+'</p>'+
    '<button class="pill" data-gift="'+esc(g.id)+'" '+(rem <= 0 ? "disabled" : "")+'>'+ (rem <= 0 ? "Indisponível" : "Quero dar este presente") +'</button></div></article>';
}
function gifts() {
  let inner;
  if (!data) inner = refreshing ? waitCard() : problemCard();
  else {
    const filtered = data.gifts.filter(g => sector === "all" || g.category?.slug === sector)
      .sort((a,b) => ["HIGH","NORMAL","OPTIONAL"].indexOf(a.priority)-["HIGH","NORMAL","OPTIONAL"].indexOf(b.priority));
    inner = '<div class="filters"><label for="sector">Filtrar por setor</label><select id="sector" aria-label="Filtrar por setor"><option value="all">Todos os setores</option>'+
      data.categories.map(c => '<option value="'+esc(c.slug)+'" '+(sector===c.slug?"selected":"")+'>'+esc(c.name)+'</option>').join("")+'</select></div>'+
      (filtered.length ? '<div class="grid">'+filtered.map(giftHTML).join("")+'</div>' : notice("Não há presentes neste setor."));
  }
  pageShell("Lista de presentes","Para o nosso lar","Escolha com carinho. Nenhum cadastro é necessário e a disponibilidade é verificada ao reservar.",inner);
  main.querySelector("#sector")?.addEventListener("change",e=>{sector=e.target.value;gifts();});
  main.querySelectorAll("[data-gift]").forEach(b => b.addEventListener("click", () => chooseGift(b.dataset.gift)));
  if (data && new URLSearchParams(location.search).has("reservar") && !currentGift) {
    const id = new URLSearchParams(location.search).get("reservar");
    if (data.gifts.some(g => g.id === id)) chooseGift(id);
  }
}
function chooseGift(id) {
  if (!data) return;
  const g = data.gifts.find(g => g.id === id);
  if (!g || remaining(g)<=0) { alert("Este presente não está mais disponível."); return; }
  currentGift = g;
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.id = "gift-modal";
  overlay.setAttribute("role","presentation");
  overlay.innerHTML = '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="gift-title"><button class="close" aria-label="Fechar" id="close-gift">×</button><span class="eyebrow">Reserva de presente</span><h2 id="gift-title">'+esc(g.name)+'</h2><p>Confirmaremos a disponibilidade diretamente no banco de dados.</p>'+
    '<form class="form" id="gift-form"><div class="field"><label for="guest-name">Seu nome *</label><input required minlength="2" maxlength="120" autocomplete="name" name="name" id="guest-name"></div>'+
    '<div class="field"><label for="guest-phone">WhatsApp ou telefone *</label><input required minlength="8" maxlength="30" inputmode="tel" autocomplete="tel" name="phone" id="guest-phone"></div>'+
    '<div class="field"><label for="guest-message">Mensagem (opcional)</label><textarea maxlength="600" name="message" id="guest-message"></textarea></div>'+
    '<label class="check"><input name="confirm" type="checkbox" required>Confirmo que desejo reservar este presente. Se não puder comprar, cancelarei pelo meu link pessoal.</label>'+
    '<div id="gift-status" aria-live="polite"></div><button class="pill" id="gift-submit">Confirmar reserva 🎁</button></form></div>';
  document.body.append(overlay);
  const close = () => { overlay.remove(); currentGift = null; history.replaceState(null,"","/presentes"); document.body.style.overflow=""; };
  overlay.querySelector("#close-gift").addEventListener("click",close);
  overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
  const onKey=e=>{if(e.key==="Escape"){close();document.removeEventListener("keydown",onKey);}};
  document.addEventListener("keydown",onKey);
  document.body.style.overflow="hidden";
  overlay.querySelector("#guest-name").focus();
  history.replaceState(null,"","/presentes?reservar="+encodeURIComponent(id));
  overlay.querySelector("#gift-form").addEventListener("submit",async e=>{
    e.preventDefault();
    const f=e.currentTarget, submit=overlay.querySelector("#gift-submit"), status=overlay.querySelector("#gift-status");
    const payload={giftId:g.id,name:f.elements.name.value,phone:f.elements.phone.value,message:f.elements.message.value,confirm:f.elements.confirm.checked};
    submit.disabled=true; status.innerHTML=notice("Enviando reserva. Não feche a página até aparecer a confirmação.");
    try {
      const result=await fetchJSON("/api/reservations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}, msg=>{status.innerHTML=notice(msg);});
      const url=location.origin+"/minha-reserva/"+encodeURIComponent(result.token);
      const buy=safeHref(g.purchaseUrl);
      overlay.querySelector(".dialog").innerHTML='<span class="eyebrow">Reserva concluída</span><h2 id="gift-title">Presente reservado! 🎁</h2>'+
        notice("Obrigado pelo carinho! Guarde seu link pessoal para consultar ou cancelar sua reserva.","success")+
        '<p><strong>'+esc(g.name)+'</strong></p><div class="field"><label for="personal-link">Seu link pessoal</label><input id="personal-link" readonly value="'+esc(url)+'"></div>'+
        '<div class="row-actions"><button class="pill" id="copy-link">Copiar link</button><a class="pill outlined" href="'+esc(url)+'">Abrir minha reserva</a></div>'+
        (buy?'<p><a href="'+buy+'" target="_blank" rel="noopener noreferrer" class="quiet-link">Ver sugestão de compra ↗</a></p>':"")+
        '<button class="pill secondary" id="close-success">Voltar à lista</button>';
      overlay.querySelector("#copy-link").addEventListener("click",async()=>{
        const i=overlay.querySelector("#personal-link"); i.select();
        try{await navigator.clipboard.writeText(url); overlay.querySelector("#copy-link").textContent="Link copiado!";}
        catch{overlay.querySelector("#copy-link").textContent="Selecione e copie o link";}
      });
      overlay.querySelector("#close-success").addEventListener("click",()=>{close();boot(true);});
    } catch(err) {
      status.innerHTML=notice(err.message || "Não foi possível reservar. Tente novamente.","error");
      submit.disabled=false;
      if (err.status===409) boot(true);
    }
  });
}
function rsvp() {
  const allow = Boolean(data?.event?.rsvpAllowCompanions);
  pageShell("Confirme sua presença","Chá de Panela · 21.11.2026","Sua resposta ajuda a preparar tudo com carinho.",
    '<div class="panel" style="max-width:680px"><form id="rsvp-form" class="form">'+
    '<div class="field"><label for="rsvp-name">Seu nome *</label><input id="rsvp-name" name="name" required minlength="2" maxlength="120" autocomplete="name"></div>'+
    '<div class="field"><label for="rsvp-phone">WhatsApp / telefone</label><input id="rsvp-phone" name="phone" inputmode="tel" autocomplete="tel" maxlength="30"></div>'+
    '<div class="field"><label for="attending">Você poderá comparecer?</label><select id="attending" name="attending"><option value="yes">Sim, estarei lá 💛</option><option value="no">Infelizmente não poderei</option></select></div>'+
    (allow ? '<div class="field"><label for="companions">Quantidade de acompanhantes</label><input id="companions" type="number" name="companions" min="0" max="10" value="0"></div>'+
    '<div class="field"><label for="companion-names">Nome de cada acompanhante (um por linha)</label><textarea id="companion-names" name="companionNames" maxlength="800"></textarea></div>' : "")+
    '<div class="field"><label for="rsvp-message">Mensagem para nós</label><textarea id="rsvp-message" name="message" maxlength="800"></textarea></div>'+
    '<div id="rsvp-status" aria-live="polite"></div><button class="pill" id="rsvp-submit">Enviar confirmação</button></form></div>');
  const form = main.querySelector("#rsvp-form");
  form.addEventListener("submit",async e=>{
    e.preventDefault(); const f=e.currentTarget, button=f.querySelector("button"), status=f.querySelector("#rsvp-status");
    const attending=f.elements.attending.value==="yes", companions=allow&&attending ? Number(f.elements.companions.value || 0) : 0;
    const names=allow&&attending ? f.elements.companionNames.value.trim() : "";
    if (companions!== (names?names.split(/\r?\n/).filter(Boolean).length:0)) {
      status.innerHTML=notice("Informe um nome por linha para cada acompanhante.","error");return;
    }
    button.disabled=true;status.innerHTML=notice("Enviando sua resposta…");
    try{
      await fetchJSON("/api/rsvp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:f.elements.name.value,phone:f.elements.phone.value,attending,message:f.elements.message.value,companions,companionNames:names})},msg=>{status.innerHTML=notice(msg);});
      status.innerHTML=notice(attending?"Presença confirmada! 🎉":"Obrigado por nos avisar. Sentiremos sua falta 💛","success");f.reset();
    }catch(err){status.innerHTML=notice(err.message,"error");}finally{button.disabled=false;}
  });
}
function recados() {
  const quotes = data ? (data.messages.length ? data.messages.map(m=>
    '<article class="quote"><p>“'+esc(m.message)+'”</p><small>— '+esc(m.name)+'</small></article>').join("") : notice("Ainda não há recados. Seja a primeira pessoa a enviar um carinho.")) : (refreshing?waitCard():problemCard());
  pageShell("Mural de recados","Com carinho","Deixe uma mensagem para Larissa e Pedro.",
    '<div class="twocol" style="align-items:start;grid-template-columns:1fr 1fr"><div class="stack" id="quotes">'+quotes+'</div>'+
    '<div class="panel"><h3>Deixe um recado ♡</h3><form class="form" id="message-form"><div class="field"><label for="message-name">Seu nome</label><input id="message-name" required minlength="2" maxlength="120" name="name"></div><div class="field"><label for="message-text">Mensagem</label><textarea id="message-text" required minlength="3" maxlength="1000" name="message"></textarea></div><div id="message-status" aria-live="polite"></div><button class="pill">Enviar carinho</button></form></div></div>');
  main.querySelector("#message-form").addEventListener("submit",async e=>{
    e.preventDefault();const f=e.currentTarget,button=f.querySelector("button"),status=f.querySelector("#message-status");
    button.disabled=true;status.innerHTML=notice("Publicando…");
    try{await fetchJSON("/api/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:f.elements.name.value,message:f.elements.message.value})},msg=>status.innerHTML=notice(msg));
      status.innerHTML=notice("Seu recado foi publicado! 💛","success");f.reset();boot(true);
    }catch(err){status.innerHTML=notice(err.message,"error");}finally{button.disabled=false;}
  });
}
function photos() {
  pageShell("Fotos do Chá de Panela","Nosso álbum compartilhado","Envie e baixe as fotos deste dia especial.",
    '<div class="panel"><h3>Compartilhe suas fotos</h3><p>Até 10 fotos por envio · 8 MB por foto · JPG, PNG, WEBP ou HEIC.</p>'+
    '<label class="drop">Escolher fotos<input id="photos-files" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple></label>'+
    '<p id="photos-selected" aria-live="polite"></p><div id="photo-status" aria-live="polite"></div><button class="pill" id="photo-send" disabled>Enviar para o álbum</button></div>'+
    '<div class="row-actions"><h2>Galeria</h2><button class="pill outlined" data-action="refresh-photos">Atualizar galeria</button></div><div id="photos-content">'+waitCard("Carregando fotos do álbum…")+'</div>');
  const input=main.querySelector("#photos-files"), button=main.querySelector("#photo-send");
  input.addEventListener("change",()=>{
    photoFiles=Array.from(input.files).slice(0,10);
    main.querySelector("#photos-selected").textContent=photoFiles.length+" foto(s) selecionada(s)";
    button.disabled=!photoFiles.length;
  });
  button.addEventListener("click",async()=>{
    if(!photoFiles.length)return;button.disabled=true;
    const body=new FormData();photoFiles.forEach(f=>body.append("photos",f));
    const status=main.querySelector("#photo-status");status.innerHTML=notice("Enviando fotos. Aguarde a confirmação.");
    try{
      const result=await fetchJSON("/api/photos",{method:"POST",body},msg=>status.innerHTML=notice(msg),100000);
      status.innerHTML=notice(result.count+" foto(s) enviada(s) com sucesso!","success");input.value="";photoFiles=[];main.querySelector("#photos-selected").textContent="";await loadPhotos();
    }catch(err){status.innerHTML=notice(err.message,"error");}finally{button.disabled=!photoFiles.length;}
  });
  loadPhotos();
}
async function loadPhotos() {
  const target=main.querySelector("#photos-content");if(!target)return;
  target.innerHTML=waitCard("Buscando o álbum…");
  try {
    const result=await fetchJSON("/api/photos",{},null,45000);
    photoList=result.photos || [];
    if (!document.contains(target))return;
    target.innerHTML=photoList.length?'<div class="photo-grid">'+photoList.map((p,i)=>{
      const src=safeHref(fullApi(p.url||"/api/photos/"+encodeURIComponent(p.id)));
      const down=safeHref(fullApi(p.downloadUrl||"/api/photos/"+encodeURIComponent(p.id)+"?download=1"));
      return '<article class="photo-card"><a href="'+src+'" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="'+src+'" alt="Foto '+(i+1)+' do Chá"></a>'+
        '<div class="row-actions"><a class="pill secondary" href="'+src+'" target="_blank" rel="noopener noreferrer">Abrir</a><a class="pill" href="'+down+'" target="_blank" rel="noopener noreferrer">Baixar</a></div></article>';
    }).join("")+'</div>':notice("Seja a primeira pessoa a compartilhar uma foto!");
  } catch(err){if(document.contains(target))target.innerHTML=notice(err.message,"error")+'<button class="pill secondary" data-action="refresh-photos">Tentar novamente</button>';}
}
async function myReservation(token) {
  pageShell("Minha reserva","Seu link pessoal","Por este endereço você pode consultar, alterar a mensagem ou cancelar sua escolha.",
    '<div id="reservation-content" class="panel" style="max-width:680px">'+waitCard("Consultando sua reserva…")+'</div>');
  const target=main.querySelector("#reservation-content");
  try{
    const payload=await fetchJSON("/api/reservations/"+encodeURIComponent(token),{},null,45000);
    if (!document.contains(target))return;
    const r=payload.reservation, active=r.status==="RESERVED";
    target.innerHTML='<h2>'+esc(r.gift.name)+'</h2><p>Status: '+esc(r.status==="RESERVED"?"Reservado":r.status==="CANCELLED"?"Cancelado":"Entregue")+'</p>'+
      (active?'<div class="form"><div class="field"><label for="reserve-note">Sua mensagem</label><textarea id="reserve-note" maxlength="600">'+esc(r.message||"")+'</textarea></div>'+
      '<div id="reserve-status" aria-live="polite"></div><button class="pill" id="reserve-save">Salvar mensagem</button>'+
      (safeHref(r.gift.purchaseUrl)?'<a class="pill outlined" target="_blank" rel="noopener noreferrer" href="'+safeHref(r.gift.purchaseUrl)+'">Ver sugestão de compra</a>':"")+
      '<button class="pill secondary" id="reserve-cancel">Cancelar reserva</button></div>':"");
    if(!active)return;
    const status=target.querySelector("#reserve-status");
    target.querySelector("#reserve-save").addEventListener("click",async()=>{
      try{await fetchJSON("/api/reservations/"+encodeURIComponent(token),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:target.querySelector("#reserve-note").value})},msg=>status.innerHTML=notice(msg));
        status.innerHTML=notice("Mensagem atualizada!","success");
      }catch(e){status.innerHTML=notice(e.message,"error");}
    });
    target.querySelector("#reserve-cancel").addEventListener("click",async()=>{
      if(!confirm("Deseja cancelar e liberar este presente?"))return;
      try{await fetchJSON("/api/reservations/"+encodeURIComponent(token),{method:"DELETE"},msg=>status.innerHTML=notice(msg));
        status.innerHTML=notice("Reserva cancelada e presente liberado.","success");await myReservation(token);
      }catch(e){status.innerHTML=notice(e.message,"error");}
    });
  }catch(err){if(document.contains(target))target.innerHTML=notice(err.message,"error")+'<button class="pill secondary" id="reserve-retry">Tentar novamente</button>';
    target.querySelector("#reserve-retry")?.addEventListener("click",()=>myReservation(token));
  }
}
function privacidade() {
  pageShell("Privacidade","Seus dados","Tratamos suas informações apenas para organizar a celebração.",
    '<div class="panel" style="max-width:740px"><p>Nome, contato e confirmação de presença ficam disponíveis apenas para os organizadores. Pessoas que escolhem presentes recebem um link individual para consultar e cancelar suas reservas.</p><p>Outros visitantes veem somente a disponibilidade dos presentes, sem identificar quem reservou. Os recados enviados ao mural e as fotos compartilhadas são públicos para os visitantes.</p><p>Evite publicar informações sensíveis em recados ou fotografias. Para solicitar alterações ou exclusão de dados, entre em contato com os noivos.</p></div>');
}
function render() {
  const path=decodeURI(location.pathname);
  main.className="";
  document.title="Chá de Panela | Larissa e Pedro";
  if (path==="/") {main.innerHTML=home;updateHome();}
  else if(path==="/presentes")gifts();
  else if(path==="/rsvp")rsvp();
  else if(path==="/recados")recados();
  else if(path==="/fotos")photos();
  else if(path==="/privacidade")privacidade();
  else if(path.startsWith("/minha-reserva/"))myReservation(path.slice("/minha-reserva/".length));
  else pageShell("Página não encontrada","Ops!","Este endereço não existe.",'<a class="pill" href="/" data-link>Voltar para o convite</a>');
  window.scrollTo({top:0,behavior:"instant"});
}
document.addEventListener("click",e=>{
  const btn=e.target.closest("[data-action]");
  if (btn) {
    if(btn.dataset.action==="retry")onRetry();
    if(btn.dataset.action==="refresh-photos")loadPhotos();
    return;
  }
  const a=e.target.closest("a[data-link]");if(!a)return;
  const url=new URL(a.href,location.href);if(url.origin!==location.origin)return;
  e.preventDefault();history.pushState(null,"",url.pathname+url.search+url.hash);
  render();if(url.hash)setTimeout(()=>document.querySelector(url.hash)?.scrollIntoView(),0);
});
window.addEventListener("popstate",()=>{main.querySelector("#gift-modal")?.remove();currentGift=null;render();});
render();
loading = boot(); // non-blocking; static invitation was already painted by HTML/CSS
})();
