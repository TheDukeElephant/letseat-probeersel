// We import decorators & helpers from NestJS core.
// Controller: lets us mark a class as a REST controller.
// Get: marks a method that should respond to HTTP GET requests.
import { Controller, Get } from '@nestjs/common';
// Import our own service that contains reusable logic.
import { AppService } from './app.service';

// @Controller() with no path means this controller is mounted at the root '/'.
@Controller()
export class AppController {
  // NestJS automatically injects the AppService instance.
  // 'private readonly' both stores it in a property and ensures we don't accidentally reassign it.
  constructor(private readonly appService: AppService) {}

  // This method will handle GET / requests.
  @Get()
  getHello(): string {
    // Delegate the actual message to the service.
    // Keeping logic in services keeps controllers thin & testable.
    return this.appService.getHello();
  }
}
