import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSubtitleAsync, translateAsync } from './utils/api';
import * as AssCompiler from "ass-compiler";
import { Button, Layout, List, Slider, Tag } from 'antd';
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
                chinese: d.Text?.parsed.find(it => it.tags.some(t => t.fn == "华文楷体"))?.text,
                english: d.Text?.parsed.find(it => it.tags.some(t => t.fn == "Cronos Pro Subhead"))?.text,
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



    return (
        <div>
            <div ref={listRef} style={{ overflow: "auto" }}>
                <List dataSource={dialogues} renderItem={(item, index) => (
                    <SubtitleItem focusing={item == currentDialogue} dialogue={item} onClick={() => {
                        const newTime = item.start + 0.01
                        setCurrentTime(newTime)
                        setSliderValue(newTime)
                    }} onWordsSelect={(words) => {
                        translateAsync(words.join(" "))
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
