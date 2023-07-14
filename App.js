import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { GOOGLE_CLOUD_VISION_API_KEY } from '@env';
// https://workspace.google.com/blog/developers-practitioners/getting-started-with-the-google-vision-api-from-gsuite
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, Button, StyleSheet, Text, View } from 'react-native';

const HOTDOG_LABELS = ['hotdog', 'hot dog', 'sausage'];
const GOOGLE_IO_LOGO = require('./assets/gdg0.png')
const GDG_DAVAO_LOGO = require('./assets/gdg1.png')

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [isHotdog, setIsHotdog] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0]
      if (selectedImage) {
        setLoading(true);
        setImageUri(selectedImage.uri);
        detectHotdog(selectedImage.uri);
      }
    }
  };

  const detectHotdog = async (uri) => {
    const endpoint = 'https://vision.googleapis.com/v1/images:annotate';

    const base64ImageData = await fetch(uri)
      .then((response) => response.blob())
      .then((blob) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }));

    const mimeType = base64ImageData.match(/^data:(.*);/)[1];
    const imageContent = base64ImageData.replace(`data:${mimeType};base64,`, '');

    const body = JSON.stringify({
      requests: [
        {
          image: {
            content: imageContent,
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 10,
            },
          ],
        },
      ],
    });

    try {
      const response = await fetch(`${endpoint}?key=${GOOGLE_CLOUD_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body,
      });

      const data = await response.json();
      const labels = data.responses[0].labelAnnotations;

      const isHotdogLabel = labels.find(
        (label) => HOTDOG_LABELS.includes(label.description.toLowerCase())
      );

      setIsHotdog(Boolean(isHotdogLabel));
    } catch (error) {
      console.error('Error detecting hotdog:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <Text style={styles.appTitle}>Hotdog, !Hotdog</Text>
      <View style={styles.container}>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.imageContainer} resizeMode='contain' />}
        {
          loading ? (
            <ActivityIndicator style={{ marginVertical: 12 }} />
          ) : (
            <>
              <View style={{ height: 12 }} />
              <Button title="Upload Image" onPress={pickImage} disabled={loading} />
              <View style={{ height: 12 }} />
              {
                imageUri && !loading ? (
                  <>
                    {isHotdog && <Text style={styles.hotdogText}>✅ This is a hotdog!</Text>}
                    {!isHotdog && <Text style={styles.notHotdogText}>❌ This is not a hotdog!</Text>}
                  </>
                ) : (
                  <Text style={{ marginTop: 12 }}>Please upload an image file to be processed.</Text>
                )
              }
            </>
          )
        }
      </View>
      <View style={styles.logoContainer}>
        <Image style={styles.logo} resizeMode='contain' source={{ uri: GOOGLE_IO_LOGO }} />
        <View style={{ width: 24 }} />
        <Image style={styles.logo} resizeMode='contain' source={{ uri: GDG_DAVAO_LOGO }} />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotdogText: {
    fontFamily: `Comic Sans MS`,
    color: '#1da05b',
    fontSize: 24,
  },
  notHotdogText: {
    fontFamily: `Comic Sans MS`,
    color: '#eb4536',
    fontSize: 24,
  },
  appTitle: {
    marginTop: 12,
    fontFamily: `Comic Sans MS`,
    fontSize: 64,
    fontWeight: `bold`,
  },
  logoContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  logo: {
    width: 256,
    height: 64,
  },
  imageContainer: {
    width: 512,
    height: 256,
    borderWidth: 1,
    borderColor: 'purple',
  },
});
