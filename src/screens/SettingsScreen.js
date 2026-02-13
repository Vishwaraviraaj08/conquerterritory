import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Switch,
    StatusBar,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import CustomAlert from '../components/CustomAlert';

export default function SettingsScreen({ navigation }) {
    const { logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        notifications: true,
        sound: true,
        vibration: true,
        locationSharing: true,
        publicProfile: true,
        autoPause: true,
        metricUnits: true,
        batterySaver: false,
        darkMode: true,
    });
    const [alertConfig, setAlertConfig] = useState({ visible: false, type: 'info', title: '', message: '', buttons: [] });

    const showAlert = (type, title, message, buttons = []) => {
        setAlertConfig({ visible: true, type, title, message, buttons });
    };
    const hideAlert = () => setAlertConfig(a => ({ ...a, visible: false }));

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data.settings) setSettings(prev => ({ ...prev, ...res.data.settings }));
        } catch (e) {
            try {
                const cached = await AsyncStorage.getItem('user_settings');
                if (cached) setSettings(prev => ({ ...prev, ...JSON.parse(cached) }));
            } catch (_) { }
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key, value) => {
        const prev = settings[key];
        setSettings(s => ({ ...s, [key]: value }));
        try {
            await api.put('/settings', { [key]: value });
            await AsyncStorage.setItem('user_settings', JSON.stringify({ ...settings, [key]: value }));
        } catch (e) {
            setSettings(s => ({ ...s, [key]: prev }));
            showAlert('error', 'Error', 'Failed to save setting. Please try again.');
        }
    };

    const handleLogout = () => {
        showAlert('logout', 'Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel', onPress: () => { } },
            { text: 'Log Out', style: 'destructive', onPress: () => logout() },
        ]);
    };

    const handleDeleteAccount = () => {
        showAlert('delete', 'Delete Account', 'This will permanently delete your account and all data. This cannot be undone.', [
            { text: 'Cancel', style: 'cancel', onPress: () => { } },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete('/users/account');
                        logout();
                    } catch (e) {
                        showAlert('error', 'Error', 'Failed to delete account.');
                    }
                },
            },
        ]);
    };

    const handleClearCache = () => {
        showAlert('warning', 'Clear Cache', 'Clear all locally cached data?', [
            { text: 'Cancel', style: 'cancel', onPress: () => { } },
            {
                text: 'Clear', onPress: async () => {
                    await AsyncStorage.clear();
                    showAlert('success', 'Done', 'Cache cleared successfully.');
                },
            },
        ]);
    };

    const ToggleRow = ({ icon, iconFamily, label, value, settingKey, color }) => (
        <View style={styles.settingRow}>
            <View style={[styles.settingIconWrap, { backgroundColor: `${color || '#5B63D3'}20` }]}>
                {iconFamily === 'mci' ? (
                    <MaterialCommunityIcons name={icon} size={18} color={color || '#5B63D3'} />
                ) : (
                    <Ionicons name={icon} size={18} color={color || '#5B63D3'} />
                )}
            </View>
            <Text style={styles.settingLabel}>{label}</Text>
            <Switch value={value} onValueChange={(v) => updateSetting(settingKey, v)} trackColor={{ false: '#3a3d50', true: '#5B63D3' }} thumbColor="#fff" />
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#5B63D3" />
                <Text style={{ color: '#888', marginTop: 10 }}>Loading settings...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 24 }} />
                </View>

                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.card}>
                    <ToggleRow icon="notifications-outline" label="Push Notifications" value={settings.notifications} settingKey="notifications" />
                    <ToggleRow icon="volume-high-outline" label="Sound Effects" value={settings.sound} settingKey="sound" />
                    <ToggleRow icon="phone-portrait-outline" label="Vibration" value={settings.vibration} settingKey="vibration" />
                </View>

                <Text style={styles.sectionTitle}>Privacy & Location</Text>
                <View style={styles.card}>
                    <ToggleRow icon="location-outline" label="Location Sharing" value={settings.locationSharing} settingKey="locationSharing" color="#2dd06e" />
                    <ToggleRow icon="eye-outline" label="Public Profile" value={settings.publicProfile} settingKey="publicProfile" color="#2dd06e" />
                </View>

                <Text style={styles.sectionTitle}>Activity</Text>
                <View style={styles.card}>
                    <ToggleRow icon="pause-circle-outline" label="Auto-Pause" value={settings.autoPause} settingKey="autoPause" color="#E88D3F" />
                    <ToggleRow icon="speedometer" iconFamily="mci" label="Metric Units" value={settings.metricUnits} settingKey="metricUnits" color="#E88D3F" />
                    <ToggleRow icon="battery-half-outline" label="Battery Saver" value={settings.batterySaver} settingKey="batterySaver" color="#E88D3F" />
                </View>

                <Text style={styles.sectionTitle}>Appearance</Text>
                <View style={styles.card}>
                    <ToggleRow icon="moon-outline" label="Dark Mode" value={settings.darkMode} settingKey="darkMode" color="#7C83ED" />
                </View>

                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={() => Linking.openURL('https://geoconquest.app/help')}>
                        <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(91,99,211,0.12)' }]}><Ionicons name="help-circle-outline" size={18} color="#7C83ED" /></View>
                        <Text style={styles.settingLabel}>Help & FAQ</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={() => Linking.openURL('mailto:support@geoconquest.app?subject=Bug%20Report')}>
                        <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(91,99,211,0.12)' }]}><Ionicons name="bug-outline" size={18} color="#7C83ED" /></View>
                        <Text style={styles.settingLabel}>Report a Bug</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={() => Linking.openURL('https://geoconquest.app/privacy')}>
                        <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(91,99,211,0.12)' }]}><Ionicons name="shield-checkmark-outline" size={18} color="#7C83ED" /></View>
                        <Text style={styles.settingLabel}>Privacy Policy</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={() => Linking.openURL('https://geoconquest.app/terms')}>
                        <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(91,99,211,0.12)' }]}><Ionicons name="document-text-outline" size={18} color="#7C83ED" /></View>
                        <Text style={styles.settingLabel}>Terms of Service</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Data</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={handleClearCache}>
                        <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(232,141,63,0.12)' }]}><Ionicons name="trash-outline" size={18} color="#E88D3F" /></View>
                        <Text style={styles.settingLabel}>Clear Cache</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={handleLogout}>
                        <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(255,68,68,0.12)' }]}><Ionicons name="log-out-outline" size={18} color="#ff4444" /></View>
                        <Text style={[styles.settingLabel, { color: '#ff4444' }]}>Log Out</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={handleDeleteAccount}>
                        <View style={[styles.settingIconWrap, { backgroundColor: 'rgba(255,68,68,0.12)' }]}><Ionicons name="person-remove-outline" size={18} color="#ff4444" /></View>
                        <Text style={[styles.settingLabel, { color: '#ff4444' }]}>Delete Account</Text>
                        <Ionicons name="chevron-forward" size={18} color="#555" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.appInfo}>GeoConquest v1.0.0 • Build 1</Text>
            </ScrollView>

            <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={hideAlert}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    scrollContent: { paddingTop: 50, paddingBottom: 50, paddingHorizontal: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888daf', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16, paddingHorizontal: 4 },
    card: { backgroundColor: '#111528', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(91,99,211,0.1)', marginBottom: 4 },
    settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(91,99,211,0.06)' },
    settingIconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    settingLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#e0e3f0' },
    appInfo: { textAlign: 'center', color: '#555', fontSize: 12, marginTop: 24, fontWeight: '400' },
});
