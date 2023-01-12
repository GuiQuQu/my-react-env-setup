import * as React from 'react';
// import Comp1 from "@/components/Comp1";

import style from "./app.module.less";

const App: React.FC = () => {
    // throw new Error("人为异常");
    return (
        <div className={style.app}>
            <div>App - Hello World</div>

        </div>
    );
};

export default App;