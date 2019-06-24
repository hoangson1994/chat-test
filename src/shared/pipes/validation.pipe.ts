import {ArgumentMetadata, BadRequestException, NotFoundException, ValidationPipe} from '@nestjs/common';

export class MyValidationPipe extends ValidationPipe {
    async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
        try {
            return await super.transform(value, metadata);
        } catch (e) {
            if (e instanceof BadRequestException) {
                let message = 'unknown';
                if (e.message && e.message.message && e.message.message[0] && e.message.message[0].constraints) {
                    const constraint = e.message.message[0].constraints;
                    if (Object.keys(constraint).length > 0) {
                        message = constraint[Object.keys(constraint)[0]];
                    }
                }
                throw new NotFoundException(message);
            }
        }
    }
}
