# 📊 Dashboard de Análise de Churn de Clientes
> Documento de especificação técnica e funcional para construção do dashboard via IA generativa (Lovable, v0, Replit, etc.)

---

## 1. Objetivo

Construir um dashboard interativo de análise de **churn de clientes** (cancelamentos), que permita identificar padrões de comportamento, segmentar clientes e compreender os fatores que influenciam a saída — apoiando decisões estratégicas de retenção.

---

## 2. Fonte de Dados

| Atributo | Valor |
|---|---|
| **Tipo** | CSV público via Google Sheets |
| **URL** | `https://docs.google.com/spreadsheets/d/1W9_d6wi9x7CB5z0Rx0km7LmiOvfW_laW2ywFSAy2QRU/export?format=csv` |
| **Separador** | Vírgula (`,`) |
| **Encoding** | UTF-8 |
| **Atualização** | Estática (snapshot) |
| **Forma de consumo** | Fetch direto da URL no carregamento da aplicação |

> ⚠️ Não há autenticação necessária. Os dados devem ser carregados via `fetch()` ou equivalente diretamente do frontend.

---

## 3. Estrutura dos Dados (Schema)

### 3.1 Tabela de Campos

| Campo | Tipo | Valores Possíveis | Descrição |
|---|---|---|---|
| `id_cliente` | `string` | Único por linha | Identificador único do cliente |
| `genero` | `string` | `Masculino`, `Feminino` | Gênero do cliente |
| `idoso` | `int` | `0`, `1` | `1` = cliente idoso |
| `possui_parceiro` | `string` | `Sim`, `Não` | Se possui parceiro(a) |
| `dependentes` | `string` | `Sim`, `Não` | Se possui dependentes |
| `tempo_cliente_meses` | `int` | `0` – `72` (aprox.) | Meses como cliente ativo |
| `tipo_contrato` | `string` | `Mensal`, `Um ano`, `Dois anos` | Modalidade contratual |
| `metodo_pagamento` | `string` | `Boleto`, `Cartão de crédito`, `Débito automático`, `Cheque eletrônico` | Forma de pagamento usada |
| `valor_mensal` | `float` | Ex: `29.85` | Valor da mensalidade em R$ |
| `valor_total` | `float` | Ex: `1889.50` | Valor acumulado total pago em R$ |
| `churn` | `string` | `Sim`, `Não` | Se o cliente cancelou |

### 3.2 Regras e Observações de Parsing

- O campo `churn` deve ser tratado como booleano para cálculos: `"Sim"` = `true`, `"Não"` = `false`
- O campo `idoso` é numérico (`0`/`1`), não string
- `valor_mensal` e `valor_total` são floats — usar `parseFloat()` ao processar
- `tempo_cliente_meses` é inteiro — usar `parseInt()` ao processar
- Linhas sem `id_cliente` ou com `churn` vazio devem ser ignoradas

---

## 4. KPIs Principais (Cards)

Estes valores devem ser calculados diretamente dos dados carregados:

| KPI | Cálculo | Formato |
|---|---|---|
| **Total de clientes** | `COUNT(todas as linhas válidas)` | Número inteiro |
| **Taxa de churn** | `COUNT(churn = "Sim") / COUNT(total) * 100` | Percentual com 1 decimal (ex: `26.5%`) |
| **Receita total** | `SUM(valor_total)` | Moeda (ex: `R$ 2.861.382,90`) |
| **Receita média por cliente** | `SUM(valor_total) / COUNT(total)` | Moeda |
| **Receita perdida com churn** | `SUM(valor_mensal WHERE churn = "Sim")` | Moeda — representa perda mensal recorrente |

---

## 5. Visualizações (Gráficos)

### 5.1 Churn por Tipo de Contrato
- **Tipo:** Gráfico de barras agrupadas ou empilhadas
- **Eixo X:** `tipo_contrato` (`Mensal`, `Um ano`, `Dois anos`)
- **Eixo Y:** Contagem de clientes
- **Segmentação:** Barras separadas para `churn = Sim` e `churn = Não`
- **Insight esperado:** Clientes com contrato mensal tendem a ter maior churn

