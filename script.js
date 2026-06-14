/* ============================================================
   SCRIPT.JS — Lógica Principal do Site
   Site institucional SPA para loja de tecnologia de bairro.

   SUMÁRIO:
   1. Sistema de Partículas Interativas (Canvas API)
   2. Menu Hambúrguer (Toggle Mobile)
   3. Navegação Suave (Smooth Scroll)
   4. Animações de Entrada (IntersectionObserver)
   5. Link Ativo na Navegação (Scroll Spy)
   6. Inicialização (DOMContentLoaded)
============================================================ */

"use strict";

/* ============================================================
   1. SISTEMA DE PARTÍCULAS INTERATIVAS (Canvas API)
   
   Classe que gerencia a criação, atualização e renderização
   de partículas efêmeras no <canvas> de fundo.
   
   Comportamento:
   - Quando o mouse se move sobre a página, partículas são
     geradas na posição do cursor, brilhando nas cores azul,
     verde e ciano.
   - As partículas se dispersam radialmente, perdem opacidade
     gradualmente e encolhem até desaparecerem.
   - Quando o mouse para ou sai da tela, nenhuma partícula
     nova é criada e as existentes somem suavemente.
   - Utiliza requestAnimationFrame para performance otimizada.
   - O canvas tem pointer-events: none para não interferir
     na interação com os elementos da página.
============================================================ */
class ParticleSystem {
    /**
     * Construtor — inicializa o sistema de partículas.
     * @param {string} canvasId - ID do elemento <canvas> no HTML.
     */
    constructor(canvasId) {
        /* Referência ao canvas e seu contexto 2D de renderização */
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        /* Posição atual do mouse (atualizada pelo evento mousemove) */
        this.mouseX = 0;
        this.mouseY = 0;

        /* Posição anterior do mouse */
        this.prevMouseX = 0;
        this.prevMouseY = 0;

        /* Flag que indica se o mouse está se movendo. */
        this.isMouseMoving = false;

        /* Timer para detectar quando o mouse para de se mover. */
        this.mouseStopTimer = null;

        /* ---- Configuração dos Prismas (Fundo Geométrico) ---- */
        this.prisms = this.createPrisms(18); /* Aumentado para 18 figuras interagindo com o mouse */

        /* Inicializa o sistema (resize, eventos, loop de animação) */
        this.init();
    }

    /**
     * init() — Configura o canvas, registra os event listeners
     * e inicia o loop de animação (requestAnimationFrame).
     */
    init() {
        /* Ajusta o tamanho do canvas para cobrir toda a viewport */
        this.resize();

        /* Reajusta ao redimensionar a janela */
        window.addEventListener("resize", () => this.resize());

        /* ---- Evento: mousemove ----
           Atualiza posição do mouse e ativa geração de laser.
           Define um timer de 100ms: se o mouse não se mover
           por 100ms, a geração é interrompida. */
        document.addEventListener("mousemove", (e) => {
            this.prevMouseX = this.mouseX;
            this.prevMouseY = this.mouseY;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.isMouseMoving = true;

            /* Cancela timer anterior e cria um novo.
               Se 100ms passarem sem novo mousemove, para de gerar. */
            clearTimeout(this.mouseStopTimer);
            this.mouseStopTimer = setTimeout(() => {
                this.isMouseMoving = false;
            }, 100);
        });

        /* ---- Evento: mouseleave ----
           Quando o mouse sai da janela, para de gerar laser. */
        document.addEventListener("mouseleave", () => {
            this.isMouseMoving = false;
        });

        /* ---- Evento: touchmove (Mobile) ----
           Suporte a dispositivos touch. Usa o primeiro ponto
           de toque como referência de posição. */
        document.addEventListener("touchmove", (e) => {
            const touch = e.touches[0];
            if (touch) {
                this.prevMouseX = this.mouseX;
                this.prevMouseY = this.mouseY;
                this.mouseX = touch.clientX;
                this.mouseY = touch.clientY;
                this.isMouseMoving = true;

                clearTimeout(this.mouseStopTimer);
                this.mouseStopTimer = setTimeout(() => {
                    this.isMouseMoving = false;
                }, 150); /* Tempo ligeiramente maior para touch */
            }
        }, { passive: true }); /* passive: true → melhor performance em mobile */

        /* ---- Evento: touchend ----
           Para de gerar laser ao levantar o dedo. */
        document.addEventListener("touchend", () => {
            this.isMouseMoving = false;
        });

        /* Inicia o loop de animação */
        this.animate();
    }

