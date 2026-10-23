FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --filter api --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN pnpm exec prisma generate && pnpm run build

# Runtime autónomo: npm instala dependencies (incluye CLI `prisma` para migrate deploy).
# Copiar solo apps/api/node_modules de pnpm deja symlinks rotos hacia el store de la raíz.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl \
  && addgroup -S app && adduser -S app -G app \
  && mkdir -p /data/uploads && chown -R app:app /data
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/apps/api/prisma ./prisma
RUN npm install --omit=dev \
  && npx prisma generate \
  && chown -R app:app /app
USER app
EXPOSE 8080
# Nest (module nodenext) emite dist/src/main.js, no dist/main.js.
# sh -c es obligatorio: Railway (Dockerfile) lanza el start en exec sin shell.
ENV RAILWAY_BOOT_REV=18
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
