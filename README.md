# Loja GAIA

Vitrine e painel de gestao com Firebase. O pedido e encaminhado ao WhatsApp;
nao ha pagamento ou reserva transacional de estoque implementados.

O painel agora atende aos campos de admin.html: login/logout, lista, criacao,
edicao, ativacao/desativacao, variantes e upload de imagem. Desativar usa o
campo ativo; nao ha exclusao definitiva pela interface.

Antes do uso real, configurar administradores autorizados e validar regras
Firestore/Storage. Os emails de exemplo sao recusados pela interface e nao
foram substituidos por dados inventados. Regras implantadas: NAO VERIFICADAS.

Testes offline: `node --test tests/*.test.mjs` (Node 22 ou superior).
Abrir a pagina conectada ao Firebase nao e um teste isolado.

[Validacao, limites e proximos passos](docs/engineering-status.md).
