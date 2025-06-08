FROM node:16.13.2 AS builder
WORKDIR /app
COPY package.json ./
RUN npm cache clean --force
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--port", "3000"]
