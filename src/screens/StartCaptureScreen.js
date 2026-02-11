import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Switch,
    StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function StartCaptureScreen({ navigation }) {
    const [gameMode, setGameMode] = useState('solo');
    const [sessionPublic, setSessionPublic] = useState(true);

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
                </View>

                {/* Pre-Run Checks */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Pre-Run Checks</Text>
                        <Ionicons name="chevron-forward" size={18} color="#666" />
                    </View>

                    <View style={styles.checkRow}>
                        <Ionicons name="wifi" size={18} color="#5B63D3" />
                        <Text style={styles.checkLabel}>GPS Signal</Text>
                        <Text style={styles.checkValue}>Excellent</Text>
                    </View>

                    <View style={styles.checkRow}>
                        <MaterialCommunityIcons name="satellite-variant" size={18} color="#5B63D3" />
                        <Text style={styles.checkLabel}>Satellite Accuracy</Text>
                        <Text style={[styles.checkValue, { color: '#7C83ED' }]}>± 2 meters</Text>
                    </View>
                </View>

                {/* Choose Gameplay Mode */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Choose Gameplay Mode</Text>

                    <TouchableOpacity
                        style={[styles.modeOption, gameMode === 'solo' && styles.modeOptionActive]}
                        onPress={() => setGameMode('solo')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.modeRow}>
                            <View style={[styles.radio, gameMode === 'solo' && styles.radioActive]}>
                                {gameMode === 'solo' && <Ionicons name="checkmark" size={12} color="#fff" />}
                            </View>
                            <Ionicons name="person-outline" size={20} color="#aaa" />
                        </View>
                        <Text style={styles.modeTitle}>Solo Capture</Text>
                        <Text style={styles.modeDesc}>Claim territory for yourself. Maximize personal points.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.modeOption, gameMode === 'team' && styles.modeOptionActive]}
                        onPress={() => setGameMode('team')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.modeRow}>
                            <View style={[styles.radio, gameMode === 'team' && styles.radioActive]}>
                                {gameMode === 'team' && <Ionicons name="checkmark" size={12} color="#fff" />}
                            </View>
                            <Ionicons name="people-outline" size={20} color="#aaa" />
                        </View>
                        <Text style={styles.modeTitle}>Team Capture</Text>
                        <Text style={styles.modeDesc}>Contribute to your team's dominance. Collaborate for larger zones.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.modeOption, gameMode === 'coop' && styles.modeOptionActive]}
                        onPress={() => setGameMode('coop')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.modeRow}>
                            <View style={[styles.radio, gameMode === 'coop' && styles.radioActive]}>
                                {gameMode === 'coop' && <Ionicons name="checkmark" size={12} color="#fff" />}
                            </View>
                            <MaterialCommunityIcons name="handshake-outline" size={20} color="#aaa" />
                        </View>
                        <Text style={styles.modeTitle}>Cooperative Play</Text>
                        <Text style={styles.modeDesc}>Work with allies against AI or other teams. Shared rewards.</Text>
                    </TouchableOpacity>
                </View>

                {/* Session Privacy */}
                <View style={styles.card}>
                    <View style={styles.privacyRow}>
                        <Ionicons name="lock-closed-outline" size={20} color="#fff" />
                        <Text style={styles.privacyLabel}>Session Privacy</Text>
                        <View style={styles.privacyBadge}>
                            <Text style={styles.privacyBadgeText}>Public</Text>
                        </View>
                        <Switch
                            value={sessionPublic}
                            onValueChange={setSessionPublic}
                            trackColor={{ false: '#3a3d50', true: '#5B63D3' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Minimum Requirements */}
                <View style={styles.card}>
                    <View style={styles.checkRow}>
                        <Ionicons name="time-outline" size={20} color="#888" />
                        <Text style={styles.cardTitle}>Minimum Requirements</Text>
                    </View>
                    <Text style={styles.reqText}>
                        A minimum area of 100 sq meters or 5 minutes of activity is required to validate a territory capture.
                    </Text>
                </View>

                {/* Estimated Outcomes */}
                <View style={styles.card}>
                    <View style={styles.outcomeHeader}>
                        <Text style={styles.cardTitle}>Estimated Outcomes</Text>
                        <Ionicons name="star-outline" size={18} color="#888" />
                    </View>

                    <View style={styles.outcomeRow}>
                        <MaterialCommunityIcons name="chart-line" size={18} color="#fff" />
                        <Text style={styles.outcomeLabel}>Difficulty</Text>
                        <View style={styles.moderateBadge}>
                            <Text style={styles.moderateText}>Moderate</Text>
                        </View>
                    </View>

                    <View style={styles.outcomeRow}>
                        <MaterialCommunityIcons name="target" size={18} color="#fff" />
                        <Text style={styles.outcomeLabel}>Potential Reward</Text>
                        <Text style={styles.rewardText}>250 - 400 points</Text>
                    </View>
                </View>

                {/* Confirm Start */}
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => navigation.navigate('LiveTracking', { gameMode })}
                    activeOpacity={0.85}
                >
                    <Text style={styles.confirmButtonText}>Confirm Start</Text>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    scrollContent: { paddingTop: 50, paddingBottom: 40, paddingHorizontal: 16 },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    card: {
        backgroundColor: '#111528',
        borderRadius: 16, padding: 18, marginBottom: 14,
        borderWidth: 1, borderColor: 'rgba(91, 99, 211, 0.12)',
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
    },
    cardTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
    checkRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8,
    },
    checkLabel: { flex: 1, color: '#ccc', fontSize: 14, fontWeight: '500' },
    checkValue: { color: '#ccc', fontSize: 14, fontWeight: '600' },
    modeOption: {
        backgroundColor: '#1a1e30', borderRadius: 12, padding: 14, marginTop: 10,
        borderWidth: 1, borderColor: 'rgba(91, 99, 211, 0.1)',
    },
    modeOptionActive: { borderColor: '#5B63D3', borderWidth: 1.5 },
    modeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    radio: {
        width: 20, height: 20, borderRadius: 4, borderWidth: 2,
        borderColor: '#4a4e68', justifyContent: 'center', alignItems: 'center',
    },
    radioActive: { backgroundColor: '#5B63D3', borderColor: '#5B63D3' },
    modeTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
    modeDesc: { fontSize: 12, color: '#888daf', lineHeight: 17 },
    privacyRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    privacyLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff' },
    privacyBadge: {
        backgroundColor: 'rgba(91, 99, 211, 0.2)', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 4,
    },
    privacyBadgeText: { color: '#7C83ED', fontSize: 12, fontWeight: '600' },
    reqText: { color: '#888daf', fontSize: 13, lineHeight: 18, marginTop: 6 },
    outcomeHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
    },
    outcomeRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
    },
    outcomeLabel: { flex: 1, color: '#ccc', fontSize: 14, fontWeight: '600' },
    moderateBadge: {
        backgroundColor: '#5B63D3', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4,
    },
    moderateText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    rewardText: { color: '#7C83ED', fontSize: 14, fontWeight: '600', fontStyle: 'italic' },
    confirmButton: {
        backgroundColor: '#5B63D3', borderRadius: 14, paddingVertical: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 6,
    },
    confirmButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
