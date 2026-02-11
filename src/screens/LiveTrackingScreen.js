import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Alert,
    Animated,
    Easing,
    ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as turf from '@turf/turf';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const TOMTOM_API_KEY = 'AoGGy9rY3zDH74BIUOIvpreylbkzKSAA';

const getTrackingMapHtml = () => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel='stylesheet' type='text/css' href='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css'>
    <script src="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"></script>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e8ecf1; }
        #map { width: 100%; height: 100%; }
        .mapboxgl-ctrl-logo { display: none !important; }
        .tt-logo { display: none !important; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        window.onerror = function(msg, src, line, col, err) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ERROR', message: 'JS: ' + msg + ' (line ' + line + ')'
                }));
            }
        };

        var map, userMarker, mapReady = false;

        function initMap() {
            try {
                if (!window.tt) {
                    setTimeout(initMap, 500);
                    return;
                }
                tt.setProductInfo('GeoConquest', '1.0.0');
                map = tt.map({
                    key: '${TOMTOM_API_KEY}',
                    container: 'map',
                    style: 'https://api.tomtom.com/map/1/style/20.0.0-8/basic_main.json',
                    center: [0, 0],
                    zoom: 16,
                    pitch: 0,
                    bearing: 0,
                    dragRotate: true,
                    touchPitch: true
                });

                map.on('load', function() {
                    map.addSource('route', {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    });
                    map.addSource('territory', {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] }
                    });

                    map.addLayer({
                        id: 'territory-fill', type: 'fill', source: 'territory',
                        paint: { 'fill-color': 'rgba(91, 99, 211, 0.15)' }
                    });
                    map.addLayer({
                        id: 'territory-border', type: 'line', source: 'territory',
                        paint: { 'line-color': '#5B63D3', 'line-width': 2, 'line-dasharray': [3, 2] }
                    });

                    map.addLayer({
                        id: 'route-glow', type: 'line', source: 'route',
                        layout: { 'line-cap': 'round', 'line-join': 'round' },
                        paint: { 'line-color': 'rgba(229, 57, 53, 0.15)', 'line-width': 18 }
                    });
                    map.addLayer({
                        id: 'route-shadow', type: 'line', source: 'route',
                        layout: { 'line-cap': 'round', 'line-join': 'round' },
                        paint: { 'line-color': 'rgba(229, 57, 53, 0.3)', 'line-width': 10 }
                    });
                    map.addLayer({
                        id: 'route-line', type: 'line', source: 'route',
                        layout: { 'line-cap': 'round', 'line-join': 'round' },
                        paint: { 'line-color': '#E53935', 'line-width': 5 }
                    });

                    var el = document.createElement('div');
                    el.style.width = '32px';
                    el.style.height = '32px';
                    el.style.borderRadius = '50%';
                    el.style.border = '3px solid #5B63D3';
                    el.style.boxShadow = '0 0 16px rgba(91,99,211,0.6)';
                    el.style.background = 'radial-gradient(circle, #7C83ED, #5B63D3)';
                    el.innerHTML = '<div style="width:10px;height:10px;background:#2dd06e;border-radius:50%;position:absolute;bottom:-2px;right:-2px;border:2px solid #fff;"></div>';
                    el.style.position = 'relative';
                    userMarker = new tt.Marker({ element: el }).setLngLat([0, 0]).addTo(map);

                    mapReady = true;
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
                });
            } catch (e) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.toString() }));
            }
        }

        function updateLocation(lat, lng) {
            if (!map || !mapReady) return;
            userMarker.setLngLat([lng, lat]);
            map.easeTo({ center: [lng, lat], zoom: 17, duration: 600 });
        }

        function updatePath(coords) {
            if (!map || !mapReady || !map.getSource('route')) return;
            var geoJson = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: coords }
                }]
            };
            map.getSource('route').setData(geoJson);

            if (coords.length >= 3) {
                var closedCoords = coords.concat([coords[0]]);
                var territoryGeoJson = {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: { type: 'Polygon', coordinates: [closedCoords] }
                    }]
                };
                map.getSource('territory').setData(territoryGeoJson);
            }
        }

        function centerOnUser(lat, lng) {
            if (!map) return;
            map.flyTo({ center: [lng, lat], zoom: 17, duration: 1000 });
        }

        document.addEventListener('message', function(e) { handleMsg(e.data); });
        window.addEventListener('message', function(e) { handleMsg(e.data); });

        function handleMsg(str) {
            try {
                var d = JSON.parse(str);
                if (d.type === 'UPDATE_LOCATION') updateLocation(d.lat, d.lng);
                else if (d.type === 'UPDATE_PATH') updatePath(d.coords);
                else if (d.type === 'CENTER') centerOnUser(d.lat, d.lng);
            } catch(e) {}
        }

        initMap();
    </script>
