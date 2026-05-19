/** 用户信息 */
interface IUser {
  id: string;
  name: string;
  code: string;
  avatar?: string;
  email?: string;
}

/** 登录参数 */
interface ILoginParams {
  username: string;
  password: string;
}

/** 登录结果 */
interface ILoginResult {
  token: string;
  userName: string;
  userCode: string;
}

/** 通用 API 响应结构 */
interface IApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}
