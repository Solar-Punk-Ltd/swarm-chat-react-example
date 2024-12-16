FROM nginx:stable-alpine AS production

WORKDIR /usr/share/nginx/html

COPY dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
