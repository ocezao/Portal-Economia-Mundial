# Dockerfile otimizado para Next.js com output: 'standalone'
# Build multi-stage para imagem final enxuta e segura

# ==========================================
# STAGE 1: Dependencies
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Para build do Next.js, dependências de dev (Tailwind/PostCSS/etc) são necessárias.
# A imagem final continua enxuta porque usamos output standalone e não copiamos node_modules.
RUN npm ci --ignore-scripts && npm cache clean --force

# ==========================================
# STAGE 2: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Next.js "NEXT_PUBLIC_*" env vars are inlined at build-time for client bundles.
# Se definidos apenas em runtime, o bundle do navegador nao recebe esses valores.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_FINNHUB_API_KEY
ARG NEXT_PUBLIC_ONESIGNAL_APP_ID
ARG NEXT_PUBLIC_ADSENSE_CLIENT_ID
ARG NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build flags para otimização
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_FINNHUB_API_KEY=$NEXT_PUBLIC_FINNHUB_API_KEY
ENV NEXT_PUBLIC_ONESIGNAL_APP_ID=$NEXT_PUBLIC_ONESIGNAL_APP_ID
ENV NEXT_PUBLIC_ADSENSE_CLIENT_ID=$NEXT_PUBLIC_ADSENSE_CLIENT_ID
ENV NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE=$NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE

# Build da aplicação
RUN npm run build

# ==========================================
# STAGE 3: Runner (Production)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Variáveis de ambiente de produção
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copiar arquivos necessários do builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Mudar para usuário não-root
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["node", "server.js"]
