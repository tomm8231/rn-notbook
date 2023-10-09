import { useState } from 'react';
import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import { Alert, StyleSheet, View, TextInput, Button, FlatList, Text, TouchableOpacity, ScrollView, Image } from 'react-native'
import { app, database, storage } from './firebase.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, deleteDoc, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';


export default function App() {
  const Stack = createNativeStackNavigator()

  return (
  <NavigationContainer>
    <Stack.Navigator initialRouteName='Login'>
      <Stack.Screen name= 'Login' component={Login} />
      <Stack.Screen name='Noter' component={Page1} />
      <Stack.Screen name='Note' component={Page2} />
    </Stack.Navigator>
  </NavigationContainer>
  )
}

const Login = ({navigation, route}) => {
  const API_KEY = "AIzaSyCuinWjjoyxUEl1js_D17D91NRF8SpsjUg"
  const url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key="
  const urlSignUp = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key="
  const [ enteredEmail, setEnteredEmail ] = useState("t@t.dk")
  const [ enteredPassword, setEnteredPassword ] = useState("123456")

 async function addCollectionForUser() {
      const collectionId = enteredEmail;
      const documentId = enteredEmail;
      const value = { versionUsed: "V9" }; 
      await setDoc(doc(database, collectionId, documentId), value); 
 }



  async function login() {
    try {
      const response = await axios.post(url + API_KEY, {
        email: enteredEmail,
        password: enteredPassword,
        returnSecureToken: true
      })
      navigation.navigate('Noter', {enteredEmail})
    } catch (error) {
      alert("Not logged in: " + error.response.data.error.errors[0].message)
    }

  }

  async function signUp() {
    try {
      const response = await axios.post(urlSignUp + API_KEY, {
        email: enteredEmail,
        password: enteredPassword,
        returnSecureToken: true
      })
      await addCollectionForUser()
      alert("Oprettet. Token: " + response.data.idToken)
    } catch (error) {
      alert("Not oprettet in: " + error.response.data.error.errors[0].message)
    }

  }

  return (
    <View style={styles.loginContainer}>
    <Text style={styles.loginHeader}>Login or Sign Up</Text>
    <TextInput
      style={styles.loginInputField}
      placeholder="Email"
      onChangeText={(text) => setEnteredEmail(text)}
      value={enteredEmail}
    />
    <TextInput
      style={styles.loginInputField}
      placeholder="Password"
      secureTextEntry
      onChangeText={(text) => setEnteredPassword(text)}
      value={enteredPassword}
    />
    <View style={styles.loginButtonContainer}>
      <Button title="Login" onPress={login} />
      <Button title="Sign Up" onPress={signUp} />
    </View>

  </View>
  )
}

const Page1 = ({navigation, route}) => {

  const messageBack = route.params?.messageBack

  const [addedTitle, setAddedTitle] = useState('')
  const [addedContent, setAddedContent] = useState('')
  //useState er react-native for et hook, som kan hægte sig på noget - som man gøre brug af
  const [imagePath, setImagePath] = useState(null)
  const [isImportant, setIsImportant] = useState(false); // State for "important note" button
  const importantButtonColor = isImportant ? 'green' : undefined;


  const [values, loading, error] = useCollection(collection(database, route.params.enteredEmail))
  const data = values?.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id
   }))

  const toggleImportant = () => {
    setIsImportant(!isImportant);
  };


  async function addButtonPressed() {
      try {

        const url = await uploadImage()
    
        await addDoc(collection(database, route.params.enteredEmail), {
          title: (isImportant) ? "[ ! ] " + addedTitle : addedTitle || (!addedTitle) ? (addedContent) ? addedContent : "Tom note" : "",
          content: addedContent,
          imageURL: (url) ? url : null
        })
        setAddedTitle('')
        setAddedContent('')
        setImagePath(null)
        setIsImportant(false);

    
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
            await deleteDoc(doc(database, route.params.enteredEmail, id))
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
    <View style={[styles.page1Container]}>
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
          placeholder='Titel'
          value={addedTitle}
          onChangeText={(txt) => setAddedTitle(txt)}
        />
      </View>

     <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputField}
          placeholder='Indhold'
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
        <Button title="Vigtig!" onPress={toggleImportant} color={importantButtonColor} />
      </View>

      <View style={styles.addBottunContainer}>
        <Button title='Gem note' onPress={addButtonPressed} />
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

    await updateDoc(doc(database, route.params.enteredEmail, editObj.id), {
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
        await updateDoc(doc(database, route.params.enteredEmail, note.id), {
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
            {imageURL && (
            <Image style={{ width: 200, height: 200 }} source={{ uri: imageURL }} /> )}
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
            {imageURL && ( <>
            <Image style={{ width: 200, height: 200 }} source={{ uri: imageURL }} />
            <TouchableOpacity style={styles.deleteButton} onPress={deleteImage}>
                <Text style={styles.deleteButtonText}>Delete Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={deleteImage}>
                <Text style={styles.addNewPhotoButton}>Indsæt nyt billede</Text>
              </TouchableOpacity>

              </>
              )}   
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

  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loginHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loginInputField: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  loginButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  map: {
    width: '100%',
    height: '100%'
  }

});
