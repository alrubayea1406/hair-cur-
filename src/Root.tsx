import React from 'react';
import {Composition} from 'remotion';
import {ChannelAvatar, ChannelBanner} from './compositions/ChannelArt';
import {CharacterSheet} from './compositions/CharacterSheet';
import {Long} from './compositions/Long';
import {ShortClip} from './compositions/ShortClip';
import {Thumbnail} from './compositions/Thumbnail';
import {calculateLongMetadata, calculateShortMetadata, loadEpisode, type EpisodeProps} from './lib/episode';
import {ensureFonts} from './lib/fonts';

ensureFonts();

const DEFAULT_EPISODE: EpisodeProps = {episodeId: '001-mansa-musa'};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Long" component={Long} durationInFrames={300} fps={30} width={1920} height={1080} defaultProps={DEFAULT_EPISODE} calculateMetadata={calculateLongMetadata} />
      <Composition
        id="ShortClip"
        component={ShortClip}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{...DEFAULT_EPISODE, short: 0}}
        calculateMetadata={calculateShortMetadata}
      />
      <Composition
        id="ThumbnailWide"
        component={Thumbnail}
        durationInFrames={60}
        fps={30}
        width={1280}
        height={720}
        defaultProps={DEFAULT_EPISODE}
        calculateMetadata={async ({props}) => ({durationInFrames: 60, props: {...props, episode: await loadEpisode(props)}})}
      />
      <Composition
        id="ThumbnailVertical"
        component={Thumbnail}
        durationInFrames={60}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={DEFAULT_EPISODE}
        calculateMetadata={async ({props}) => ({durationInFrames: 60, props: {...props, episode: await loadEpisode(props)}})}
      />
      <Composition id="CharacterSheet" component={CharacterSheet} durationInFrames={300} fps={30} width={1920} height={1080} />
      <Composition id="ChannelAvatar" component={ChannelAvatar} durationInFrames={60} fps={30} width={800} height={800} />
      <Composition id="ChannelBanner" component={ChannelBanner} durationInFrames={60} fps={30} width={2560} height={1440} />
    </>
  );
};