    /**
     * resize() — Ajusta as dimensões do canvas para
     * corresponder ao tamanho atual da viewport.
     * Utiliza devicePixelRatio para canvases nítidos
     * em telas de alta resolução (retina).
     */
    resize() {
        /* Obtém o ratio de pixels do dispositivo (1 em telas normais, 2 em retina) */
        const dpr = window.devicePixelRatio || 1;

        /* Define tamanho visual via CSS */
        this.canvas.style.width = window.innerWidth + "px";
        this.canvas.style.height = window.innerHeight + "px";

        /* Define tamanho real do canvas (multiplicado pelo DPR para nitidez) */
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;

        /* Escala o contexto para compensar o DPR */
        this.ctx.scale(dpr, dpr);
    }

    /**
     * createPrisms(count) — Gera polígonos geométricos translúcidos
     * para criar um efeito de refração prismática no fundo.
     */
    createPrisms(count) {
        const prisms = [];

        /* ---- Nova Paleta de Cores Únicas ----
           Múltiplas cores para que cada figura tenha a sua. */
        this.prismPalette = [
            { r: 255, g: 0,   b: 60 },   /* Vermelho Carmesim Neon */
            { r: 255, g: 100, b: 0 },    /* Laranja Chama */
            { r: 255, g: 215, b: 0 },    /* Amarelo Ouro */
            { r: 0,   g: 255, b: 100 },  /* Verde Esmeralda Neon */
            { r: 0,   g: 200, b: 255 },  /* Ciano Brilhante */
            { r: 0,   g: 100, b: 255 },  /* Azul Profundo Neon */
            { r: 150, g: 0,   b: 255 },  /* Roxo Místico */
            { r: 255, g: 0,   b: 200 },  /* Rosa Pink */
        ];

        for (let i = 0; i < count; i++) {
            const radius = Math.random() * 150 + 70;
            const shapeType = Math.floor(Math.random() * 3);
            let faces = [];
            const r = radius;

            if (shapeType === 0) {
                /* Diamante / Cristal 3D — faces bem sólidas */
                const top = {x: 0, y: -r};
                const bot = {x: 0, y: r};
                const left = {x: -r*0.6, y: 0};
                const right = {x: r*0.6, y: 0};
                const c = {x: 0, y: r*0.2};
                faces = [
                    { p: [top, left, c], o: 0.55 },
                    { p: [top, c, right], o: 0.70 },
                    { p: [bot, left, c], o: 0.85 },
                    { p: [bot, c, right], o: 0.45 }
                ];
            } else if (shapeType === 1) {
                /* Cubo Isométrico 3D */
                const c = {x: 0, y: 0};
                const p0 = {x: 0, y: -r};
                const p1 = {x: r*0.866, y: -r*0.5};
                const p2 = {x: r*0.866, y: r*0.5};
                const p3 = {x: 0, y: r};
                const p4 = {x: -r*0.866, y: r*0.5};
                const p5 = {x: -r*0.866, y: -r*0.5};
                faces = [
                    { p: [p0, p1, c, p5], o: 0.45 },
                    { p: [p1, p2, p3, c], o: 0.70 },
                    { p: [p5, c, p3, p4], o: 0.90 }
                ];
            } else {
                /* Pirâmide 3D (Tetraedro) */
                const top = {x: 0, y: -r};
                const bl = {x: -r*0.866, y: r*0.5};
                const br = {x: r*0.866, y: r*0.5};
                const c = {x: 0, y: r*0.1};
                faces = [
                    { p: [top, bl, c], o: 0.50 },
                    { p: [top, c, br], o: 0.75 },
                    { p: [bl, br, c], o: 0.90 }
                ];
            }

            /* Cada prisma recebe um índice de cor atual e um progresso
               de interpolação para animar suavemente entre cores. */
            const colorIdx = Math.floor(Math.random() * this.prismPalette.length);
            const nextIdx = (colorIdx + 1) % this.prismPalette.length;
            const fromColor = this.prismPalette[colorIdx];

            prisms.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                angle: Math.random() * Math.PI * 2,
                va: (Math.random() - 0.5) * 0.003,
                radius: radius,
                faces: faces,
                /* Propriedades de animação de cor */
                colorIdx: colorIdx,
                nextColorIdx: nextIdx,
                colorProgress: Math.random(),      /* Começa em ponto aleatório */
                colorSpeed: 0.002 + Math.random() * 0.003, /* Velocidade de transição */
                /* Cor atual calculada (será atualizada no update) */
                currentR: fromColor.r,
                currentG: fromColor.g,
                currentB: fromColor.b,
            });
        }
        return prisms;
    }

    /**
     * update() — Atualiza o estado do rastro laser e dos prismas.
     * - Adiciona novos pontos ao rastro se o mouse estiver se movendo.
     * - Diminui a opacidade dos pontos antigos (fade out).
     * - Remove pontos que ficaram invisíveis.
     * - Atualiza posição e rotação dos prismas.
     */
    update() {
        /* ---- Atualizar Prismas (Posição + Animação de Cor) ---- */
        for (let i = 0; i < this.prisms.length; i++) {
            const prism = this.prisms[i];
            prism.x += prism.vx;
            prism.y += prism.vy;
            prism.angle += prism.va;

            /* Rebater suavemente nas bordas para mantê-los visíveis */
            if (prism.x < -prism.radius || prism.x > window.innerWidth + prism.radius) prism.vx *= -1;
            if (prism.y < -prism.radius || prism.y > window.innerHeight + prism.radius) prism.vy *= -1;

            /* ---- Sistema de Colisão (Evita Sobreposição) ---- */
            for (let j = i + 1; j < this.prisms.length; j++) {
                const other = this.prisms[j];
                const dx = other.x - prism.x;
                const dy = other.y - prism.y;
                const dist = Math.hypot(dx, dy);
                const minDist = prism.radius + other.radius + 40; /* 40px de margem de respiro */

                if (dist < minDist) {
                    /* Se estão colidindo ou muito próximos, empurra-os de volta */
                    const angle = Math.atan2(dy, dx);
                    const overlap = minDist - dist;
                    const pushX = Math.cos(angle) * overlap * 0.5;
                    const pushY = Math.sin(angle) * overlap * 0.5;

                    prism.x -= pushX;
                    prism.y -= pushY;
                    other.x += pushX;
                    other.y += pushY;

                    /* Troca as direções para rebaterem suavemente */
                    const tempVx = prism.vx;
                    const tempVy = prism.vy;
                    prism.vx = other.vx;
                    prism.vy = other.vy;
                    other.vx = tempVx;
                    other.vy = tempVy;
                }
            }

            /* ---- Interpolação suave de cor (lerp entre cores da paleta) ---- */
            prism.colorProgress += prism.colorSpeed;
            if (prism.colorProgress >= 1) {
                /* Avança para o próximo par de cores */
                prism.colorProgress = 0;
                prism.colorIdx = prism.nextColorIdx;
                prism.nextColorIdx = (prism.nextColorIdx + 1) % this.prismPalette.length;
            }
            const from = this.prismPalette[prism.colorIdx];
            const to = this.prismPalette[prism.nextColorIdx];
            const t = prism.colorProgress;
            prism.currentR = Math.round(from.r + (to.r - from.r) * t);
            prism.currentG = Math.round(from.g + (to.g - from.g) * t);
            prism.currentB = Math.round(from.b + (to.b - from.b) * t);
        }

        /* ---- Interação com o Mouse (Repulsão Magnética) ---- */
        if (this.isMouseMoving) {
            const interactionRadius = 250; /* Distância de influência do mouse */
            for (const prism of this.prisms) {
                const dx = prism.x - this.mouseX;
                const dy = prism.y - this.mouseY;
                const dist = Math.hypot(dx, dy);

                if (dist < interactionRadius && dist > 0) {
                    /* Empurra as figuras para longe do cursor */
                    const force = (interactionRadius - dist) / interactionRadius; 
                    const angle = Math.atan2(dy, dx);
                    
                    prism.x += Math.cos(angle) * force * 5;
                    prism.y += Math.sin(angle) * force * 5;
                    
                    /* Acelera a figura ao ser empurrada */
                    prism.vx += Math.cos(angle) * force * 0.2;
                    prism.vy += Math.sin(angle) * force * 0.2;
                }
            }
        }

        /* ---- Controle de Velocidade (Atrito e Impulso Base) ---- */
        const maxSpeed = 1.2;
        const baseSpeed = 0.4;
        for (const prism of this.prisms) {
            const speed = Math.hypot(prism.vx, prism.vy);
            if (speed > maxSpeed) {
                /* Desacelera suavemente se estiver muito rápido */
                prism.vx *= 0.95;
                prism.vy *= 0.95;
            } else if (speed < baseSpeed) {
                /* Acelera suavemente para não parar completamente */
                prism.vx *= 1.02;
                prism.vy *= 1.02;
            }
        }
    }

    /**
     * draw() — Renderiza os prismas 3D e o rastro laser no canvas.
     * O laser é desenhado como segmentos de linha conectados com
     * glow neon intenso via shadowBlur, simulando feixes de luz.
     */
    draw() {
        /* Fundo cinza claro */
        this.ctx.globalCompositeOperation = "source-over";
        this.ctx.fillStyle = "#f0f0f0";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        /* ---- Renderizar Faces Sólidas dos Prismas 3D ---- */
        this.ctx.globalCompositeOperation = "source-over";
        for (const prism of this.prisms) {
            this.ctx.save();
            this.ctx.translate(prism.x, prism.y);
            this.ctx.rotate(prism.angle);

            const cR = prism.currentR;
            const cG = prism.currentG;
            const cB = prism.currentB;

            /* Glow externo radiante atrás de toda a forma (brilho reduzido) */
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = `rgba(${cR}, ${cG}, ${cB}, 0.4)`;

            for (const face of prism.faces) {
                this.ctx.beginPath();
                this.ctx.moveTo(face.p[0].x, face.p[0].y);
                for (let i = 1; i < face.p.length; i++) {
                    this.ctx.lineTo(face.p[i].x, face.p[i].y);
                }
                this.ctx.closePath();
                this.ctx.fillStyle = `rgba(${cR}, ${cG}, ${cB}, ${face.o})`;
                this.ctx.fill();
            }
            this.ctx.restore();
        }

        /* ---- Renderizar Arestas Neon Brilhantes ---- */
        for (const prism of this.prisms) {
            this.ctx.save();
            this.ctx.translate(prism.x, prism.y);
            this.ctx.rotate(prism.angle);

            const cR = prism.currentR;
            const cG = prism.currentG;
            const cB = prism.currentB;

            /* Arestas com glow neon forte da cor atual (brilho reduzido) */
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = `rgba(${cR}, ${cG}, ${cB}, 0.8)`;
            this.ctx.strokeStyle = `rgba(${cR}, ${cG}, ${cB}, 0.7)`;
            this.ctx.lineWidth = 1.2;

            for (const face of prism.faces) {
                this.ctx.beginPath();
                this.ctx.moveTo(face.p[0].x, face.p[0].y);
                for (let i = 1; i < face.p.length; i++) {
                    this.ctx.lineTo(face.p[i].x, face.p[i].y);
                }
                this.ctx.closePath();
                this.ctx.stroke();
            }

            /* Núcleo branco nas arestas (brilho interno do neon) */
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = `rgba(255, 255, 255, 0.25)`;
            this.ctx.lineWidth = 0.5;

            for (const face of prism.faces) {
                this.ctx.beginPath();
                this.ctx.moveTo(face.p[0].x, face.p[0].y);
                for (let i = 1; i < face.p.length; i++) {
                    this.ctx.lineTo(face.p[i].x, face.p[i].y);
                }
                this.ctx.closePath();
                this.ctx.stroke();
            }

            /* Reflexo diagonal (glare de vidro) */
            const grad = this.ctx.createLinearGradient(-prism.radius, -prism.radius, prism.radius, prism.radius);
            grad.addColorStop(0, "rgba(255, 255, 255, 0)");
            grad.addColorStop(0.45, "rgba(255, 255, 255, 0)");
            grad.addColorStop(0.5, "rgba(255, 255, 255, 0.20)");
            grad.addColorStop(0.55, "rgba(255, 255, 255, 0)");
            grad.addColorStop(1, "rgba(255, 255, 255, 0)");

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, prism.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }

        /* O rastro laser foi removido para focar na repulsão interativa das formas */
    }

    /**
     * animate() — Loop principal de animação.
     * Utiliza requestAnimationFrame para sincronizar
     * com a taxa de atualização do monitor (~60fps).
     * Chama update() e draw() a cada frame.
     */
    animate() {
        this.update();
        this.draw();
        /* requestAnimationFrame garante performance otimizada:
           - Pausa quando a aba não está ativa
           - Sincroniza com o refresh rate do monitor */
        requestAnimationFrame(() => this.animate());
    }
}


