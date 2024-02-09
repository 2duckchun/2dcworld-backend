import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  async loginGithubOauth(authCode: string) {
    const access_token = await this.validateAuthenticationCode(authCode);

    const getUserUrl: string = 'https://api.github.com/user';

    const { data } = await axios.get(getUserUrl, {
      headers: {
        Authorization: `token ${access_token}`,
      },
    });

    const { login, avatar_url, name, html_url } = data;

    const githubInfo = {
      githubId: login,
      avatar: avatar_url,
      name,
      url: html_url,
    };

    return githubInfo;
  }

  async validateAuthenticationCode(authCode: string) {
    const getTokenUrl = this.configService.get('GITHUB_GET_TOKEN_URL');
    const request = {
      code: authCode,
      client_id: this.configService.get('GITHUB_CLIENT_ID'),
      client_secret: this.configService.get('GITHUB_CLIENT_SECRET'),
    };

    const response: AxiosResponse = await axios.post(getTokenUrl, request, {
      headers: {
        accept: 'application/json',
      },
    });

    if (response.data.error) {
      throw new UnauthorizedException('깃허브 인증을 실패했습니다.');
    }

    const { access_token } = response.data;

    return access_token;
  }
}
