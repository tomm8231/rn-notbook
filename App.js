import { useState } from 'react';
import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import { Alert, StyleSheet, View, TextInput, Button, FlatList, Text, TouchableOpacity, ScrollView, Image } from 'react-native'
import { app, database, storage } from './firebase.js'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { collection, addDoc, deleteDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore'
import * as ImagePicker from 'expo-image-picker'


export default function App() {
  const Stack = createNativeStackNavigator()
  return (
  <NavigationContainer>
    <Stack.Navigator initialRouteName='Noter'>
      <Stack.Screen name='Noter' component={Page1} />
      <Stack.Screen name='Note' component={Page2} />
    </Stack.Navigator>
  </NavigationContainer>
  )
}

const Page1 = ({navigation, route}) => {
  const messageBack = route.params?.messageBack

  const [addedTitle, setAddedTitle] = useState('')
  const [addedContent, setAddedContent] = useState('')
  //useState er react-native for et hook, som kan hægte sig på noget - som man gøre brug af
  const [imagePath, setImagePath] = useState(null)

  const [values, loading, error] = useCollection(collection(database, "notes"))
  const data = values?.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id
   }))

  async function addButtonPressed() {
      try {

        const url = await uploadImage()
    
        await addDoc(collection(database, "notes"), {
          title: addedTitle,
          content: addedContent,
          imageURL: url
        })
        setAddedTitle('')
        setAddedContent('')
        setImagePath(null)
    
    } catch(err) {
      console.log("Error in DB: " + err);
    }


  
  }

  function deleteNote(id) {
    Alert.alert(
      'Slet note?',
      '',
      [
        {
          text: 'TILBAGE',
          style: 'cancel',
        },
        {
          text: 'SLET',
          style: 'destructive',
          onPress: async () => {
            // Create a copy of the noteList and remove the note at the specified id
            await deleteDoc(doc(database, "notes", id))
          },
        },
      ]
    );
  };

  async function uploadImage() {

    try {
      const res = await fetch(imagePath)
      const blob = await res.blob()

      const uniqueImageID = Date.now().toString();
      

      const storageRef = ref(storage, uniqueImageID)
      
      const snapshot = await uploadBytes(storageRef, blob)
      const downloadURL = await getDownloadURL(snapshot.ref)

      setImagePath(downloadURL)
      return downloadURL

    
  } catch (err) {
      console.log("Fejl: " + err);
  }
  };

  async function launchImagePicker() {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true
    })
    if(!result.canceled) {
      setImagePath(result.assets[0].uri)
    } 
  }

  async function launchCamera() {
    const result = await ImagePicker.requestCameraPermissionsAsync() // spørger om lov
    if(result.granted === false) { //samme værdig og samme type
      alert("camera access not provided")
    } else {
      ImagePicker.launchCameraAsync({
        quality:1 //ikke nødvendigt
      })
      .then((response) => {
        if(!response.canceled) {
          setImagePath(response.assets[0].uri)
        }
      })
      .catch ((error) => alert("feil i kamera: " + error))
    }
  }


  return (
    <View style={styles.page1Container}>
      <View style={styles.listContainer}>
        <FlatList
          data={data}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('Note', { note: item })}>
              <View style={styles.noteItem}>
                <Text style={styles.noteText}>{item.title}</Text>
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNote(item.id)}>
                  <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputField}
          placeholder='Note Title'
          value={addedTitle}
          onChangeText={(txt) => setAddedTitle(txt)}
        />
      </View>

     <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputField}
          placeholder='Note Content'
          value={addedContent}
          onChangeText={(txt) => setAddedContent(txt)}
          onBlur= {(e) => e.target.setNativeProps({numberOfLines: 1})}
          onFocus={(e) => e.target.setNativeProps({numberOfLines: 15})}
          multiline={true}

        />
      </View>
      <View style={styles.inputContainer}>
      { (imagePath) ? (
        <Image style={{width: 75, height: 75}} source={{uri:imagePath}} />
        ) : <>
        <Button title="Vælg billede" onPress={launchImagePicker}/>
        <Button title="Kamera" onPress={launchCamera}/>
        </> }
      </View>

      <View style={styles.addBottunContainer}>
        <Button title='Add' onPress={addButtonPressed} />
      </View>
    </View>
  );
}

