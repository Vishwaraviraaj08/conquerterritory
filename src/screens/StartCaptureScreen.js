import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Switch,
    StatusBar,
    ActivityIndicator,
    TextInput,
    Alert,
    Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api';
import CustomAlert from '../components/CustomAlert';

import { useAuth } from '../context/AuthContext';

export default function StartCaptureScreen({ navigation, route }) {
    const { isPublic: initialPublic = true } = route.params || {};
    const { user } = useAuth();

    // UI State
    const [gameMode, setGameMode] = useState('solo'); // 'solo', 'team', 'coop'
    const [teamAction, setTeamAction] = useState('create'); // 'create' or 'join'
    const [sessionPublic, setSessionPublic] = useState(initialPublic);

    // Data State


    // Team/Lobby State
    const [enteredCode, setEnteredCode] = useState('');
    const [activeSession, setActiveSession] = useState(null); // The lobby session object
    const [lobbyLoading, setLobbyLoading] = useState(false);

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    // GPS State
    const [currentLocation, setCurrentLocation] = useState(null);
    const [gpsAccuracy, setGpsAccuracy] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(true);

    const pollInterval = useRef(null);

    // Initial Fetch (Friends & GPS)
    useEffect(() => {


        // Get GPS
        (async () => {
            try {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                setGpsAccuracy(loc.coords.accuracy);
                setCurrentLocation(loc.coords);
            } catch (e) {
                setGpsAccuracy(null);
            } finally {
                setGpsLoading(false);
            }
        })();

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, []);

    // Polling active session details
    useEffect(() => {
        if (activeSession) {
            pollInterval.current = setInterval(fetchSessionDetails, 3000); // Poll every 3s
        } else {
            if (pollInterval.current) clearInterval(pollInterval.current);
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [activeSession?._id]); // Re-run if session ID changes (or null)

    const fetchSessionDetails = async () => {
        if (!activeSession) return;
        try {
            const res = await api.get(`/capture-sessions/${activeSession._id}`);
            const session = res.data.session;
            setActiveSession(session);

            if (session.status === 'active') {
                // Navigate to LiveTracking
                navigation.replace('LiveTracking', {
                    sessionId: session._id,
                    gameMode: 'team',
                    isPublic: sessionPublic,
                    teamId: session.code
                });
            }
        } catch (e) {
            console.log('Polling error:', e);
        }
    };

    // Intercept Back Button
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!activeSession) {
                return;
            }

            e.preventDefault();

            setAlertConfig({
                type: 'warning',
                title: 'Leave Session?',
                message: 'You are currently in a lobby. Leaving will remove you from the team.',
                buttons: [
                    { text: 'Cancel', style: 'cancel', onPress: () => setAlertVisible(false) },
                    {
                        text: 'Leave',
                        style: 'destructive',
                        onPress: () => {
                            handleLeaveSession().then(() => {
                                navigation.dispatch(e.data.action);
                            });
                        }
                    }
                ]
            });
            setAlertVisible(true);
        });

        return unsubscribe;
    }, [navigation, activeSession]);

    const handleLeaveSession = async (shouldGoBack = false) => {
        if (!activeSession) return;
        try {
            await api.post(`/capture-sessions/${activeSession._id}/leave`);
            setActiveSession(null);
            setTeamAction('create');
            if (shouldGoBack && navigation.canGoBack()) {
                navigation.goBack();
            }
        } catch (e) {
            console.log('Leave error:', e);
            setActiveSession(null);
            if (shouldGoBack && navigation.canGoBack()) {
                navigation.goBack();
            }
        }
    };

    // Handlers
    const handleCreateSession = async () => {
        if (!currentLocation) return Alert.alert('GPS Error', 'Wait for GPS signal.');
        setLobbyLoading(true);
        try {
            const res = await api.post('/capture-sessions/create', {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                gameMode: gameMode // Send selected mode ('solo', 'team', 'coop')
            });
            setActiveSession(res.data.session);
            setTeamAction('create'); // Ensure UI stays on create/lobby view
        } catch (e) {
            console.error(e);
            Alert.alert('Error', e.response?.data?.error || e.message || 'Failed to create session');
        } finally {
            setLobbyLoading(false);
        }
    };



    const handleJoinSession = async () => {
        if (!currentLocation) return Alert.alert('GPS Error', 'Wait for GPS signal.');
        if (enteredCode.length !== 6) return Alert.alert('Invalid Code', 'Enter a 6-character code.');

        setLobbyLoading(true);
        try {
            const res = await api.post('/capture-sessions/join', {
                code: enteredCode.toUpperCase(),
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude
            });
            setActiveSession(res.data.session);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.error || 'Failed to join session');
        } finally {
            setLobbyLoading(false);
        }
    };

    const handleStartSession = async () => {
        if (!activeSession) return;

        // Custom "Coming Soon" for Team Mode (not Co-op)
        // Adjust logic if "Team" means the Red/Blue team mode specifically
        if (gameMode === 'team') {
            setAlertConfig({
                type: 'info',
                title: 'Coming Soon',
                message: 'Team capture is coming soon, try solo mode for now...',
                buttons: [{ text: 'OK', onPress: () => setAlertVisible(false) }]
            });
            setAlertVisible(true);
            return;
        }

        try {
            await api.post(`/capture-sessions/${activeSession._id}/start`);
            // Navigation handled by polling or immediate response
        } catch (e) {
            Alert.alert('Error', e.response?.data?.error || 'Failed to start session');
        }
    };

    const handleCancelSession = async () => {
        // For admin, cancelling is same as leaving (removes them, effectively rendering session leaderless or deleted if backend handled it)
        setAlertConfig({
            type: 'warning',
            title: 'Cancel Team?',
            message: 'This will disband the team lobby. Are you sure?',
            buttons: [
                { text: 'No', style: 'cancel', onPress: () => setAlertVisible(false) },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => handleLeaveSession(true)
                }
            ]
        });
        setAlertVisible(true);
    };





    const getSignalQuality = () => {
        if (gpsLoading) return { label: 'Checking...', color: '#888', icon: 'cellular-outline' };
        if (!gpsAccuracy) return { label: 'No Signal', color: '#ff4444', icon: 'warning-outline' };
        if (gpsAccuracy < 10) return { label: 'Excellent', color: '#2dd06e', icon: 'cellular' };
        if (gpsAccuracy < 20) return { label: 'Good', color: '#5B63D3', icon: 'cellular' };
        if (gpsAccuracy < 50) return { label: 'Fair', color: '#E8A838', icon: 'cellular' };
        return { label: 'Poor', color: '#ff4444', icon: 'cellular' };
    };

    const signal = getSignalQuality();
    const canStartSolo = !gpsLoading && gpsAccuracy && gpsAccuracy < 50 && gameMode === 'solo';


    // derived state
    const isAdmin = activeSession?.adminId === user?._id;
    // If I created it, I am admin.

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Start Capture</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* GPS Signal */}
                <LinearGradient
                    colors={['rgba(17, 21, 40, 1)', 'rgba(17, 21, 40, 0.8)']}
                    style={styles.signalCard}
                >
                    <View style={styles.signalRow}>
                        {gpsLoading ? (
                            <ActivityIndicator size="small" color="#5B63D3" />
                        ) : (
                            <View style={[styles.signalIconCtx, { backgroundColor: signal.color + '20' }]}>
                                <Ionicons name={signal.icon} size={20} color={signal.color} />
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.signalLabel}>GPS STATUS</Text>
                            <Text style={[styles.signalValue, { color: signal.color }]}>{signal.label}</Text>
                        </View>
                        {gpsAccuracy && (
                            <View style={styles.accuracyBadge}>
                                <Text style={styles.accuracyText}>±{gpsAccuracy.toFixed(0)}m</Text>
                            </View>
                        )}
                    </View>
                </LinearGradient>

                {/* Game Mode Row */}
                <Text style={styles.sectionTitle}>SELECT MODE</Text>
                {/* Mode Tabs - Hide when in a session to prevent accidental exit */}
                {!activeSession && (
                    <View style={styles.modeRow}>
                        {[
                            { id: 'solo', label: 'SOLO', icon: 'account' },
                            { id: 'team', label: 'TEAM', icon: 'account-group' },
                        ].map((m) => {
                            const isActive = gameMode === m.id;
                            return (
                                <TouchableOpacity
                                    key={m.id}
                                    onPress={() => { setGameMode(m.id); setActiveSession(null); }}
                                    activeOpacity={0.9}
                                    style={{ flex: 1 }}
                                >
                                    <LinearGradient
                                        colors={isActive ? ['#5B63D3', '#7C83ED'] : ['#1a1f33', '#111528']}
                                        style={[styles.modeCard, isActive && styles.modeCardActive]}
                                    >
                                        <MaterialCommunityIcons name={m.icon} size={24} color={isActive ? '#fff' : '#888'} />
                                        <Text style={[styles.modeLabel, isActive && { color: '#fff' }]}>{m.label}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* MODE SPECIFIC UI */}

                {/* SOLO MODE */}
                {gameMode === 'solo' && (
                    <View style={styles.modeContent}>
                        <Text style={styles.infoText}>Capture territory by completing a closed loop. Larger loops earn more points.</Text>
                        <TouchableOpacity
                            disabled={!canStartSolo}
                            onPress={() => navigation.replace('LiveTracking', { gameMode: 'solo', isPublic: sessionPublic })}
                            activeOpacity={0.8}
                            style={{ marginTop: 20 }}
                        >
                            <LinearGradient
                                colors={canStartSolo ? ['#5B63D3', '#7C83ED'] : ['#333', '#444']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.startBtn}
                            >
                                <Text style={styles.startBtnText}>{canStartSolo ? 'START SOLO SESSION' : 'WAITING FOR GPS...'}</Text>
                                <Ionicons name="arrow-forward" size={24} color={canStartSolo ? "#fff" : "#888"} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}



                {/* TEAM MODE */}
                {(gameMode === 'team') && (
                    <View style={styles.modeContent}>
                        {/* 2 Columns: Create vs Join (Only for Team Mode initial state) */}
                        {!activeSession && gameMode === 'team' && (
                            <View style={styles.teamColumns}>
                                {/* Create Column */}
                                <TouchableOpacity
                                    style={[styles.teamCol, teamAction === 'create' && styles.teamColActive]}
                                    onPress={() => { setTeamAction('create'); setEnteredCode(''); }}
                                    activeOpacity={0.9}
                                >
                                    <Text style={styles.colTitle}>CREATE TEAM</Text>
                                    <MaterialCommunityIcons name="plus-circle-outline" size={32} color={teamAction === 'create' ? "#5B63D3" : "#666"} />
                                    <Text style={styles.colDesc}>Generate a code and invite others</Text>
                                </TouchableOpacity>

                                {/* Join Column */}
                                <TouchableOpacity
                                    style={[styles.teamCol, teamAction === 'join' && styles.teamColActive]}
                                    onPress={() => { setTeamAction('join'); }}
                                    activeOpacity={0.9}
                                >
                                    <Text style={styles.colTitle}>JOIN TEAM</Text>
                                    <MaterialCommunityIcons name="login-variant" size={32} color={teamAction === 'join' ? "#5B63D3" : "#666"} />
                                    <Text style={styles.colDesc}>Enter code to join an existing team</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Action Area (Team Only) */}
                        {!activeSession && gameMode === 'team' && teamAction === 'create' && (
                            <View style={styles.actionArea}>
                                <TouchableOpacity onPress={handleCreateSession} style={styles.actionBtnFull}>
                                    {lobbyLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>GENERATE LOBBY</Text>}
                                </TouchableOpacity>
                            </View>
                        )}

                        {!activeSession && gameMode === 'team' && teamAction === 'join' && (
                            <View style={styles.actionArea}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="ENTER 6-CHAR CODE"
                                    placeholderTextColor="#666"
                                    maxLength={6}
                                    autoCapitalize="characters"
                                    value={enteredCode}
                                    onChangeText={setEnteredCode}
                                />
                                <TouchableOpacity onPress={handleJoinSession} style={styles.actionBtnFull}>
                                    {lobbyLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>CONNECT</Text>}
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* LOBBY UI (Shared for Team) */}
                        {activeSession && (
                            <View style={styles.lobbyContainer}>
                                <Text style={styles.lobbyTitle}>LOBBY CODE</Text>
                                <View style={styles.codeDisplay}>
                                    <Text style={styles.codeText}>{activeSession.code}</Text>
                                </View>

                                <Text style={styles.lobbySubtitle}>PARTICIPANTS ({activeSession.participants.length + (activeSession.invitedUsers?.length || 0)})</Text>
                                <View style={styles.participantList}>
                                    {activeSession.participants.map((p, idx) => (
                                        <View key={'p-' + idx} style={styles.participantRow}>
                                            <Image source={{ uri: p.profileImage || 'https://via.placeholder.com/40' }} style={styles.pAvatar} />
                                            <Text style={styles.pName}>{p.username} {p.userId === activeSession.adminId && '(Host)'}</Text>
                                            <Ionicons name="checkmark-circle" size={16} color="#2dd06e" />
                                        </View>
                                    ))}
                                    {/* Show Invited Users */}
                                    {activeSession.invitedUsers?.map((u, idx) => {
                                        // Check if they are already in participants to avoid duplicates?
                                        // But invitedUsers are removed/handled? No, I just added them to schema.
                                        // If they join, they are added to participants.
                                        // Filter out if user is in participants.
                                        const isJoined = activeSession.participants.some(p => p.userId === u._id);
                                        if (isJoined) return null;

                                        return (
                                            <View key={'inv-' + idx} style={[styles.participantRow, { opacity: 0.6 }]}>
                                                <Image source={{ uri: u.profileImage || 'https://via.placeholder.com/40' }} style={styles.pAvatar} />
                                                <Text style={styles.pName}>{u.username} (Invited)</Text>
                                                <ActivityIndicator size="small" color="#888" />
                                            </View>
                                        );
                                    })}
                                </View>

                                {isAdmin ? (
                                    <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
                                        {/* Start Button */}
                                        <TouchableOpacity
                                            onPress={handleStartSession}
                                            style={[styles.actionBtnFull, { backgroundColor: '#2dd06e' }]}
                                        >
                                            <Text style={styles.actionBtnText}>START CAPTURE (ALL)</Text>
                                        </TouchableOpacity>

                                        {/* Cancel Button */}
                                        <TouchableOpacity
                                            onPress={handleCancelSession}
                                            style={[styles.actionBtnFull, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ff4444' }]}
                                        >
                                            <Text style={[styles.actionBtnText, { color: '#ff4444' }]}>CANCEL TEAM</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={{ width: '100%', alignItems: 'center', gap: 15 }}>
                                        <View style={styles.waitingBadge}>
                                            <ActivityIndicator size="small" color="#5B63D3" />
                                            <Text style={styles.waitingText}>Waiting for host to start...</Text>
                                        </View>

                                        {/* Leave Button for Members */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setAlertConfig({
                                                    type: 'warning',
                                                    title: 'Leave Team?',
                                                    message: 'Are you sure you want to leave this session?',
                                                    buttons: [
                                                        { text: 'Cancel', style: 'cancel', onPress: () => setAlertVisible(false) },
                                                        { text: 'Leave', style: 'destructive', onPress: handleLeaveSession }
                                                    ]
                                                });
                                                setAlertVisible(true);
                                            }}
                                            style={[styles.actionBtnFull, { backgroundColor: 'rgba(255,68,68,0.1)', borderWidth: 1, borderColor: '#ff4444' }]}
                                        >
                                            <Text style={[styles.actionBtnText, { color: '#ff4444' }]}>LEAVE TEAM</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* Session Settings (Public) */}
                <View style={[styles.divider, { marginVertical: 30 }]} />
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Public Session</Text>
                    <Switch
                        value={sessionPublic}
                        onValueChange={setSessionPublic}
                        trackColor={{ false: '#3a3d50', true: '#5B63D3' }}
                        thumbColor="#fff"
                    />
                </View>

            </ScrollView>

            <CustomAlert
                visible={alertVisible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={() => setAlertVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050811' },
    scrollContent: { padding: 24, paddingBottom: 100 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1f33',
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333'
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    signalCard: {
        borderRadius: 20, padding: 16, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    signalRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    signalIconCtx: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    signalValue: { fontSize: 16, fontWeight: '700', color: '#fff' },
    signalLabel: { fontSize: 10, color: '#6b7280', fontWeight: '700' },
    accuracyBadge: {
        paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#1a1f33', borderRadius: 8, borderWidth: 1, borderColor: '#333'
    },
    accuracyText: { fontSize: 12, color: '#888', fontWeight: '600' },

    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 16, letterSpacing: 1.5 },
    modeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    modeCard: {
        borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 8, height: 90,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
    },
    modeCardActive: { borderColor: '#5B63D3' },
    modeLabel: { fontSize: 12, fontWeight: '700', color: '#888' },

    modeContent: { marginTop: 10 },
    infoText: { color: '#ccc', fontSize: 14, textAlign: 'center', marginBottom: 20 },
    startBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: 16, borderRadius: 12, shadowColor: "#5B63D3", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    },
    startBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },

    friendListContainer: { backgroundColor: '#1a1f33', borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
    friendItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    friendInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    friendAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#5B63D3', justifyContent: 'center', alignItems: 'center' },
    friendInitial: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    friendName: { color: '#fff', fontWeight: '600' },

    teamColumns: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    teamCol: {
        flex: 1, backgroundColor: '#111528', borderRadius: 14, padding: 20, alignItems: 'center', gap: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    teamColActive: { borderColor: '#5B63D3', backgroundColor: 'rgba(91,99,211,0.08)' },
    colTitle: { fontSize: 12, fontWeight: '800', color: '#fff' },
    colDesc: { fontSize: 10, color: '#666', textAlign: 'center' },

    actionArea: { backgroundColor: '#111528', padding: 20, borderRadius: 16, alignItems: 'center', gap: 14 },
    input: {
        width: '100%', backgroundColor: '#0a0e1a', color: '#fff', padding: 14, borderRadius: 10,
        textAlign: 'center', fontSize: 18, fontWeight: 'bold', letterSpacing: 2, borderWidth: 1, borderColor: '#333'
    },
    actionBtnFull: {
        width: '100%', backgroundColor: '#5B63D3', padding: 16, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center'
    },
    actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

    lobbyContainer: { backgroundColor: '#111528', padding: 20, borderRadius: 16, alignItems: 'center' },
    lobbyTitle: { color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    codeDisplay: {
        backgroundColor: '#0a0e1a', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 10,
        marginVertical: 10, borderWidth: 1, borderColor: '#5B63D3'
    },
    codeText: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 4 },
    lobbySubtitle: { color: '#666', fontSize: 12, marginTop: 20, marginBottom: 10, alignSelf: 'flex-start' },
    participantList: { width: '100%', gap: 8 },
    participantRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, backgroundColor: '#1a1f33', borderRadius: 8 },
    pAvatar: { width: 24, height: 24, borderRadius: 12 },
    pName: { color: '#fff', fontSize: 14, flex: 1 },
    waitingBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, padding: 10, backgroundColor: 'rgba(91,99,211,0.1)', borderRadius: 10 },
    waitingText: { color: '#5B63D3', fontWeight: '600' },

    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    settingLabel: { color: '#fff', fontWeight: '600' }
});
