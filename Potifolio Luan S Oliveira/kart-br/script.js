// =========================
// BOTÕES DE AGENDAMENTO
// =========================

const btnAgendar = document.getElementById("btnAgendar");
const btnReserva = document.getElementById("btnReserva");
const btnAgendar2 = document.getElementById("btnAgendar2");
const btnFinal = document.getElementById("btnFinal");


// =========================
// ELEMENTOS DO MODAL
// =========================

const modalAgendamento = document.getElementById("modalAgendamento");
const fecharModal = document.getElementById("fecharModal");

const formAgendamento = document.getElementById("formAgendamento");
const bookingSuccess = document.getElementById("bookingSuccess");

const novoAgendamento = document.getElementById("novoAgendamento");


// =========================
// CAMPOS DO FORMULÁRIO
// =========================

const tipoCorrida = document.getElementById("tipoCorrida");
const nomeCliente = document.getElementById("nomeCliente");
const whatsappCliente = document.getElementById("whatsappCliente");
const dataCorrida = document.getElementById("dataCorrida");
const quantidadePilotos = document.getElementById("quantidadePilotos");
const horarioCorrida = document.getElementById("horarioCorrida");
const observacao = document.getElementById("observacao");


// =========================
// CAMPOS DO RESUMO
// =========================

const resumoTipo = document.getElementById("resumoTipo");
const resumoNome = document.getElementById("resumoNome");
const resumoData = document.getElementById("resumoData");
const resumoHorario = document.getElementById("resumoHorario");
const resumoPilotos = document.getElementById("resumoPilotos");

const whatsappAgendamento =
    document.getElementById("whatsappAgendamento");


// =========================
// ABRIR MODAL
// =========================

function abrirAgendamento(tipo = "") {

    modalAgendamento.classList.add("active");

    document.body.style.overflow = "hidden";

    // Se veio de um plano específico
    if (tipo) {
        tipoCorrida.value = tipo;
    }

}


// =========================
// FECHAR MODAL
// =========================

function fecharAgendamento() {

    modalAgendamento.classList.remove("active");

    document.body.style.overflow = "";

}


// =========================
// BOTÕES PRINCIPAIS
// =========================

btnAgendar.addEventListener("click", () => {
    abrirAgendamento();
});

btnReserva.addEventListener("click", () => {
    abrirAgendamento();
});

btnAgendar2.addEventListener("click", () => {
    abrirAgendamento();
});

btnFinal.addEventListener("click", () => {
    abrirAgendamento();
});


// =========================
// BOTÃO X
// =========================

fecharModal.addEventListener("click", () => {
    fecharAgendamento();
});


// =========================
// CLICAR FORA DO MODAL
// =========================

modalAgendamento.addEventListener("click", (event) => {

    if (event.target === modalAgendamento) {
        fecharAgendamento();
    }

});


// =========================
// BOTÕES DOS PLANOS
// =========================

const botoesPrecos =
    document.querySelectorAll(".price-button");

botoesPrecos.forEach((botao) => {

    botao.addEventListener("click", () => {

        const tipo = botao.dataset.tipo;

        abrirAgendamento(tipo);

    });

});


// =========================
// DATA MÍNIMA
// =========================

const hoje = new Date();

const ano = hoje.getFullYear();

const mes = String(hoje.getMonth() + 1).padStart(2, "0");

const dia = String(hoje.getDate()).padStart(2, "0");

dataCorrida.min = `${ano}-${mes}-${dia}`;


// =========================
// MÁSCARA WHATSAPP
// =========================

whatsappCliente.addEventListener("input", () => {

    let valor = whatsappCliente.value.replace(/\D/g, "");

    if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }

    if (valor.length <= 10) {

        valor = valor.replace(
            /^(\d{2})(\d)/,
            "($1) $2"
        );

        valor = valor.replace(
            /(\d{4})(\d)/,
            "$1-$2"
        );

    } else {

        valor = valor.replace(
            /^(\d{2})(\d)/,
            "($1) $2"
        );

        valor = valor.replace(
            /(\d{5})(\d)/,
            "$1-$2"
        );

    }

    whatsappCliente.value = valor;

});


// =========================
// ENVIAR AGENDAMENTO
// =========================

formAgendamento.addEventListener("submit", (event) => {

    event.preventDefault();


    // =========================
    // PEGAR VALORES
    // =========================

    const tipo = tipoCorrida.value;

    const nome = nomeCliente.value.trim();

    const whatsapp = whatsappCliente.value.trim();

    const data = dataCorrida.value;

    const pilotos = quantidadePilotos.value;

    const horario = horarioCorrida.value;

    const obs = observacao.value.trim();


    // =========================
    // VALIDAR WHATSAPP
    // =========================

    const numerosWhatsApp =
        whatsapp.replace(/\D/g, "");

    if (numerosWhatsApp.length < 10) {

        alert("Digite um WhatsApp válido.");

        whatsappCliente.focus();

        return;

    }


    // =========================
    // FORMATAR DATA
    // =========================

    const partesData = data.split("-");

    const dataFormatada =
        `${partesData[2]}/${partesData[1]}/${partesData[0]}`;


    // =========================
    // PREENCHER RESUMO
    // =========================

    resumoTipo.textContent = tipo;

    resumoNome.textContent = nome;

    resumoData.textContent = dataFormatada;

    resumoHorario.textContent = horario;

    resumoPilotos.textContent =
        pilotos + (pilotos === "1"
            ? " piloto"
            : " pilotos");


    // =========================
    // MONTAR MENSAGEM WHATSAPP
    // =========================

    let mensagem =
        `🏁 *NOVO AGENDAMENTO - BR KART TAUBATÉ*%0A%0A` +

        `🏎️ *Experiência:* ${tipo}%0A` +

        `👤 *Nome:* ${nome}%0A` +

        `📅 *Data:* ${dataFormatada}%0A` +

        `⏰ *Horário:* ${horario}%0A` +

        `🏁 *Pilotos:* ${pilotos}%0A` +

        `📱 *WhatsApp:* ${whatsapp}`;


    if (obs) {

        mensagem +=
            `%0A%0A📝 *Observação:* ${obs}`;

    }


    // =========================
    // LINK WHATSAPP
    // =========================

    const numeroBRKart =
        "5512996187159";

    const linkWhatsApp =
        `https://wa.me/${numeroBRKart}?text=${mensagem}`;


    whatsappAgendamento.href =
        linkWhatsApp;


    // =========================
    // MOSTRAR CONFIRMAÇÃO
    // =========================

    formAgendamento.style.display = "none";

    bookingSuccess.classList.add("active");

});


// =========================
// NOVO AGENDAMENTO
// =========================

novoAgendamento.addEventListener("click", () => {

    formAgendamento.reset();

    bookingSuccess.classList.remove("active");

    formAgendamento.style.display = "block";

    // Voltar a limitar a data para hoje
    dataCorrida.min =
        `${ano}-${mes}-${dia}`;

});


// =========================
// MENU MOBILE
// =========================

const menuMobile =
    document.getElementById("menuMobile");

const mobileMenu =
    document.getElementById("mobileMenu");

const fecharMenu =
    document.getElementById("fecharMenu");


menuMobile.addEventListener("click", () => {

    mobileMenu.classList.add("active");

});


fecharMenu.addEventListener("click", () => {

    mobileMenu.classList.remove("active");

});


const linksMenu =
    mobileMenu.querySelectorAll("a");


linksMenu.forEach((link) => {

    link.addEventListener("click", () => {

        mobileMenu.classList.remove("active");

    });

});