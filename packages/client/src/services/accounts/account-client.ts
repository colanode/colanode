import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  isAxiosError,
} from 'axios';
import { createDebugger } from '@colanode/core';

import { AccountService } from './account-service';

import { BackoffCalculator } from '../../lib/backoff-calculator';

const debug = createDebugger('desktop:service:account');

export class AccountClient {
  private readonly backoff: BackoffCalculator = new BackoffCalculator();
  private readonly axiosInstance: AxiosInstance;
  private readonly account: AccountService;

  constructor(account: AccountService) {
    this.account = account;
    this.axiosInstance = axios.create({
      baseURL: this.account.server.apiBaseUrl,
    });
  }

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    config: AxiosRequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    if (!this.backoff.canRetry()) {
      throw new Error(`Backoff in progress for account: ${this.account.id}`);
    }

    try {
      debug(`Requesting ${method} ${path} for account ${this.account.id}`);

      const headers = {
        ...config.headers,
        Authorization: `Bearer ${this.account.token}`,
      };

      const response = await this.axiosInstance.request<T>({
        method,
        url: path,
        ...config,
        headers,
      });

      this.backoff.reset();
      return response;
    } catch (error) {
      debug(`Error in request for account ${this.account.id}: ${error}`);
      if (isAxiosError(error) && this.shouldBackoff(error)) {
        this.backoff.increaseError();
      }
      throw error;
    }
  }

  public async get<T>(
    path: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('get', path, config);
  }

  public async post<T>(
    path: string,
    data: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('post', path, { ...config, data });
  }

  public async put<T>(
    path: string,
    data: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('put', path, { ...config, data });
  }

  public async delete<T>(
    path: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('delete', path, config);
  }

  private shouldBackoff(error: AxiosError): boolean {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    const status = error.response?.status ?? 0;
    if (status === 429) {
      return true;
    }

    return status >= 500 && status < 600;
  }
}