/* ============================================================
   2. MENU HAMBÚRGUER (Toggle Mobile)
   
   Gerencia a abertura e fechamento do menu mobile.
   - Adiciona/remove a classe 'active' no botão e no menu.
   - Cria um overlay escuro atrás do menu.
   - Atualiza atributos ARIA para acessibilidade.
   - Impede scroll do body quando o menu está aberto.
============================================================ */

/**
 * initHamburgerMenu() — Configura os event listeners
 * do botão hambúrguer e do overlay do menu mobile.
 */
function initHamburgerMenu() {
    const hamburger = document.getElementById("hamburger-btn");
    const navLinks = document.getElementById("nav-links");

    /* Se os elementos não existirem no DOM, interrompe */
    if (!hamburger || !navLinks) return;

    /* ---- Criação do Overlay ----
       Div transparente escura que cobre o conteúdo
       quando o menu mobile está aberto.
       Clicar no overlay fecha o menu. */
    const overlay = document.createElement("div");
    overlay.classList.add("menu-overlay");
    overlay.id = "menu-overlay";
    document.body.appendChild(overlay);

    /**
     * toggleMenu() — Alterna o estado do menu mobile.
     * Chamada ao clicar no botão hambúrguer.
     */
    function toggleMenu() {
        /* Alterna a classe 'active' em todos os elementos relevantes */
        const isActive = hamburger.classList.toggle("active");
        navLinks.classList.toggle("active");
        overlay.classList.toggle("active");

        /* Atualiza o atributo ARIA para leitores de tela */
        hamburger.setAttribute("aria-expanded", isActive.toString());

        /* Bloqueia/desbloqueia o scroll do body */
        document.body.style.overflow = isActive ? "hidden" : "";
    }

    /**
     * closeMenu() — Fecha o menu mobile programaticamente.
     * Usada quando um link é clicado ou o overlay é tocado.
     */
    function closeMenu() {
        hamburger.classList.remove("active");
        navLinks.classList.remove("active");
        overlay.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
    }

    /* ---- Event Listeners ---- */

    /* Clique no botão hambúrguer → abre/fecha o menu */
    hamburger.addEventListener("click", toggleMenu);

    /* Clique no overlay → fecha o menu */
    overlay.addEventListener("click", closeMenu);

    /* Tecla Escape → fecha o menu */
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navLinks.classList.contains("active")) {
            closeMenu();
        }
    });

    /* Retorna a função closeMenu para uso externo (navegação) */
    return closeMenu;
}


