import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            {find: "/@", replacement: path.resolve(__dirname, "src")},
        ],
    },
    css: {},
    server: {
        proxy: {
            '/api/': {
                target: 'http://localhost:8888/',
                changeOrigin: true,
                rewrite(path) {
                    return path.replace(/\/api\//, '/')
                }
            }
        }
    }
})
