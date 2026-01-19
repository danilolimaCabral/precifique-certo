# 🚂 Guia de Deploy no Railway - GetCerto

## Passo 1: Preparar Banco de Dados

Você precisa de um banco de dados MySQL/TiDB. Opções:

### Opção A: Usar Railway MySQL
1. No Railway, clique em "New" → "Database" → "Add MySQL"
2. Copie a `DATABASE_URL` que será gerada automaticamente

### Opção B: Usar TiDB Cloud (Recomendado - Grátis)
1. Acesse https://tidbcloud.com
2. Crie uma conta gratuita
3. Crie um cluster Serverless (gratuito)
4. Copie a string de conexão MySQL

## Passo 2: Deploy no Railway

1. Acesse https://railway.app/new
2. Clique em "Deploy from GitHub repo"
3. Selecione o repositório: `danilolimaCabral/precifique-certo`
4. O Railway detectará automaticamente o projeto Node.js

## Passo 3: Configurar Variáveis de Ambiente

No painel do Railway, vá em "Variables" e adicione:

```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=cole-uma-string-aleatoria-segura-aqui
NODE_ENV=production
```

### Gerar JWT_SECRET:
Execute no terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Passo 4: Executar Migrações

Após o primeiro deploy, execute no terminal do Railway:
```bash
pnpm db:push
```

Ou adicione isso ao build command no railway.json.

## Passo 5: Acessar o Sistema

1. O Railway gerará uma URL pública automaticamente
2. Acesse a URL gerada
3. Crie sua primeira conta em `/cadastro`

## Custos Estimados

- **Railway**: ~$5-10/mês (após trial de $5)
- **TiDB Cloud**: Gratuito (até 5GB)

## Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no package.json
- Confirme que o Node.js version é compatível (v22)

### Erro de Conexão com Banco
- Verifique se a DATABASE_URL está correta
- Confirme que o banco permite conexões externas
- Para TiDB, certifique-se de usar SSL

### Aplicação não inicia
- Verifique os logs no Railway Dashboard
- Confirme que JWT_SECRET está definido
- Verifique se a porta está configurada corretamente

## Suporte

Para mais ajuda, consulte:
- Documentação Railway: https://docs.railway.app
- Documentação TiDB: https://docs.pingcap.com
