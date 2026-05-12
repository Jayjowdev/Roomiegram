# Imagen de desarrollo — instala deps y arranca Vite con hot reload
FROM node:22-alpine
WORKDIR /app

# Copia sólo los manifests primero para aprovechar la caché de capas
COPY package*.json ./
RUN npm install

# El código fuente se monta como volume en docker-compose, no se copia aquí
EXPOSE 5173
CMD ["npm", "run", "dev"]
