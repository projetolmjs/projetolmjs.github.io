// ==============================
// STORAGE + MIGRAÇÃO
// ==============================
let clientes = []; // [{nome, senha}]
let agendamentos = []; // [{usuario, data:'YYYY-MM-DD', hora:'HH:mm'}]
let carrinho = []; // [{nome, preco, qtd}]
let adm = []; // [admin , 123}]

let barbeiros = [
  { nome: "Rafael", usuario: "rafael", senha: "123456" , pix: "@rafael.luiz.silva29"},
  { nome: "Alifer", usuario: "alifer", senha: "123456" },
  { nome: "Jhonata", usuario: "jhonata", senha: "123456" }
];


function lerLS(chave, fallback) {
  try {
    return JSON.parse(localStorage.getItem(chave)) ?? fallback;
  } catch {
    return fallback;
  }
}
// ==============================
// DASHBOARD BARBEIRO
// ==============================
function mostrarDashboardAdm() {
  const c = document.getElementById("conteudo");
  const pedidos = lerLS("pedidos", []);
  const hoje = hojeYYYYMMDD();

  c.innerHTML = `
    <h2>📊 Registros do Dia</h2>

    <div style="margin-bottom:15px;">
      <label>Filtrar por data: 
        <input type="date" id="filtroData" value="${hoje}" max="${hoje}">
      </label>
    </div>

    <div id="resumoDia" style="margin-bottom:15px; font-weight:bold;"></div>

    <h3>💰 Pagamentos Recebidos</h3>
    <ul id="pagamentosHoje"></ul>

    <h3>🛍️ Vendas de Produtos</h3>
    <table class="table" style="width:100%; border-collapse:collapse; margin-top:10px;">
      <thead>
        <tr>
          <th>Pedido</th>
          <th>Cliente</th>
          <th>Itens</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody id="vendasBody"></tbody>
    </table>
  `;

  const filtroInput = document.getElementById("filtroData");
  filtroInput.addEventListener("change", atualizarDashboardAdm);
  atualizarDashboardAdm();

  function atualizarDashboardAdm() {
    const dataSelecionada = filtroInput.value;
    const pedidosFiltrados = pedidos.filter(p => p.quando.slice(0,10) === dataSelecionada);

    // Resumo do dia
    const totalDia = pedidosFiltrados.reduce((sum, p) => sum + p.total, 0);
    const resumoDiv = document.getElementById("resumoDia");
    resumoDiv.textContent = `📅 Total de vendas: ${pedidosFiltrados.length} | 💵 Faturamento: ${brl(totalDia)}`;

    // Lista pagamentos do dia
    const ul = document.getElementById("pagamentosHoje");
    ul.innerHTML = pedidosFiltrados.length === 0
      ? `<li>Nenhum pagamento registrado</li>`
      : pedidosFiltrados.map(p => `<li>${p.nomePagador} - ${brl(p.total)} - ${p.quando.slice(11,16)}</li>`).join('');

    // Tabela de vendas
    const tbody = document.getElementById("vendasBody");
    tbody.innerHTML = pedidosFiltrados.length === 0
      ? `<tr><td colspan="4" style="text-align:center;">Nenhuma venda registrada</td></tr>`
      : pedidosFiltrados.map(p => `
          <tr>
            <td>${p.id}</td>
            <td>${p.nomePagador}</td>
            <td>${p.itens.map(i => `${i.nome} × ${i.qtd}`).join(', ')}</td>
            <td>${brl(p.total)}</td>
          </tr>
        `).join('');
  }
}


