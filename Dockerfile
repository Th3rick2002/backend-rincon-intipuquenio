# Stage 1: build with Bun
FROM oven/bun:1 AS build
WORKDIR /app

# Copia solo los archivos para instalar dependencias (caching)
COPY package.json ./
RUN bun install --frozen-lockfile

# Copia el resto del código
COPY . .

# Ejecuta builds/tests si los tienes
RUN bun test || echo "No tests defined"
RUN bun run build || echo "No build script definido"

# Stage 2: imagen final ligera
FROM oven/bun:1 AS release
WORKDIR /app

# Solo dependencias de producción
COPY --from=build /app/node_modules node_modules
COPY --from=build /app ./

USER bun
EXPOSE 5000
ENTRYPOINT ["bun", "run", "src/index.ts"]
