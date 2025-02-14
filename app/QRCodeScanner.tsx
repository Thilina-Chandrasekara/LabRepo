import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { 
  Button, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [barcodeData, setBarcodeData] = useState<string | null>(null);
  const [barcodeType, setBarcodeType] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState<string>('');
  const cameraRef = useRef(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    setBarcodeType(type);
    setBarcodeData(data);
  };

  const handleManualSubmit = () => {
    if (manualEntry.trim()) {
      setBarcodeType('manual');
      setBarcodeData(manualEntry.trim());
      setManualEntry('');
    }
  };

  const requestToReserve = () => {
    if (barcodeData) {
      // Simulate sending request for component reservation based on barcodeData
      console.log(`Sending request to reserve component with ${barcodeType}: ${barcodeData}`);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.cameraContainer}>
          <CameraView 
            ref={cameraRef}
            style={styles.camera} 
            facing={facing}
            autofocus="on"
            barcodeScannerSettings={{
              barcodeTypes: [
                "qr",
                "ean13",
                "ean8",
                "upc_e",
                "code39",
                "code93",
                "code128",
                "itf14",
                "codabar",
                "datamatrix",
                "pdf417"
              ],
            }}
            onBarcodeScanned={handleBarCodeScanned}
          >
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                  <Text style={styles.buttonText}><Ionicons name="camera-reverse" size={44} color="white" /> </Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>

        <View style={styles.manualEntryContainer}>
          <Text style={styles.manualEntryTitle1}>
            Can't find component QR?
          </Text>
          <Text style={styles.manualEntryTitle}>
            Enter your Component ID here.
          </Text>
          <TextInput
            style={styles.input}
            value={manualEntry}
            onChangeText={setManualEntry}
            placeholder="Component ID: eg. CMP12345"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleManualSubmit}
          >
            <Text style={styles.submitButtonText}>Search Manually</Text>
          </TouchableOpacity>
        </View>

        {barcodeData && (
          <View style={styles.barcodeCard}>
            <Text style={styles.cardTitle}>Scan QR code Information</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}>QR code type: {barcodeType}</Text>
              <Text style={styles.cardText}>Your Component number {barcodeData}</Text>
              <Text style={styles.timestamp}>
                Scanned at: {new Date().toLocaleString()}
              </Text>
              <TouchableOpacity 
                style={styles.reserveButton}
                onPress={requestToReserve}
              >
                <Text style={styles.reserveButtonText}>Request to Reserve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CAMERA_HEIGHT = SCREEN_HEIGHT * 0.4;
const FRAME_WIDTH = SCREEN_WIDTH * 0.9;
const FRAME_HEIGHT = FRAME_WIDTH;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  cameraContainer: {
    height: CAMERA_HEIGHT,
    overflow: 'hidden',
  },
  camera: {
    height: CAMERA_HEIGHT,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: FRAME_WIDTH,
    height: FRAME_WIDTH,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    position: 'absolute',
    left: (SCREEN_WIDTH - FRAME_WIDTH) / 2,
    top: (CAMERA_HEIGHT - FRAME_HEIGHT) / 2,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  manualEntryContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  manualEntryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8e44ad',
    marginBottom: 15,
    textAlign: 'center',
  },
  manualEntryTitle1: {
    fontSize: 26,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    color: '#333', 
  },
  submitButton: {
    backgroundColor: '#e84393',
    padding: 10,
    borderRadius: 5,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  barcodeCard: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cardContent: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
  },
  cardText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#444',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  reserveButton: {
    backgroundColor: '#2980b9',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  reserveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
