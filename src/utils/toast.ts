/*
 * @Author: TuXunJia
 * @Date: 2026-05-20 16:21:13
 * @LastEditors: TuXunJia
 * @LastEditTime: 2026-05-20 16:21:14
 */
import { closeToast, showLoadingToast } from 'vant';

export const showLoading = () => {
  showLoadingToast({
    duration: 0,
    message: '加载中...',
    forbidClick: true,
    loadingType: 'spinner',
  });
};

export const hideLoading = () => {
  closeToast();
};
