import { Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Auth, GetUser } from 'src/auth/decorators';
import { validRoles } from 'src/auth/interfaces';
import { User } from 'src/auth/entities/user.entity';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  // @Auth( validRoles.admin )
  executeSeed() {
    return this.seedService.runSeed();
  }
  
}
