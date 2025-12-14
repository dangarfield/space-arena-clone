import { Route } from '@solidjs/router';
import HangarHub from './components/HangarHub';
import ShipSelect from './components/ShipSelect';
import FittingSceneCanvas from './components/FittingSceneCanvas';
import GameWrapper from './components/GameWrapper';

export default function App() {
  return (
    <>
      <Route path="/" component={HangarHub} />
      <Route path="/ship-select/:hangarIndex" component={ShipSelect} />
      <Route path="/fitting/:hangarIndex" component={FittingSceneCanvas} />
      <Route path="/battle" component={GameWrapper} />
    </>
  );
}
