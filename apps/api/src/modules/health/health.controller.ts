import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

type HealthResponse = {
  status: 'ok';
  service: string;
  timestamp: string;
};

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'API health status' })
  health(): HealthResponse {
    const productName = process.env.PRODUCT_NAME ?? 'WorkPulse AI';

    return {
      status: 'ok',
      service: `${productName} API`,
      timestamp: new Date().toISOString(),
    };
  }
}
