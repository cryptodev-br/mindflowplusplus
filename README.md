# MindFlow App

Um aplicativo web de produtividade e motivação pessoal para melhorar sua rotina, organização e inspiração.

## Funcionalidades

- **Autenticação de Usuário**: Login simples para uso pessoal
- **Dashboard de Produtividade**:
  - Lista de tarefas com status: "Planejado", "Em Progresso" e "Concluído"
  - Calendário de atividades
  - Anotações rápidas
- **Inspiração Diária Personalizada**: Frases motivacionais, músicas, vídeos ou imagens de acordo com suas preferências
- **Avatar Personalizado**: Um avatar que evolui conforme você completa tarefas
- **Gráficos e Estatísticas**: Visualização de progresso de tarefas e taxa de conclusão de metas

## Tecnologias Utilizadas

- Next.js
- React
- Firebase (Autenticação e Banco de Dados)
- TailwindCSS
- Chart.js
- React Calendar
- Framer Motion

## Configuração do Projeto

### Pré-requisitos

- Node.js 16.x ou superior
- Conta no Firebase
- Conta na Vercel (para deploy)

### Configuração do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Adicione um aplicativo web ao seu projeto
4. Habilite a autenticação por email/senha
5. Crie uma base de dados Firestore

### Configuração Local

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/mindflow-app.git
cd mindflow-app
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env.local` na raiz do projeto com as credenciais do Firebase:
```
NEXT_PUBLIC_FIREBASE_API_KEY=seu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

5. Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o aplicativo.

## Deploy na Vercel

1. Crie uma conta na [Vercel](https://vercel.com/)
2. Instale a CLI da Vercel:
```bash
npm i -g vercel
```

3. Faça login na sua conta Vercel:
```bash
vercel login
```

4. Deploy do projeto:
```bash
vercel
```

5. Para o ambiente de produção:
```bash
vercel --prod
```

### Configuração de Variáveis de Ambiente na Vercel

1. Acesse o dashboard da Vercel
2. Selecione seu projeto
3. Vá para "Settings" > "Environment Variables"
4. Adicione as mesmas variáveis de ambiente do arquivo `.env.local`

## Estrutura do Projeto

```
mindflow-app/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Dashboard principal
│   │   ├── login/
│   │   │   └── page.tsx       # Página de login
│   │   ├── signup/
│   │   │   └── page.tsx       # Página de cadastro
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Página inicial
│   ├── components/
│   │   ├── Navbar.tsx         # Barra de navegação
│   │   └── TodoList.tsx       # Componente de lista de tarefas
│   ├── contexts/
│   │   └── AuthContext.tsx    # Contexto de autenticação
│   ├── styles/
│   │   └── globals.css        # Estilos globais
│   └── utils/
│       └── firebase.ts        # Configuração do Firebase
├── public/                     # Arquivos estáticos
├── .env.local.example          # Exemplo de variáveis de ambiente
├── next.config.js              # Configuração do Next.js
├── package.json                # Dependências e scripts
├── postcss.config.js           # Configuração do PostCSS
├── tailwind.config.js          # Configuração do Tailwind CSS
└── tsconfig.json               # Configuração do TypeScript
```

## Licença

MIT 