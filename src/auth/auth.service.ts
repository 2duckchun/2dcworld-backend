import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_GET_TOKEN_URL,
  GITHUB_GET_USER_INFO_URL,
} from 'src/common/constants/env-keys.const';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  async loginGithubOauth(authCode: string) {
    const githubAccessToken = await this.getGitHubAccessToken(authCode);
    const githubUserInfo = await this.getGitHubUserInfo(githubAccessToken);
    return githubUserInfo;
  }

  async getGitHubUserInfo(accessToken: string) {
    const getUserInfoUrl = this.configService.get(GITHUB_GET_USER_INFO_URL);
    const response: AxiosResponse = await axios.get(getUserInfoUrl, {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });

    if (response.data.error) {
      throw new UnauthorizedException('깃허브 인증을 실패했습니다.');
    }

    const { login, id, avatar_url, name, html_url } = response.data;

    return {
      githubId: id,
      loginId: login,
      avatar: avatar_url,
      nickname: name,
      url: html_url,
    };
  }

  async getGitHubAccessToken(authCode: string) {
    const getTokenUrl = this.configService.get(GITHUB_GET_TOKEN_URL);
    const request = {
      code: authCode,
      client_id: this.configService.get(GITHUB_CLIENT_ID),
      client_secret: this.configService.get(GITHUB_CLIENT_SECRET),
    };

    const response: AxiosResponse = await axios.post(getTokenUrl, request, {
      headers: {
        accept: 'application/json',
      },
    });

    if (response.data.error) {
      throw new UnauthorizedException('깃허브 인증을 실패했습니다.');
    }

    const { access_token: accessToken } = response.data;

    return accessToken;
  }
}
