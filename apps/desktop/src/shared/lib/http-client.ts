import { serverService } from '@/main/services/server-service';
import { BackoffCalculator } from '@/shared/lib/backoff-calculator';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface HttpClientRequestConfig extends AxiosRequestConfig {
  domain: string;
  token?: string | null;
}

class HttpClient {
  private readonly backoffs: Map<string, BackoffCalculator> = new Map();

  constructor() {}

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    config: HttpClientRequestConfig
  ): Promise<AxiosResponse<T>> {
    if (this.backoffs.has(config.domain)) {
      const backoff = this.backoffs.get(config.domain);
      if (!backoff?.canRetry()) {
        throw new Error(`Backoff in progress for key: ${config.domain}`);
      }
    }

    try {
      const axiosInstance = this.buildAxiosInstance(config);
      const response = await axiosInstance.request<T>({
        method,
        url: path,
        ...config,
      });

      // Reset backoff if successful
      if (this.backoffs.has(config.domain)) {
        this.backoffs.get(config.domain)?.reset();
      }

      return response;
    } catch (error: any) {
      // If error is related to server availability, increase backoff
      if (this.isServerError(error)) {
        if (!this.backoffs.has(config.domain)) {
          this.backoffs.set(config.domain, new BackoffCalculator());
        }

        const backoff = this.backoffs.get(config.domain);
        backoff?.increaseError();
      }

      throw error;
    }
  }

  private isServerError(error: any): boolean {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    const status = error.response?.status;
    return (status >= 500 && status < 600) || status === 429;
  }

  private buildAxiosInstance(config: HttpClientRequestConfig): AxiosInstance {
    const baseURL = serverService.buildApiBaseUrl(config.domain);
    const instance = axios.create({ baseURL });

    if (config.token) {
      instance.defaults.headers.common['Authorization'] =
        `Bearer ${config.token}`;
    }

    return instance;
  }

  public async get<T>(
    path: string,
    config: HttpClientRequestConfig
  ): Promise<AxiosResponse<T, any>> {
    return this.request<T>('get', path, config);
  }

  public async post<T>(
    path: string,
    data: any,
    config: HttpClientRequestConfig
  ): Promise<AxiosResponse<T, any>> {
    return this.request<T>('post', path, {
      ...config,
      data,
    });
  }

  public async put<T>(
    path: string,
    data: any,
    config: HttpClientRequestConfig
  ): Promise<AxiosResponse<T, any>> {
    return this.request<T>('put', path, {
      ...config,
      data,
    });
  }

  public async delete<T>(
    path: string,
    config: HttpClientRequestConfig
  ): Promise<AxiosResponse<T, any>> {
    return this.request<T>('delete', path, config);
  }
}

export const httpClient = new HttpClient();
