import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Switch,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function StartCaptureScreen({ navigation, route }) {
    const { isPublic: initialPublic = true } = route.params || {};

    const [gameMode, setGameMode] = useState('solo');
    const [sessionPublic, setSessionPublic] = useState(initialPublic);
    const [gpsAccuracy, setGpsAccuracy] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(true);

    // Team/Co-op State
    const [teamId, setTeamId] = useState('');
    const [friends, setFriends] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFriendList, setShowFriendList] = useState(false);

    // Generate a random Team ID on mount
    useEffect(() => {
        setTeamId(Math.random().toString(36).substring(2, 8).toUpperCase());
    }, []);

    // Fetch friends
    useEffect(() => {
        import('../api').then(({ default: api }) => {
            api.get('/friends').then(res => {
                setFriends(res.data.friends || []);
            }).catch(err => console.log('Error fetching friends:', err));
        });
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                setGpsAccuracy(loc.coords.accuracy);
            } catch (e) {
                setGpsAccuracy(null);
            } finally {
                setGpsLoading(false);
            }
        })();
    }, []);

    const getSignalQuality = () => {
        if (gpsLoading) return { label: 'Checking...', color: '#888', icon: 'cellular-outline' };
        if (!gpsAccuracy) return { label: 'No Signal', color: '#ff4444', icon: 'warning-outline' };
        if (gpsAccuracy < 10) return { label: 'Excellent', color: '#2dd06e', icon: 'cellular' };
        if (gpsAccuracy < 20) return { label: 'Good', color: '#5B63D3', icon: 'cellular' };
        if (gpsAccuracy < 50) return { label: 'Fair', color: '#E8A838', icon: 'cellular' };
        return { label: 'Poor', color: '#ff4444', icon: 'cellular' };
    };

    const signal = getSignalQuality();
    const canStart = !gpsLoading && gpsAccuracy && gpsAccuracy < 50;
    const isTeamMode = gameMode === 'team' || gameMode === 'coop';

    const toggleFriend = (friendId) => {
        if (selectedFriends.includes(friendId)) {
            setSelectedFriends(prev => prev.filter(id => id !== friendId));
        } else {
            setSelectedFriends(prev => [...prev, friendId]);
        }
    };

    const filteredFriends = friends.filter(f =>
        f.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Start Capture</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* GPS Signal */}
                <View style={styles.signalCard}>
                    <View style={styles.signalRow}>
                        {gpsLoading ? (
                            <ActivityIndicator size="small" color="#5B63D3" />
                        ) : (
                            <Ionicons name={signal.icon} size={22} color={signal.color} />
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.signalLabel}>GPS Signal</Text>
                            <Text style={[styles.signalValue, { color: signal.color }]}>{signal.label}</Text>
                        </View>
                        {gpsAccuracy && (
                            <Text style={styles.accuracyText}>±{gpsAccuracy.toFixed(0)}m</Text>
                        )}
                    </View>
                    {!canStart && !gpsLoading && (
                        <Text style={styles.gpsWarning}>Move to an open area to improve signal.</Text>
                    )}
                </View>

                {/* Game Mode */}
                <Text style={styles.sectionTitle}>Game Mode</Text>
                <View style={styles.modeRow}>
                    {[
                        { id: 'solo', label: 'Solo', icon: 'account-outline', desc: 'Capture alone' },
                        { id: 'team', label: 'Team', icon: 'account-group-outline', desc: 'With your team' },
                        { id: 'coop', label: 'Co-op', icon: 'handshake-outline', desc: 'Cooperate' },
                    ].map((mode) => (
                        <TouchableOpacity
                            key={mode.id}
                            style={[styles.modeCard, gameMode === mode.id && styles.modeCardActive]}
                            onPress={() => setGameMode(mode.id)}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons
                                name={mode.icon}
                                size={28}
                                color={gameMode === mode.id ? '#5B63D3' : '#888'}
                            />
                            <Text style={[styles.modeLabel, gameMode === mode.id && { color: '#fff' }]}>
                                {mode.label}
                            </Text>
                            <Text style={styles.modeDesc}>{mode.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Team Controls */}
                {isTeamMode && (
                    <View style={styles.teamSection}>
                        <Text style={styles.sectionTitle}>Team Setup</Text>

                        {/* Team ID Input/Display */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Team ID</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="pound" size={20} color="#888" />
                                <Text style={styles.teamIdText}>{teamId}</Text>
                            </View>
                            <Text style={styles.inputHint}>Share this ID with your friends</Text>
                        </View>

                        {/* Friend Search */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Invite Friends</Text>

                            {/* Selected Friends Chips */}
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                {friends.filter(f => selectedFriends.includes(f._id)).map(f => (
                                    <View key={f._id} style={styles.friendChip}>
                                        <Text style={styles.friendChipText}>{f.username}</Text>
                                        <TouchableOpacity onPress={() => toggleFriend(f._id)}>
                                            <Ionicons name="close-circle" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.searchBtn}
                                onPress={() => setShowFriendList(!showFriendList)}
                            >
                                <Ionicons name="search" size={20} color="#ccc" />
                                <Text style={styles.searchBtnText}>
                                    {showFriendList ? 'Close Friend List' : 'Search & Add Friends'}
                                </Text>
                            </TouchableOpacity>

                            {/* Collapsible Friend List */}
                            {showFriendList && (
                                <View style={styles.friendListCard}>
                                    {friends.length === 0 ? (
                                        <Text style={{ color: '#888', textAlign: 'center', padding: 10 }}>No friends found</Text>
                                    ) : (
                                        friends.map(friend => {
                                            const isSelected = selectedFriends.includes(friend._id);
                                            return (
                                                <TouchableOpacity
                                                    key={friend._id}
                                                    style={styles.friendItem}
                                                    onPress={() => toggleFriend(friend._id)}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#333', overflow: 'hidden' }}>
                                                            {/* Placeholder for avatar */}
                                                            <View style={{ flex: 1, backgroundColor: '#5B63D3', justifyContent: 'center', alignItems: 'center' }}>
                                                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{friend.username[0].toUpperCase()}</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={{ color: '#fff', fontWeight: '500' }}>{friend.username}</Text>
                                                    </View>
                                                    <Ionicons
                                                        name={isSelected ? "checkbox" : "square-outline"}
                                                        size={24}
                                                        color={isSelected ? "#5B63D3" : "#666"}
                                                    />
                                                </TouchableOpacity>
                                            );
                                        })
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}


                {/* Session Settings */}
                <Text style={styles.sectionTitle}>Session Settings</Text>
                <View style={styles.settingCard}>
                    <View style={styles.settingRow}>
                        <Ionicons name="eye-outline" size={20} color="#7C83ED" />
                        <Text style={styles.settingLabel}>Public Session</Text>
                        <Switch
                            value={sessionPublic}
                            onValueChange={setSessionPublic}
                            trackColor={{ false: '#3a3d50', true: '#5B63D3' }}
                            thumbColor="#fff"
                        />
                    </View>
                    <Text style={styles.settingHint}>
                        {sessionPublic ? 'Others can see your capture in real-time' : 'Your capture will be private'}
                    </Text>
                </View>

                {/* Tips */}
                <View style={styles.tipsCard}>
                    <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#E8A838" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.tipsTitle}>Capture Tips</Text>
                        <Text style={styles.tipsText}>
                            Walk or run in a loop to capture maximum area. The territory is formed by the polygon of your path.
                        </Text>
                    </View>
                </View>

                {/* Start Button */}
                <TouchableOpacity
                    style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
                    disabled={!canStart}
                    onPress={() => navigation.replace('LiveTracking', {
                        gameMode: gameMode,
                        isPublic: sessionPublic,
                        teamId: isTeamMode ? teamId : null,
                        partnerIds: isTeamMode ? selectedFriends : [],
                    })}
                    activeOpacity={0.85}
                >
                    <MaterialCommunityIcons name="play-circle" size={24} color="#fff" />
                    <Text style={styles.startBtnText}>
                        {canStart ? 'BEGIN CAPTURE' : 'WAIT FOR GPS...'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    scrollContent: { paddingTop: 50, paddingBottom: 50, paddingHorizontal: 20 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    signalCard: {
        backgroundColor: '#111528', borderRadius: 16, padding: 16, marginBottom: 24,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.12)',
    },
    signalRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    signalLabel: { fontSize: 12, color: '#888daf', fontWeight: '500' },
    signalValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
    accuracyText: { fontSize: 12, color: '#888', fontWeight: '500' },
    sectionTitle: {
        fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12,
    },
    modeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    modeCard: {
        flex: 1, backgroundColor: '#111528', borderRadius: 16, padding: 14,
        alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(91,99,211,0.1)',
    },
    modeCardActive: {
        borderColor: '#5B63D3', backgroundColor: 'rgba(91,99,211,0.1)',
    },
    modeLabel: { fontSize: 13, fontWeight: '700', color: '#888daf', marginTop: 8 },
    modeDesc: { fontSize: 10, color: '#666', marginTop: 2, textAlign: 'center' },
    settingCard: {
        backgroundColor: '#111528', borderRadius: 16, padding: 16, marginBottom: 24,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.12)',
    },
    settingRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    settingLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#e0e3f0' },
    settingHint: { fontSize: 12, color: '#666', marginTop: 8 },
    tipsCard: {
        flexDirection: 'row', gap: 12, backgroundColor: 'rgba(232,168,56,0.08)',
        borderRadius: 16, padding: 16, marginBottom: 32,
        borderWidth: 1, borderColor: 'rgba(232,168,56,0.15)',
    },
    tipsTitle: { fontSize: 14, fontWeight: '700', color: '#E8A838', marginBottom: 4 },
    tipsText: { fontSize: 12, color: '#888daf', lineHeight: 18 },
    startBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, backgroundColor: '#5B63D3', borderRadius: 16,
        paddingVertical: 18, elevation: 8,
        shadowColor: '#5B63D3', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 12,
    },
    startBtnText: {
        color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1,
    },
    startBtnDisabled: {
        backgroundColor: '#3a3d50', opacity: 0.7,
    },
    gpsWarning: {
        color: '#ff4444', fontSize: 12, marginTop: 8, fontStyle: 'italic',
    },
    // Team Section
    teamSection: { marginBottom: 24 },
    inputGroup: { marginBottom: 16 },
    inputLabel: { color: '#ccc', fontSize: 14, fontWeight: '600', marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#111528',
        borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(91,99,211,0.2)',
        gap: 10,
    },
    teamIdText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 2 },
    inputHint: { color: '#666', fontSize: 12, marginTop: 4 },
    searchBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#1a1e2e', padding: 12, borderRadius: 12,
        borderWidth: 1, borderColor: '#333',
    },
    searchBtnText: { color: '#ccc', fontWeight: '600' },
    friendListCard: {
        backgroundColor: '#111528', borderRadius: 12, padding: 8, marginTop: 8,
        borderWidth: 1, borderColor: '#333', maxHeight: 200,
    },
    friendItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 12, borderBottomWidth: 1, borderBottomColor: '#1a1e2e',
    },
    friendChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#5B63D3', paddingVertical: 6, paddingHorizontal: 10,
        borderRadius: 20,
    },
    friendChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