const Page2 = ({ route, navigation }) => {
  const note = route.params?.note
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editObj, setEditObj] = useState(null)
  const [imagePath, setImagePath] = useState(null)
  const [imageURL, setImageURL] = useState(route.params?.note.imageURL)


  //For at få uploadImage til at virke på Android, måtte fetch() nedgraderes med: npm install whatwg-fetch@3.6.2
  //Virkede fint i browser på PC fra starten
  
  function viewUpdateDialog(item) {
    setEditObj(item)
  }

  async function saveUpdate() {
    console.log(editedTitle);
    console.log(editedContent);

    await updateDoc(doc(database, "notes", editObj.id), {
      title: (editedTitle) ? editedTitle : editObj.title,
      content: (editedContent) ? editedContent: editObj.content
    })

    setEditedContent("")
    setEditedTitle("")
    setEditObj(null)
    navigation.goBack()

  }

  async function deleteImage() {
    try {
      // Check if the note has an image URL
      if (imageURL) {
        // Extract the filename from the imageURL
        const filename = imageURL.split('/').pop();
        const cleanFilename = filename.split('?')[0];
        console.log(cleanFilename);
        const storageRef = ref(storage, cleanFilename);

        // Delete the file from Firebase Storage
        await deleteObject(storageRef);

        // Remove the imageURL from the note
        await updateDoc(doc(database, "notes", note.id), {
          imageURL: null,
        });

        setImageURL(null)

        // Update the local state to clear the image
        setImagePath(null);
      }
    } catch (error) {
      console.error("Error deleting image: ", error);
    }
  }

  
  return (
    <View style={styles.page2Container}>
      <View style={styles.buttonContainer}>
      {!editObj ? (
        <TouchableOpacity style={styles.button} onPress={() => viewUpdateDialog(note)}>
          <Text style={styles.buttonText}>Rediger</Text>
        </TouchableOpacity>
      ) : (
          <TouchableOpacity style={styles.button} onPress={saveUpdate}>
            <Text style={styles.buttonText}>Gem</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.contentContainer}>
        {!editObj ? (
          <View>
            <Text style={styles.noteTitle}>{note.title}</Text>
            <Text style={styles.noteText}>{note.content}</Text>
            {imageURL && ( <>
            <Image style={{ width: 200, height: 200 }} source={{ uri: imageURL }} />
            <TouchableOpacity style={styles.deleteButton} onPress={deleteImage}>
                <Text style={styles.deleteButtonText}>Delete Image</Text>
              </TouchableOpacity>
              </>
              )}
          </View>
        ) : (
          <View>
            <TextInput
              defaultValue={editObj.title}
              onChangeText={(txt) => setEditedTitle(txt)}
              style={styles.noteTitle}
            />
            <TextInput
              defaultValue={editObj.content}
              onChangeText={(txt) => setEditedContent(txt)}
              style={styles.noteText}
              multiline={true}
            />        
          </View>
        )}
      </ScrollView>
    </View>
  );

}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EFEF', // Light beige background
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  page1Container: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  /*
  page2Container: {
    flex: 1,
    backgroundColor: '#F3EFEF', // Light beige background
    paddingTop: 20, // Add space to the top
    alignItems: 'center',
  },
  */
  page2Container: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    paddingTop: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  /*
  contentContainer: {
    width: '80%',
    padding: 20,
    borderColor: '#D0B89C', // Thin border color
    borderWidth: 1, // Thin border width
    borderRadius: 5, // Rounded corners
    backgroundColor: '#FFFFFF', // White background for content
  },
  */
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  addButtonContainer: {
    flex: 1, // This makes the button fill out the entire row
    padding: 10,
  },
  noteText: {
    fontSize: 18,
    lineHeight: 24,
    color: '#333', // Dark text color
  },
  listContainer: {
    flex: 1,
    paddingTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#D0B89C', // Warm brownish border color
  },
  inputField: {
    flex: 1,
    marginRight: 10,
    color: '#7E6158', // Rusty brown text color
    textAlignVertical: 'top', // Place text at the top
  },
  /*
  noteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  */
  noteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  noteText: {
    fontSize: 18,
    lineHeight: 24,
    color: '#333',
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#D0B89C',
    backgroundColor: '#F5E1C1', // Light orange background for notes
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    alignSelf: 'stretch', // Make the button stretch to the top
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 10,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#007BFF', // Blue color, you can change this
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },

});