### 5.2 Churn por Tempo de Cliente
- **Tipo:** Histograma ou gráfico de linha
- **Eixo X:** `tempo_cliente_meses` agrupado em faixas (ex: 0–12, 13–24, 25–48, 49–72)
- **Eixo Y:** Taxa de churn (%) por faixa
- **Insight esperado:** Clientes recentes têm churn mais alto

### 5.3 Distribuição de Valor Mensal
- **Tipo:** Histograma
- **Eixo X:** Faixas de `valor_mensal` (ex: R$0–30, R$30–60, R$60–90, R$90+)
- **Eixo Y:** Contagem de clientes
- **Segmentação:** Cores distintas para clientes com e sem churn
- **Insight esperado:** Visualizar se há concentração de churn em determinadas faixas de valor

### 5.4 Churn por Método de Pagamento
- **Tipo:** Gráfico de barras horizontais
- **Eixo X:** Taxa de churn (%) ou contagem
- **Eixo Y:** `metodo_pagamento`
- **Insight esperado:** Cheque eletrônico costuma ter maior taxa de churn

### 5.5 (Opcional) Churn por Perfil Demográfico
- **Tipo:** Gráfico de pizza ou barras
- **Dimensões:** `genero`, `idoso`, `possui_parceiro`, `dependentes`

---

## 6. Filtros Interativos

O dashboard deve ter um painel de filtros que atualiza **todos os gráficos e KPIs em tempo real**:

| Filtro | Tipo de Controle | Campo correspondente |
|---|---|---|
| Tipo de contrato | Checkbox ou dropdown multi-seleção | `tipo_contrato` |
| Faixa de tempo como cliente | Slider de intervalo (range) | `tempo_cliente_meses` |
| Método de pagamento | Checkbox ou dropdown | `metodo_pagamento` |
| Status de churn | Toggle / radio button | `churn` (`Todos` / `Sim` / `Não`) |
| Gênero | Checkbox | `genero` |

> Os filtros devem ser combinados com lógica `AND` (todos ativos ao mesmo tempo).

---

## 7. Requisitos de UX e Design

### 7.1 Visual
- Interface **limpa, moderna e profissional**
- Paleta de cores com **destaque em vermelho** para churn e **verde** para retenção
- Fundo escuro (dark mode) ou claro — definir uma direção e manter consistência
- Tipografia legível com hierarquia visual clara entre títulos, valores e labels

### 7.2 Layout
- **Desktop:** Sidebar de filtros à esquerda + área principal com cards e gráficos
- **Mobile:** Layout em coluna única com filtros colapsáveis
- Cards de KPI no topo, gráficos abaixo

### 7.3 Experiência
- Loading state enquanto os dados são carregados via fetch
- Estado vazio caso os filtros resultem em zero registros
- Tooltips nos gráficos com valores detalhados ao hover
- Animação suave ao aplicar filtros

---

## 8. Stack Técnica Recomendada

A IA pode escolher a stack mais adequada, mas as seguintes são compatíveis com este projeto:

| Camada | Opções sugeridas |
|---|---|
| **Framework** | React, Next.js, Vue, HTML/JS puro |
| **Gráficos** | Recharts, Chart.js, ApexCharts, Victory |
| **Estilo** | Tailwind CSS, CSS Modules, Styled Components |
| **Dados** | Fetch nativo + parsing de CSV (PapaParse recomendado) |

> 💡 **PapaParse** é a biblioteca mais robusta para parsing de CSV no frontend: `https://www.papaparse.com/`

---

## 9. Comportamento Esperado da Aplicação

```
1. Ao carregar: buscar CSV da URL → parsear → calcular KPIs → renderizar gráficos
2. Ao aplicar filtro: recalcular KPIs e redesenhar gráficos com os dados filtrados
3. Ao remover filtros: restaurar estado original
```

---

## 10. Checklist de Entregáveis

- [ ] Cards de KPI funcionais e calculados dinamicamente
- [ ] 4 gráficos implementados com dados reais
- [ ] Painel de filtros conectado a todos os gráficos e KPIs
- [ ] Layout responsivo (desktop e mobile)
- [ ] Loading e empty states
- [ ] Cores diferenciadas para churn vs retenção