function salvarLS() {
  localStorage.setItem("clientes", JSON.stringify(clientes));
  localStorage.setItem("agendamentos", JSON.stringify(agendamentos));
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function migrarFormasAntigas() {
  const rawClientes = lerLS("clientes", []);
  if (Array.isArray(rawClientes)) {
    clientes = rawClientes;
  } else if (rawClientes && typeof rawClientes === "object") {
    clientes = Object.keys(rawClientes).map(nome => ({ nome, senha: rawClientes[nome] }));
    salvarLS();
  } else {
    clientes = [];
  }
  agendamentos = Array.isArray(lerLS("agendamentos", [])) ? lerLS("agendamentos", []) : [];
  carrinho = Array.isArray(lerLS("carrinho", [])) ? lerLS("carrinho", []) : [];
}

// ==============================
// NOTIFICAÇÃO BONITA
// ==============================
function notificar(msg, tipo = "info") {
  const el = document.getElementById("notification");
  if (!el) return alert(msg);
  el.textContent = msg;
  el.className = `notification show ${tipo}`;
  setTimeout(() => {
    el.className = "notification";
  }, 2800);
}

// ==============================
// LOGIN / CADASTRO
// ==============================
let usuarioLogado = null; // string do nome
let tipoLogado = null; // 'cliente' | 'adm'

function mostrarLogin(tipo) {
  document.getElementById("tipoLogin").style.display = "none";
  document.getElementById("loginAdm").style.display = "none";
  document.getElementById("loginCliente").style.display = "none";
  document.getElementById("cadastroCliente").style.display = "none";

  if (tipo === "adm") document.getElementById("loginAdm").style.display = "flex";
  else document.getElementById("loginCliente").style.display = "flex";
}

function voltarTipoLogin() {
  document.getElementById("loginAdm").style.display = "none";
  document.getElementById("loginCliente").style.display = "none";
  document.getElementById("cadastroCliente").style.display = "none";
  document.getElementById("tipoLogin").style.display = "flex";
}

function mostrarCadastroCliente() {
  document.getElementById("loginCliente").style.display = "none";
  document.getElementById("cadastroCliente").style.display = "flex";
}

function voltarLoginCliente() {
  document.getElementById("cadastroCliente").style.display = "none";
  document.getElementById("loginCliente").style.display = "flex";
}

function cadastrarCliente() {
  const nome = document.getElementById("clienteNomeCadastro").value.trim();
  const senha = document.getElementById("clienteSenhaCadastro").value.trim();
  if (nome.length < 3) return notificar("Nome deve ter ao menos 3 caracteres", "erro");
  if (senha.length < 6) return notificar("Senha deve ter ao menos 6 caracteres", "erro");
  if (clientes.find(c => c.nome.toLowerCase() === nome.toLowerCase())) {
    return notificar("Nome já cadastrado", "erro");
  }
  clientes.push({ nome, senha });
  salvarLS();
  notificar("Cadastro realizado! Faça login.", "sucesso");
  voltarLoginCliente();
}

function loginCliente() {
  const nome = document.getElementById("clienteNomeLogin").value.trim();
  const senha = document.getElementById("clienteSenhaLogin").value.trim();
  const c = clientes.find(x => x.nome === nome && x.senha === senha);
  if (!c) return notificar("Nome ou senha inválidos", "erro");
  usuarioLogado = c.nome;
  tipoLogado = "cliente";
  entrarApp();
}


 function loginAdm() {
  const u = document.getElementById("admUsuario").value.trim();
  const s = document.getElementById("admSenha").value.trim();
  const b = barbeiros.find(b => b.usuario === u && b.senha === s);
  if (!b) return notificar("Usuário ou senha inválidos", "erro");

  usuarioLogado = b.nome; // o nome do barbeiro logado
  tipoLogado = "adm";
  entrarApp();
}


// ==============================
// APP / MENU
// ==============================
function entrarApp() {
  document.querySelectorAll(".container").forEach(c => c.style.display = "none");
  document.getElementById("app").style.display = "flex";
  montarMenu();
  if (tipoLogado === "cliente") mostrarInicio();
  else mostrarAgendamentosAdm();
  atualizarCarrinhoUI();
}

function montarMenu() {
  const menu = document.getElementById("menu");
  if (!menu) return;

  if (tipoLogado === "cliente") {
    menu.innerHTML = `
      <button onclick="mostrarInicio()">🏠 Início</button>
      <button onclick="mostrarProdutos()">🛍️ Produtos</button>
      <button onclick="mostrarPlanos()">🧾 Planos</button>
      <button onclick="mostrarValores()">💲 Tabela de Valores</button>
      <button onclick="mostrarAgendamento()">📅 Agendar</button>
      <button onclick="mostrarMeusAgendamentos()">📖 Meus Agendamentos</button>
      <button onclick="toggleCarrinho()">🛒 Ver Carrinho</button>
      <button onclick="sair()">🚪 Sair</button>
    `;
  } else {
    menu.innerHTML = `
      <button onclick="mostrarDashboardAdm()">📊 Dashboard</button>
      <button onclick="mostrarAgendamentosAdm()">📋 Agendamentos</button>
      <button onclick="sair()">🚪 Sair</button>
    `;
  }

  // Adiciona listener de fechamento automaticamente para **todos os botões recém-criados**
  const menuBotoes = menu.querySelectorAll("button");
  menuBotoes.forEach(btn => {
    btn.addEventListener("click", () => {
      menu.classList.remove("show");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("show");
    });
  }

  montarMenu(); // monta menu na inicialização
});



document.addEventListener("DOMContentLoaded", () => {
  migrarFormasAntigas();

  // badge do carrinho
  const badge = document.getElementById("cartBadge");
  if (badge) {
    badge.addEventListener("click", () => {
      const sidebar = document.getElementById("cartSidebar");
      if (sidebar) sidebar.classList.toggle("active");
    });
  }

  // injeta estilo do menu assim que carregar
  injetarEstilosMenu();
});




  // garante o estilo/spacing do menu (sem mexer no seu CSS)
  injetarEstilosMenu();


function injetarEstilosMenu() {
  if (document.getElementById("menu-style-injected")) return;
  const style = document.createElement("style");
  style.id = "menu-style-injected";
  style.textContent = `
    #menu {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    #menu .menu-btn {
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid #333;
      background: #202020;
      color: #fff;
      cursor: pointer;
      letter-spacing: .2px;
    }
    #menu .menu-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
  `;
  document.head.appendChild(style);
}
//
function sair() {
  usuarioLogado = null;
  tipoLogado = null;
  document.getElementById("app").style.display = "none";
  document.getElementById("tipoLogin").style.display = "flex";
}

// ==============================
// INÍCIO
// ==============================
function mostrarInicio(){
  const c=document.getElementById("conteudo");
  c.innerHTML=`
    <div style="
      display:flex; 
      flex-direction:column; 
      align-items:center; 
      justify-content:center; 
      text-align:center; 
      padding:20px; 
      min-height:80vh;">
      <img src="imagens/Logo.jpg.png" alt="Barbearia Brooklyn" style="max-width:250px; margin-bottom:20px;">
      <h2>💈 Bem-vindo!!!</h2>
      <p> <strong>Na Barbearia Brooklyn</strong>  oferecemos mais do que cortes e barbas impecáveis: criamos um espaço para relaxar, conversar e se sentir em casa. Nossa missão é entregar uma experiência única a cada cliente, com técnica, estilo e cuidado excepcionais de profissionais apaixonados pelo que fazem.</p>
    </div>
  `;
}


// ==============================
// PLANOS
// ==============================
function mostrarPlanos() {
  const c = document.getElementById("conteudo");
  c.innerHTML = `
    <h2>🧾 Planos</h2>
    <div class="produtos-grid">
      <div class="produto">
        <h3>Plano Basico</h3>
        <p style="margin:8px 0;">💈 4 Cortes ou 4 Barbas</p>
        <p><strong>R$ 100,00</strong></p>
        <button onclick="adicionarAoCarrinho('Plano Basico ( 4 Cortes ou 4 Barbas)', 100.00)">Assinar</button>
      </div>
      <div class="produto">
        <h3>Plano Premium</h3>
        <p style="margin:8px 0;">💈 4 Cortes + Barba</p>
        <p><strong>R$ 150</strong></p>
        <button onclick="adicionarAoCarrinho('Plano Premium (4 cortes + barba)', 150.00)">Assinar</button>
      </div>
      <div class="produto">
        <h3>Plano Brooklyn</h3>
        <p style="margin:8px 0;">💈 4 Cortes + Barba +
                   4 Aplicação de Mascara +
                   4 Aplicação de Cera Quente</p>
        <p><strong>R$ 250</strong></p>
        <button onclick="adicionarAoCarrinho('Plano VIP', 250.00)">Assinar</button>
      </div>
    </div>
    <small style="color:#777;display:block;margin-top:80px;">* Todos os Planos Acompanham Sombrancelha Inclusos.</small>
  `;
}

// ==============================
// TABELA DE VALORES
// ==============================
function mostrarValores() {
  const c = document.getElementById("conteudo");
  c.innerHTML = `
    <h2>💲 Tabela de Valores</h2>
    <div class="pix-box" style="max-width:720px;">
      <table class="table" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Serviço</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #eee;">Preço</th>
            <th style="padding:8px; border-bottom:1px solid #eee;">Ação</th>
          </tr>
        </thead>
        <tbody id="valoresBody"></tbody>
      </table>
    </div>
  `;
  const servicos = [
    { nome: "Corte Só Na Maquina", preco: 20.00 },
    { nome: "Corte Social", preco: 30.00 },
    { nome: "Degrade Na Zero", preco: 30.00 },
    { nome: "Degrade Navalhado)", preco: 35.00 },
    { nome: "Barba", preco: 30.00 },
    { nome: "Pezinho", preco: 10.00 },
    { nome: "Mascara Negra", preco: 20.00 },
    { nome: "Corte + Alisamento", preco: 50.00 },
    { nome: "Corte + Pigmentação ", preco: 50.00 },
    { nome: "Corte + Barba", preco: 50.00 },
    { nome: "Pigmentado", preco: 70.00 },
    { nome: "Barba Pigmentada", preco: 40.00 },
    { nome: "Corte + Cavanhaque", preco: 40.00 },
    { nome: "Corte + Luzes ", preco: 100.00 },
    { nome: "Nevou + Corte", preco: 150.00 },
  ];
  const tb = document.getElementById("valoresBody");
  servicos.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding:8px;">${s.nome}</td>
      <td style="padding:8px; text-align:right;">${brl(s.preco)}</td>
      <td style="padding:8px; text-align:center;">
        <button onclick="adicionarAoCarrinho('${s.nome}', ${s.preco})">Fazer</button>
      </td>
    `;
    tb.appendChild(tr);
  });
}

// ==============================
// PRODUTOS COM SUBMENU E BOTÃO ATIVO
// ==============================
function mostrarProdutos() {
  const c = document.getElementById("conteudo");
  c.innerHTML = `<h2>🧴 Produtos</h2><div id="submenu"></div><div id="produtos-grid"></div>`;

  const submenu = document.getElementById("submenu");
  const grid = document.getElementById("produtos-grid");

  const secoes = [
    {
      titulo: "💪 Pomadas e Gel",
      produtos: [
        { nome: "FOX FOR MEN  GEL COLA", preco: 25, img: "imagens/foxcola.jfif" },
        { nome: "FOX FOR MEN  GEL BLACK", preco: 25, img: "imagens/foxblack.jfif" },
        { nome: "FOX FOR MEN  GEL UVA", preco: 25, img: "imagens/foxuva.jfif" },
        { nome: "FOX FOR MEN  CERA CARAMELO", preco: 25, img: "imagens/foxcaramelo.jfif" },
        { nome: "FOX FOR MEN  PASTA CAFÉ", preco: 25, img: "imagens/foxcoffee.jfif" },
        { nome: "MONACO FUTURE MEN PASTA MATTE", preco: 30, img: "imagens/monacomatte.jfif" },
        { nome: "MONACO FUTURE MEN PASTA WHITE", preco: 30, img: "imagens/monacowhite.jfif" }
        
      ]
    },
    {
      titulo: "🧔 Cuidados Com a Barba",
      produtos: [
        { nome: "VIKING MOUSSE", preco: 75, img: "imagens/mousseviking.jfif" },
        { nome: "DONVITOR ÓLEO", preco: 30, img: "imagens/donvitor.jfif" }
      ]
    },
    {
      titulo: "🧴 Cremes e Cuidados",
      produtos: [
        { nome: "MENSHAPES PÓ MODELADOR", preco: 35, img: "imagens/pomodelador.jfif" }
       
      ]
    }
  ];

  // Se já houver botões, não recriar
  if (!submenu.dataset.inited) {
    const botoes = [];
    secoes.forEach((secao, i) => {
      const btn = document.createElement("button");
      btn.textContent = secao.titulo;
      btn.className = "submenu-btn";
      btn.addEventListener("click", () => mostrarProdutosSecao(i, botoes));
      submenu.appendChild(btn);
      botoes.push(btn);
    });
    submenu.dataset.inited = true;

    // ativa a primeira seção
    mostrarProdutosSecao(0, botoes);
  }

  function mostrarProdutosSecao(index, botoes) {
    // Remove destaque de todos os botões
    botoes.forEach(b => b.classList.remove("ativo"));
    botoes[index].classList.add("ativo");

    const secao = secoes[index];
    grid.innerHTML = ""; // limpa grid
    secao.produtos.forEach(p => {
      const card = document.createElement("div");
      card.className = "produto";
      card.innerHTML = `
        <img src="${p.img}" alt="${p.nome}" onerror="this.src='imagens/placeholder.jpeg'">
        <h4>${p.nome}</h4>
        <p>${brl(p.preco)}</p>
        <button onclick="adicionarAoCarrinho('${p.nome}', ${p.preco})">Adicionar</button>
      `;
      grid.appendChild(card);
    });

    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(160px, 1fr))";
    grid.style.gap = "14px";
    grid.style.marginTop = "20px";
  }
}



// ==============================
// CARRINHO + PIX
// ==============================

// ---- util: moeda BR
function brl(n) {
  return n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

// ---- util: CRC16 (EMV/PIX)
function crc16_emv(payload) {
  const polynom = 0x1021;
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynom;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  return (crc >>> 0).toString(16).toUpperCase().padStart(4, "0");
}

// ---- util: monta campo EMV (ID + tamanho + valor)
function emv(id, value) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

// ---- gera payload COPIA-E-COLA PIX
function gerarPixCopiaECola({ chave, nome, cidade, valor, txid = "TX" + Date.now().toString().slice(-8), infoAd = "" }) {
  const payloadFormat = emv("00","01");
  const pointOfInitiation = emv("01","12"); // 12 = estático
  const gui = emv("00","BR.GOV.BCB.PIX");
  const chaveId = emv("01", chave);
  const infoAdId = infoAd ? emv("02", infoAd.slice(0,50)) : "";
  const merchantAccountInfo = emv("26", gui + chaveId + infoAdId);
  const merchantCategoryCode = emv("52","0000");
  const transactionCurrency = emv("53","986");
  const transactionAmount = emv("54", (valor.toFixed(2)));
  const countryCode = emv("58","BR");
  const merchantName = emv("59", nome.toUpperCase().slice(0,25));
  const merchantCity = emv("60", (cidade || "SAO PAULO").toUpperCase().slice(0,15));
  const txidField = emv("05", txid.slice(0,25));
  const additionalDataField = emv("62", txidField);

  const semCRC = payloadFormat + pointOfInitiation + merchantAccountInfo + merchantCategoryCode +
                 transactionCurrency + transactionAmount + countryCode + merchantName + merchantCity +
                 additionalDataField + "6304";

  const crc = crc16_emv(semCRC);
  return semCRC + crc;
}

function adicionarAoCarrinho(nome, preco) {
  const item = carrinho.find(i => i.nome === nome);
  if (item) item.qtd++;
  else carrinho.push({ nome, preco, qtd: 1 });
  salvarLS();
  atualizarCarrinhoUI();
  notificar(`${nome} adicionado ao carrinho`, "sucesso");
}

function removerDoCarrinho(nome) {
  const i = carrinho.findIndex(x => x.nome === nome);
  if (i >= 0) carrinho.splice(i, 1);
  salvarLS();
  atualizarCarrinhoUI();
}

function atualizarCarrinhoUI() {
  const badge = document.getElementById("cartBadge");
  const list = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  if (!badge || !list || !totalEl) return;

  const totalQtd = carrinho.reduce((s,i)=>s+i.qtd,0);
  badge.textContent = totalQtd;
  badge.style.display = totalQtd > 0 ? "block" : "none";

  list.innerHTML = "";
  let total = 0;
  carrinho.forEach(i=>{
    total += i.preco * i.qtd;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <span>${i.nome} × ${i.qtd}</span>
      <div>
        <button onclick="alterarQtd('${i.nome}', -1)">−</button>
        <button onclick="alterarQtd('${i.nome}', 1)">+</button>
        <button onclick="removerDoCarrinho('${i.nome}')">❌</button>
      </div>
    `;
    list.appendChild(row);
  });
  totalEl.textContent = `Total: ${brl(total)}`;

  // CTA PIX dentro do carrinho
  let actions = document.getElementById("cartActions");
  if (!actions) {
    actions = document.createElement("div");
    actions.id = "cartActions";
    actions.style.marginTop = "10px";
    totalEl.parentNode.insertBefore(actions, totalEl.nextSibling);
  }
  actions.innerHTML = `
  <button id="btnPixCheckout" ${carrinho.length===0?'disabled':''}
    style="width:100%; padding:10px; border-radius:8px; border:0; background:#2e7d32; color:#fff; cursor:pointer; margin-top:8px;">
    💳 Pagar com PIX
  </button>

  <button id="btnCashCheckout" ${carrinho.length===0?'disabled':''}
    style="width:100%; padding:10px; border-radius:8px; border:0; background:#fbc02d; color:#000; cursor:pointer; margin-top:8px;">
    💰 Pagar em dinheiro ou cartão (no local)
  </button>
`;

