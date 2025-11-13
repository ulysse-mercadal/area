import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  let app: any;

  if (fs.existsSync('localhost+1-key.pem') && fs.existsSync('localhost+1.pem')) {
    const httpsOptions = {
      key: fs.readFileSync('localhost+1-key.pem'),
      cert: fs.readFileSync('localhost+1.pem'),
    }
    app = await NestFactory.create(AppModule, { httpsOptions });
  } else {
    app = await NestFactory.create(AppModule);
  }
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Flow connect api')
    .setDescription('a 3 epitech year project to automate EVERYTHING')
    .setVersion('42.42')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.API_PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()} on port ${port}`);
}
bootstrap();
