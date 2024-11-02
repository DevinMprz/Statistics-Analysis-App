import React from 'react';
import './App.css';
import MiniTools from './components/MiniTools';

let a: String | number = 5;

type Person = {
  age: number;
  name: string;
};

const App: React.FC = () => {
  return (
    <div className="App"><span className="heading">Data Analysis</span>
      <MiniTools />
    </div>
  );
};

export default App;
