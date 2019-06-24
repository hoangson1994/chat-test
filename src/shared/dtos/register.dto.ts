import {IsNotEmpty} from 'class-validator';

export class RegisterDto {
    @IsNotEmpty()
    password: string;
    @IsNotEmpty()
    phoneNumber: string;
    @IsNotEmpty()
    name: string;
}
