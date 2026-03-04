import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Image,
    LayoutAnimation,
    Platform,
    UIManager
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import api from '../api';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const StatBox = ({ icon, value, label, color }) => (
    <View style={styles.statBox}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
        <Text style={styles.statBoxValue}>{value}</Text>
        <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
);

const ALL_ACHIEVEMENTS = [
    { id: 'first_step', title: 'First Step', description: 'Take your first step.', icon: 'walk', targetValue: 1, getStat: (s) => s.steps || 0 },
    { id: '1km_walk', title: '1km Walker', description: 'Walk a total of 1 kilometer.', icon: 'map-marker-distance', targetValue: 1000, getStat: (s) => s.totalDistance || 0 },
    { id: '5km_runner', title: '5km Runner', description: 'Run a total of 5 kilometers.', icon: 'run', targetValue: 5000, getStat: (s) => s.totalDistance || 0 },
    { id: 'territory_claimer', title: 'Land Owner', description: 'Claim your first territory.', icon: 'flag-variant', targetValue: 1, getStat: (s) => s.totalCaptures || 0 },
    { id: 'social_butterfly', title: 'Social Butterfly', description: 'Add a friend.', icon: 'account-multiple-plus', targetValue: 1, getStat: (s, p) => p.friendsCount || 0 },
    { id: 'week_streak', title: 'Consistency', description: 'Maintain a 7-day streak.', icon: 'fire', targetValue: 7, getStat: (s) => s.streak || 0 },
    { id: 'marathoner', title: 'Marathoner', description: 'Walk 42km in total.', icon: 'run-fast', targetValue: 42000, getStat: (s) => s.totalDistance || 0 },
    { id: 'explorer', title: 'Explorer', description: 'Complete 10 runs.', icon: 'compass', targetValue: 10, getStat: (s) => s.totalRuns || 0 },
    { id: 'calorie_crusher', title: 'Calorie Crusher', description: 'Burn 5,000 calories.', icon: 'lightning-bolt', targetValue: 5000, getStat: (s) => s.caloriesBurned || 0 },
    { id: 'land_baron', title: 'Land Baron', description: 'Claim 50,000 m² territory.', icon: 'earth', targetValue: 50000, getStat: (s) => s.totalArea || 0 },
];

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Achievement State
    const [achievementFilter, setAchievementFilter] = useState('all'); // all, completed, pending
    const [displayedAchievements, setDisplayedAchievements] = useState(5);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });
            if (!result.canceled && result.assets[0]) {
                const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
                // Check size (approx 1MB limit for base64)
                if (base64.length > 1.5 * 1024 * 1024) {
                    alert('Image too large. Please choose a smaller image.');
                    return;
                }
                setUploadingImage(true);
                try {
                    const res = await api.put('/users/profile', { profileImage: base64 });
                    setProfile(res.data.user);
                } catch (e) {
                    console.log('Profile image upload error:', e.message);
                } finally {
                    setUploadingImage(false);
                }
            }
        } catch (e) {
            console.log('Image pick error:', e.message);
        }
    };

    const fetchProfile = useCallback(async () => {
        try {
            const [profRes, capRes] = await Promise.all([
                api.get('/users/profile'),
                api.get('/captures?limit=500')
            ]);
            const userData = profRes.data.user;
            const caps = capRes.data.captures || [];

            // Compute live stats from actual captures
            const liveDist = caps.reduce((a, c) => a + (c.distance || 0), 0);
            const liveCals = caps.reduce((a, c) => a + (c.calories || 0), 0);
            const liveSteps = caps.reduce((a, c) => a + Math.floor((c.distance || 0) / 0.762), 0);
            const liveArea = caps.reduce((a, c) => a + (c.area || 0), 0);
            const liveTerritories = caps.filter(c => c.area > 0).length;
            const liveRuns = caps.length;

            // Merge live stats into profile (prefer computed over stale DB values)
            const mergedStats = {
                ...(userData.stats || {}),
                totalDistance: liveDist,
                caloriesBurned: liveCals,
                steps: liveSteps,
                totalArea: liveArea,
                totalCaptures: liveTerritories,
                totalRuns: liveRuns,
            };

            // Recalculate health score with live data
            let hs = 50;
            hs += Math.min(liveSteps / 1000, 20);
            hs += Math.min(liveDist / 5000, 15);
            hs += Math.min(liveCals / 500, 10);
            hs += Math.min(mergedStats.streak || 0, 5);
            mergedStats.healthScore = Math.min(Math.round(hs), 100);

            setProfile({ ...userData, stats: mergedStats });
        } catch (e) {
            console.log('Profile fetch error, using local user:', e.message);
            setProfile(user);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const p = profile || user || {};
    const stats = p.stats || {};
    const userAchievements = p.achievements || [];

    // --- Health Score Calculation ---
    // Simple algorithm: 
    // Base 50
    // + Steps / 1000 (max 20)
    // + Distance / 5km (max 15)
    // + Calories / 500 (max 10)
    // + Streak (max 5)
    const calculateHealthScore = () => {
        let score = 50;
        score += Math.min((stats.steps || 0) / 1000, 20);
        score += Math.min((stats.totalDistance || 0) / 5000, 15);
        score += Math.min((stats.caloriesBurned || 0) / 500, 10);
        score += Math.min((stats.streak || 0), 5);
        return Math.min(Math.round(score), 100);
    };
    const healthScore = calculateHealthScore();

    // --- Achievements Logic ---
    const getProcessedAchievements = () => {
        // 1. Merge all possible achievements with user's unlocked status
        const merged = ALL_ACHIEVEMENTS.map(ach => {
            const unlocked = userAchievements.find(ua => ua.title === ach.title || ua.id === ach.id); // Simple match
            return {
                ...ach,
                unlocked: !!unlocked,
                unlockedAt: unlocked ? unlocked.unlockedAt : null,
                currentValue: ach.getStat ? ach.getStat(stats, p) : 0
            };
        });

        // 2. Filter
        const filtered = merged.filter(ach => {
            if (achievementFilter === 'completed') return ach.unlocked;
            if (achievementFilter === 'pending') return !ach.unlocked;
            return true;
        });

        // 3. Sort: Unlocked first, then by ID (preserved order)
        filtered.sort((a, b) => {
            if (a.unlocked === b.unlocked) return 0;
            return a.unlocked ? -1 : 1;
        });

        return filtered;
    };

    const processedAchievements = getProcessedAchievements();
    const visibleAchievements = processedAchievements.slice(0, displayedAchievements);

    const loadMoreAchievements = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setDisplayedAchievements(prev => prev + 5);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#5B63D3" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ width: 22 }} />
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
                        <Ionicons name="settings-outline" size={22} color="#7C83ED" />
                    </TouchableOpacity>
                </View>

                {/* Avatar & Username */}
                <View style={styles.profileSection}>
                    <TouchableOpacity style={styles.avatarOuter} onPress={pickImage} activeOpacity={0.8}>
                        {uploadingImage ? (
                            <View style={styles.avatarCircle}>
                                <ActivityIndicator size="small" color="#5B63D3" />
                            </View>
                        ) : p.profileImage ? (
                            <Image source={{ uri: p.profileImage }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarCircle}>
                                <Ionicons name="person" size={44} color="#7C83ED" />
                            </View>
                        )}
                        <View style={styles.onlineDot} />
                        <View style={styles.cameraBadge}>
                            <Ionicons name="camera" size={12} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.username}>{p.username || 'Player'}</Text>
                    <Text style={styles.userTeam}>
                        {p.email || 'Adventurer'} • Level {Math.floor((stats.totalPoints || 0) / 100) + 1}
                    </Text>
                </View>

                {/* Health Score */}
                <View style={styles.healthCard}>
                    <View style={styles.healthHeader}>
                        <MaterialCommunityIcons name="heart-pulse" size={18} color="#E53935" />
                        <Text style={styles.healthTitle}>Health Score</Text>
                        <Text style={styles.healthValue}>{healthScore}/100</Text>
                    </View>
                    <View style={styles.healthBarBg}>
                        <View style={[styles.healthBarFill, { width: `${healthScore}%`, backgroundColor: healthScore > 80 ? '#2dd06e' : healthScore > 50 ? '#E8A838' : '#E53935' }]} />
                    </View>
                    <Text style={styles.healthSubtitle}>
                        Based on your steps, distance, and consistency.
                    </Text>
                </View>

                {/* Key Statistics */}
                <Text style={styles.sectionTitle}>Key Statistics</Text>
                <View style={styles.statsGrid}>
                    <StatBox icon="vector-polygon" value={stats.totalArea ? `${Math.round(stats.totalArea)} m²` : '0 m²'} label="Area Claimed" color="#5B63D3" />
                    <StatBox icon="run-fast" value={stats.totalDistance ? `${(stats.totalDistance / 1000).toFixed(1)} km` : '0 km'} label="Distance" color="#E8A838" />
                    <StatBox icon="fire" value={`${(stats.caloriesBurned || 0).toLocaleString()}`} label="Calories" color="#E53935" />
                    <StatBox icon="chart-line" value={`${stats.streak || 0} days`} label="Streak" color="#2dd06e" />
                    <StatBox icon="earth" value={`${stats.totalCaptures || 0}`} label="Territories" color="#7C83ED" />
                    <StatBox icon="shoe-print" value={`${(stats.steps || 0).toLocaleString()}`} label="Steps" color="#9C27B0" />
                </View>

                {/* Achievements Section */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Achievements ({processedAchievements.filter(a => a.unlocked).length}/{ALL_ACHIEVEMENTS.length})</Text>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterTabs}>
                    {['all', 'completed', 'pending'].map(filter => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.filterTab, achievementFilter === filter && styles.filterTabActive]}
                            onPress={() => { setAchievementFilter(filter); setDisplayedAchievements(5); }}
                        >
                            <Text style={[styles.filterTabText, achievementFilter === filter && styles.filterTabTextActive]}>
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.achievementsList}>
                    {visibleAchievements.map((ach, i) => (
                        <View key={i} style={[styles.achievementCard, !ach.unlocked && styles.achievementCardLocked]}>
                            <View style={[
                                styles.achievementIcon,
                                { backgroundColor: ach.unlocked ? 'rgba(91,99,211,0.15)' : 'rgba(255,255,255,0.05)' }
                            ]}>
                                <MaterialCommunityIcons
                                    name={ach.icon || 'trophy'}
                                    size={20}
                                    color={ach.unlocked ? '#5B63D3' : '#555'}
                                />
                            </View>
                            <View style={styles.achievementInfo}>
                                <Text style={[styles.achievementTitle, !ach.unlocked && styles.textDim]}>{ach.title}</Text>
                                <Text style={[styles.achievementDesc, !ach.unlocked && styles.textDim]}>{ach.description}</Text>

                                {!ach.unlocked && ach.targetValue && ach.currentValue !== undefined && (
                                    <View style={{ marginTop: 8 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text style={{ fontSize: 10, color: '#888daf' }}>Progress</Text>
                                            <Text style={{ fontSize: 10, color: '#888daf' }}>
                                                {typeof ach.currentValue === 'number' && ach.targetValue >= 1000
                                                    ? `${(ach.currentValue / 1000).toFixed(1)}k / ${(ach.targetValue / 1000).toFixed(1)}k`
                                                    : `${Math.round(ach.currentValue)} / ${ach.targetValue}`}
                                            </Text>
                                        </View>
                                        <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                            <View style={{ height: 4, backgroundColor: '#5B63D3', borderRadius: 2, width: `${Math.min(100, Math.max(0, (ach.currentValue / ach.targetValue) * 100))}%` }} />
                                        </View>
                                    </View>
                                )}
                            </View>
                            <MaterialCommunityIcons
                                name={ach.unlocked ? "check-circle" : "checkbox-blank-circle-outline"}
                                size={22}
                                color={ach.unlocked ? "#2dd06e" : "#444"}
                            />
                        </View>
                    ))}

                    {/* Load More Button */}
                    {visibleAchievements.length < processedAchievements.length && (
                        <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreAchievements}>
                            <Text style={styles.loadMoreText}>Load More</Text>
                            <Ionicons name="chevron-down" size={16} color="#7C83ED" />
                        </TouchableOpacity>
                    )}

                    {visibleAchievements.length === 0 && (
                        <Text style={styles.emptyStateText}>No achievements found in this category.</Text>
                    )}
                </View>

                {/* Career Timeline - Kept as requested to keep 'other relevant data' */}
                <Text style={styles.sectionTitle}>Career History</Text>
                <View style={styles.timelineMap}>
                    <MaterialCommunityIcons name="map-marker-path" size={40} color="rgba(91,99,211,0.4)" />
                    <Text style={styles.timelineText}>View Activity Heatmap & Logs</Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    scrollContent: { paddingTop: 50, paddingBottom: 100, paddingHorizontal: 20 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    profileSection: { alignItems: 'center', marginBottom: 20 },
    avatarOuter: { position: 'relative', marginBottom: 10 },
    avatarCircle: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: 'rgba(91,99,211,0.15)', justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#5B63D3',
    },
    avatarImage: {
        width: 90, height: 90, borderRadius: 45,
        borderWidth: 3, borderColor: '#5B63D3',
    },
    cameraBadge: {
        position: 'absolute', bottom: 0, right: -2,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: '#5B63D3', justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#0a0e1a',
    },
    onlineDot: {
        width: 16, height: 16, borderRadius: 8, backgroundColor: '#2dd06e',
        position: 'absolute', bottom: 2, right: 2, borderWidth: 3, borderColor: '#0a0e1a',
    },
    username: { fontSize: 22, fontWeight: '800', color: '#fff' },
    userTeam: { fontSize: 13, color: '#888daf', marginTop: 2 },

    // Health Score
    healthCard: {
        backgroundColor: '#111528', borderRadius: 16, padding: 16, marginBottom: 25,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.12)',
    },
    healthHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    healthTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#fff' },
    healthValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
    healthBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8 },
    healthBarFill: { height: 8, borderRadius: 4 },
    healthSubtitle: { fontSize: 11, color: '#666' },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25,
    },
    statBox: {
        width: '48%', backgroundColor: '#111528', borderRadius: 14, padding: 14, alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)',
    },
    statBoxValue: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 6 },
    statBoxLabel: { fontSize: 11, color: '#888daf', marginTop: 2 },

    // Achievements
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    filterTabs: { flexDirection: 'row', marginBottom: 15, gap: 10 },
    filterTab: {
        paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'transparent'
    },
    filterTabActive: { backgroundColor: 'rgba(91,99,211,0.15)', borderColor: '#5B63D3' },
    filterTabText: { fontSize: 12, color: '#888', fontWeight: '600' },
    filterTabTextActive: { color: '#7C83ED' },

    achievementsList: { marginBottom: 25 },
    achievementCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#111528',
        borderRadius: 14, padding: 14, marginBottom: 8, gap: 12,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)',
    },
    achievementCardLocked: { opacity: 0.6, borderColor: 'rgba(255,255,255,0.03)' },
    achievementIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    achievementInfo: { flex: 1 },
    achievementTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
    achievementDesc: { fontSize: 11, color: '#888daf', marginTop: 1 },
    textDim: { color: '#666' },

    loadMoreBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, gap: 5 },
    loadMoreText: { color: '#7C83ED', fontWeight: '600', fontSize: 13 },
    emptyStateText: { color: '#666', textAlign: 'center', fontStyle: 'italic', marginTop: 10 },

    // Timeline
    timelineMap: {
        height: 100, backgroundColor: '#111528', borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)', borderStyle: 'dashed'
    },
    timelineText: { color: '#555', fontSize: 12, marginTop: 6 },
});