/* ============================================================
   3. NAVEGAÇÃO SUAVE (Smooth Scroll)
   
   Intercepta cliques nos links de navegação e executa
   um scroll suave até a seção alvo usando scrollIntoView.
   Também fecha o menu mobile após a navegação.
============================================================ */

/**
 * initSmoothScroll() — Configura navegação suave para
 * todos os links internos (âncoras com href="#...").
 * @param {Function} closeMenuFn - Função para fechar o menu mobile.
 */
function initSmoothScroll(closeMenuFn) {
    /* Seleciona todos os links de navegação */
    const navLinksElements = document.querySelectorAll(".nav-link");

    /* Também seleciona o link do logotipo */
    const logoLink = document.querySelector(".nav-logo a");

    /* Container de scroll (o <main>) */
    const scrollContainer = document.getElementById("main-content");

    /**
     * scrollToSection() — Faz scroll suave até a seção
     * identificada pelo href do link clicado.
     * @param {Event} e - Evento de clique.
     */
    function scrollToSection(e) {
        e.preventDefault();

        /* Obtém o ID da seção alvo (ex: "#contato") */
        const targetId = this.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetSection && scrollContainer) {
            /* scrollIntoView com behavior 'smooth' para transição suave.
               block 'start' alinha o topo da seção ao topo do viewport. */
            targetSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }

        /* Fecha o menu mobile (se estiver aberto) */
        if (closeMenuFn) closeMenuFn();
    }

    /* Registra o listener em cada link de navegação */
    navLinksElements.forEach((link) => {
        link.addEventListener("click", scrollToSection);
    });

    /* Registra também no link do logotipo */
    if (logoLink) {
        logoLink.addEventListener("click", scrollToSection);
    }
}


