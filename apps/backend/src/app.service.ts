// Injectable marks this class as something Nest can create & inject elsewhere.
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Simple method returning a string. In a real app this could query a DB or assemble data.
  getHello(): string {
    return 'Hello World!';
  }
}
