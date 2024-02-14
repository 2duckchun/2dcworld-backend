import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios, { AxiosResponse } from 'axios';
import {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_GET_TOKEN_URL,
  GITHUB_GET_USER_INFO_URL,
} from 'src/common/constants/env-keys.const';
import { UsersModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async loginGithubOauth(authCode: string) {
    const githubAccessToken = await this.getGitHubAccessToken(authCode);
    const githubUserInfo = await this.getGitHubUserInfo(githubAccessToken);

    // DB에 githubId가 등록되었는지 안되었는지 확인
    let user = await this.usersService.findOneByGithubId(
      githubUserInfo.githubId,
    );

    // 안되었다면 DB에 유저 정보 등록
    if (!user) {
      user = await this.usersService.createUser(githubUserInfo);
    }

    // 이후 토큰 발급 (access, refresh)
    return this.loginUser({
      id: user.id,
      loginId: user.loginId,
      nickname: user.nickname,
      avatar: user.avatar,
    });
  }

  signToken(
    user: Pick<UsersModel, 'id' | 'loginId' | 'nickname' | 'avatar'>,
    isRefreshToken: boolean,
  ) {
    const payload = {
      userId: user.id,
      loginId: user.loginId,
      nickname: user.nickname,
      avatar: user.avatar,
      type: isRefreshToken ? 'refresh' : 'access',
    };
    return this.jwtService.sign(payload, {
      expiresIn: isRefreshToken ? '30d' : '1d',
    });
  }

  loginUser(user: Pick<UsersModel, 'id' | 'loginId' | 'nickname' | 'avatar'>) {
    const accessToken = this.signToken(user, false);
    const refreshToken = this.signToken(user, true);
    return { accessToken, refreshToken };
  }

  async getGitHubUserInfo(
    accessToken: string,
  ): Promise<
    Pick<
      UsersModel,
      'githubId' | 'loginId' | 'avatar' | 'nickname' | 'githubUrl'
    >
  > {
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
      githubUrl: html_url,
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