// PIX
const btnPix = document.getElementById("btnPixCheckout");
if (btnPix) btnPix.onclick = finalizarCompra;

// Dinheiro/cartão no local
const btnCash = document.getElementById("btnCashCheckout");
if (btnCash) btnCash.onclick = () => {
  const c = document.getElementById("conteudo");
  c.innerHTML = `
    <div class="pagamento-local" style="
      max-width:500px; 
      margin:40px auto; 
      padding:20px; 
      border-radius:12px; 
      background:#fff;
      text-align:center;
      font-family:sans-serif;
    ">
      <h2 style="color:#000;">💰 Pagamento no local</h2>
      <p style="color:#222; margin:12px 0;">
        Só Aceitamos Pagamento Em  <strong>Dinheiro ou Cartão</strong> Em Nosso Estabelecimento!!!.
      </p>
      <button onclick="mostrarInicio()" style="
        padding:10px 16px; 
        border-radius:8px; 
        border:0; 
        background:#fbc02d; 
        color:#000; 
        cursor:pointer;
        font-weight:bold;
      ">
        Voltar ao início
      </button>
    </div>
  `;
};



}

function alterarQtd(nome, delta){
  const item = carrinho.find(i=>i.nome===nome);
  if(!item) return;
  item.qtd += delta;
  if(item.qtd<=0) carrinho = carrinho.filter(i=>i.nome!==nome);
  salvarLS();
  atualizarCarrinhoUI();
}

