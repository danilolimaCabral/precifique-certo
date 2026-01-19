# GetCerto

Sistema completo de formação de preço e análise de custos para e-commerce.

## Funcionalidades

- Cadastro de Materiais (insumos e embalagens)
- Cadastro de Produtos com BOM (Bill of Materials)
- Dimensões e Logística (cubagem, peso cubado)
- Configuração de Marketplaces (comissões, taxas, frete)
- Cálculo do CTM (Custo Total da Mercadoria)
- Módulo de Precificação com margem de contribuição
- Módulo de Preço Mínimo
- Simulador de Cenários em tempo real
- Dashboard com gráficos analíticos
- Importação em massa via Excel
- Integração com Mercado Livre
- Análise de Venda estilo ML
- Sistema Multi-Tenant com planos de assinatura
- 187 testes unitários

## Tecnologias

- React 19 + TypeScript
- Tailwind CSS 4
- tRPC 11
- Express 4
- Drizzle ORM
- MySQL/TiDB
- Vitest

## Instalação

```bash
pnpm install
pnpm db:push
pnpm dev
```

## Testes

```bash
pnpm test
```

## Licença

MIT
