# Loja GAIA

Site estatico: index.html/js/store.js vitrine; admin.html/js/admin.js gestao;
js/firebase-init.js integra Firebase; product-data.mjs contem validacao pura.
Dados em produtos, com preco em BRL e estoque inteiro por produto/variante.
Nunca usar backend real como fixture nem publicar dados de clientes.
ADMIN_EMAILS controla interface; regras Firestore/Storage precisam impor
autorizacao no servidor. Nao substituir emails de exemplo por identidades
inventadas. Configuracao implantada e regras: NAO VERIFICADAS.
Testar `node --test tests/*.test.mjs`; doubles nao comprovam regras Firebase.
Definition of Done: regressao offline, tratamento de erro, texto externo
escapado, documentacao e limite explicito entre teste e producao.
