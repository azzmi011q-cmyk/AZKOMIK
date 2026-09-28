import React from 'react';
import { Image } from 'react-native';

export default function ExpoImage({ contentFit = 'cover', cachePolicy, transition, style, ...props }) {
  const resizeMode = contentFit === 'contain' ? 'contain' : contentFit === 'fill' ? 'stretch' : 'cover';
  return <Image {...props} style={style} resizeMode={resizeMode} />;
}
