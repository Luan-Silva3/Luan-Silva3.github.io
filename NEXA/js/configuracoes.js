/* =========================================================
   NEXA — CONFIGURAÇÕES
   ========================================================= */


/* =========================================================
   ELEMENTOS
   ========================================================= */

const nomeUsuario = document.getElementById("nomeUsuario");
const avatarUsuario = document.getElementById("avatarUsuario");

const btnLogout = document.getElementById("btnLogout");
const btnSair = document.getElementById("btnSair");
const btnSairFinal = document.getElementById("btnSairFinal");

const btnMenu = document.getElementById("btnMenu");
const sidebar = document.getElementById("sidebar");

const btnTema = document.getElementById("btnTema");

const dataAtual = document.getElementById("dataAtual");

const formPerfil = document.getElementById("formPerfil");

const nomePerfil = document.getElementById("nomePerfil");
const emailPerfil = document.getElementById("emailPerfil");

const btnSalvarPerfil =
    document.getElementById("btnSalvarPerfil");

const mensagemPerfil =
    document.getElementById("mensagemPerfil");

const btnAlterarSenha =
    document.getElementById("btnAlterarSenha");

const idConta =
    document.getElementById("idConta");

const emailConta =
    document.getElementById("emailConta");

const dataCriacao =
    document.getElementById("dataCriacao");


/* =========================================================
   USUÁRIO ATUAL
   ========================================================= */

let usuarioAtual = null;


/* =========================================================
   DATA ATUAL
   ========================================================= */

if (dataAtual) {

    dataAtual.textContent =
        new Date().toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}


/* =========================================================
   MOSTRAR MENSAGEM
   ========================================================= */

function mostrarMensagem(
    mensagem,
    tipo = "success"
) {

    if (!mensagemPerfil) {
        return;
    }

    mensagemPerfil.textContent = mensagem;

    mensagemPerfil.className =
        "form-message " + tipo;

}


/* =========================================================
   LIMPAR MENSAGEM
   ========================================================= */

function limparMensagem() {

    if (!mensagemPerfil) {
        return;
    }

    mensagemPerfil.textContent = "";

    mensagemPerfil.className =
        "form-message";

}


/* =========================================================
   FORMATAR DATA
   ========================================================= */

function formatarData(data) {

    if (!data) {
        return "Não informado";
    }

    const dataFormatada =
        new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
        return "Não informado";
    }

    return dataFormatada.toLocaleDateString(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


/* =========================================================
   CARREGAR USUÁRIO
   ========================================================= */

async function carregarUsuario() {

    try {

        document.body.classList.add("loading");


        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();


        if (error) {
            throw error;
        }


        if (!user) {

            window.location.replace("login.html");

            return;
        }


        usuarioAtual = user;


        /* =========================
           NOME
        ========================== */

        const nome =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            "Usuário";


        if (nomeUsuario) {
            nomeUsuario.textContent = nome;
        }


        if (avatarUsuario) {

            avatarUsuario.textContent =
                nome
                    .charAt(0)
                    .toUpperCase();

        }


        /* =========================
           FORMULÁRIO
        ========================== */

        if (nomePerfil) {
            nomePerfil.value = nome;
        }


        if (emailPerfil) {
            emailPerfil.value =
                user.email || "";
        }


        /* =========================
           INFORMAÇÕES DA CONTA
        ========================== */

        if (idConta) {
            idConta.textContent =
                user.id;
        }


        if (emailConta) {
            emailConta.textContent =
                user.email || "Não informado";
        }


        if (dataCriacao) {
            dataCriacao.textContent =
                formatarData(user.created_at);
        }


        console.log(
            "Usuário carregado:",
            user
        );


    } catch (error) {

        console.error(
            "Erro ao carregar usuário:",
            error
        );

        alert(
            "Não foi possível carregar os dados da conta."
        );

    } finally {

        document.body.classList.remove("loading");

    }

}


/* =========================================================
   ALTERAR NOME
   ========================================================= */

if (formPerfil) {

    formPerfil.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            limparMensagem();


            const nome =
                nomePerfil.value.trim();


            if (!nome) {

                mostrarMensagem(
                    "Digite seu nome.",
                    "error"
                );

                nomePerfil.focus();

                return;
            }


            if (nome.length < 2) {

                mostrarMensagem(
                    "O nome precisa ter pelo menos 2 caracteres.",
                    "error"
                );

                nomePerfil.focus();

                return;
            }


            try {

                btnSalvarPerfil.disabled = true;

                btnSalvarPerfil.textContent =
                    "Salvando...";


                const {
                    data,
                    error
                } = await supabaseClient.auth.updateUser({

                    data: {
                        full_name: nome,
                        name: nome
                    }

                });


                if (error) {
                    throw error;
                }


                usuarioAtual =
                    data.user;


                /* =========================
                   ATUALIZA INTERFACE
                ========================== */

                if (nomeUsuario) {
                    nomeUsuario.textContent =
                        nome;
                }


                if (avatarUsuario) {

                    avatarUsuario.textContent =
                        nome
                            .charAt(0)
                            .toUpperCase();

                }


                mostrarMensagem(
                    "Nome atualizado com sucesso!",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Erro ao atualizar nome:",
                    error
                );


                mostrarMensagem(
                    error.message ||
                    "Não foi possível atualizar o nome.",
                    "error"
                );


            } finally {

                btnSalvarPerfil.disabled = false;

                btnSalvarPerfil.textContent =
                    "Salvar alterações";

            }

        }
    );

}


