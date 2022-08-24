import axios, {AxiosInstance, AxiosRequestConfig} from "axios";



/**
 * by zlm(执着)
 */
//消息提示
export type Message =
    | boolean
    | {
    error?: boolean | string;
    success?: boolean | string;
};
// loading
export type Loading = LoadingInstance | string | boolean;

export interface RequestInterceptor {
    // 请求拦截
    requestInterceptor?: (config: RequestConfigOption) => RequestConfigOption;
    requestInterceptorCatch?: (err: any) => any;
    // 响应拦截
    responseInterceptor?: (response: any) => any;
    responseInterceptorCatch?: (err: any) => any;
}

//请求参数
export interface RequestConfigOption extends AxiosRequestConfig, Record<string, any> {
    //是否loading
    loading?: Loading;
    //是否消息提示
    message?: Message;
    //外部传入是否请求成功
    isSuccess?: (resp: any) => Boolean;
    //是否获取api响应的数据
    getApiResponse?: boolean;
    //是否含有完整的http响应（一般用于获取头部信息的请求）
    getResponse?: boolean;
    //成功情况下获取data
    getSuccessData?: (resp: any) => any;
    //拦截器
    interceptor?: RequestInterceptor;
}

// //处理提示参数
const processMessageOptions = (message: Message) => {
    if (typeof message == "boolean") {
        return {error: message, success: message};
    } else if (typeof message == "object") {
        return message;
    }
    return {error: false, success: false};
};

// //处理loading参数
const processLoadingOptions = (loading: Loading) => {
    if (typeof loading == "boolean" && loading) {
        return {lock: true, text: "加载中"};
    } else if (typeof loading == "string") {
        return {lock: true, text: loading};
    } else if (typeof loading == "object") {
        return loading;
    }
    return false;
};

//默认options
const defaultOptions = {
    //接口回调是否成功
    isSuccess(resp) {
        return resp.code == 200 || resp.success;
    },
    //获取成功情况下的data
    getSuccessData(resp) {
        return resp.data;
    },
    //不直接获取api响应的数据，而是获取成功后里面的data
    getApiResponse: true,
};

class HttpRequest<R> {
    //axios实例
    axiosInstance: AxiosInstance;
    //全局配置项
    private readonly options: RequestConfigOption;

    constructor(configOption: RequestConfigOption = {}) {
        const options = Object.assign({}, defaultOptions, configOption);
        //实例化axios实例
        this.axiosInstance = axios.create(options);
        //全局option
        this.options = options;
        //添加配置拦截器
        this.addInterceptor(options.interceptor || {});
    }

    //配置拦截器
    addInterceptor(interceptor: RequestInterceptor) {
        // 使用实例拦截器
        this.axiosInstance.interceptors.request.use(interceptor.requestInterceptor, interceptor.requestInterceptorCatch);
        this.axiosInstance.interceptors.response.use(interceptor.responseInterceptor, interceptor.responseInterceptorCatch);
    }

    //基础请求
    request = async <A>(options?: RequestConfigOption): Promise<A> => {
        options = {...defaultOptions, ...this.options, ...(options || {})};
        //解析loading参数
        const loadingOptions = processLoadingOptions(options.loading as Loading);
        loadingOptions && (options.$loading = ElLoading.service(loadingOptions as any));
        //解析message参数
        const messageOptions = processMessageOptions(options.message as Message);

        //获取提示消息
        const getMessageStr = (value, defaultStr) => (typeof value == "boolean" ? defaultStr : value);

        return this.axiosInstance
            .request(options)
            .then((response: any = {}) => {
                if (response instanceof Error) throw response;
                //获取全部响应
                if (options?.getResponse) {
                    return Promise.resolve(response);
                }
                const res = response.data;
                const {message} = res || {};
                //判断响应类型，响应类型是json才处理
                if ((options?.responseType || "json").toLocaleLowerCase() === "json") {
                    //在默认不直接获取data的情况下，会直接成功
                    if (options?.getApiResponse) {
                        messageOptions.success && ElMessage.success(getMessageStr(messageOptions.success, message || "操作成功"));
                        return Promise.resolve(res);
                    } else if (options?.getSuccessData && options?.isSuccess) {
                        if (options?.isSuccess(res)) {
                            messageOptions.success && ElMessage.success(getMessageStr(messageOptions.success, message || "操作成功"));
                            return Promise.resolve(options?.getSuccessData(res));
                        } else {
                            return Promise.reject(res);
                        }
                    }
                }
                return Promise.resolve(res);
            })
            .catch((response) => {
                const {message, msg, error_description} = response?.response?.data || response?.data || response || {};
                messageOptions.error &&
                ElMessage.error(getMessageStr(messageOptions.error, msg || error_description || message || "操作失败"));
                return Promise.reject(response);
            })
            .finally(() => {
                options?.$loading?.close();
            });
    };

    get<Data = R>(url: string, params?: any, options?: RequestConfigOption) {
        return this.request<Data>({
            method: "get",
            url,
            params,
            ...options,
        });
    }

    post<Data = R>(url: string, params?: any, data?: any, options?: RequestConfigOption) {
        return this.request<Data>({
            method: "post",
            url,
            params,
            data,
            ...options,
        });
    }

    put<Data = R>(url: string, params?: any, data?: any, options?: RequestConfigOption) {
        return this.request<Data>({
            method: "put",
            url,
            params,
            data,
            ...options,
        });
    }

    delete<Data = R>(url: string, params?: any, options?: RequestConfigOption) {
        return this.request<Data>({
            method: "delete",
            url,
            params,
            ...options,
        });
    }
}

export default HttpRequest;
