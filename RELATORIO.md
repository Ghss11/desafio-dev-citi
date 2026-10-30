# Relatório: desafio de Dev Folhagem & Cia

## Como rodar

Com o Docker Desktop aberto, na raiz do projeto:

```bash
copy .env.example .env
yarn
docker compose up -d --build
yarn migration              # aplica as migrations de usuários e de plantas
yarn seed                   # cadastra 6 plantas de exemplo
```

A API fica em `http://localhost:3001`. O `yarn seed` só cadastra as plantas se o banco estiver vazio; se já houver plantas, ele avisa e não faz nada, para não duplicar dados.

## 1. O que foi feito

Implementei todas as rotas e regras pedidas, a pergunta extra sobre compras simultâneas e os quatro bônus.

| Método | Rota | O que faz |
|---|---|---|
| POST | `/plantas` | Cadastra uma planta (todos os campos obrigatórios) |
| GET | `/plantas` | Lista as plantas, com filtros opcionais `?luminosidade=` e `?petFriendly=` |
| GET | `/plantas/:id` | Busca uma planta |
| PATCH | `/plantas/:id` | Edita só os campos enviados |
| DELETE | `/plantas/:id` | Remove uma planta |
| POST | `/plantas/:id/venda` | Recebe `{ "quantidade": 2 }` e diminui o estoque |
| GET | `/plantas/estoque/valor-total` | Soma preço × estoque e o total de vasos |

**Regras garantidas:** todos os campos são obrigatórios no cadastro; preço inteiro maior que zero; estoque inteiro maior ou igual a zero; `regaACadaDias` de pelo menos 1; luminosidade só aceita os três valores do enum; dados inválidos (no cadastro, na edição, nos filtros e na venda) respondem 400 com uma mensagem que diz o campo e a regra; id que não existe responde 404; e a venda nunca deixa o estoque negativo.

**Extra:** a venda está protegida contra duas compras simultâneas do último vaso (explico na seção 2).

**Bônus:**

| Bônus | Como usar |
|---|---|
| Busca por nome, sem diferenciar maiúsculas | `GET /plantas?nome=costela` |
| Ordenação | `GET /plantas?ordem=preco` ou `?ordem=nome` (sem o parâmetro, a lista sai pela ordem do id) |
| Plantas esgotadas | `GET /plantas/esgotadas` |
| Seed | `yarn seed` |

Os filtros, a busca e a ordenação podem ser combinados, por exemplo `/plantas?petFriendly=true&ordem=preco`. Não ficou nada de fora.

## 2. Como foi feito

**Ordem de trabalho.** Antes de o repositório sair, preparei o ambiente e fiz alguns exercícios de JavaScript. Depois, estudei o CRUD de usuários, que usei como modelo o tempo todo, e segui os passos do enunciado: model e migration, repository, e então controller e rotas, **uma rota por vez**, testando cada uma no Thunder Client antes de passar para a próxima e fazendo um commit a cada passo. No fim, testei tudo numa cópia baixada do GitHub e fiz os bônus.

**Decisões e por quê:**

- **Uma função de validação para o cadastro e a edição.** A `validarPlanta` recebe um parâmetro `parcial`: no cadastro, todos os campos são obrigatórios; na edição, só os enviados são conferidos, com as mesmas regras. Assim as regras ficam escritas uma vez só.
- **`=== undefined` em vez de `!campo`.** Como `!0` e `!false` são verdadeiros, um `!estoque` recusaria planta com estoque zero e um `!petFriendly` recusaria toda planta que não é pet-friendly.
- **Validar o enum antes de chamar o banco.** Percebi que o CRUD de usuários não confere se a conta é CPF ou CNPJ: um valor inválido só falha no banco e vira um 500. Nas plantas, confiro a luminosidade antes, para responder 400.
- **Buscar a planta antes de editar, remover ou vender.** Sem isso, um id inexistente gera um erro do Prisma, que cai no `catch` e vira 500 em vez de 404.
- **Passar ao banco só os campos da planta**, e não o `req.body` inteiro, para ninguém conseguir mandar um campo a mais, como um `id`.
- **Filtros numa única busca.** O Prisma ignora condições com `undefined`, então uma consulta resolve todas as combinações. O cuidado foi não transformar um `petFriendly` não enviado em `false`, o que esconderia metade das plantas.
- **Ordenação padrão pelo id.** Sem ela, uma planta editada aparecia fora de ordem na listagem.
- **Valor total calculado no código.** O Prisma soma uma coluna, mas não soma preço × estoque. Busco só esses dois campos e faço a conta com um `for`.
- **Venda protegida contra compras simultâneas.** A venda conferia o estoque e depois diminuía, em duas etapas. Se duas pessoas comprassem o último vaso ao mesmo tempo, as duas conferências poderiam passar antes de qualquer diminuição, e o estoque ficaria em -1. Troquei a diminuição por um `updateMany` com a condição `estoque >= quantidade`, para o banco conferir e diminuir numa única operação. Se nenhuma linha for alterada, respondo 400. Mantive a conferência anterior, que dá uma mensagem mais clara no caso comum.
- **Seed em JavaScript, rodando dentro do contêiner do servidor**, onde a API já se conecta ao banco, e só com o banco vazio.
- **Aspas:** usei aspas simples no controller, por costume, sabendo que o projeto usa aspas duplas; no repository, que partiu do modelo do usuário, mantive as duplas.

