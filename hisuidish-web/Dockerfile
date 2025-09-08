FROM node:22-bookworm-slim

WORKDIR /app

ENV CHOKIDAR_USEPOLLING=1 \
    WATCHPACK_POLLING=true \
    NODE_ENV=development

EXPOSE 5173
USER node

# Vite を 0.0.0.0:5173 で起動（compose側の command でもOK）
CMD ["npm","run","dev","--","--host","0.0.0.0","--port","5173"]