import React, { useState, useRef, useEffect } from 'react';
import { 
  Alert, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  ActivityIndicator 
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

export default function QRCodeScanner() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [barcodeData, setBarcodeData] = useState<string | null>(null);
  const [componentId, setComponentId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const cameraRef = useRef(null);
  const router = useRouter();
  const scanAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    startScanAnimation();
  }, [permission]);

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    setBarcodeData(data);
    const match = data.match(/(\d+)$/);
    if (match) {
      setComponentId(match[0]);
    } else {
      setComponentId(null);
      Alert.alert("Invalid QR Code", "The scanned QR code does not contain a valid component ID.");
    }
  };

  const fetchComponentDetails = async () => {
    if (!componentId) {
      Alert.alert("Error", "No valid component ID found.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`https://thilina80.tiiny.io/fetch_component.php?id=${componentId}`);
      const result = await response.json();
      if (result.success) {
        router.push({
          pathname: '/ComponentDetails',
          params: { component: JSON.stringify(result.component) },
        });
      } else {
        Alert.alert("Not Found", "No component found with this ID.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch component details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          autofocus="on"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarCodeScanned}
        >
          <View style={styles.overlay}>
            <Animated.View 
              style={[
                styles.scanLine,
                {
                  top: scanAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['5%', '85%'],
                  }),
                }
              ]}
            />
            <View style={styles.scanFrame} />
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <Text style={styles.buttonText}>Flip Camera</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>

      {barcodeData && componentId && (
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Scan QR Code Information</Text>
          <Text style={styles.cardText}>Scanned Data: {barcodeData}</Text>
          <Text style={styles.cardText}>Component ID: {componentId}</Text>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={fetchComponentDetails}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>View Component Details</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#E8F4FF', 
    padding: 10 
  },
  cameraContainer: { 
    flex: 1, 
    borderRadius: 10, 
    overflow: 'hidden' 
  },
  camera: { 
    flex: 1 
  },
  overlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#00ACC1', // Accent blue
    position: 'absolute',
  },
  scanLine: {
    width: '80%',
    height: 5,
    backgroundColor: 'red', // Vibrant purple
    position: 'absolute',
    alignSelf: 'center',
  },
  flipButton: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: '#00ACC1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    marginVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#0277BD', 
    marginBottom: 10 
  },
  cardText: { 
    fontSize: 16, 
    color: '#424242', 
    marginVertical: 5, 
    textAlign: 'center' 
  },
  viewDetailsButton: {
    backgroundColor: '#66BB6A', // Vibrant green
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
});