function toggleCarrinho() {
  document.getElementById("cartSidebar").classList.toggle("active");
}
// alias para compatibilidade com seu HTML (cartBadge usa toggleCart())
function toggleCart(){ toggleCarrinho(); }

// --- TELA PIX + confirmação manual
function finalizarCompra() {
  if (carrinho.length === 0) return notificar("Carrinho vazio", "erro");

  const total = carrinho.reduce((s,i)=>s+i.preco*i.qtd,0);

  // dados fixos do recebedor (edite conforme sua chave real)
  const dadosRecebedor = {
    chave: "@rafael.luiz.silva29",
    nome: "rafael luiz silva",
    infoAd: "Compra produtos"
  };

  const payload = gerarPixCopiaECola({
    chave: dadosRecebedor.chave,
    nome: dadosRecebedor.nome,
    valor: total,
    infoAd: dadosRecebedor.infoAd
  });

  const c = document.getElementById("conteudo");
  c.innerHTML = `
    <div class="pix-box" style="max-width:700px; margin:0 auto;">
      <h2>💳 Pagamento PIX</h2>
      <p>Total a pagar: <strong>${brl(total)}</strong></p>

      <div class="pix-steps" style="display:grid; gap:12px;">
        <label>Nome do pagador* <input id="pixNomePagador" class="input-agendamento" placeholder="Seu nome"></label>
        <label>Celular/WhatsApp* <input id="pixContato" class="input-agendamento" placeholder="(11) 99999-9999"></label>
        <label>Observação (opcional) <input id="pixObs" class="input-agendamento" placeholder="Ex.: Retirar no balcão"></label>
      </div>

      <div style="margin-top:14px;">
        <p>Copie o código abaixo e cole no app do seu banco:</p>
        <textarea id="pixCode" readonly style="width:100%; min-height:130px;">@rafael.luiz.silva29</textarea>


        <div style="display:flex; gap:10px; margin-top:8px;">
          <button id="btnCopyPix" style="padding:10px 12px; border-radius:8px; border:0; background:#1565c0; color:#fff; cursor:pointer;">📋 Copiar Código</button>
          <button id="btnValidarPix" style="padding:10px 12px; border-radius:8px; border:0; background:#2e7d32; color:#fff; cursor:pointer;">✅ Confirmar Pagamento</button>
        </div>
        <label style="display:flex; align-items:center; gap:8px; margin-top:10px; font-size:.95rem;">
          <input type="checkbox" id="pixTermos">
          Declaro que efetuei o pagamento PIX usando o código acima.
        </label>
        <small style="color:#bbb; display:block; margin-top:8px;">* Campos obrigatórios</small>
        <p style="margin-top:10px">Após Confirmar o Pagamento, Envie o Comprovante  Para: 13996286473.</p>
      </div>
    </div>
  `;


  

// Tela PIX
c.innerHTML = `
  <div class="pix-box" style="max-width:700px; margin:0 auto;">
    <h2>💳 Pagamento PIX</h2>
    <p>Total a pagar: <strong>${brl(total)}</strong></p>

    <div class="pix-steps" style="display:grid; gap:12px;">
      <label>Nome do pagador* <input id="pixNomePagador" class="input-agendamento" placeholder="Seu nome"></label>
      <label>Celular/WhatsApp* <input id="pixContato" class="input-agendamento" placeholder="(11) 99999-9999"></label>
      <label>Observação (opcional) <input id="pixObs" class="input-agendamento" placeholder="Ex.: Retirar no balcão"></label>
    </div>

    <div style="margin-top:14px; display:flex; gap:20px; align-items:center;">
      <!-- QR Code fixo do barbeiro -->
      <img src="URL_DO_QR_FIXO_AQUI" alt="QR Code PIX" style="width:150px; height:150px; border-radius:8px; border:1px solid #ccc;">
      
      <!-- Código PIX fixo -->
      <div style="flex:1;">
        <p>Copie o código abaixo ou escaneie o QR:</p>
        <textarea id="pixCode" readonly style="width:100%; min-height:130px;">@rafael.luiz.silva29</textarea>
        <button id="btnCopyPix" style="padding:10px 12px; border-radius:8px; border:0; background:#1565c0; color:#fff; cursor:pointer; margin-top:8px;">📋 Copiar Código</button>
      </div>
    </div>

    <button id="btnValidarPix" style="padding:10px 12px; border-radius:8px; border:0; background:#2e7d32; color:#fff; cursor:pointer; margin-top:12px;">✅ Confirmar Pagamento</button>
    <label style="display:flex; align-items:center; gap:8px; margin-top:10px; font-size:.95rem;">
      <input type="checkbox" id="pixTermos">
      Declaro que efetuei o pagamento PIX usando o código acima.
    </label>
  </div>
`;

// Botão copiar
document.getElementById("btnCopyPix").onclick = async () => {
  const pixCode = document.getElementById("pixCode").value; // pega o texto do textarea
  try {
    await navigator.clipboard.writeText(pixCode);
    notificar("Código PIX copiado!", "sucesso");
  } catch {
    notificar("Não foi possível copiar. Selecione e copie manualmente.", "erro");
  }
};



  document.getElementById("btnValidarPix").onclick = () => {
    const nome = document.getElementById("pixNomePagador").value.trim();
    const tel  = document.getElementById("pixContato").value.trim();
    const termos = document.getElementById("pixTermos").checked;

    if (nome.length < 3) return notificar("Informe seu nome (mín. 3 caracteres).", "erro");
    if (tel.length < 8)  return notificar("Informe um contato válido.", "erro");
    if (!termos)         return notificar("Marque a confirmação de pagamento.", "erro");

    // sucesso local
    const total = carrinho.reduce((s,i)=>s+i.preco*i.qtd,0);
    const recibo = {
      id: "PED" + Date.now(),
      nomePagador: nome,
      contato: tel,
      total: total,
      quando: new Date().toISOString(),
      itens: carrinho.slice()
    };
    const pedidos = lerLS("pedidos", []);
    pedidos.push(recibo);
    localStorage.setItem("pedidos", JSON.stringify(pedidos));

    carrinho = [];
    salvarLS();
    atualizarCarrinhoUI();
    document.getElementById("cartSidebar").classList.remove("active");

    const ctn = document.getElementById("conteudo");
    ctn.innerHTML = `
      <div class="pix-box" style="max-width:700px; margin:0 auto;">
        <h2>✅ Pagamento confirmado</h2>
        <p>Obrigado, <strong>${nome}</strong>! Recebemos sua confirmação.</p>
        <p><strong>Pedido:</strong> ${recibo.id}</p>
        <p><strong>Total:</strong> ${brl(total)}</p>
        <div style="margin-top:12px;">
          <button onclick="mostrarInicio()" style="padding:10px 12px; border-radius:8px; border:0; background:#444; color:#fff; cursor:pointer;">Voltar ao início</button>
        </div>
        <small style="display:block; color:#bbb; margin-top:10px;">
          *Por Favor Envie o Comprovante Para: 13996286473*/PSP.
        </small>
      </div>
    `;
    notificar("Pagamento validado com sucesso!", "sucesso");
  };
}

