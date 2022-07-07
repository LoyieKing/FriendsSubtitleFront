import axios from "axios";
import * as crypto from "crypto-js";
import { as00String } from "./string";


export async function getSubtitleAsync(season: number, eposide: number): Promise<string> {
    const ass = await (await axios.get(`subtitles/S${as00String(season)}E${as00String(eposide)}.ass`, {
        "responseType": "text"
    })).data
    return ass
}


export type TranslateResult = {
    errorCode: string,
    query: string,
    translation: string[],
    basic: {
        "phonetic": string,
        "uk-phonetic": string, //英式音标
        "us-phonetic": string, //美式音标
        "uk-speech": string,//英式发音
        "us-speech": string,//美式发音
        "explains": string[]
    },
    web: {
        key: string,
        value: string[]
    }[],
    l: string,
    dict: { url: string },
    webdict: { url: string },

}

export async function translateAsync(text: string) {

    const secret = "7Lf0448VYgQa34z4K5J4TVX0vP8UEIYR"
    const appKey = "00f96704d6ac41df"

    const uuid = (new Date).getTime().toString()
    const curtime = Math.round(new Date().getTime() / 1000);

    const sign = sha256(appKey + truncate(text) + uuid + curtime + secret)

    let result = await axios.post<TranslateResult>("https://openapi.youdao.com/api", {
        q: text,
        from: "en",
        to: "zh-CHS",
        appKey: "00f96704d6ac41df",
        salt: uuid,
        signType: "v3",
        sign,
        curtime
    })
    console.log(result.data)
    return result.data
}

function truncate(q: string) {
    var len = q.length;
    if (len <= 20) return q;
    return q.substring(0, 10) + len + q.substring(len - 10, len);
}

function sha256(str: string) {
    return crypto.SHA256(str).toString(crypto.enc.Hex);
}