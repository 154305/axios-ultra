import React, {useEffect} from 'react'
import './index.css';
import httpRequest from "/@/utils/request";

export default () => {
    useEffect(() => {
        run();
        // window.onunload = () => localStorage.clear()
    }, [])

    const run = async () => {
        console.log(
            httpRequest.get('/api1', {}, {needHeaderToken: false, message: true, loading: true}),
            // httpRequest.get('/api3'),
            // await httpRequest.get('/api1'),
            // await httpRequest.get('/api2'),
            await httpRequest.get('/api3'),
        )
    }


    return (
        <div className='home-page'>
            <h1>Index Page</h1>
        </div>
    )
}
