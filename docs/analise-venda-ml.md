# Análise de Venda - Estrutura Mercado Livre

## Estrutura de Valores (baseado na imagem)

### Resumo do Pagamento (coluna direita)
| Campo | Valor Exemplo | Descrição |
|-------|---------------|-----------|
| Preço do produto | R$ 585,90 | Preço de venda unitário × quantidade |
| Tarifa de venda total | -R$ 99,60 | Comissão do marketplace (17% no exemplo) |
| Envios | -R$ 39,90 | Tarifa de frete (Mercado Envios) |
| Custo do Produto | -R$ 112,00 | Custo unitário × quantidade |
| Imposto do Produto | -R$ 194,52 | Imposto sobre a venda |
| **Margem de Contribuição** | **R$ 139,88 (23.87%)** | Lucro líquido da operação |
| **Total** | **R$ 446,40** | Valor total recebido |

### Detalhes da Venda (coluna esquerda)
- Produto: Nome, SKU, imagem
- Quantidade: 2 unidades
- Tarifas de Venda: R$ 49,80 (por unidade)
- Envios (Frete): R$ 19,95
- Custo do Produto: R$ 56,00 (por unidade)
- Imposto do Produto: R$ 97,26
- Margem de Contribuição: R$ 69,94 (23.87%)

### Fórmulas de Cálculo
```
Preço Total = Preço Unitário × Quantidade
Tarifa ML = Preço Total × Taxa Comissão (%)
Custo Total = Custo Unitário × Quantidade
Imposto Total = Preço Total × Alíquota Imposto (%)
Margem = Preço Total - Tarifa ML - Envios - Custo Total - Imposto Total
Margem % = (Margem / Preço Total) × 100
```

### Componentes a Implementar
1. **Seletor de Produto** - dropdown com produtos cadastrados
2. **Seletor de Marketplace** - para puxar comissões automaticamente
3. **Campo Quantidade** - multiplicador
4. **Campo Preço de Venda** - editável
5. **Campo Custo de Frete** - editável ou automático por faixa
6. **Resumo Visual** - card lateral estilo ML
7. **Breakdown Detalhado** - tabela com todos os valores