</body>
</html>
`;

export default function LiveTrackingScreen({ navigation, route }) {
    const [mapReady, setMapReady] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [distance, setDistance] = useState(0);
    const [headingDeg, setHeadingDeg] = useState(0);
    const [headingLabel, setHeadingLabel] = useState('N');
    const [maxSpeedVal, setMaxSpeedVal] = useState(0);
    const [initialLocation, setInitialLocation] = useState(null);

    const compassAnim = useRef(new Animated.Value(0)).current;
    const webViewRef = useRef(null);
    const pathRef = useRef([]);
    const subscription = useRef(null);
    const timerRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    const mapReadyRef = useRef(false);
    const maxSpeedRef = useRef(0);
    const distanceRef = useRef(0);

    const getHeadingLabel = (deg) => {
        if (deg === null || deg === undefined || deg < 0) return 'N';
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return dirs[Math.round(deg / 45) % 8];
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const getPace = () => {
        const d = distanceRef.current;
        if (d <= 0 || elapsedTime <= 0) return '--:--';
        const paceMinPerKm = (elapsedTime / 60) / (d / 1000);
        if (!isFinite(paceMinPerKm) || paceMinPerKm > 99) return '--:--';
        const min = Math.floor(paceMinPerKm);
        const sec = Math.floor((paceMinPerKm - min) * 60).toString().padStart(2, '0');
        return `${min}:${sec}`;
    };

    const animateCompass = (toDeg) => {
        Animated.timing(compassAnim, {
            toValue: toDeg,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    };

    useEffect(() => {
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);

        getInitialLocation();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (subscription.current) {
                subscription.current.remove();
                subscription.current = null;
            }
        };
    }, []);

    const getInitialLocation = async () => {
        try {
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });
            setInitialLocation(loc.coords);
        } catch (e) { }
    };

    useEffect(() => {
        if (mapReady && initialLocation) {
            sendToMap('UPDATE_LOCATION', {
                lat: initialLocation.latitude,
                lng: initialLocation.longitude,
            });
            startTracking();
        }
    }, [mapReady, initialLocation]);

    const sendToMap = (type, data) => {
        if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({ type, ...data }));
        }
    };

    const startTracking = async () => {
        subscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 800,
                distanceInterval: 2,
            },
            (newLoc) => {
                const { latitude, longitude, speed: spd, accuracy, heading: hdg } = newLoc.coords;

                const currentSpeed = (spd !== null && spd !== undefined && spd >= 0) ? spd * 3.6 : 0;
                setSpeed(currentSpeed);

                if (currentSpeed > maxSpeedRef.current) {
                    maxSpeedRef.current = currentSpeed;
                    setMaxSpeedVal(currentSpeed);
                }

                if (hdg !== null && hdg !== undefined && hdg >= 0) {
                    setHeadingDeg(hdg);
                    setHeadingLabel(getHeadingLabel(hdg));
                    animateCompass(hdg);
                }

                sendToMap('UPDATE_LOCATION', { lat: latitude, lng: longitude });

                let shouldAdd = true;
                if (accuracy && accuracy > 30) shouldAdd = false;

                if (shouldAdd && pathRef.current.length > 0) {
                    const last = pathRef.current[pathRef.current.length - 1];
                    const from = turf.point([last[0], last[1]]);
                    const to = turf.point([longitude, latitude]);
                    const dist = turf.distance(from, to, { units: 'meters' });
                    if (dist < 3) shouldAdd = false;
                }

                if (shouldAdd) {
                    pathRef.current.push([longitude, latitude]);

                    if (pathRef.current.length > 1) {
                        const line = turf.lineString(pathRef.current);
                        const totalDist = turf.length(line, { units: 'meters' });
                        distanceRef.current = totalDist;
                        setDistance(totalDist);
                    }

                    sendToMap('UPDATE_PATH', { coords: pathRef.current });
                }
            }
        );
    };

    const handleFinish = () => {
        if (subscription.current) {
            subscription.current.remove();
            subscription.current = null;
        }
        if (timerRef.current) clearInterval(timerRef.current);

        const cp = pathRef.current;
        let area = 0;
        if (cp.length >= 3) {
            const closedCoords = [...cp, cp[0]];
            try {
                const poly = turf.polygon([closedCoords]);
                area = turf.area(poly);
            } catch (e) { }
        }

        const d = distanceRef.current;
        navigation.replace('CaptureResults', {
            area: area.toFixed(1),
            distance: d.toFixed(0),
            time: elapsedTime,
            avgSpeed: d > 0 && elapsedTime > 0 ? ((d / 1000) / (elapsedTime / 3600)).toFixed(1) : '0',
            maxSpeed: maxSpeedRef.current.toFixed(1),
            pace: getPace(),
            points: Math.floor(area * 0.068 + d * 0.1),
        });
    };

    const handleCancel = () => {
        Alert.alert('Cancel Capture', 'Are you sure you want to cancel?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes', style: 'destructive', onPress: () => {
                    if (subscription.current) { subscription.current.remove(); subscription.current = null; }
                    if (timerRef.current) clearInterval(timerRef.current);
                    navigation.goBack();
                }
            }
        ]);
    };

    const compassRotation = compassAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Stats row 1 */}
            <View style={styles.statsTop}>
                <View style={[styles.statCard, { backgroundColor: 'rgba(91,99,211,0.12)' }]}>
                    <Text style={styles.statSmallLabel}>Speed</Text>
                    <View style={styles.statMainRow}>
                        <MaterialCommunityIcons name="speedometer" size={16} color="#5B63D3" />
                        <Text style={styles.statBigValue}>{speed.toFixed(1)}</Text>
                        <Text style={styles.statUnit}>km/h</Text>
                    </View>
                </View>

                {/* Animated Compass */}
                <Animated.View style={[styles.compassCircle, { transform: [{ rotate: compassRotation }] }]}>
                    <MaterialCommunityIcons name="navigation" size={20} color="#5B63D3" />
                </Animated.View>

                <View style={[styles.statCard, { backgroundColor: 'rgba(91,99,211,0.12)' }]}>
                    <Text style={styles.statSmallLabel}>Time</Text>
                    <View style={styles.statMainRow}>
                        <Ionicons name="time-outline" size={16} color="#5B63D3" />
                        <Text style={styles.statBigValue}>{formatTime(elapsedTime)}</Text>
                    </View>
                </View>
            </View>

            {/* Compass direction label */}
            <View style={styles.compassLabelWrap}>
                <Text style={styles.compassLabelText}>{headingLabel}</Text>
            </View>

            {/* Stats row 2 */}
            <View style={styles.statsSecond}>
                <View style={[styles.statCard, { backgroundColor: 'rgba(91,99,211,0.12)' }]}>
                    <Text style={styles.statSmallLabel}>Pace</Text>
                    <View style={styles.statMainRow}>
                        <MaterialCommunityIcons name="shoe-print" size={16} color="#5B63D3" />
                        <Text style={styles.statBigValue}>{getPace()}</Text>
                        <Text style={styles.statUnit}>/km</Text>
                    </View>
                </View>

                <View style={[styles.statCard, { backgroundColor: 'rgba(91,99,211,0.12)' }]}>
                    <Text style={styles.statSmallLabel}>Distance</Text>
                    <View style={styles.statMainRow}>
                        <Ionicons name="location-outline" size={16} color="#5B63D3" />
                        <Text style={styles.statBigValue}>
                            {distance >= 1000
                                ? (distance / 1000).toFixed(2)
                                : Math.round(distance)}
                        </Text>
                        <Text style={styles.statUnit}>{distance >= 1000 ? 'km' : 'm'}</Text>
                    </View>
                </View>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
                <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    source={{ html: getTrackingMapHtml() }}
                    style={styles.map}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    androidLayerType="hardware"
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.mapLoading}>
                            <ActivityIndicator size="large" color="#5B63D3" />
                            <Text style={styles.mapLoadingText}>Loading Map...</Text>
                        </View>
                    )}
                    onMessage={(event) => {
                        try {
                            const data = JSON.parse(event.nativeEvent.data);
                            if (data.type === 'MAP_READY') {
                                mapReadyRef.current = true;
                                setMapReady(true);
                            }
                        } catch (e) { }
                    }}
                />
            </View>

            {/* Bottom warning */}
            <View style={styles.warningContainer}>
                <Ionicons name="warning-outline" size={18} color="#E8A838" />
                <Text style={styles.warningText}>You are vulnerable—capture not closed!</Text>
            </View>

            {/* Bottom buttons */}
            <View style={styles.bottomActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
                    <Ionicons name="close-circle-outline" size={20} color="#E53935" />
                    <Text style={styles.cancelBtnText}>Cancel/Abort</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.85}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#5B63D3" />
                    <Text style={styles.finishBtnText}>Finish/Close Loop</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#e8ecf1' },
    statsTop: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 12, paddingTop: 50, gap: 8,
    },
    statsSecond: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 12, paddingTop: 8, gap: 8,
    },
    statCard: {
        flex: 1, borderRadius: 14, padding: 10,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.15)',
        backgroundColor: '#fff',
    },
    statSmallLabel: { color: '#666', fontSize: 11, fontWeight: '500', marginBottom: 2 },
    statMainRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    statBigValue: { fontSize: 22, fontWeight: '800', color: '#1a1e2e' },
    statUnit: { fontSize: 12, fontWeight: '500', color: '#777' },
    compassCircle: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: '#1a1e2e', justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#5B63D3',
    },
    compassLabelWrap: { alignItems: 'center', marginTop: 2 },
    compassLabelText: { fontSize: 11, fontWeight: '700', color: '#5B63D3' },
    mapContainer: { flex: 1, marginTop: 8, borderRadius: 0, overflow: 'hidden' },
    map: { flex: 1 },
    mapLoading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#e8ecf1',
    },
    mapLoadingText: { marginTop: 8, fontSize: 13, color: '#888', fontWeight: '500' },
    warningContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, gap: 8, backgroundColor: '#fff',
    },
    warningText: { color: '#555', fontSize: 13, fontWeight: '500' },
    bottomActions: {
        flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 34,
        paddingTop: 12, gap: 12, backgroundColor: '#fff',
    },
    cancelBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, borderWidth: 1.5, borderColor: '#E53935', borderRadius: 14,
        paddingVertical: 14, backgroundColor: 'rgba(229,57,53,0.05)',
    },
    cancelBtnText: { color: '#E53935', fontSize: 14, fontWeight: '700' },
    finishBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, borderWidth: 1.5, borderColor: '#5B63D3', borderRadius: 14,
        paddingVertical: 14, backgroundColor: 'rgba(91,99,211,0.05)',
    },
    finishBtnText: { color: '#5B63D3', fontSize: 14, fontWeight: '700' },
});
