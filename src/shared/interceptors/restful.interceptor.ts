import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable()
export class RestfulInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
        .handle()
        .pipe(
            map(data => {
              const result: any = {
                status: 1,
                message: 'Thành công',
              };
              if (!data) {
                return result;
              }
              const {datas, meta} = data;
              if (datas) {
                return {
                  ...result,
                  datas,
                  meta,
                };
              }
              if (Array.isArray(data)) {
                return {...result, datas: data};
              }
              return {
                ...result,
                data,
              };
            }),
        );
  }
}