// ==============================
// AGENDAMENTO
// ==============================
const HORARIOS = (() => {
  const slots = [];
  for (let h = 9; h <= 19; h++)
    for (let m of [0,30]) {
      const hh = String(h).padStart(2,"0");
      const mm = String(m).padStart(2,"0");
      slots.push(`${hh}:${mm}`);
    }
  return slots;
})();

function hojeYYYYMMDD(){
  const d=new Date();
  const yyyy=d.getFullYear();
  const mm=String(d.getMonth()+1).padStart(2,'0');
  const dd=String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}
function mostrarAgendamento() {
  const c = document.getElementById("conteudo");
  c.innerHTML = `
    <h2>📅 Agendar horário</h2>
    <div class="box-agendamento">
      <label>Data</label>
      <input class="input-agendamento" type="date" id="dataAg" min="${hojeYYYYMMDD()}" value="${hojeYYYYMMDD()}"/>
      
      <label>Hora</label>
      <select class="input-agendamento" id="horaAg"></select>

      <label>Barbeiro</label>
      <select class="input-agendamento" id="barbeiroAg">
        ${barbeiros.map(b => `<option value="${b.nome}">${b.nome}</option>`).join('')}
      </select>

      <button onclick="confirmarAgendamento()">Confirmar</button>

      <div>
        <small style="color:#bbb">Horários ocupados nesta data para o barbeiro:</small>
        <div id="ocupados" class="chips"></div>
      </div>
    </div>
  `;
  atualizarHorarios();
  document.getElementById("dataAg").addEventListener("change", atualizarHorarios);
  document.getElementById("barbeiroAg").addEventListener("change", atualizarHorarios);
}


