/** 用户信息 */
export interface IUser {
  id: string;
  name: string;
  code: string;
  avatar?: string;
  email?: string;
}

/** 登录参数 */
export interface ILoginParams {
  username: string;
  password: string;
}

/** 登录结果 */
export interface ILoginResult {
  token: string;
  userName: string;
  userCode: string;
}

/** 通用 API 响应结构 */
export interface IApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface IMobileUser {
  id: string;
  name: string;
  userNo: string;
  token: string;
  loginName: string;
  departmentId: string;
  departmentName: string;
  userRole: number;
  accessSource: number;
  post: string;
  edifactCompanyName: string;
  changeUser: boolean;
  nameWithDepartment: string;
}
