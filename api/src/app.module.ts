import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { SpotifyModule } from './service/spotify/spotifyAuth.module'
import { WorkflowModule } from './workflow/workflow.module';
import { NodeModule } from './nodes/node.module';
import { NodeConectionModule } from './nodes-connect/node-connect.module';
import { GoogleauthModule } from './auth/google/googleauth.module';
import { GithubauthService } from './auth/github/github.module';
import { MicrosoftAuthModule } from './auth/microsoft/microsoft.module';
import { CredentialsModule } from './credentials/credentials.module';
import { AreaModule } from './area/area.module';
import { ApiKeyModule } from './apikey/apikey.module';
import { ServicesModule } from './service/service.module';
import { AboutModule } from './about/about.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    SpotifyModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    GoogleauthModule,
    GithubauthService,
    MicrosoftAuthModule,
    WorkflowModule,
    NodeModule,
    NodeConectionModule,
    CredentialsModule,
    AreaModule,
    ServicesModule,
    ApiKeyModule,
    AboutModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