function atualizarHorarios() {
  const data = document.getElementById("dataAg").value;
  const barbeiro = document.getElementById("barbeiroAg").value;
  const select = document.getElementById("horaAg");
  const ocupadosDiv = document.getElementById("ocupados");

  const ocupados = new Set(
    agendamentos
      .filter(a => a.data === data && a.barbeiro === barbeiro)
      .map(a => a.hora)
  );

  select.innerHTML = "";
  HORARIOS.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = ocupados.has(h) ? `${h} (ocupado)` : h;
    if (ocupados.has(h)) opt.disabled = true;
    select.appendChild(opt);
  });

  ocupadosDiv.innerHTML = "";
  if (ocupados.size === 0) {
    ocupadosDiv.innerHTML = `<span class="chip">Nenhum horário ocupado</span>`;
  } else {
    [...ocupados].sort().forEach(h => {
      const s = document.createElement("span");
      s.className = "chip busy";
      s.textContent = h;
      ocupadosDiv.appendChild(s);
    });
  }
}

function confirmarAgendamento() {
  if (!usuarioLogado) return notificar("Faça login para agendar", "erro");

  const data = document.getElementById("dataAg").value;
  const hora = document.getElementById("horaAg").value;
  const barbeiro = document.getElementById("barbeiroAg").value;

  if (!data || !hora || !barbeiro) return notificar("Selecione data, hora e barbeiro", "erro");

  const existe = agendamentos.some(a =>
    a.data === data && a.hora === hora && a.barbeiro === barbeiro
  );
  if (existe) return notificar("Esse horário já está ocupado para o barbeiro escolhido", "erro");

  agendamentos.push({ usuario: usuarioLogado, data, hora, barbeiro });
  salvarLS();
  notificar("Agendamento confirmado!", "sucesso");
  atualizarHorarios();
}


