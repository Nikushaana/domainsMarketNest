import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateDomainDto } from './dto/create-domain.dto';
import { DomainsService } from './domains.service';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { RequestInfo } from 'src/common/types/request-info';

@Controller('front/domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  create(@Body() dto: CreateDomainDto, @Req() req: RequestInfo) {
    return this.domainsService.create(dto, req.user.id ?? null);
  }

  @Get()
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.domainsService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.domainsService.findOne(+id);
  }
}