/* ============================================================
   4. ANIMAÇÕES DE ENTRADA (IntersectionObserver)
   
   Utiliza a API IntersectionObserver para detectar quando
   elementos entram na viewport e dispara animações CSS
   adicionando a classe 'visible'.
   
   Elementos animados:
   - Título da seção de serviços
   - Cards de serviço (com delay escalonado)
   - Título da seção de contato
   - Cards de contato (com delay escalonado)
   - Container do mapa
============================================================ */

/**
 * initScrollAnimations() — Configura o IntersectionObserver
 * para animar elementos da seção de contato ao entrar na viewport.
 */
function initScrollAnimations() {
    /* Verifica se o navegador suporta IntersectionObserver */
    if (!("IntersectionObserver" in window)) {
        /* Fallback: mostra todos os elementos imediatamente */
        document.querySelectorAll(".section-title, .servico-card, .contato-card, .mapa-container")
            .forEach((el) => el.classList.add("visible"));
        return;
    }

    /* ---- Configuração do Observer ---- */
    const observerOptions = {
        /* Observa na viewport inteira */
        root: null,
        /* Margem de ativação: dispara um pouco antes de entrar na viewport */
        rootMargin: "0px 0px -50px 0px",
        /* threshold: 0.1 = 10% do elemento precisa estar visível */
        threshold: 0.1,
    };

    /* ---- Callback do Observer ----
       Executada quando um elemento observado cruza o threshold. */
    const observerCallback = (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                /* Adiciona a classe 'visible' que ativa a transição CSS */
                entry.target.classList.add("visible");
                /* Para de observar após animar (animação acontece uma vez) */
                observer.unobserve(entry.target);
            }
        });
    };

    /* Cria o observer com as opções definidas */
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    /* ---- Observar Título da Seção ---- */
    const sectionTitle = document.getElementById("section-title-contato");
    if (sectionTitle) observer.observe(sectionTitle);

    /* ---- Observar Título da Seção de Serviços ---- */
    const servicosTitle = document.getElementById("section-title-servicos");
    if (servicosTitle) observer.observe(servicosTitle);

    /* ---- Observar Cards de Serviço com Delay Escalonado ---- */
    const servicoCards = document.querySelectorAll(".servico-card");
    servicoCards.forEach((card, index) => {
        /* Delay crescente: 0.1s, 0.2s, 0.3s */
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });

    /* ---- Observar Cards de Contato com Delay Escalonado ----
       Cada card recebe um transition-delay crescente para
       criar um efeito de entrada "em cascata" (stagger). */
    const cards = document.querySelectorAll(".contato-card");
    cards.forEach((card, index) => {
        /* Delay crescente: 0.08s, 0.16s, 0.24s, 0.32s, 0.40s */
        card.style.transitionDelay = `${index * 0.08}s`;
        observer.observe(card);
    });

    /* ---- Observar Container do Mapa ---- */
    const mapaContainer = document.querySelector(".mapa-container");
    if (mapaContainer) {
        /* Delay após os cards terminarem de aparecer */
        mapaContainer.style.transitionDelay = `${cards.length * 0.08 + 0.1}s`;
        observer.observe(mapaContainer);
    }
}


