import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { center } from '@turf/turf';

export default function AuthScreen({ navigation }) {
    const { register, login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [agreeLocation, setAgreeLocation] = useState(false);
    const [selectedTeamAction, setSelectedTeamAction] = useState(null);
    const [isLogin, setIsLogin] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [profileImage, setProfileImage] = useState(null);

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
                if (base64.length > 1024 * 1024) {
                    setErrorMsg('Image too large. Please choose a smaller image.');
                    return;
                }
                setProfileImage(base64);
            }
        } catch (e) {
            console.log('Image pick error:', e.message);
        }
    };

    const handleSubmit = async () => {
        setErrorMsg('');
        if (!email.trim() || !password.trim()) {
            setErrorMsg('Email and password are required');
            return;
        }
        if (!isLogin && !username.trim()) {
            setErrorMsg('Username is required');
            return;
        }

        setSubmitting(true);
        try {
            if (isLogin) {
                await login(email.trim(), password);
            } else {
                await register(email.trim(), password, username.trim(), {
                    agreePrivacy,
                    agreeLocation,
                    profileImage,
                });
            }
        } catch (err) {
            let msg = 'Something went wrong';
            if (err.response?.data?.error) {
                const apiError = err.response.data.error;
                msg = typeof apiError === 'object' ? (apiError.message || JSON.stringify(apiError)) : apiError;
            } else if (err.message) {
                msg = err.message;
            }
            setErrorMsg(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <Text style={styles.title}>Join the GeoConquest</Text>
                <Text style={styles.subtitle}>
                    Unleash your inner explorer. Track,{'\n'}claim, and dominate territories{'\n'}worldwide.
                </Text>

                {/* Toggle Login/Register */}
                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]}
                        onPress={() => { setIsLogin(false); setErrorMsg(''); }}
                    >
                        <Text style={[styles.toggleBtnText, !isLogin && styles.toggleBtnTextActive]}>Sign Up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]}
                        onPress={() => { setIsLogin(true); setErrorMsg(''); }}
                    >
                        <Text style={[styles.toggleBtnText, isLogin && styles.toggleBtnTextActive]}>Log In</Text>
                    </TouchableOpacity>
                </View>

                {/* Error Message */}
                {errorMsg ? (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={16} color="#E53935" />
                        <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                ) : null}

                {/* Email Field */}
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="email-outline" size={18} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="your@example.com"
                        placeholderTextColor="#555"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Password Field */}
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#555"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                {/* Username Field (only for Sign Up) */}
                {!isLogin && (
                    <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fieldLabel}>Username</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={18} color="#666" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Username"
                                        placeholderTextColor="#555"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={{ alignItems: 'center' }}>
                                <Text style={styles.avatarLabel}>Profile Image</Text>
                                <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} activeOpacity={0.8}>
                                    {profileImage ? (
                                        <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                                    ) : (
                                        <View style={styles.avatarCircle}>
                                            <Ionicons name="camera-outline" size={28} color="#7C83ED" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                    </>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.signUpButton, submitting && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.signUpButtonText}>
                            {isLogin ? 'Log In' : 'Sign Up'}
                        </Text>
                    )}
                </TouchableOpacity>


            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e1a' },
    scrollContent: {
        paddingTop: 60, paddingBottom: 50, paddingHorizontal: 24, alignItems: 'center',
    },
    logoContainer: { marginBottom: 20 },
    logoBox: {
        width: 64, height: 64, borderRadius: 16,
        backgroundColor: 'rgba(124, 131, 237, 0.15)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(124, 131, 237, 0.3)',
    },
    title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#888daf', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    toggleRow: {
        flexDirection: 'row', alignSelf: 'stretch', marginBottom: 20,
        backgroundColor: '#1a1e2e', borderRadius: 12, padding: 4,
    },
    toggleBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    },
    toggleBtnActive: { backgroundColor: '#5B63D3' },
    toggleBtnText: { color: '#888', fontSize: 15, fontWeight: '600' },
    toggleBtnTextActive: { color: '#fff' },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(229,57,53,0.12)', borderRadius: 10,
        padding: 12, alignSelf: 'stretch', marginBottom: 14,
        borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)',
    },
    errorText: { color: '#E53935', fontSize: 13, fontWeight: '500', flex: 1 },
    fieldLabel: {
        color: '#ccc', fontSize: 13, fontWeight: '600',
        alignSelf: 'flex-start', marginBottom: 6, marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1a1e2e', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 13,
        marginBottom: 12, alignSelf: 'stretch', gap: 10,
        borderWidth: 1, borderColor: '#2a2e40',
    },
    input: { flex: 1, color: '#ccc', fontSize: 14 },
    avatarLabel: {
        color: '#ccc', fontSize: 14, fontWeight: '600',
        textAlign: 'center', marginTop: 10, marginBottom: 10,
    },
    avatarContainer: { alignItems: 'center', marginBottom: 16 },
    avatarImage: {
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 2, borderColor: '#5B63D3',
    },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(124, 131, 237, 0.15)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: 'rgba(124, 131, 237, 0.4)',
    },
    teamLabel: { color: '#ccc', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
    teamBtn: {
        borderRadius: 12, paddingVertical: 14, alignSelf: 'stretch',
        alignItems: 'center', marginBottom: 10, backgroundColor: '#1a1e2e',
        borderWidth: 1, borderColor: '#5B63D3',
    },
    teamBtnActive: { backgroundColor: '#5B63D3' },
    teamBtnText: { color: '#ccc', fontSize: 15, fontWeight: '600' },
    teamBtnTextActive: { color: '#fff' },
    signUpButton: {
        backgroundColor: '#5B63D3', borderRadius: 14, paddingVertical: 16,
        alignSelf: 'stretch', alignItems: 'center', marginTop: 14,
    },
    signUpButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    sectionDivider: {
        height: 1, backgroundColor: '#2a2d3e',
        alignSelf: 'stretch', marginVertical: 20,
    },
    permissionsTitle: {
        fontSize: 18, fontWeight: '700', color: '#fff',
        textAlign: 'center', marginBottom: 16,
    },
    checkboxRow: {
        flexDirection: 'row', alignSelf: 'stretch',
        marginBottom: 14, gap: 12, alignItems: 'flex-start',
    },
    checkbox: {
        width: 22, height: 22, borderRadius: 4,
        borderWidth: 2, borderColor: '#4a4e68',
        justifyContent: 'center', alignItems: 'center', marginTop: 2,
    },
    checkboxChecked: { backgroundColor: '#5B63D3', borderColor: '#5B63D3' },
    checkboxText: { flex: 1, color: '#9094b8', fontSize: 13, lineHeight: 18 },
});
