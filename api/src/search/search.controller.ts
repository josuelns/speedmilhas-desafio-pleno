import { Body, Controller, Post } from '@nestjs/common';

import type { SearchRequestDto } from './dto/search.dto';
import { SearchService } from './search.service';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('search')
  search(@Body() body: SearchRequestDto) {
    return this.searchService.search(body);
  }
}
