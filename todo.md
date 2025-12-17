# PRECIFIQUE CERTO - TODO

## Módulos Principais
- [x] Cadastro de Materiais (SKU, descrição, tipo insumo/embalagem, custo unitário, status)
- [x] Cadastro de Produtos com BOM (Lista de Materiais)
- [x] Dimensões e Logística (altura, largura, comprimento, peso real, cubagem, peso cubado, peso considerado)
- [x] Configuração de Marketplaces (comissão, taxa fixa, tipo logística, faixas de frete)
- [x] Cálculo do CTM (Custo Total da Mercadoria)
- [x] Módulo de Precificação (margem de contribuição em R$ e %)
- [x] Módulo de Preço Mínimo (menor preço para margem não-negativa)
- [x] Simulador de Cenários em tempo real

## Funcionalidades
- [x] Recálculo automático de valores quando variáveis mudam
- [x] Alertas visuais para margem negativa ou abaixo da meta
- [x] Configuração de impostos (alíquota %)
- [x] Configuração de ADS (publicidade %)
- [x] Configuração de OPEX (% ou R$ fixo)
- [x] Encargos personalizados configuráveis
- [x] Atualização automática de produtos quando custo de material mudar
- [x] Sistema operando por SKU
- [x] Transparência total dos valores de custo e margem

## Interface
- [x] Dashboard com visão geral
- [x] Menu lateral com navegação
- [x] Design moderno e elegante
- [x] Valores em Reais (R$)
- [x] Interface responsiva

## Testes
- [x] Testes unitários para cálculo de CTM
- [x] Testes unitários para cálculo de margem
- [x] Testes unitários para preço mínimo
- [x] Testes unitários para peso cubado
- [x] Testes unitários para custo de produto (BOM)
- [x] Testes unitários para faixas de frete
- [x] Testes unitários para alertas de margem


## Bugs
- [x] Tabela settings não existe no banco de dados - executar migração

## Pré-cadastros
- [x] Cadastrar Mercado Livre com comissões reais
- [x] Cadastrar Shopee com comissões reais
- [x] Cadastrar Magalu com comissões reais
- [x] Cadastrar Amazon DBA com comissões reais
- [x] Cadastrar Amazon FBA com comissões reais
- [x] Configurar faixas de frete para cada marketplace
- [x] Ajustar configurações fiscais padrão (Simples Nacional)

## Novas Funcionalidades
- [x] CRUD de faixas de frete no backend
- [x] Interface de edição de faixas na página Marketplaces
- [x] Modal para adicionar/editar faixas de frete
- [x] Botão para excluir faixas de frete

## Sistema de Autenticação com Usuário e Senha
- [x] Atualizar schema do banco para campo de senha (hash)
- [x] Implementar procedure de registro com email/senha
- [x] Implementar procedure de login com email/senha
- [x] Criar página de login com formulário
- [x] Criar página de cadastro/registro
- [x] Integrar com sistema de sessão existente

## Sistema Multi-Tenant com Níveis de Permissão
- [x] Adicionar userId em todas as tabelas de dados (materials, products, settings, etc)
- [x] Atualizar queries para filtrar por userId do usuário logado
- [x] Criar adminProcedure para rotas protegidas de admin
- [x] Criar página de administração de usuários (somente admin)
- [x] Permitir admin ver todos os usuários e seus dados
- [x] Implementar controle de acesso no frontend por role
- [x] Exibir badge de role no perfil do usuário
- [x] Garantir isolamento de dados entre clientes
- [x] Cada novo usuário começa com dados zerados (sem dados de outros tenants)
- [x] 60 testes unitários passando (incluindo 9 testes de multi-tenant)

## Bugs a Corrigir
- [x] Coluna userId não existe na tabela settings - adicionar coluna

## Melhorias Multi-Cliente
- [x] Botão de cadastro sempre visível na página de login
- [x] Link para cadastro no DashboardLayout quando não logado
- [x] Página de boas-vindas para novos usuários
- [x] Garantir que novos usuários comecem com dados zerados
