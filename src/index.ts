import axios from 'axios'
import adapter from './adapter';

//不是普通web项目才添加adapter
if (!(window && window.document)) {
    axios.defaults.adapter = adapter
}
export default axios;
