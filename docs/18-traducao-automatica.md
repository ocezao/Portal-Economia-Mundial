# TraduÃ§Ã£o AutomÃ¡tica - Portal EconÃ´mico Mundial

**Status: Removido do app.** Este documento permanece apenas como referencia historica.

## VisÃ£o Geral

O Portal EconÃ´mico Mundial possui funcionalidade de traduÃ§Ã£o automÃ¡tica que funciona tanto em **desenvolvimento local** (porta 5173) quanto em **produÃ§Ã£o**.

---

## ðŸŽ¯ Como Funciona

### EstratÃ©gia Dual

| Ambiente | MÃ©todo | Funcionamento |
|----------|--------|---------------|
| **Localhost (5173)** | Widget Inline | Google Translate embeddado na pÃ¡gina |
| **ProduÃ§Ã£o** | Redirecionamento | Abre translate.google.com com a URL |

### Por que duas estratÃ©gias?

O **Google Translate** (via URL) **nÃ£o traduz pÃ¡ginas de localhost** - ele precisa de uma URL pÃºblica acessÃ­vel. Por isso:

- Em desenvolvimento: Usamos o widget inline do Google Translate
- Em produÃ§Ã£o: Redirecionamos para o serviÃ§o de traduÃ§Ã£o do Google

---

## ðŸŒ Idiomas Suportados

| CÃ³digo | Idioma | Bandeira |
|--------|--------|----------|
| pt | PortuguÃªs | ðŸ‡§ðŸ‡· |
| en | English | ðŸ‡ºðŸ‡¸ |
| es | EspaÃ±ol | ðŸ‡ªðŸ‡¸ |
| fr | FranÃ§ais | ðŸ‡«ðŸ‡· |
| de | Deutsch | ðŸ‡©ðŸ‡ª |
| it | Italiano | ðŸ‡®ðŸ‡¹ |

---

## ðŸ“ Arquivos

```
src/components/layout/
â”œâ”€â”€ LanguageSwitcher.tsx           # Componente principal (header)
â”‚   â”œâ”€â”€ LanguageSwitcher           # Dropdown com detecÃ§Ã£o
â”‚   â””â”€â”€ LanguageSwitcherFooter     # Select compacto (footer)
```

---

## ðŸ–¼ï¸ Interface

### Header
```
[ðŸ”] [ðŸŒ EN] [ðŸ‘¤ User]
      â†‘
   Clique: mostra dropdown com idiomas
```

### Banner de DetecÃ§Ã£o (aparece automaticamente)
```
ðŸŒ Traduzir para English?
Detectamos que seu navegador estÃ¡ em English.
(Modo desenvolvimento)
[Traduzir] [NÃ£o, obrigado] [Ã—]
```

### Footer
```
ðŸŒ PortuguÃªs  Â© 2024 Portal EconÃ´mico Mundial
   â†‘
Select para trocar idioma
```

---

## ðŸ”§ Uso

### Para UsuÃ¡rios (Desenvolvimento Local)

1. **Acesse** `http://localhost:5173`
2. Se seu navegador estÃ¡ em inglÃªs, um **banner aparecerÃ¡** apÃ³s 2 segundos
3. Clique **"Traduzir"** - a pÃ¡gina serÃ¡ traduzida inline (sem redirecionamento)
4. Ou use o Ã­cone ðŸŒ no header para escolher outro idioma

### Para UsuÃ¡rios (ProduÃ§Ã£o)

1. Acesse o site
2. Clique no Ã­cone ðŸŒ no header
3. Selecione o idioma desejado
4. VocÃª serÃ¡ redirecionado para `translate.google.com` com a pÃ¡gina traduzida

---

## âš™ï¸ ConfiguraÃ§Ã£o

### Adicionar Novo Idioma

Edite `src/components/layout/LanguageSwitcher.tsx`:

```typescript
const LANGUAGES: Language[] = [
  { code: 'pt', name: 'PortuguÃªs', flag: 'ðŸ‡§ðŸ‡·', googleCode: 'pt' },
  { code: 'en', name: 'English', flag: 'ðŸ‡ºðŸ‡¸', googleCode: 'en' },
  // Adicione:
  { code: 'ko', name: 'í•œêµ­ì–´', flag: 'ðŸ‡°ðŸ‡·', googleCode: 'ko' },
];
```

---

## âš ï¸ LimitaÃ§Ãµes

### Em Desenvolvimento (Localhost)

- âœ… TraduÃ§Ã£o instantÃ¢nea na mesma pÃ¡gina
- âœ… MantÃ©m sessÃ£o e estado
- âš ï¸ Carrega script externo do Google
- âš ï¸ Pode ter pequeno delay inicial

### Em ProduÃ§Ã£o

- âœ… Traduz toda a pÃ¡gina automaticamente
- âœ… Google Translate otimizado
- âš ï¸ Redireciona para outro domÃ­nio
- âš ï¸ URL muda para translate.google.com

---

## ðŸ”’ Privacidade

- Nenhum dado enviado para nossos servidores
- TraduÃ§Ã£o processada pelo Google
- PreferÃªncia salva apenas localmente (localStorage)

---

## ðŸ› Troubleshooting

### "Can't translate this page" em produÃ§Ã£o

Isso Ã© normal se o site ainda nÃ£o estÃ¡ publicado. O Google Translate precisa de uma URL pÃºblica.

**SoluÃ§Ã£o:** Use o modo desenvolvimento (localhost:5173) para testar.

### Widget nÃ£o aparece em localhost

1. Verifique conexÃ£o com internet
2. Desative bloqueadores de anÃºncios
3. Verifique console do navegador (F12)
4. Recarregue a pÃ¡gina (F5)

### Idioma nÃ£o muda

1. Limpe localStorage: `localStorage.removeItem('pem_lang')`
2. Recarregue a pÃ¡gina
3. Tente novamente

---

## ðŸ“Š Testando

### Teste em Desenvolvimento

```bash
npm run dev
# Acesse http://localhost:5173
# Mude idioma do navegador para inglÃªs
# Verifique se banner aparece
```

### Teste em ProduÃ§Ã£o (simulado)

```bash
npm run build
npm run preview
# Acesse http://localhost:4173
# Clique no Ã­cone ðŸŒ
# Deve redirecionar para translate.google.com
```

---

**VersÃ£o:** 3.0 (EstratÃ©gia Dual)
**Data:** 04/02/2024
