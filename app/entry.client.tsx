import { hydrate } from "blitz";
import Root from "./root.tsx";

// Using hydrate from 'blitz' is required.
// This applies some fixes for preact client render.
hydrate(<Root />);
