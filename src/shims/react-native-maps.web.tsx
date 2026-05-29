import { forwardRef } from 'react';
import { View } from 'react-native';

export const PROVIDER_GOOGLE = 'google';

const MapView = forwardRef<View, any>(({ children, style, ...props }, ref) => (
  <View ref={ref} style={style} {...props}>
    {children}
  </View>
));

MapView.displayName = 'MapView';

export function Marker() {
  return null;
}

export function Circle() {
  return null;
}

export default MapView;
