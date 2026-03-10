import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const response = context.switchToHttp().getResponse();

        return next.handle().pipe(
            map((result: any) => {
                const { data, meta, message } = result ?? {};
                return {
                    statusCode: response.statusCode,
                    message: message ?? "Success",
                    data: data ?? result,
                    errors: null,
                    meta: meta ?? null,
                };
            })
        );
    }
}