/* ============================================================
   5. LINK ATIVO NA NAVEGAÇÃO (Scroll Spy)
   
   Monitora a posição de scroll dentro do <main> e
   destaca o link de navegação correspondente à seção
   atualmente visível, adicionando a classe 'active'.
============================================================ */

/**
 * initScrollSpy() — Configura o Scroll Spy para atualizar
 * o link ativo na navbar conforme o usuário rola a página.
 */
function initScrollSpy() {
    const sections = document.querySelectorAll(".snap-section");
    const navLinksElements = document.querySelectorAll(".nav-link");

    /* Se não houver seções ou links, interrompe */
    if (sections.length === 0 || navLinksElements.length === 0) return;

    /* Variável de controle para throttling (limita execuções) */
    let ticking = false;

    /**
     * updateActiveLink() — Verifica qual seção está mais
     * visível e destaca o link correspondente.
     */
    function updateActiveLink() {
        /* Posição de scroll atual da janela */
        const scrollPos = window.scrollY || window.pageYOffset;
        /* Metade da altura da viewport (ponto de referência) */
        const halfViewport = window.innerHeight / 2;

        /* Itera pelas seções para encontrar a que está visível */
        sections.forEach((section) => {
            /* Calcula a posição da seção relativa ao container */
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            /* Se a metade superior da viewport está dentro desta seção */
            if (scrollPos >= sectionTop - halfViewport &&
                scrollPos < sectionTop + sectionHeight - halfViewport) {

                /* ID da seção atual (ex: "apresentacao") */
                const currentId = section.getAttribute("id");

                /* Remove 'active' de todos os links */
                navLinksElements.forEach((link) => link.classList.remove("active"));

                /* Adiciona 'active' ao link correspondente */
                const activeLink = document.querySelector(`.nav-link[href="#${currentId}"]`);
                if (activeLink) activeLink.classList.add("active");
            }
        });

        ticking = false;
    }

    /* ---- Evento de Scroll com Throttling ----
       Usa requestAnimationFrame para limitar a frequência
       de execução do updateActiveLink, otimizando performance. */
    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(updateActiveLink);
            ticking = true;
        }
    });

    /* Executa uma vez no carregamento para definir o link inicial */
    updateActiveLink();
}


