import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Button } from 'antd';
import { Subtitle } from './Subtitle';

function App() {
  return (
    <div className="App" >
      <Subtitle season={1} eposide={1} />
    </div>
  );
}

export default App;