/* =========================================================
   ALTERAR SENHA
   ========================================================= */

async function alterarSenha() {

    const novaSenha =
        prompt(
            "Digite sua nova senha:"
        );


    if (novaSenha === null) {
        return;
    }


    const senha =
        novaSenha.trim();


    if (!senha) {

        alert(
            "Digite uma senha."
        );

        return;
    }


    if (senha.length < 6) {

        alert(
            "A senha precisa ter pelo menos 6 caracteres."
        );

        return;
    }


    const confirmarSenha =
        prompt(
            "Digite novamente a nova senha:"
        );


    if (confirmarSenha === null) {
        return;
    }


    if (senha !== confirmarSenha.trim()) {

        alert(
            "As senhas não são iguais."
        );

        return;
    }


    try {

        btnAlterarSenha.disabled = true;

        btnAlterarSenha.textContent =
            "Atualizando...";


        const {
            error
        } = await supabaseClient.auth.updateUser({

            password: senha

        });


        if (error) {
            throw error;
        }


        alert(
            "Senha alterada com sucesso!"
        );


    } catch (error) {

        console.error(
            "Erro ao alterar senha:",
            error
        );


        alert(
            error.message ||
            "Não foi possível alterar a senha."
        );


    } finally {

        btnAlterarSenha.disabled = false;

        btnAlterarSenha.textContent =
            "Alterar senha";

    }

}


/* =========================================================
   EVENTO ALTERAR SENHA
   ========================================================= */

if (btnAlterarSenha) {

    btnAlterarSenha.addEventListener(
        "click",
        alterarSenha
    );

}


/* =========================================================
   SAIR DA CONTA
   ========================================================= */

async function sairDaConta() {

    const confirmar =
        confirm(
            "Deseja realmente sair da sua conta?"
        );


    if (!confirmar) {
        return;
    }


    try {

        const botoesLogout = [
            btnLogout,
            btnSair,
            btnSairFinal
        ];


        botoesLogout.forEach(
            function (botao) {

                if (botao) {

                    botao.disabled = true;

                    botao.textContent =
                        "Saindo...";

                }

            }
        );


        const {
            error
        } = await supabaseClient.auth.signOut({
            scope: "local"
        });


        if (error) {
            throw error;
        }


        window.location.replace(
            "login.html"
        );


    } catch (error) {

        console.error(
            "Erro ao sair:",
            error
        );


        alert(
            "Não foi possível sair da conta."
        );


        const botoesLogout = [
            btnLogout,
            btnSair,
            btnSairFinal
        ];


        botoesLogout.forEach(
            function (botao) {

                if (botao) {
                    botao.disabled = false;
                }

            }
        );

    }

}


/* =========================================================
   EVENTOS DE LOGOUT
   ========================================================= */

if (btnLogout) {

    btnLogout.addEventListener(
        "click",
        sairDaConta
    );

}

if (btnSair) {

    btnSair.addEventListener(
        "click",
        sairDaConta
    );

}

if (btnSairFinal) {

    btnSairFinal.addEventListener(
        "click",
        sairDaConta
    );

}


/* =========================================================
   MENU MOBILE
   ========================================================= */

if (btnMenu && sidebar) {

    btnMenu.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}






/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

carregarUsuario();