/* ============================================================
   6. INICIALIZAÇÃO (DOMContentLoaded)
   
   Ponto de entrada do script. Executado quando o DOM
   está completamente carregado e parseado.
   Inicializa todos os módulos do site na ordem correta.
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    /* ---- 1. Sistema de Partículas ----
       Instancia a classe ParticleSystem passando o ID do canvas.
       O sistema começa a funcionar imediatamente
       (resize, listeners, loop de animação). */
    const particleSystem = new ParticleSystem("particles-canvas");

    /* ---- 2. Menu Hambúrguer ----
       Configura o toggle do menu mobile e retorna a função
       closeMenu para uso na navegação. */
    const closeMenu = initHamburgerMenu();

    /* ---- 3. Navegação Suave ----
       Configura scroll suave nos links internos.
       Passa closeMenu para fechar o menu mobile após navegação. */
    initSmoothScroll(closeMenu);

    /* ---- 4. Animações de Scroll ----
       Configura IntersectionObserver para animar elementos
       da seção de contato ao entrarem na viewport. */
    initScrollAnimations();

    /* ---- 5. Scroll Spy ----
       Monitora o scroll e destaca o link de navegação
       correspondente à seção visível. */
    initScrollSpy();

    /* Log informativo no console do desenvolvedor */
    console.log(
        "%c[Nome da Loja] — Site carregado com sucesso! 🚀",
        "color: #00BFA5; font-weight: bold; font-size: 14px;"
    );
});