Não tomei nenhuma decisão diferente do enunciado.

**Testes.** Testei cada rota no Thunder Client, com os casos de sucesso e de erro. No fim, usei um script em Node (fora do projeto) que roda todos os casos da parte 4 e o teste das compras simultâneas. Para garantir que o projeto sobe do zero, clonei o repositório numa pasta nova, subi com os comandos do README e rodei o script: todos os testes passaram, a migration não pediu nada e o `yarn typecheck` não apontou erros. Repeti esse teste depois de fazer o seed.

## 3. Principais dificuldades

- **Ambiente no Windows.** O instalador do Docker dizia que não podia ser executado no meu computador: eu tinha baixado a versão errada. Depois ele pediu um recurso do Windows que exige administrador; resolvi rodando `wsl --install` no PowerShell como administrador.
- **Validações ao contrário.** Na primeira versão, os `if` testavam se o valor estava **certo** e devolviam erro, ou seja, recusavam os dados válidos. Também faltava conferir se o campo tinha sido enviado. Corrigi seguindo o formato `campo !== undefined && !(teste)`.
- **Repositório no GitHub.** Não tinha permissão para enviar ao repositório original. Criei um repositório meu e troquei o destino com `git remote set-url`. Depois, não via minhas mudanças no GitHub porque estava olhando a branch `main`, e não a minha.
- **Erros que não eram do meu código.** Ao abrir `/plantas` no navegador aparecia "Rota não encontrada", porque o navegador só faz GET e naquela hora eu só tinha a rota POST. O Thunder Client mostrava só "ERROR" porque o Docker estava desligado. E o VS Code apontava erros no `tsconfig.json` que vinham da versão do TypeScript embutida no editor, e não da do projeto; resolvi selecionando a versão do workspace, sem mexer na configuração.
- **Compras simultâneas.** Foi a parte que mais me fez pensar: entender por que duas etapas separadas deixam uma brecha, corrigir e provar a correção. Deixei um produto com 1 vaso e disparei duas compras ao mesmo tempo com `Promise.all`: uma respondeu 200, a outra 400, e o estoque ficou em 0.
- **Organização.** Salvei um arquivo de teste dentro de `src/repositories` sem perceber (o Windows escondia a extensão); localizei e movi para fora do projeto antes do commit. Um commit de ajustes saiu incompleto porque eu não tinha salvado os arquivos, e completei no commit seguinte.

## 4. Uso de inteligência artificial

Usei o Claude durante todo o desafio, como um tutor:

- **Para entender:** conceitos que eu não conhecia (CRUD, camadas da API, migration, branch, commit, push, condição de corrida) e os erros que apareciam.
- **Para escrever o código:** a IA me guiou passo a passo. Boa parte do código veio dela como modelo, em trechos pequenos (a estrutura de cada função com `try/catch`, as buscas, os 404 e as respostas, as funções do repository, os filtros, a proteção da venda e o seed), e eu colei e adaptei um trecho por vez, entendendo cada um antes de seguir. As regras de validação de cada campo eu escrevi seguindo o modelo da regra do nome; a primeira versão saiu com a lógica invertida, a IA apontou o erro, e eu corrigi.
- **Para revisar e testar:** ela revisou o meu repositório no GitHub, apontou detalhes de formatação e arquivos que não deviam estar lá, e escreveu o script de testes finais.

**Como conferi:** testei cada rota no Thunder Client, inclusive os casos de erro; comparei sempre com o CRUD de usuários e com o enunciado; rodei o teste do zero numa cópia baixada do GitHub; e rodei o `yarn typecheck`.

**Onde decidi diferente:** a IA sugeriu trocar as aspas simples por duplas, para seguir o padrão do projeto. Mantive as simples no controller, por costume, ciente da diferença.

**O que aprendi:** a base de JavaScript e TypeScript que uma API usa; como um pedido percorre rotas, controller, repository e banco; os métodos HTTP e os códigos de status; a diferença entre saber se um campo foi enviado e se o valor está certo; o básico do Prisma, de migrations e de Git e Docker; e, principalmente, que testar os casos de erro e subir o projeto do zero mostra problemas que o caminho feliz esconde.
