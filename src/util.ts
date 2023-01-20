/**
 * 判断是否是普通web环境
 */
export const isGeneralWeb = () => !!(globalThis.window && globalThis.window.document)