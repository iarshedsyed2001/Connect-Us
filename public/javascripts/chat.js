var currentRoomID;
var currentUser;
var currentUserName;
var docData;
var lastDocument;

var currentUserLoggedOut = false;

let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

//  Check If someone has logged In or Out by setting an observer on the Auth object
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        currentUserName = user.displayName;
        readRoomList();

        //  Set the value for the username on the top-left corner
        document.querySelector('.user-name').innerHTML = `@${currentUserName}`;
    } else { 
        if(currentUserLoggedOut)
            alert("You Logged Out Successfully!")
        else
            alert("Please Login First!");    
        location.href = '/';
    }
});

//  Scroll to bottom of the message list, whenever user sends a message 
function scrollToBottom() {
    var totalHeight = document.querySelector('#message-list-top .simplebar-content-wrapper').scrollHeight;
    document.querySelector('#message-list-top .simplebar-content-wrapper').scrollTo({ top: totalHeight, behavior: "smooth" });
}

//  Check if user entered a message 
let textMessage = $('#chat-message')
$('html').keydown((e) => {
    if(e.which == 13 && textMessage.val().length !== 0) {
        sendMessage();
    }
})

//  Send message to database
function sendMessage() {
    if(textMessage.val().length !== 0) {
        var dateTime = getDateTime();

        //  Add message and other details to the database
        db.collection('rooms').doc(currentRoomID).collection('messages').add({
            sender: currentUserName,
            time: dateTime,
            message: textMessage.val(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        
        //  Add message to our chat
        $('.messages').append(`<li class="me-message"> <div class="sender-details">
                                        <span>Me  </span><span class="to-right">${dateTime}</span>
                                    </div> ${textMessage.val()}</li>`);
        
        scrollToBottom();
        textMessage.val('');
    }
}

// Variable to store listner and use it later to detach our listener
var unsubscribe;

//  Check for realtime messages 
function realTimeMessage() {
    var firstTime = true;
    //   listen for changes in document or collection
    unsubscribe = db.collection("rooms").doc(currentRoomID).collection("messages").orderBy('createdAt','desc').limit(1)
    .onSnapshot((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            // Add message of other user to our chat
            if(doc.data().sender != currentUserName && !firstTime) {
                if(doc.data().sender == "admin")    
                    $('.messages').append(`<li class="admin-message"><span>${doc.data().message}</span></li>`);
                else   
                    $('.messages').append(`<li class="other-message"><div class="sender-details"><span>${doc.data().sender} </span>
                                            <span class="to-right"> ${doc.data().time}</span></div>${doc.data().message}</li>`);
            }   
            firstTime = false;
        });
    });
}


//  Load recent messages(maximum 20) of the room/team, whenever user opens the chat window of the room/team 
async function recentMessages(){
    //  Retrieve messages in descending order of created timestamp, that means recent messages will  be retrieved first
    const docRef = await db.collection("rooms").doc(currentRoomID).collection("messages").orderBy("createdAt", "desc").limit(20);
    docData = await docRef.get();

    //  Store the snapshot of the last available message document
    lastDocument = docData.docs[docData.docs.length-1]; 

    //  Display message according to the sender's detail
    for(var i = 0; i < docData.docs.length; i++) {
        if(currentUserName == docData.docs[i].data().sender)
            $('.messages').prepend(`<li class="me-message"><div class="sender-details"><span>Me  </span>
                                        <span class="to-right"> ${docData.docs[i].data().time}</span>
                                    </div>${docData.docs[i].data().message}</li>`);

        else if(docData.docs[i].data().sender == "admin")    
            $('.messages').prepend(`<li class="admin-message"><span>${docData.docs[i].data().message}</span></li>`);
        
            else
            $('.messages').prepend(`<li class="other-message"><div class="sender-details">
                <span>${docData.docs[i].data().sender} </span><span class="to-right"> ${docData.docs[i].data().time}</span>
                </div>${docData.docs[i].data().message}</li>`);
    }
    //  Scroll to bottom, to view the recent message
    scrollToBottom();
}

//  Load previous messages in set of 20 messages, whenever user scrollup and reach's at the top of the message list
async function previousMessages(){
    //  Retrieve messages in descending order of created timestamp, that means recent messages will  be retrieved first 
    const docRef = await db.collection("rooms").doc(currentRoomID).collection("messages")
                            .orderBy("createdAt", "desc").startAfter(lastDocument).limit(20);
    
    docData = await docRef.get();

    // Check if message documents are available or not
    if(!docData.docs.length) { 
        return ;    //  If all the messages have been retrieved
    }
    //  Store the snapshot of the last available message document
    lastDocument = docData.docs[docData.docs.length-1];

    //  Display message according to the sender's detail
    for(var i = 0; i < docData.docs.length; i++){
        if(currentUserName == docData.docs[i].data().sender)
            $('.messages').prepend(`<li class="me-message"><div class="sender-details"><span>Me  </span>
                                        <span class="to-right"> ${docData.docs[i].data().time}</span>
                                    </div>${docData.docs[i].data().message}</li>`);

        else if(docData.docs[i].data().sender == "admin")    
            $('.messages').prepend(`<li class="admin-message"><span>${docData.docs[i].data().message}</span></li>`);
            
        else
            $('.messages').prepend(`<li class="other-message"><div class="sender-details">
                <span>${docData.docs[i].data().sender} </span><span class="to-right"> ${docData.docs[i].data().time}</span>
                </div>${docData.docs[i].data().message}</li>`);
    }
}


//  Check if user has reached the top of the message list
$('#message-list-top .simplebar-content-wrapper').scroll(function() {
    var container = document.querySelector('#message-list-top .simplebar-content-wrapper'); 
    if(container.scrollTop == 0) {
        //  Load previous messages
        previousMessages();  
        container.scrollTo({ top: 10, behavior: "smooth" });
    }
 });

 // Check if user has entered the room/team name
 let roomNameText = $('#room-input-id')
 $('html').keydown((e) => {
     if(e.which == 13 && roomNameText.val().length !== 0) {
         checkRoomAvailability();
     }
 })
 
 // Check if room/team is already created or not
 async function checkRoomAvailability() {
     if(roomNameText.val().length !== 0) {
        var roomname = replaceWhiteSpaces(roomNameText.val());
        var alreadyJoined = false;

        //  Check if user is already a member of the room/team or not
        await db.collection('users').doc(currentUser.uid).get().then((doc) => {
            var groupList = doc.data().groups;
            for(var i=0; i < groupList.length; i++) {
                if(groupList[i] == roomname) {
                    alreadyJoined = true;
                    break;
                }
            }
        })
        if(alreadyJoined) {
            alert("You Have Already Joined The Group");
            return;
        }
        
        //  Check if room/team name is available or not
        var roomExists = true;
        var docRef = db.collection("rooms").doc(roomname);
        docRef.get().then((doc) => {
            if (doc.exists) {
                if (confirm(roomname + ' already exists, Do you want to join?')) {
                    joinRoom(roomname, roomExists);  
                  } else {
                    alert("Create Room with Different Name")
                    return;
                  }
            } else {
                roomExists = false;
                if (confirm(roomname + ' does not exists, Do you want to Create New One?')) {
                    joinRoom(roomname, roomExists);  
                } else {
                    alert("Enter Correct Room Name To Join")
                    return;
                }  
            }
        });
     }
 }

 // Join room/team or create a room/team 
async function joinRoom(roomName, roomExists) {

    //  Add the roomname to the user's room/team list
    var docRef = await db.collection("users").doc(currentUser.uid);    
    docRef.update({
        groups: firebase.firestore.FieldValue.arrayUnion(roomName)
    });
    
    var dateTime = getDateTime();
    var adminMessage;
    if(roomExists) {
        adminMessage = currentUserName + " joined the group @" + dateTime;    
    } else {
        adminMessage = currentUserName + " created the group @" + dateTime;
        //  User becomes the admin of the newly created room
        db.collection('rooms').doc(roomName).set({
            name: roomName,
            participants: [],
            admin: currentUserName
        })
    }

    // Send notification as a message to the room/team
    db.collection('rooms').doc(roomName).collection('messages').add({
        sender: "admin",
        time: dateTime,
        message: adminMessage,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })

    //  Add the newly joined or created room to the frontend
    const htmlCode = `<li class="rooms" id=${roomName} onclick="openChat(this.id)">${roomName}</li>`;
    document.querySelector('#room-list-id').insertAdjacentHTML('afterbegin', htmlCode);

    roomNameText.val('');
}

// change the display mode of the element according to the window width, to make it mobile responsive
$(window).resize(function() {
   if(window.innerWidth < 551) {
        document.querySelector('.chat-block').style.display = 'block';
        document.querySelector('.rooms-block').style.display = 'none';
    } else {
        document.querySelector('.chat-block').style.display = 'block';
        document.querySelector('.rooms-block').style.display = 'block';
    } 
});
 
//  open chat window of the room/team clicked
function openChat(roomID) {
    if(window.innerWidth < 551) {
        document.querySelector('.chat-block').style.display = 'block';
        document.querySelector('.rooms-block').style.display = 'none';
    }

    // check if user is trying to open the chat window, which is already opened
    if(currentRoomID == roomID)
        return;
    var prevRoomId = currentRoomID;
    currentRoomID = roomID;

    if(document.querySelector('.chat-block').style.visibility == "hidden") {
        realTimeMessage();
        recentMessages(); 
        document.querySelector('.chat-block').style.visibility =  "visible";
        document.querySelector('.chat-name').innerHTML = `${currentRoomID}`;
        document.getElementById(currentRoomID).className = "room-clicked";
        
    }
    else {
        //  detach our listener from the current room/team
        unsubscribe();
        document.querySelector('.messages').innerHTML = "";
        document.querySelector('.chat-name').innerHTML = `${currentRoomID}` ;
        //  Check if previous room/team was deleted or not, if not then change its background
        if(document.getElementById(prevRoomId))
            document.getElementById(prevRoomId).className = "rooms";
        document.getElementById(currentRoomID).className = "room-clicked";
        realTimeMessage();
        recentMessages();
    } 
}

//  function gets triggered whenever user clicks the back button(which is only available in mobile view)
function openRoomList() {
    document.querySelector('.chat-block').style.display = 'none';
    document.querySelector('.rooms-block').style.display = 'block';
}

//  show the list of rooms/teams joined by the user on frontend
async function readRoomList() {
    document.querySelector('.chat-block').style.visibility =  "hidden";

    var userDocRef = await db.collection('users').doc(currentUser.uid).get();
    var groupList = userDocRef.data().groups;
    var len = groupList.length;

    for(var i = 0; i < len; i++) {
        const html =`  <li class="rooms" id=${groupList[i]} onclick="openChat(this.id)">${groupList[i]}</li>`
        document.querySelector('#room-list-id').insertAdjacentHTML('afterbegin', html);
    }
    if(len) {
        // open the recently joined room
        openChat(groupList[len-1]);
    }
}

//  Logout function
function logout() { 
    currentUserLoggedOut = true;
    firebase.auth().signOut()
}

//  function to invite others by providing and asking them to join the group/team
function inviteOhters() {
    prompt( "Ask Your Friend To Join The Team", currentRoomID );
};

//  get current date and time
function getDateTime(){
    var today = new Date();
    var date = today.getDate() + '/' + months[today.getMonth()] + '/' + today.getFullYear();
    var hour = today.getHours();
    var minutes =  today.getMinutes();
    if(hour < 9)
        hour = '0' + hour;
    if(minutes < 9)
        minutes = '0' + minutes;
    var DateTime = hour + ':' + minutes + '  ' + date;
    return DateTime;
}

//  start the meeting
async function startMeeting() {
    var dateTime = getDateTime();

    //  Send notification as a message to other members
    var adminMessage = currentUserName + " joined the meeting @" + dateTime; 
    await db.collection('rooms').doc(currentRoomID).collection('messages').add({
        sender: "admin",
        time: dateTime,
        message: adminMessage,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    window.location.href = `/meet/${currentRoomID}`;
}

//  To leave the room/team
function leaveRoom() {
    //  detach our listener from the current room/team
    unsubscribe();

    //  Open room/team list for mobile users
    if(window.innerWidth < 551) {
        openRoomList();
    }
    var dateTime = getDateTime();
    //  Send notification to the room, that user has left the room/group
    adminMessage = currentUserName + " left the group @" + dateTime;
    db.collection('rooms').doc(currentRoomID).collection('messages').add({
        sender: "admin",
        time: dateTime,
        message: adminMessage,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })

    document.querySelector('.messages').innerHTML = "";
    document.querySelector('.chat-block').style.visibility =  "hidden";
    document.getElementById(`${currentRoomID}`).remove();

    //  reomve the roomname from the users joined room/team list
    var docRef = db.collection("users").doc(currentUser.uid);
    docRef.update({
        groups: firebase.firestore.FieldValue.arrayRemove(currentRoomID)
    });
}

//  Replace white spaces with underscore in string
function replaceWhiteSpaces(str) {
    var i = 0, len = str.length;
    for (i; i < len; i++) {
        str = str.replace(" ", "_");
    }
    return str;
}








