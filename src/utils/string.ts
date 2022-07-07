
export function asTimeString(num?: number, showMs?: boolean) {
    if (showMs === undefined) {
        showMs = true;
    }
    if (!num) return showMs ? "00:00:00" : "00:00";
    let h = Math.floor(num / 3600)
    let m = as00String(Math.floor((num % 3600) / 60))
    let s = as00String(Math.floor(num % 60))
    let ms = ":" + as00String(Math.floor((num % 1) * 100))
    if (h) {
        return `${as00String(h)}:${m}:${s}` + (showMs ? ms : "")
    } else {
        return `${m}:${s}` + (showMs ? ms : "")
    }
}

export function as00String(num: number) {
    let ret = num.toString()
    if (ret.length == 1) return "0" + ret
    return ret
}
