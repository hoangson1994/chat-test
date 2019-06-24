import {ArgumentsHost, Catch, ExceptionFilter, HttpStatus, HttpException} from '@nestjs/common';

@Catch()
export class ErrorsResponseFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    let message = exception.message;
    if (typeof message === 'object') {
      message = message.message;
    }
    res.status(HttpStatus.NOT_FOUND)
        .json({
          status: 0,
          message,
        });
  }
}
