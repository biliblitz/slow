import { hydrate } from "slow";
import Root from "./root.tsx";

// Using hydrate from 'slow' is required.
// This applies some fixes for preact client render.
hydrate(<Root />);
