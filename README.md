# 🤖 AI Data Copilot + Dashboard de Churn (Telecom)

Plataforma de análise de dados com **dashboard interativo** e **AI Data Copilot**, utilizando **LLMs, Agents e LangChain** para geração automática de insights e suporte à tomada de decisão.

---

## 🚀 Visão Geral

Este projeto simula um cenário real de negócio focado em **análise de churn de clientes no setor de telecomunicações**, combinando:

- 📊 **Visualização de dados** — Dashboard interativo com KPIs de churn
- 🧠 **Geração de insights com IA** — LLM + ReAct Agent executando análises em tempo real
- ⚙️ **Orquestração com LangChain** — Agent que raciocina, escreve e executa código Python no DataFrame automaticamente

O objetivo é demonstrar como integrar **BI + IA** para criar soluções modernas de análise de dados.

---

## 📊 Preview do Dashboard

![Dashboard](images/dashboard.png)

---

🔗 **Acesse o dashboard (Railway):**
- https://workspacechurn-dashboard-production.up.railway.app/

🔗 **Versão inicial (Replit):**
- https://b90be4c4-970a-4140-ab69-8459bfb8d618-00-3h6b71i09oqlk.janeway.replit.dev/

> 📌 O dashboard foi desenvolvido com apoio de ferramentas de IA (Replit) para acelerar a construção da interface.

---

## 🎬 Demonstração — AI Data Copilot em ação

<p align="center">
  <img src="assets/Pergunta.png" width="800"/>
</p>

> O agent recebe a pergunta em linguagem natural, raciocina sobre qual código escrever, executa no DataFrame e retorna a resposta com os valores exatos dos dados reais.

---

## 🧠 AI Data Copilot — Como funciona?

O **AI Data Copilot** é um chatbot analítico baseado em **ReAct Agent (LangChain + Groq LLM)** capaz de:

- 💬 Interpretar perguntas em linguagem natural
- 🛠️ Escrever e executar código Python no DataFrame automaticamente
- 📊 Gerar insights precisos com base nos dados reais
- 🔄 Corrigir os próprios erros durante a execução (como na demonstração acima)

**Fluxo do Agent:**

```
💬 Pergunta → 🤔 Raciocínio → 🛠️ Execução de Código → 📊 Análise do Resultado → 🧠 Resposta
```

📂 **Notebook completo:** [`churn_agent_llm.ipynb`](churn_agent_llm.ipynb)

> O notebook contém o passo a passo completo para configurar o ambiente e rodar o projeto localmente, incluindo instalação de dependências, configuração da API Key e exemplos de perguntas.

---

## 📂 Fonte de Dados

Dataset público de churn (Telecom):

| | |
|---|---|
| 🔗 **Kaggle** | [Telco Customer Churn](https://www.kaggle.com/datasets/blastchar/telco-customer-churn) |
| 🔗 **Google Sheets (fonte ativa)** | [Acessar planilha](https://docs.google.com/spreadsheets/d/1W9_d6wi9x7CB5z0Rx0km7LmiOvfW_laW2ywFSAy2QRU/export?format=csv) |

> 📌 Optei por utilizar o **Google Sheets** como fonte de dados para permitir atualizações contínuas da base, possibilitando que o projeto reflita automaticamente novas informações sem necessidade de reprocessamento manual.

---

## 🧰 Tecnologias Utilizadas

| Tecnologia | Uso |
|---|---|
| Python (pandas, numpy) | Manipulação e análise de dados |
| LangChain | Orquestração do Agent (ReAct) |
| Groq LLM (llama-3.3-70b) | Modelo de linguagem gratuito e de alta performance |
| LangChain Experimental (PythonREPL) | Execução de código Python pelo Agent |
| Dashboard Web | Visualização interativa de KPIs |
| Replit | Desenvolvimento assistido por IA |
| Railway | Deploy e hospedagem do dashboard |
| Google Sheets | Fonte de dados com atualização contínua |

---

## 🧩 Arquitetura do Projeto

O projeto é dividido em três camadas principais:

**1. 📦 Dados**
- Ingestão via Google Sheets (CSV → DataFrame)
- Limpeza e tratamento (pandas)
- Análise exploratória (EDA)

**2. 📊 Dashboard**
- Construção de visualizações interativas
- Interface para análise de KPIs de churn
- Deploy via Railway

**3. 🤖 IA (Copilot)**
- LLM (Groq) para interpretação de perguntas em linguagem natural
- ReAct Agent (LangChain) para orquestração e execução de código
- Python Tool para análise dinâmica diretamente no DataFrame

---

## 🎯 Principais Análises

- 📉 Taxa geral de churn
- 👤 Perfil dos clientes que cancelam
- 📋 Impacto do tipo de contrato na retenção
- 💳 Influência do método de pagamento no churn
- 🌐 Relação entre tipo de internet e cancelamento
- ⏱️ Churn por tempo de permanência (tenure)
- 🛠️ Impacto de serviços adicionais (suporte técnico, segurança online)

---

## 💡 Diferenciais do Projeto

- ✅ Integração real de **BI + IA** em um mesmo projeto
- ✅ Agent que **executa código Python autonomamente** para responder perguntas
- ✅ LLM **gratuito** via Groq (sem custos com OpenAI)
- ✅ Dashboard criado com **apoio de IA (Replit)**
- ✅ Fonte de dados com **atualização automática** via Google Sheets
- ✅ Simulação de ambiente corporativo real

---

## 📌 Objetivo

Demonstrar na prática como utilizar **LLMs e Agents** para transformar dados em **insights acionáveis**, além de explorar a **automatização da análise de dados com IA**.

---

## 👤 Autor

**Lucas Diagone**

| | |
|---|---|
| 💼 LinkedIn | [lucas-diagone-691285104](https://www.linkedin.com/in/lucas-diagone-691285104/) |
| 🐙 GitHub | [LucasDiagone](https://github.com/LucasDiagone) |
