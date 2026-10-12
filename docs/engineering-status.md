# Correcao da administracao e validacao

O antigo js/admin.js repetia a vitrine e procurava elementos inexistentes em
admin.html. Foi substituido por handlers do formulario real: autenticacao,
listagem, criacao/edicao, variantes, estoque, ativo e upload. Campos de texto
da lista usam textContent. A vitrine escapa valores externos, usa evento por
data-product-id e tolera JSON corrompido no carrinho.

TESTADO AUTOMATICAMENTE com doubles: validacao de preco/estoque/variantes,
URLs, escape, carrinho; acesso sem login, criacao, edicao, falha de upload e
falha de leitura depois de gravacao. Nenhuma chamada de teste vai ao Firebase.
NAO TESTADO: regras implantadas, contas reais, upload real, estoque concorrente
e revisao visual completa em dispositivos. A interface nao substitui regras.

CRITICO: definir administradores reais e exportar/revisar regras do projeto.
Antes de habilitar, testar no Emulator: anonimo nao escreve; membro comum nao
escreve; administrador pode criar/editar; upload restringe tipo/tamanho;
validacao server-side recusa preco/estoque invalido. Regras atuais: UNKNOWN.
Nao foi feito deploy de regras nem modificacao de catalogo real nesta revisao.

ALTO: checkout e apenas intencao via WhatsApp, nao reserva estoque. Confirmar
preco/disponibilidade no atendimento. MEDIO: upload e Firestore nao sao uma
transacao: arquivo pode sobrar se a escrita falhar. A mensagem identifica o
caminho para revisao; nao remove automaticamente arquivos remotos.
Politica atual da interface: JPEG/PNG/WebP ate 5 MB; validar tambem nas regras.

Para entender esta implementacao: siga formulario → productData → upload →
addDoc/updateDoc → nova leitura. Estude autenticacao versus autorizacao,
validacao cliente/servidor e consistencia entre servicos. Desafio: injete
falha na leitura apos gravar e confirme que nao ocorre segunda criacao.

Referencias consultadas: [Firestore add/update](https://firebase.google.com/docs/firestore/manage-data/add-data)
e [Storage upload](https://firebase.google.com/docs/storage/web/upload-files).
Aplicacao: APIs modulares ja usadas no projeto. Limite: a documentacao nao
confirma permissoes ou dados desta instancia.
