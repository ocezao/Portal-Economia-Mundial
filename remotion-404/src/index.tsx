import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import { GlobeAnimation } from './GlobeAnimation';

registerRoot(() => {
  return (
    <>
      <Composition
        id="GlobeAnimation"
        component={GlobeAnimation}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
});