function mostrarMeusAgendamentos(){
  const c = document.getElementById("conteudo");
  c.innerHTML = `<h2>📖 Meus Agendamentos</h2>`;
  const meus = agendamentos.filter(a=>a.usuario===usuarioLogado)
    .sort((a,b)=> (a.data+a.hora).localeCompare(b.data+b.hora) );

  if (meus.length===0){
    c.innerHTML += `<p>Você não possui agendamentos.</p>`;
    return;
  }
  meus.forEach(a=>{
    const el = document.createElement("div");
    el.className="agendamento-item";
    el.innerHTML = `
      <span>${a.data} às ${a.hora}</span>
      <button onclick="cancelarAgendamento('${a.data}','${a.hora}')">Cancelar</button>
    `;
    c.appendChild(el);
  });
}

function cancelarAgendamento(data,hora){
  agendamentos = agendamentos.filter(a=> !(a.usuario===usuarioLogado && a.data===data && a.hora===hora));
  salvarLS();
  notificar("Agendamento cancelado", "sucesso");
  mostrarMeusAgendamentos();
}

function mostrarAgendamentosAdm() {
  const c = document.getElementById("conteudo");
  c.innerHTML = `<h2>📋 Meus Agendamentos</h2>`;

  const meus = agendamentos
    .filter(a => a.barbeiro === usuarioLogado)
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

  if (meus.length === 0) {
    c.innerHTML += `<p>Você não possui agendamentos.</p>`;
    return;
  }

  const tbl = document.createElement("table");
  tbl.className = "table";
  tbl.innerHTML = `
    <thead>
      <tr><th>Cliente</th><th>Data</th><th>Hora</th><th>Ações</th></tr>
    </thead>
    <tbody></tbody>
  `;
  const tb = tbl.querySelector("tbody");
  meus.forEach((a, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.usuario}</td>
      <td>${a.data}</td>
      <td>${a.hora}</td>
      <td><button onclick="excluirAgendamento(${idx})">Excluir</button></td>
    `;
    tb.appendChild(tr);
  });
  c.appendChild(tbl);
}


function excluirAgendamento(index){
  agendamentos.splice(index,1);
  salvarLS();
  notificar("Agendamento excluído", "sucesso");
  mostrarAgendamentosAdm();
}


// ===== Banco de Dados Simples =====
const DB = {
  clientes: lerLS("clientes", []),
  barbeiros: lerLS("barbeiros", [
    { nome: "Rafael", usuario: "rafael", senha: "123456" , pix: "@rafael.luiz.silva29"},
    { nome: "????????", usuario: "????????1", senha: "123456" },
    { nome: "????????2", usuario: "???????2", senha: "123456" }
  ]),
  agendamentos: lerLS("agendamentos", []),
  pedidos: lerLS("pedidos", []),
  carrinho: lerLS("carrinho", []),

  salvar() {
    localStorage.setItem("clientes", JSON.stringify(this.clientes));
    localStorage.setItem("barbeiros", JSON.stringify(this.barbeiros));
    localStorage.setItem("agendamentos", JSON.stringify(this.agendamentos));
    localStorage.setItem("pedidos", JSON.stringify(this.pedidos));
    localStorage.setItem("carrinho", JSON.stringify(this.carrinho));
  }
};

// Exemplo de uso
function adicionarCliente(nome, senha) {
  DB.clientes.push({ nome, senha });
  DB.salvar();
}

function adicionarAgendamento(usuario, barbeiro, data, hora) {
  DB.agendamentos.push({ usuario, barbeiro, data, hora });
  DB.salvar();
}






// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  migrarFormasAntigas();
  const badge = document.getElementById("cartBadge");
  if (badge) badge.addEventListener("click", toggleCarrinho);
  // injeta estilo do menu assim que carregar
 
});








