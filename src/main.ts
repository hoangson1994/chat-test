import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ErrorsResponseFilter} from './shared/filters/errors-response.filter';
import {RestfulInterceptor} from './shared/interceptors/restful.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ErrorsResponseFilter());
  app.useGlobalInterceptors(new RestfulInterceptor());
  app.enableShutdownHooks();
  await app.listen(3000);
}
bootstrap();
