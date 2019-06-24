import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {AuthService} from './auth.service';
import {JWT_SECRET} from '../../shared/resources/constants.resource';
import {JwtPayload} from './jwt.payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: JWT_SECRET,
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.authService.findAccountByPayload(payload);
        if (!user) {
            throw new UnauthorizedException('Token sai hoặc đã hết hạn');
        }
        return user;
    }
}
