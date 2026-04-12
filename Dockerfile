# LoveSpace 前端静态资源（请先本地 npm run build，再将 dist/ 上传至本目录）
# 构建（在 docker-compose.yml 所在目录）：
#   docker compose build frontend

FROM nginx:1.27-alpine

COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
