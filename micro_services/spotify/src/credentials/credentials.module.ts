import { Module, Global } from '@nestjs/common';
import { CredentialsService } from './credientials.service';

@Global()
@Module({
    providers: [CredentialsService],
    exports: [CredentialsService],
})
export class CredentialsModule { }
