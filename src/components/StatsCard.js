import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export default function StatsCard({ stats, tracking, onStart, onStop }) {
    return (
        <View style={styles.card}>
            <View style={styles.statsRow}>
                <StatItem icon="◇" label="Area" value={stats.area} unit="m²" color="#1D72B8" />
                <View style={styles.divider} />
                <StatItem icon="↗" label="Distance" value={stats.distance} unit="m" color="#E67E22" />
                <View style={styles.divider} />
                <StatItem icon="⬡" label="Perimeter" value={stats.perimeter} unit="m" color="#27AE60" />
            </View>

            <TouchableOpacity
                style={[styles.button, tracking ? styles.stopBtn : styles.startBtn]}
                onPress={tracking ? onStop : onStart}
                activeOpacity={0.85}
            >
                <View style={styles.btnInner}>
                    <View style={[styles.btnDot, { backgroundColor: tracking ? '#FF6B6B' : '#4ADE80' }]} />
                    <Text style={styles.btnText}>{tracking ? 'STOP TRACKING' : 'START TRACKING'}</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const StatItem = ({ icon, label, value, unit, color }) => (
    <View style={styles.statItem}>
        <Text style={[styles.statIcon, { color }]}>{icon}</Text>
        <Text style={styles.statValue}>
            {Number(value) > 0 ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'}
        </Text>
        <Text style={styles.statUnit}>{unit}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        bottom: 34,
        left: 14,
        right: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderRadius: 22,
        paddingVertical: 18,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    divider: {
        width: 1,
        height: 36,
        backgroundColor: '#e5e7eb',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statIcon: {
        fontSize: 14,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1a1a1a',
        letterSpacing: -0.5,
    },
    statUnit: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9ca3af',
        marginTop: -2,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#6b7280',
        marginTop: 2,
    },
    button: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    startBtn: {
        backgroundColor: '#1D72B8',
    },
    stopBtn: {
        backgroundColor: '#DC2626',
    },
    btnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    btnDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    btnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
});
