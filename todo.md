# GetCerto - TODO

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

## Duplicar Marketplaces para Novos Usuários
- [x] Criar procedure adminProcedure para duplicar marketplaces
- [x] Incluir duplicação de faixas de frete junto com marketplaces
- [x] Adicionar botão na página de Administração para duplicar
- [x] Permitir selecionar usuário de origem e destino
- [x] Testes unitários para a funcionalidade (12 testes passando)

## Sistema de Planos de Assinatura
- [x] Criar tabela de planos no banco de dados
- [x] Adicionar campo de plano na tabela de usuários
- [x] Definir limites por plano (materiais, produtos, marketplaces)
- [x] Criar página de planos e preços
- [x] Implementar verificação de limites no backend
- [x] Mostrar plano atual no perfil do usuário
- [x] Bloquear funcionalidades quando limite atingido
- [x] Criar página de upgrade de plano (integrada na página de Planos)

## Período de Teste Gratuito (Trial)
- [x] Adicionar campos trialStartedAt e trialPlanId na tabela users
- [x] Criar lógica para iniciar trial de 7 dias
- [x] Verificar se trial está ativo ou expirado
- [x] Mostrar dias restantes do trial na interface
- [x] Bloquear funcionalidades quando trial expirar
- [x] Botão para iniciar trial na página de planos
- [x] Testes unitários para a funcionalidade de trial (15 testes passando)

## Importação em Massa via Excel
- [x] Analisar estrutura da planilha ICOMMPRECIFIQUE2.xlsx
- [x] Adicionar campos adicionais no schema (dimensões, peso, referência frete) - já existem
- [x] Criar parser de Excel no backend
- [x] Criar página de importação com upload de arquivo
- [x] Validar dados antes de importar
- [x] Importar materiais, produtos e BOM em lote
- [x] Testes unitários para importação (13 testes passando)

## Dashboard com Gráficos
- [x] Criar procedure para obter dados de margem por produto
- [x] Criar procedure para obter dados de margem por marketplace
- [x] Implementar gráfico de barras de margem por produto
- [x] Implementar gráfico de pizza de margem por marketplace
- [x] Adicionar cards de resumo com totais

## Bugs a Corrigir
- [x] Coluna userId não existe na tabela shippingRanges - adicionar coluna

## Gráfico de Lucro por Marketplace
- [x] Adicionar gráfico de barras comparando lucro total por marketplace no Dashboard

## Correção Autenticação Local
- [x] Verificar e corrigir registro de usuário com email/senha - FUNCIONANDO
- [x] Verificar e corrigir login com email/senha - FUNCIONANDO
- [x] Garantir criação correta de sessão após login local - FUNCIONANDO

## Configurações e Autenticação Local
- [x] Configurar alíquota de imposto (Simples Nacional 6%)
- [x] Criar usuário local admin (admin@precifiquecerto.com)
- [x] Remover autenticação OAuth do Manus
- [x] Deixar apenas login com email/senha

## Integração Mercado Livre
- [x] Pesquisar API do Mercado Livre para comissões
- [x] Implementar serviço de integração no backend (mercadolivre.ts)
- [x] Criar tabela mlCredentials no banco de dados
- [x] Criar rotas tRPC (getStatus, saveCredentials, exchangeCode, syncCommissions)
- [x] Criar interface para configurar credenciais ML
- [x] Implementar sincronização automática de comissões
- [x] Criar página de callback OAuth
- [x] Adicionar link no menu lateral
- [x] Testes unitários da integração (14 testes passando)


## Campo de Regime Tributário
- [x] Criar tabela tax_regimes no banco de dados (id, nome, aliquota_padrao, ativo)
- [x] Adicionar campo taxRegimeId na tabela settings
- [x] Criar rotas CRUD para regimes tributários
- [x] Popular regimes padrão (Simples Nacional, Lucro Presumido, Lucro Real, MEI, Isento, Outro)
- [x] Substituir campo texto por select com busca na página Configurações
- [x] Implementar autocomplete com ícone de lupa
- [x] Preencher alíquota automaticamente ao selecionar regime
- [x] Permitir edição manual da alíquota
- [x] Implementar opção "Outro (Personalizado)" com campo adicional
- [x] Validar campo obrigatório antes de salvar
- [x] Integrar regime tributário com cálculos de precificação
- [x] Testes unitários da funcionalidade (25 testes passando)

## Gestão de Regimes Tributários (Admin)
- [x] Adicionar seção de regimes tributários na página de Administração
- [x] Listar todos os regimes (ativos e inativos)
- [x] Formulário para adicionar novo regime
- [x] Formulário para editar regime existente
- [x] Botão para ativar/desativar regime
- [x] Proteção para não excluir regimes do sistema
- [x] Validação de campos obrigatórios
- [x] 165 testes unitários passando


