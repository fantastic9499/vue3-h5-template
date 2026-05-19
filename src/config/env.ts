export const ENV = import.meta.env.VITE_APP_ENV;
export const IS_DEV = ENV === 'develop';
export const IS_TEST = ENV === 'testing';
export const IS_PROD = ENV === 'product';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
