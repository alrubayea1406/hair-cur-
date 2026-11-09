import React from 'react';
import {Composition} from 'remotion';
import {ChannelAvatar, ChannelBanner} from './compositions/ChannelArt';
import {CharacterSheet} from './compositions/CharacterSheet';
import {Short} from './compositions/Short';
import {Thumbnail} from './compositions/Thumbnail';
import {calculateEpisodeMetadata, type EpisodeProps} from './lib/episode';
import {ensureFonts} from './lib/fonts';

ensureFonts();

const DEFAULT_EPISODE: EpisodeProps = {episodeId: '001-onion-tears'};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="CharacterSheet" component={CharacterSheet} durationInFrames={300} fps={30} width={1920} height={1080} />
      <Composition id="ChannelAvatar" component={ChannelAvatar} durationInFrames={60} fps={30} width={800} height={800} />
      <Composition id="ChannelBanner" component={ChannelBanner} durationInFrames={60} fps={30} width={2560} height={1440} />
      <Composition
        id="Short"
        component={Short}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={DEFAULT_EPISODE}
        calculateMetadata={calculateEpisodeMetadata}
      />
      <Composition
        id="ThumbnailShort"
        component={Thumbnail}
        durationInFrames={60}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={DEFAULT_EPISODE}
        calculateMetadata={async (opts) => ({...(await calculateEpisodeMetadata(opts)), durationInFrames: 60})}
      />
      <Composition
        id="ThumbnailWide"
        component={Thumbnail}
        durationInFrames={60}
        fps={30}
        width={1280}
        height={720}
        defaultProps={DEFAULT_EPISODE}
        calculateMetadata={async (opts) => ({...(await calculateEpisodeMetadata(opts)), durationInFrames: 60})}
      />
    </>
  );
};
