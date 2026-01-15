export type AccountVerifyOtpAttributes = {
  accountId: string;
  attempts: number;
};

export type AccountPasswordResetOtpAttributes = {
  accountId: string;
  attempts: number;
};

export type Otp<T> = {
  id: string;
  expiresAt: string;
  otp: string;
  attributes: T;
};
