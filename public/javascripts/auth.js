var newUserRegistered = false;

/* User Name shouldn't contain special characters */

//  SignUp function
async function signup(event) {
    // Prevent Signup page from refreshing after submit button is clicked
    event.preventDefault() 

    //  User Input
    const email = document.querySelector('#signupEmail')
    const password = document.querySelector('#signupPassword')
    const userName = document.querySelector('#userName')

    //  check if all details are entered or not
    if(email.value == '' || password.value == '' || userName.value == '') {
        alert("Please Enter All Details");
        location.href = '/signup';
    }

    newUserRegistered = true;
    userName.value = replaceWhiteSpaces(userName.value);
    document.querySelector('.p2').style.display = 'block';

    //  Check if User Name is available or not
    var docRef = await db.collection("usernames").doc(userName.value).get();
    if (docRef.exists) {
        alert("Username is already registered, Try different Username");
        return;
    }

    //  signup user using his email ID and password
    try { 
        const result = await firebase.auth().createUserWithEmailAndPassword(email.value, password.value)
        await result.user.updateProfile({
            displayName: userName.value,
        })
    } catch (err) {
        alert("Please Enter Correct Details");
        location.href = '/signup';
    }

    //  Store essentially User details on database
    var User = await firebase.auth().currentUser;
    await db.collection('users').doc(User.uid).set({
        name: User.displayName,
        email: User.email,
        groups: [],
        uid: User.uid
    })

    //  Store the newly registered username on database
    await db.collection('usernames').doc(User.displayName).set({
        name: User.displayName,
    })
    
    //  Logout and ask the user to login 
    logout();
    alert("ACCOUNT SUCCESSFULLY CREATED, PLEASE LOGIN NOW");
    window.location.href = '/';

    //  Erase the entered data from the input field
    email.value = ""
    password.value = ""
    userName.value = ""
}

//  Login Function
async function login(event) {
    event.preventDefault()  

    //  User Input
    const email = document.querySelector('#loginEmail')
    const password = document.querySelector('#loginPassword')

    //  The state will only persist in the current session or tab, and will be cleared when the tab or window is closed
    const res = await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
    
    //  Login using email ID and password
    try { 
        const result = await firebase.auth().signInWithEmailAndPassword(email.value, password.value)

        //  Erase the input fields and move to home screen 
        email.value = ""
        password.value = ""
        location.href = '/home';
    } catch (err) {
        //  Show error for incorrect email or password or any other thing
        alert("Please Enter Correct Details");
    }
}

//  Logout Function
function logout() { 
    firebase.auth().signOut()
}

//  Check If someone has logged In or Out by setting an observer on the Auth object
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        if(newUserRegistered)
            newUserRegistered = false;
        else
            location.href = '/home';  //  If someone is logged In, then move to home screen 
    }
});

//  Function to move to Signup page
function callSignup() {
    location.href = '/signup';
}

//  Function to move to Login page
function callLogin() {
    location.href = '/';
}

//  Replace white spaces with underscore in string
function replaceWhiteSpaces(str) {
    var i = 0, len = str.length;
    for (i; i < len; i++) {
        str = str.replace(" ", "_");
    }
    return str;
}
