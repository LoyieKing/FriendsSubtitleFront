import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Button, Select } from 'antd';
import { Subtitle } from './Subtitle';

const seasonEpisodes: Record<string, number> = {
  "1": 24,
  "2": 24,
  "3": 25,
  "4": 24,
  "5": 24,
  "6": 25,
  "7": 24,
  "8": 24,
  "9": 23,
  "10": 17,
}

function App() {

  const params = new URLSearchParams(window.location.search)

  const season = params.get("season")
  const episode = params.get("episode")

  if (season && !(season in seasonEpisodes)) {
    window.location.search = ""
    return <></>
  }
  if (season && episode && Number.parseInt(episode) > seasonEpisodes[season]) {
    window.location.search = ""
    return <></>
  }

  return (
    <div className="App" >
      {(season && episode) ? <Subtitle season={Number.parseInt(season)} eposide={Number.parseInt(episode)} /> : (<>
        <div style={{ height: "100vh", transform: "translate(0, 50%)" }}>
          <Select placeholder="Select Season" value={season} onChange={val => window.location.search = `?season=${val}`}>
            {Object.keys(seasonEpisodes).map(season => <Select.Option key={"s" + season} value={season}>S{season}</Select.Option>)}
          </Select>
          <Select placeholder="Select Eposide" value={episode} onChange={val => window.location.search = `?season=${season}&episode=${val}`}>
            {season && Object.keys([...Array(seasonEpisodes[season])]).map(it => Number.parseInt(it) + 1).map(it => <Select.Option key={"e" + it} value={it}>E{it}</Select.Option>)}
          </Select>
        </div>
      </>)}
    </div>
  );
}

export default App;
