import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.apiKey.upsert({
        where: { key: '$2b$12$UEepoS8UsOtcR9sXTUB4Yuhi8UAL4Axs1HOcZ0XrDUTkhHWmy3Qkm' },
        update: {},
        create: {
            key: '$2b$12$UEepoS8UsOtcR9sXTUB4Yuhi8UAL4Axs1HOcZ0XrDUTkhHWmy3Qkm',
            name: 'default',
            isActive: true,
        },
    });
    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
