import { Controller, Get, Req } from '@nestjs/common';
import { AboutService } from './about.service';

@Controller()
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get('about.json')
  getAbout(@Req() req: any) {
    const clientIp =
      req.ip ||
      req.raw?.socket?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown';

    const formattedIp = clientIp.replace('::ffff:', '');

    return this.aboutService.getAboutData(formattedIp);
  }
}
