# 🎯 Leads Frontend

Interface Next.js para o Gerador de Leads Multi-Nicho.

---

## 🚀 Setup local

```bash
cd leads-frontend
npm install
cp .env.local.example .env.local
```

Edite `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

```bash
npm run dev
# http://localhost:3000
```

> ⚠️ O **leads-backend** precisa estar rodando antes de usar o frontend.

---

## 🌐 Deploy no Vercel

```bash
vercel login
vercel
vercel env add NEXT_PUBLIC_API_URL   # cole a URL do Render: https://leads-backend.onrender.com
vercel --prod
```

---

## 📁 Estrutura

```
leads-frontend/
├── pages/
│   ├── _app.tsx
│   └── index.tsx              # Página principal
├── components/
│   ├── StatsCards.tsx         # Cards de métricas
│   ├── ConfigPanel.tsx        # Form de configuração (nicho, cidades, fontes)
│   ├── ProgressPanel.tsx      # Barra de progresso + logs em tempo real
│   └── LeadsTable.tsx         # Tabela com filtros, paginação e download
├── lib/
│   ├── api.ts                 # Cliente HTTP para o backend
│   ├── types.ts               # Tipos TypeScript
│   ├── cities.ts              # 30 cidades por região
│   └── niches.ts              # 23 nichos pré-definidos + campo livre
├── styles/
│   └── globals.css
├── .env.local.example
└── next.config.js
```

---

## ✨ Funcionalidades

- **Multi-nicho:** 23 nichos pré-definidos + campo livre para qualquer segmento
- **4 fontes:** Google Maps, Instagram, LinkedIn, Facebook Pages
- **30 cidades** organizadas por região — seleção individual ou por região
- **API Key sempre obrigatória** — nunca armazenada
- **Polling em tempo real** a cada 3s com log de execução
- **Filtros:** cidade, fonte, prioridade, busca textual
- **Paginação** de 25 por página
- **Download .md** com scripts de abordagem incluídos
- **Download .csv** com BOM UTF-8 (compatível com Excel)
- **Indicador de backend** online/offline
