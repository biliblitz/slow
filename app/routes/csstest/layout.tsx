import { layout$ } from "blitz";
import { Something } from "./component.tsx";

import "./b.css";

export default layout$((props) => {
  return (
    <div>
      <Something />
      {props.children}
    </div>
  );
});
