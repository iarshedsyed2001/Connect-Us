/*
                            FIREBASE API keys are visible to users but for security,
    AFTER DEPLOYING MY PROJECT I WILL RESTRICT FIREBASE API KEY USAGE REQUESTS TO A SPECIFIED WEBSITE

For more information: https://cloud.google.com/docs/authentication/api-keys?hl=en&visit_id=637618555730645022-772762286&rd=1
*/

// Our web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIcKJHtgtJ62TCN7K4SKWhQ_haQy4eVOo",
  authDomain: "connect-us-7ac41.firebaseapp.com",
  projectId: "connect-us-7ac41",
  storageBucket: "connect-us-7ac41.appspot.com",
  messagingSenderId: "875261439407",
  appId: "1:875261439407:web:d9f2d319bada439ccdd35a"
};
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

var db = firebase.firestore()