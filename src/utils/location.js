import * as Location from 'expo-location';

export const requestLocationPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        return false;
    }
    return true;
};

export const getCurrentLocation = async () => {
    let location = await Location.getCurrentPositionAsync({});
    return location.coords;
};
