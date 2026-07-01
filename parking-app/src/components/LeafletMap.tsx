import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import RNWebView, { WebViewMessageEvent, WebViewProps } from 'react-native-webview';
import { ParkingSpot } from '../types';
import { getEffectiveStatus } from '../utils/spotStatus';
import { buildLeafletHtml } from './leafletHtml';

// react-native-webview's default export types its props generic as
// `WebViewProps & P` with `P = undefined`, which some TypeScript versions
// collapse to `never` for JSX attribute checking. Re-typing the component
// as a plain class component sidesteps that without affecting runtime.
const WebView = RNWebView as unknown as React.ComponentClass<WebViewProps>;

export interface LeafletMapHandle {
  centerOn: (lat: number, lng: number, zoom?: number) => void;
}

interface LeafletMapProps {
  initialCenter: { lat: number; lng: number };
  spots: ParkingSpot[];
  userLocation: { lat: number; lng: number } | null;
  onSpotTap: (spotId: string) => void;
}

export const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>(
  ({ initialCenter, spots, userLocation, onSpotTap }, ref) => {
    const webViewRef = useRef<RNWebView>(null);
    const isReady = useRef(false);
    const html = useMemo(() => buildLeafletHtml(initialCenter.lat, initialCenter.lng), [initialCenter.lat, initialCenter.lng]);

    useImperativeHandle(ref, () => ({
      centerOn: (lat, lng, zoom) => {
        webViewRef.current?.injectJavaScript(`window.centerOn(${lat}, ${lng}, ${zoom ?? 17}); true;`);
      },
    }));

    function pushSpots() {
      const payload = spots.map((spot) => ({
        id: spot.id,
        lat: spot.lat,
        lng: spot.lng,
        status: getEffectiveStatus(spot),
      }));
      webViewRef.current?.injectJavaScript(`window.setSpots(${JSON.stringify(payload)}); true;`);
    }

    function pushUserLocation() {
      if (!userLocation) return;
      webViewRef.current?.injectJavaScript(
        `window.setUserLocation(${userLocation.lat}, ${userLocation.lng}); true;`
      );
    }

    function handleMessage(event: WebViewMessageEvent) {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'ready') {
          isReady.current = true;
          pushSpots();
          pushUserLocation();
        } else if (data.type === 'spotTap') {
          onSpotTap(data.id);
        }
      } catch {
        // ignora messaggi non JSON
      }
    }

    // Ad ogni variazione di spots/userLocation, se la mappa è già pronta
    // reinviamo lo stato aggiornato (la WebView vive fuori dal ciclo di
    // render di React, quindi la sincronizzazione avviene via injectJavaScript).
    React.useEffect(() => {
      if (isReady.current) pushSpots();
    }, [spots]);

    React.useEffect(() => {
      if (isReady.current) pushUserLocation();
    }, [userLocation]);

    return (
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
      />
    );
  }
);

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});
