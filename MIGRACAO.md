# 🚚 Guia de Migração Completa: PROFROTA

Este documento guiará você passo a passo para colocar o aplicativo de Controle de Frota no ar em seus novos ambientes:
* **GitHub**: sob o usuário `infrainec-create` no repositório `controle-frota`.
* **Vercel**: sob a sua nova conta Vercel.
* **Google Drive**: banco de dados conectado à conta `infrainec@gmail.com`.

---

## 📂 1. GitHub (infrainec-create)

Já atualizamos a configuração do Git local para apontar para a nova URL:  
`https://github.com/infrainec-create/controle-frota.git`.

### Passo a Passo para Puxar o Código:
1. Acesse o seu [GitHub](https://github.com) com a conta **infrainec-create**.
2. Clique em **New Repository** (Novo Repositório).
3. Preencha os seguintes campos:
   * **Repository name**: `controle-frota`
   * **Public/Private**: Escolha de acordo com sua preferência (Recomendado: *Private* para dados internos).
   * **Não adicione** README, .gitignore ou licença (o repositório deve ser criado vazio).
4. Clique em **Create repository**.
5. No terminal da sua máquina local, na pasta do projeto, execute o comando abaixo para enviar o código:
   ```bash
   git push -u origin main
   ```
   > *Nota: Se for solicitada autenticação, faça login no GitHub pelo navegador ou insira o seu Personal Access Token (PAT).*

---

## ⚡ 2. Implantação na Nova Conta do Vercel

O projeto foi totalmente desvinculado da conta anterior. Agora você pode publicá-lo em sua nova conta do Vercel de forma rápida.

### Passo a Passo para Implantação:
1. No terminal da pasta do projeto, execute o comando de login:
   ```bash
   npx vercel login
   ```
2. Escolha o método de login correspondente à sua nova conta da Vercel (ex: GitHub ou E-mail) e siga as instruções na tela do navegador para autorizar.
3. Após fazer login com sucesso, execute o comando abaixo para iniciar a configuração do novo projeto:
   ```bash
   npx vercel
   ```
4. Responda às perguntas interativas do Vercel CLI:
   * **Set up and deploy?** `yes` (y)
   * **Which scope?** Selecione o escopo da sua nova conta.
   * **Link to existing project?** `no` (n)
   * **What’s your project’s name?** `controle-frota`
   * **In which directory?** `./` (apenas dê Enter)
   * **Want to modify settings?** `no` (n)
5. O Vercel gerará o link da sua aplicação em desenvolvimento.
6. Para colocar a aplicação oficialmente em **Produção** com um link permanente e otimizado, execute:
   ```bash
   npx vercel --prod
   ```

---

## 💾 3. Novo Banco de Dados Google Drive (infrainec@gmail.com)

O PROFROTA armazena todos os seus dados diretamente no seu Google Drive de forma 100% serverless e segura. Para ativar esse recurso na conta `infrainec@gmail.com`, siga estes passos simples:

### A. Criando a Credencial no Google Cloud:
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) com o e-mail **infrainec@gmail.com**.
2. Crie um novo projeto clicando em **Selecionar um projeto** (topo esquerdo) > **Novo Projeto**. Nomeie-o como `ProFrota-DB` e clique em criar.
3. No menu lateral, acesse **APIs e Serviços** > **Biblioteca**.
4. Busque por **Google Drive API** e clique em **Ativar**.
5. Acesse **APIs e Serviços** > **Tela de consentimento OAuth**:
   * Escolha o tipo de usuário **Externo** e clique em **Criar**.
   * Preencha as informações obrigatórias (Nome do App: `ProFrota DB`, seu e-mail de suporte).
   * Na aba **Escopos**, clique em **Adicionar ou remover escopos**, marque o escopo `.../auth/drive.file` e salve.
   * Na aba **Usuários de teste**, adicione o e-mail `infrainec@gmail.com` para permitir que você faça login. Salve tudo.
6. Acesse **APIs e Serviços** > **Credenciais**:
   * Clique em **+ Criar Credenciais** > **ID do cliente OAuth**.
   * Tipo de aplicativo: **Aplicativo da Web**.
   * Nome: `ProFrota Web Client`.
   * Em **Origens JavaScript autorizadas**, clique em **Adicionar URI** e adicione:
     * `http://localhost:3000` (para testes locais)
     * `https://controle-frota.vercel.app` (substitua pelo link gerado no seu deploy da Vercel).
   * Clique em **Criar**.
7. Copie o **Client ID** (ID do Cliente) gerado (ex: `xxxxxxxx.apps.googleusercontent.com`).

### B. Vinculando o Banco de Dados no App:
1. Abra o link do seu app implantado no Vercel.
2. Na barra lateral (ou cabeçalho), localize a seção **Sincronização em Nuvem** (Nuvem).
3. Clique em **Configurações** (ícone de engrenagem) ou no botão de configurar.
4. Cole o **Google Client ID** que você acabou de copiar no campo solicitado e clique em **Salvar**.
5. Agora, clique em **Conectar ao Google Drive** e faça login usando o e-mail **infrainec@gmail.com**.
6. Autorize as permissões necessárias. 
7. **Pronto!** O sistema criará silenciosamente a pasta `ProFrota-DB` e o arquivo `controle_frota_db.json` em seu Google Drive. Todos os seus dados serão salvos ali automaticamente em tempo real!

---

## 🔄 4. Como Migrar seus Dados Existentes (Opcional)

Se você já estava usando o aplicativo em outra conta e deseja passar as informações cadastradas para o novo banco de dados:

1. Acesse o **aplicativo antigo** (onde seus dados atuais estão visíveis).
2. Clique no painel superior ou barra lateral em **Exportar Banco (JSON)**. Um arquivo contendo todos os veículos, condutores e manutenções será baixado em seu computador.
3. Acesse o **novo aplicativo** (já hospedado na sua conta Vercel e conectado ao seu Google Drive `infrainec@gmail.com`).
4. Clique em **Importar Banco** e selecione o arquivo JSON que você acabou de exportar.
5. O sistema carregará todos os seus dados instantaneamente e fará a sincronização imediata com o seu novo Google Drive! 🎉
