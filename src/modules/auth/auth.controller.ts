import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post, Query, Req, UseGuards } from '@nestjs/common';
import {AuthService} from './auth.service';
import {transformPipe} from '../../shared/resources/constants.resource';
import {RegisterDto} from '../../shared/dtos/register.dto';
import * as bcrypt from 'bcryptjs';
import {Account} from '../../shared/entities/account';
import {AccountResDto} from '../../shared/res-dto/account-res-dto';
import {JwtGuard} from './jwt.guard';
import { NotificationService } from '../../shared/helpers/notification/notification.service';
import { DeviceToken } from '../../shared/entities/account-devices';
import { LoginDto } from '../../shared/dtos/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly notifyService: NotificationService,
    ) {
    }

    @Post('register')
    async register(@Body(transformPipe) registerDto: RegisterDto, @Req() req): Promise<any> {
        if (await this.authService.findByPhoneNumber(registerDto.phoneNumber)) {
            throw new NotFoundException('SDT đã được sử dụng trước đó.');
        }
        const account = await this.authService.create(registerDto);
        if (req.headers.tokendevice) {
            await this.authService.addDeviceTokenForUser(String(account._id), req.headers.tokendevice);
        }
        return await this.getAccountReturnData(account);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body(transformPipe) loginDto: LoginDto): Promise<any> {
        const account = await this.authService.findByPhoneNumber(loginDto.phoneNumber);
        if (!account || !(await bcrypt.compare(loginDto.password, account.password))) {
            throw new NotFoundException('Account or Password not match');
        }
        return await this.getAccountReturnData(account);
    }

    @Get('logout')
    @UseGuards(JwtGuard)
    async logout(@Req() req) {
        const user: Account = req.user;
        const clientId = req.headers.clientid;
        const deviceToken = req.headers.tokendevice;
        const account = await this.authService.findByPhoneNumber(user.phoneNumber);
        const accountDevice = await this.notifyService.findByAccountId(String(user._id));
        const socketIds = [];
        const deviceTokens = [];
        account.socketIds.forEach(socket => {
            if (socket !== clientId) {
                socketIds.push(socket);
            }
        });
        accountDevice.deviceTokens.forEach((dT: DeviceToken) => {
            if (dT.token !== deviceToken) {
                deviceTokens.push(dT);
            }
        });

        try {
            await account.updateOne({ socketIds });
            await accountDevice.updateOne({ deviceTokens });
        } catch (e) {
            throw new NotFoundException('Logout fail');
        }
        return null;
    }

    @Get('user-data')
    @UseGuards(JwtGuard)
    async userData(@Req() req) {
        const token = req.headers.authorization.replace('Bearer ', '');
        return new AccountResDto(req.user, token);
    }

    private async getAccountReturnData(account: Account) {
        const accessToken = await this.authService.fromAccount(account);
        return new AccountResDto(account, accessToken);
    }

    @Get('search')
    @UseGuards(JwtGuard)
    async search(@Query('s') search: string, @Req() req) {
        const user = req.user;
        try {
            const accounts = await this.authService.listForSearch(user._id, search);
            if (!accounts) {
                return [];
            }
            return accounts.map(account => {
                return new AccountResDto(account);
            });
        } catch (e) {
            throw new NotFoundException(e.toString());
        }
    }

    @Get('list')
    @UseGuards(JwtGuard)
    async list(@Req() req) {
        const user = req.user;
        const accounts = await this.authService.list(user._id);
        if (!accounts) {
            throw new NotFoundException('Can not found any account');
        }
        return accounts.map(account => {
            return new AccountResDto(account);
        });
    }
}
