# Tradução Automática - Portal Econômico Mundial

**Status: Removido do app.** Este documento permanece apenas como referencia historica.

## Visão Geral

O Portal Econômico Mundial possui funcionalidade de tradução automática que funciona tanto em **desenvolvimento local** (porta 5173) quanto em **produção**.

---

## 🎯 Como Funciona

### Estratégia Dual

| Ambiente | Método | Funcionamento |
|----------|--------|---------------|
| **Localhost (5173)** | Widget Inline | Google Translate embeddado na página |
| **Produção** | Redirecionamento | Abre translate.google.com com a URL |

### Por que duas estratégias?

O **Google Translate** (via URL) **não traduz páginas de localhost** - ele precisa de uma URL pública acessível. Por isso:

- Em desenvolvimento: Usamos o widget inline do Google Translate
- Em produção: Redirecionamos para o serviço de tradução do Google

---

## 🌍 Idiomas Suportados

| Código | Idioma | Bandeira |
|--------|--------|----------|
| pt | Português | 🇧🇷 |
| en | English | 🇺🇸 |
| es | Español | 🇪🇸 |
| fr | Français | 🇫🇷 |
| de | Deutsch | 🇩🇪 |
| it | Italiano | 🇮🇹 |

---

## 📁 Arquivos

```
src/components/layout/
├── LanguageSwitcher.tsx           # Componente principal (header)
│   ├── LanguageSwitcher           # Dropdown com detecção
│   └── LanguageSwitcherFooter     # Select compacto (footer)
```

---

## 🖼️ Interface

### Header
```
[🔍] [🌐 EN] [👤 User]
      ↑
   Clique: mostra dropdown com idiomas
```

### Banner de Detecção (aparece automaticamente)
```
🌐 Traduzir para English?
Detectamos que seu navegador está em English.
(Modo desenvolvimento)
[Traduzir] [Não, obrigado] [×]
```

### Footer
```
🌐 Português  © 2024 Portal Econômico Mundial
   ↑
Select para trocar idioma
```

---

## 🔧 Uso

### Para Usuários (Desenvolvimento Local)

1. **Acesse** `http://localhost:5173`
2. Se seu navegador está em inglês, um **banner aparecerá** após 2 segundos
3. Clique **"Traduzir"** - a página será traduzida inline (sem redirecionamento)
4. Ou use o ícone 🌐 no header para escolher outro idioma

### Para Usuários (Produção)

1. Acesse o site
2. Clique no ícone 🌐 no header
3. Selecione o idioma desejado
4. Você será redirecionado para `translate.google.com` com a página traduzida

---

## ⚙️ Configuração

### Adicionar Novo Idioma

Edite `src/components/layout/LanguageSwitcher.tsx`:

```typescript
const LANGUAGES: Language[] = [
  { code: 'pt', name: 'Português', flag: '🇧🇷', googleCode: 'pt' },
  { code: 'en', name: 'English', flag: '🇺🇸', googleCode: 'en' },
  // Adicione:
  { code: 'ko', name: '한국어', flag: '🇰🇷', googleCode: 'ko' },
];
```

---

## ⚠️ Limitações

### Em Desenvolvimento (Localhost)

- ✅ Tradução instantânea na mesma página
- ✅ Mantém sessão e estado
- ⚠️ Carrega script externo do Google
- ⚠️ Pode ter pequeno delay inicial

### Em Produção

- ✅ Traduz toda a página automaticamente
- ✅ Google Translate otimizado
- ⚠️ Redireciona para outro domínio
- ⚠️ URL muda para translate.google.com

---

## 🔒 Privacidade

- Nenhum dado enviado para nossos servidores
- Tradução processada pelo Google
- Preferência salva apenas localmente (localStorage)

---

## 🐛 Troubleshooting

### "Can't translate this page" em produção

Isso é normal se o site ainda não está publicado. O Google Translate precisa de uma URL pública.

**Solução:** Use o modo desenvolvimento (localhost:5173) para testar.

### Widget não aparece em localhost

1. Verifique conexão com internet
2. Desative bloqueadores de anúncios
3. Verifique console do navegador (F12)
4. Recarregue a página (F5)

### Idioma não muda

1. Limpe localStorage: `localStorage.removeItem('pem_lang')`
2. Recarregue a página
3. Tente novamente

---

## 📊 Testando

### Teste em Desenvolvimento

```bash
npm run dev
# Acesse http://localhost:5173
# Mude idioma do navegador para inglês
# Verifique se banner aparece
```

### Teste em Produção (simulado)

```bash
npm run build
npm run preview
# Acesse http://localhost:4173
# Clique no ícone 🌐
# Deve redirecionar para translate.google.com
```

---

**Versão:** 3.0 (Estratégia Dual)
**Data:** 04/02/2024
