# ARCH-007: production image (Next.js standalone is not used so Payload's runtime files stay intact)
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_TELEMETRY_DISABLED=1
RUN DATABASE_URI=file:/tmp/build.db PAYLOAD_SECRET=build-only pnpm build

FROM base AS run
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build /app ./
RUN addgroup -S app && adduser -S app -G app && mkdir -p /app/media && chown -R app:app /app/media /app/.next
USER app
EXPOSE 3000
CMD ["sh", "deploy/start.sh"]
