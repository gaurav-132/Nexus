import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class APIResponseInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<{ success: true; data: unknown }> {
        const response = context.switchToHttp().getResponse<{
            setHeader: (name: string, value: string) => void;
        }>();
        response.setHeader('Cache-Control', 'no-store');

        return next.handle().pipe(
            map((data: unknown) => ({
                success: true as const,
                data: data === undefined ? null : data,
            })),
        );
    }
}
