import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSubtitleAsync, translateAsync, TranslateResult } from './utils/api';
import * as AssCompiler from "ass-compiler";
import { Button, Card, Descriptions, Layout, List, Slider, Tag } from 'antd';
import { SliderMarks } from 'antd/lib/slider';
import { asTimeString } from './utils/string';
import Item from 'antd/lib/list/Item';
import tokenize from "@stdlib/nlp-tokenize"
import { useDebounce, useDebouncedCallback } from './utils/hooks';


type DialogueItem = {
    start: number,
    end: number,
    chinese?: string,
    english?: string,
}

export const Subtitle: React.FunctionComponent<{ season: number, eposide: number }> = (props) => {

    const { season, eposide } = props;

    const [loading, setLoading] = useState(true);
    const [ass, setAss] = useState<AssCompiler.ParsedASS | undefined>(undefined);


    useEffect(() => {
        setLoading(true)
        getSubtitleAsync(season, eposide).then(ass => {
            setAss(AssCompiler.parse(ass))
            setLoading(false)
        })

    }, [season, eposide])

    const videoDuration = useMemo(() => {
        console.log(ass)
        if (!ass) return 0

        let maxEnd = 0
        for (let d of ass.events.dialogue) {
            if (d.End > maxEnd) {
                maxEnd = d.End
            }
        }
        return maxEnd + 1

    }, [ass])

    const sliderMarks = useMemo<SliderMarks>(() => ({
        [Math.floor(videoDuration)]: asTimeString(videoDuration)
    }), [videoDuration])


    const [sliderValue, setSliderValue] = useState(0)

    const [currentTime, setCurrentTime] = useState(0)

    const decbounceSliderValue = useDebounce(sliderValue, 300)
    useEffect(() => {
        setCurrentTime(decbounceSliderValue)
    }, [decbounceSliderValue])


    useEffect(() => {
        if (currentTime > videoDuration) {
            setCurrentTime(videoDuration)
        }
    }, [videoDuration])


    const dialogues = useMemo<DialogueItem[]>(() => {
        if (!ass) return []

        let dialogues: DialogueItem[] = []
        for (let d of ass.events.dialogue) {
            let item = {
                start: d.Start,
                end: d.End,
                chinese: d.Text?.parsed[0]?.text?.replace("\\N", ""),
                english: d.Text?.parsed[1]?.text == "\\N" ? d.Text?.parsed[2]?.text : d.Text?.parsed[1]?.text,
            }
            if (item.chinese && item.english) {
                dialogues.push(item)
            }
        }

        return dialogues

    }, [ass])

    const currentDialogue = useMemo(() => {
        if (!ass) return undefined
        let maxI = 0;
        for (let i = 0; i < dialogues.length; i++) {
            if (dialogues[i].start <= currentTime) {
                maxI = i
            } else {
                break;
            }
        }
        return dialogues[maxI]
    }, [dialogues, currentTime])


    const listRef = useRef<HTMLDivElement>(null)
    const sliderRef = useRef<HTMLDivElement>(null)

    const resize = useCallback(() => {
        if (!listRef.current || !sliderRef.current) return
        listRef.current.style.height = (document.body.clientHeight - sliderRef.current.clientHeight - 36) + "px"
    }, [listRef.current, sliderRef.current?.clientHeight, document.body.clientHeight])

    useEffect(() => {
        resize()
        window.onresize = resize
    }, [resize])


    const [translation, setTranslation] = useState<TranslateResult | undefined>()
    const showTranslation = async (words: string) => {
        let trans: TranslateResult | undefined = undefined
        try {
            trans = await translateAsync(words)
        } catch (error) {

        }
        setTranslation(trans)
    }

    const translationCardStyle: React.CSSProperties = document.body.clientHeight > document.body.clientWidth ? {
        position: "absolute"
    } : {
        float: "right",
        maxWidth: "40%"
    }

    return (
        <div>
            {translation && <Card
                style={{ zIndex: 9999, background: "white", textAlign: "left", ...translationCardStyle }}
                title={<>{translation.query}{translation?.basic?.['us-phonetic'] && <Tag style={{ marginLeft: 8 }}>{translation.basic['us-phonetic']}</Tag>}</>}
                extra={<Button onClick={() => setTranslation(undefined)} type="text">关闭</Button>}
            >
                {translation.basic?.explains.map(it => <>{it}<br /></>)}
            </Card>}
            <div>
                <div ref={listRef} style={{ overflow: "auto" }}>
                    <List dataSource={dialogues} renderItem={(item, index) => (
                        <SubtitleItem focusing={item == currentDialogue} dialogue={item} onClick={() => {
                            const newTime = item.start + 0.01
                            setCurrentTime(newTime)
                            setSliderValue(newTime)
                        }} onWordsSelect={(words) => {
                            showTranslation(words.join(" "))
                        }}
                        />
                    )} />
                </div>
                <div ref={sliderRef} style={{ padding: "0 32px" }}>
                    <Slider step={0.01} marks={sliderMarks} tipFormatter={(val) => asTimeString(val)}
                        tooltipPlacement="bottom" tooltipVisible
                        max={videoDuration}
                        value={sliderValue} onChange={(val) => setSliderValue(val)} />
                </div>
            </div >
        </div>

    )
}

const SubtitleItem: React.FunctionComponent<{ focusing: boolean, dialogue: DialogueItem, onClick: () => void, onWordsSelect: (words: string[]) => void }> = (prop) => {

    const { dialogue, focusing } = prop

    const currentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (focusing) {
            currentRef.current?.scrollIntoView({ "block": "center", "inline": "center" })
        }
    }, [focusing])

    const words = useMemo(() => {
        return tokenize(dialogue.english || "").filter(it => it)
    }, [dialogue])

    const [wordChecked, setWordChecked] = useState<{ [key: number]: boolean }>({})
    useEffect(() => {
        if (!focusing) return
        const checkedIndex = Object.entries(wordChecked).filter(it => it[1]).map(it => Number.parseInt(it[0]))
        prop.onWordsSelect(checkedIndex.map(it => words[it]))
        console.log("words checked!")
    }, [focusing, wordChecked])

    return (
        <div ref={currentRef} style={{ background: focusing ? "#f0f2f5" : "inherit", padding: "1em" }} onClick={prop.onClick}>
            <div style={{ position: "absolute", margin: "0 16px", color: "rgba(0,0,0,0.3)" }}>
                {asTimeString(dialogue.start, false)} - {asTimeString(dialogue.end, false)}
            </div>
            <span style={{ fontSize: "1.5em" }}>
                {dialogue.chinese}
            </span>
            <br />
            {words.map((it, index) => (
                <Tag.CheckableTag
                    checked={focusing ? wordChecked[index] : false}
                    onChange={checked => setWordChecked({ ...wordChecked, [index]: checked })}
                    style={{ marginTop: "0.2em", fontSize: "2em", padding: "0.3em" }}
                >
                    {it}
                </Tag.CheckableTag>
            ))}
        </div>
    )
}