## Módulo de Análise de Venda (Padrão ML)
- [x] Analisar estrutura de valores do Mercado Livre
- [x] Criar página de Análise de Venda com breakdown completo
- [x] Implementar campos: Preço do Produto, Tarifa de Venda Total, Envios, Custo do Produto, Imposto do Produto
- [x] Calcular Margem de Contribuição (valor e %)
- [x] Exibir Total da venda
- [x] Suportar múltiplas unidades vendidas
- [x] Layout similar ao painel do ML (coluna direita com resumo)
- [x] Integrar com produtos e marketplaces cadastrados
- [x] Testes unitários (14 testes passando)
- [x] 179 testes unitários totais passando

## Bug Fix - Erro removeChild
- [x] Investigar erro "NotFoundError: Failed to execute 'removeChild'"
- [x] Identificar componente causador do problema (Select do Radix UI)
- [x] Implementar correção (container prop no SelectContent)
- [x] Testar em produção

## Bug Fix - Erro ao selecionar produto na Precificação
- [x] Investigar erro no Select de produtos
- [x] Corrigir problema de seleção (funcionando no dev)
- [x] Testar funcionalidade
- [x] Corrigir getLoginUrl para usar login local

## Integração Categorias e Comissões ML
- [x] Pesquisar API de categorias do Mercado Livre
- [x] Implementar busca de categorias no backend
- [x] Criar endpoint para listar categorias ML
- [x] Criar página dedicada "Categorias ML" para navegar categorias
- [x] Permitir criar marketplace a partir de categoria selecionada
- [x] Preencher comissão automaticamente (16%) e taxa fixa (R$ 6,00)
- [x] Adicionar link no menu lateral
- [x] 179 testes unitários passando

## Bug Fix - Erro na página de Precificação
- [x] Investigar erro ao selecionar produto/marketplace
- [x] Corrigir problema no componente Select
- [x] Adicionar coluna userId na tabela productMaterials
- [x] Testar funcionalidade - Cálculo funcionando corretamente

## Bug Fix - Erro removeChild ao selecionar produto (CRÍTICO)
- [x] Analisar vídeo do erro
- [x] Identificar que o erro ocorre ao selecionar produto no Select
- [x] Aplicar correção robusta no componente Select (forceMount, modal=false, keys únicas)
- [x] Atualizar página Precificacao.tsx com memoização e loading states
- [x] Testado no ambiente de desenvolvimento - funcionando corretamente
- [x] 179 testes unitários passando


## Correções Relatório Pedro Victor
- [x] Adicionar campo "Custo do Produto" entre Nome e Dimensões no cadastro de produtos
- [x] Corrigir cálculo de cubagem para (C x L x A) / 6000 (resultado em Kg) - já estava correto
- [x] Implementar taxa fixa variável por faixa de preço (Mercado Livre tem taxa fixa apenas para produtos < R$ 79)
- [x] Garantir que Frete seja puxado corretamente na Precificação - já estava funcionando
- [x] Garantir que Custo do Produto seja puxado corretamente na Precificação - agora usa unitCost se disponível
- [x] Implementar tabela de taxa fixa do Mercado Livre (varia conforme preço do produto)
- [x] Melhorar Simulador de Cenários: trocar sliders por inputs manuais para permitir valores precisos (ex: 7,1% de OPEX)
- [x] Adicionar ícones informativos (tooltips) com "i" nas páginas para ajudar usuários com dúvidas


## Renomeação do Projeto para GetCerto
- [ ] Atualizar package.json com novo nome
- [ ] Atualizar README.md
- [ ] Atualizar título no DashboardLayout
- [ ] Atualizar título na página Home
- [ ] Atualizar título na página de Login
- [ ] Atualizar título na página de Cadastro
- [ ] Atualizar variável VITE_APP_TITLE
- [ ] Atualizar todos os textos "PRECIFIQUE CERTO" para "GetCerto"
- [ ] Atualizar meta tags e títulos HTML
- [ ] Testar todas as páginas
- [ ] Salvar checkpoint
- [ ] Push para GitHub


## Novas Funcionalidades - Fase 2
- [ ] Exportação de relatórios em PDF (Precificação e CTM)
- [ ] Página de Histórico de Precificações
- [ ] Sistema de Alertas Automáticos
- [ ] Logo personalizado GetCerto
- [ ] Testar todas as funcionalidades
- [ ] Push para GitHub
