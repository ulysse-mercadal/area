import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    logger.log(`Microservice Discord running on http://localhost:${port}`);
    logger.log('Polling service started automatically');
}

bootstrap();
