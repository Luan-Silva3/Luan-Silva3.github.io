/* =========================================
   NEXA — TEMA GLOBAL
========================================= */

(function () {

    const CHAVE_TEMA = "nexa-theme";

    function aplicarTema(tema) {

        const html = document.documentElement;

        if (tema === "light") {
            html.classList.add("light-mode");
        } else {
            html.classList.remove("light-mode");
        }

        atualizarBotoes();
    }

    function atualizarBotoes() {

        const temaAtual =
            document.documentElement.classList.contains("light-mode")
                ? "light"
                : "dark";

        document.querySelectorAll("#btnTema").forEach(function (botao) {

            botao.textContent =
                temaAtual === "light"
                    ? "☀"
                    : "☾";

            botao.title =
                temaAtual === "light"
                    ? "Ativar tema escuro"
                    : "Ativar tema claro";

        });
    }

    function carregarTema() {

        const temaSalvo =
            localStorage.getItem(CHAVE_TEMA);

        if (temaSalvo === "light") {
            aplicarTema("light");
        } else {
            aplicarTema("dark");
        }
    }

    function alternarTema() {

        const temaAtual =
            document.documentElement.classList.contains("light-mode")
                ? "light"
                : "dark";

        const novoTema =
            temaAtual === "light"
                ? "dark"
                : "light";

        localStorage.setItem(
            CHAVE_TEMA,
            novoTema
        );

        aplicarTema(novoTema);
    }

    /* Carrega imediatamente */
    carregarTema();

    /* Configura o botão quando o HTML estiver pronto */
    document.addEventListener("DOMContentLoaded", function () {

        atualizarBotoes();

        document.querySelectorAll("#btnTema").forEach(function (botao) {

            botao.addEventListener("click", alternarTema);

        });

    });

})();