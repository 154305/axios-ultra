export interface AxiosInterceptorObject {
    // 请求拦截
    requestInterceptor?: (config: any) => any;
    requestInterceptorCatch?: (err: any) => any;
    // 响应拦截
    responseInterceptor?: (response: any) => any;
    responseInterceptorCatch?: (err: any) => any;
}