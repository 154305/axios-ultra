//一定要加，不然不知道扩展哪个库
import AxiosUltra from 'axios-ultra'
import {message} from 'antd'

declare module 'axios-ultra' {
    /**
     * 扩展接口响应参数
     */
    export interface AxiosUltraAPIResponse {
        code: number;
        data: any;
        message: string
    }

    /**
     * 扩展错误消息提示传参
     */
    export interface AxiosUltraErrorMessageOption {

    }

    /**
     * 扩展成功消息提示传参
     */
    export interface AxiosUltraSuccessMessageOption {

    }
}