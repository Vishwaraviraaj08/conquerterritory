import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as turf from '@turf/turf';
import api from '../api';

const TrackingContext = createContext(null);

export function TrackingProvider({ children }) {
    const [isTracking, setIsTracking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [distance, setDistance] = useState(0);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [avgSpeed, setAvgSpeed] = useState(0);
    const [maxSpeed, setMaxSpeed] = useState(0);
    const [area, setArea] = useState(0);
    const [path, setPath] = useState([]);
    const [sessionData, setSessionData] = useState(null); // gameMode, teamId, etc.
    const [startLocation, setStartLocation] = useState(null);

    const watchRef = useRef(null);
    const timerRef = useRef(null);
    const updateIntervalRef = useRef(null); // For backend updates
    const speedsRef = useRef([]);
    const lastLocRef = useRef(null);

    useEffect(() => {
        if (isTracking && !isPaused) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isTracking, isPaused]);

    // Backend Update Loop
    useEffect(() => {
        if (isTracking && !isPaused && sessionData?.isPublic) {
            updateIntervalRef.current = setInterval(async () => {
                if (lastLocRef.current) {
                    try {
                        await api.post('/tracking/update', {
                            coordinates: lastLocRef.current,
                            path: path.length > 50 ? path.slice(-50) : path, // Optimize payload
                            isActive: true,
                            gameMode: sessionData.gameMode,
                            teamId: sessionData.teamId,
                        });
                    } catch (e) { console.warn('Tracking update failed', e.message); }
                }
            }, 5000); // 5 seconds
        } else {
            if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
        }
        return () => { if (updateIntervalRef.current) clearInterval(updateIntervalRef.current); };
    }, [isTracking, isPaused, sessionData, path]);

    const startSession = async (data) => {
        // Reset state
        setElapsedTime(0);
        setDistance(0);
        setCurrentSpeed(0);
        setAvgSpeed(0);
        setMaxSpeed(0);
        setArea(0);
        setPath([]);
        setSessionData(data);
        setIsPaused(false);
        setIsTracking(true);
        speedsRef.current = [];
        lastLocRef.current = null;
        setStartLocation(null);

        // Start location watching
        watchRef.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 2 },
            (loc) => {
                if (isPaused) return;

                const { latitude, longitude, speed, heading } = loc.coords;
                const coord = [longitude, latitude];
                const spd = Math.max(0, (speed || 0) * 3.6); // km/h

                if (!startLocation) {
                    setStartLocation({ type: 'Point', coordinates: coord });
                }

                setCurrentSpeed(spd);
                if (spd > maxSpeed) setMaxSpeed(spd);
                speedsRef.current.push(spd);
                setAvgSpeed(speedsRef.current.length > 0 ? speedsRef.current.reduce((a, b) => a + b, 0) / speedsRef.current.length : 0);

                if (lastLocRef.current) {
                    const d = turf.distance(turf.point(lastLocRef.current), turf.point(coord), { units: 'meters' });
                    if (d > 1 && d < 100) setDistance(prev => prev + d);
                }

                lastLocRef.current = coord;
                setPath(prev => {
                    const newPath = [...prev, coord];

                    // Calculate area if possible
                    if (newPath.length >= 3) {
                        try {
                            const closed = [...newPath, newPath[0]];
                            const polygon = turf.polygon([closed]);
                            setArea(turf.area(polygon));
                        } catch (e) { }
                    }
                    return newPath;
                });
            }
        );
    };

    const pauseSession = () => setIsPaused(true);
    const resumeSession = () => setIsPaused(false);

    const stopSession = async () => {
        setIsTracking(false);
        setIsPaused(false);
        if (watchRef.current) {
            watchRef.current.remove();
            watchRef.current = null;
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);

        // Notify backend of stop
        try { await api.post('/tracking/stop'); } catch (e) { }

        return {
            elapsedTime,
            distance,
            avgSpeed,
            maxSpeed,
            area,
            path,
            startLocation,
            sessionData
        };
    };

    const cancelSession = async () => {
        setIsTracking(false);
        setIsPaused(false);
        if (watchRef.current) {
            watchRef.current.remove();
            watchRef.current = null;
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);

        // Notify backend of stop
        try { await api.post('/tracking/stop'); } catch (e) { }

        // Reset all state
        setElapsedTime(0);
        setDistance(0);
        setArea(0);
        setPath([]);
    };

    return (
        <TrackingContext.Provider value={{
            isTracking,
            isPaused,
            elapsedTime,
            distance,
            currentSpeed,
            avgSpeed,
            maxSpeed,
            area,
            path,
            sessionData,
            startSession,
            pauseSession,
            resumeSession,
            stopSession,
            cancelSession
        }}>
            {children}
        </TrackingContext.Provider>
    );
}

export function useTracking() {
    const context = useContext(TrackingContext);
    if (!context) throw new Error('useTracking must be used within TrackingProvider');
    return context;
}

export default TrackingContext;
