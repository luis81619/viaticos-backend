import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): {
    name: string;
    status: string;
    timestamp: string;
  } {
    return {
      name: 'VIATICOS API',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }
}