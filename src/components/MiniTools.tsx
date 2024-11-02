import React from 'react';
import './minitools.css';

const MiniTools = () => {
  return (
    <div className="GridContainer">
      <div className="GridItem">
        <p>
          Minitool 1 zobrazuje dve sady jednorozmerných (univariate) dát po max
          10 až 12 bodov každá, ako „line graph“.
        </p>
        <button>Minitool1</button>
      </div>
      <div className="GridItem">
        <p>
          Minitool 2 zobrazuje dve sady jednorozmerných (univariate) dát po max
          250 až 300 bodov každá, ako „dot plot“.
        </p>
        <button>Minitool2</button>
      </div>
      <div className="GridItem">
        <p>
          Minitool 3 zobrazuje sady dvojrozmerných (bivariate) dát,
          preklikávateľné cez pull-down menu, pričom ostanú zapnuté rovnaké
          nástroje.
        </p>
        <button>Minitool3</button>
      </div>
    </div>
  );
};

export default MiniTools;
