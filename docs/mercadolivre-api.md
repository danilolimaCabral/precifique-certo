# API do Mercado Livre - Fees for Listing

## Endpoint Principal
```
GET https://api.mercadolibre.com/sites/{SITE}/listing_prices?price={PRICE}
```

## Sites Disponíveis
- MLB = Brasil
- MLA = Argentina
- MLM = México
- MLC = Chile
- MCO = Colômbia

## Parâmetros de Filtro
- `price` - Filtrar por preço
- `listing_type_id` - Tipo de anúncio (gold_pro, gold_special, free)
- `category_id` - ID da categoria
- `quantity` - Quantidade

## Atributos da Resposta
| Atributo | Descrição |
|----------|-----------|
| currency_id | ID da moeda (BRL para Brasil) |
| listing_exposure | Nível de exposição (highest, high, mid, low, lowest) |
| listing_fee_amount | Custo para publicar |
| listing_type_id | ID do tipo de anúncio |
| listing_type_name | Nome do tipo (Premium, Clásica, etc) |
| sale_fee_amount | Valor da comissão de venda |
| sale_fee_details | Detalhes da comissão |

## Detalhes da Comissão (sale_fee_details)
- `percentage_fee` - Percentual total da comissão
- `fixed_fee` - Taxa fixa
- `gross_amount` - Valor bruto da comissão
- `meli_percentage_fee` - Percentual da plataforma
- `financing_add_on_fee` - Taxa adicional de financiamento

## Tipos de Anúncio
- `gold_pro` - Premium (maior exposição)
- `gold_special` - Clássica
- `free` - Gratuita (menor exposição)

## Exemplo de Requisição para Brasil
```bash
curl -X GET "https://api.mercadolibre.com/sites/MLB/listing_prices?price=100"
```

## Notas Importantes
1. A API é pública e não requer autenticação para consultar comissões
2. As comissões variam por categoria e tipo de anúncio
3. Para Brasil, usar site_id = MLB
4. O endpoint retorna comissões em tempo real

## Filtrar por Categoria
```
GET https://api.mercadolibre.com/sites/MLB/listing_prices?price=100&category_id=MLB1051
```

## Filtrar por Tipo de Anúncio
```
GET https://api.mercadolibre.com/sites/MLB/listing_prices?price=100&listing_type_id=gold_special
```


## Autenticação OAuth 2.0

A API do Mercado Livre requer autenticação OAuth 2.0 para a maioria dos endpoints.

### Fluxo de Autorização (Server Side)

1. **Redirecionar para autorização:**
```
https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=$APP_ID&redirect_uri=$YOUR_URL
```

2. **Trocar código por token:**
```bash
curl -X POST \
  -H "accept: application/json" \
  -H "content-type: application/x-www-form-urlencoded" \
  "https://api.mercadolibre.com/oauth/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=$APP_ID" \
  -d "client_secret=$SECRET_KEY" \
  -d "code=$CODE" \
  -d "redirect_uri=$REDIRECT_URI"
```

3. **Usar token nas requisições:**
```bash
curl -H 'Authorization: Bearer $ACCESS_TOKEN' https://api.mercadolibre.com/users/me
```

### Refresh Token
```bash
curl -X POST \
  -H "accept: application/json" \
  -H "content-type: application/x-www-form-urlencoded" \
  "https://api.mercadolibre.com/oauth/token" \
  -d "grant_type=refresh_token" \
  -d "client_id=$APP_ID" \
  -d "client_secret=$SECRET_KEY" \
  -d "refresh_token=$REFRESH_TOKEN"
```

## Endpoints Públicos (Sem Autenticação)

Alguns endpoints são públicos e não requerem autenticação:

- `GET /sites` - Lista de sites/países
- `GET /categories/{category_id}` - Informações de categoria
- `GET /items/{item_id}` - Informações de item público

## Estratégia de Implementação

Como a API de comissões (listing_prices) requer autenticação, vamos implementar:

1. **Opção 1 - OAuth Completo**: Usuário conecta sua conta ML
   - Vantagem: Acesso a dados personalizados
   - Desvantagem: Complexidade de implementação

2. **Opção 2 - Tabela de Comissões Atualizada**: Manter tabela local com comissões
   - Vantagem: Simplicidade
   - Desvantagem: Requer atualização manual

3. **Opção 3 - Híbrido**: Botão para sincronizar quando usuário tiver credenciais
   - Vantagem: Flexibilidade
   - Desvantagem: Depende do usuário ter app ML

## Decisão de Implementação

Vamos implementar a **Opção 3 (Híbrido)**:
- Manter comissões pré-cadastradas como padrão
- Permitir que usuários com credenciais ML sincronizem automaticamente
- Interface para configurar Client ID e Client Secret do app ML
