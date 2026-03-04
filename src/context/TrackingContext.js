import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as turf from '@turf/turf';
import api from '../api';

const TrackingContext = createContext(null);
const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

// Shared state for background task to communicate with foreground
let backgroundUpdateCallback = null;
let currentPath = [];
let currentDistance = 0;
let currentLastLoc = null;

// Define the background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
    if (error) {
        console.error('Task error:', error);
        return;
    }
    if (data) {
        const { locations } = data;
        let newDist = 0;
        let coordsToAdd = [];

        locations.forEach(loc => {
            const { latitude, longitude } = loc.coords;
            const coord = [longitude, latitude];
            if (currentLastLoc) {
                const d = turf.distance(turf.point(currentLastLoc), turf.point(coord), { units: 'meters' });
                if (d > 1 && d < 100) newDist += d;
            }
            currentLastLoc = coord;
            coordsToAdd.push(coord);
        });

        currentDistance += newDist;
        currentPath = [...currentPath, ...coordsToAdd];

        if (backgroundUpdateCallback) {
            backgroundUpdateCallback({
                distanceDiff: newDist,
                newCoords: coordsToAdd,
                lastCoord: currentLastLoc,
                latestRawCoords: locations[locations.length - 1].coords
            });
        }
    }
});

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

    const timerRef = useRef(null);
    const updateIntervalRef = useRef(null); // For backend updates
    const speedsRef = useRef([]);
    const lastLocRef = useRef(null);

    // Sync background updates to React state
    useEffect(() => {
        backgroundUpdateCallback = (data) => {
            if (isPaused) return;

            const { distanceDiff, newCoords, lastCoord, latestRawCoords } = data;
            const spd = Math.max(0, (latestRawCoords.speed || 0) * 3.6);

            if (!startLocation && newCoords.length > 0) {
                setStartLocation({ type: 'Point', coordinates: newCoords[0] });
            }

            setCurrentSpeed(spd);
            setMaxSpeed(prev => Math.max(prev, spd));
            speedsRef.current.push(spd);
            setAvgSpeed(speedsRef.current.length > 0 ? speedsRef.current.reduce((a, b) => a + b, 0) / speedsRef.current.length : 0);

            if (distanceDiff > 0) setDistance(prev => prev + distanceDiff);

            lastLocRef.current = lastCoord;

            setPath(prev => {
                const newPath = [...prev, ...newCoords];
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
        };

        return () => {
            backgroundUpdateCallback = null;
        };
    }, [isPaused, startLocation]);

    useEffect(() => {
        if (isTracking && !isPaused) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
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
        const { status } = await Location.requestBackgroundPermissionsAsync();
        if (status !== 'granted') {
            console.warn('Background location permission denied');
        }

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

        currentPath = [];
        currentDistance = 0;
        currentLastLoc = null;

        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 2,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
                notificationTitle: 'Geo Conquest Tracking',
                notificationBody: 'Your movement is being tracked for continuous territory capture',
                notificationColor: '#5B63D3',
            }
        });
    };

    const pauseSession = () => setIsPaused(true);
    const resumeSession = () => setIsPaused(false);

    const stopSession = async () => {
        setIsTracking(false);
        setIsPaused(false);

        const hasTask = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
        if (hasTask) {
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
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

        const hasTask = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
        if (hasTask) {
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
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
