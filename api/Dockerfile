FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma/schema.prisma prisma/schema.prisma

COPY . .

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
