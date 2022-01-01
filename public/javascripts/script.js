const socket = io('/');  
const videoGrid = document.getElementById('video-grid');

const myVideo = document.createElement('video');
let handValue = false;
let mikeValue = true;
myVideo.muted = true;

let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let currentUserName;
let myVideoStream;
var peer;

var docData; 
var lastDocument;

//  Check If someone has logged In or Out by setting an observer on the Auth object
firebase.auth().onAuthStateChanged((user) => {
    //  If user is logged in
    if (user) {
        currentUserName = user.displayName;

        // check if the current user is member of the room/team or not
        db.collection('users').doc(user.uid).get().then((doc) => {
            var groupList = doc.data().groups;
            var trueRoomUser = false;
            for(var i=0; i < groupList.length; i++) {
                if(groupList[i]==ROOM_ID) {
                    trueRoomUser = true;
                    break;
                }     
            }
            //  If they are not a meber of the room/team then ask them to join the team first
            if(!trueRoomUser) {
                alert("Please Join The Room First");
                location.href = '/home';
            }
        })

        //  Create a peer
        peer = new Peer(currentUserName, {
            path: '/peerjs',
            host: '/',
            port: '3030' // change this to 443 for deploying 
        });

        //  take media permission
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(stream => {
            myVideoStream = stream;

            //  dislpay the stream in video element
            myVideo.setAttribute('id', `${currentUserName}`);
            myVideo.setAttribute('class', 'border-blue');
            createVideoDiv(currentUserName);
            addVideoStream(myVideo, stream, currentUserName);
            
            //  Answer the call of other users
            peer.on('call', call => {
                createVideoDiv(call.peer);
                //  Answer the call of other users by sending our stream
                call.answer(stream);
                
                const video = document.createElement('video')
                
                //  dislpay the stream of other user in video element
                call.on('stream', userVideoStream => {  
                    video.setAttribute('id', `${call.peer}`);
                    socket.emit('videoBorder', call.metadata.hvalue, call.metadata.mvalue, call.peer);
                    addVideoStream(video, userVideoStream, call.peer);
                })
            })

            /*  function initiated if socket reads an event that user is connected,
                this event is emitted by server.js to every user in the room whenever a new user joins   */
            socket.on('user-connected', (userId) => {
                //  wait for a sec so that all connections are made before connectiong to a new user
                setTimeout(connectToNewUser,1000,userId,stream)
            })
        
            /*  function initiated if socket reads an event that user disconnected,
                this event is emitted by server.js to every user in the room whenever any user leaves the meeting   */
            socket.on('user-disconnected', (userId) => {
                //  video element of that user need to be removed
                var divId = userId + "-div"
                const videoElement = document.getElementById(`${divId}`);
                if(videoElement)
                    videoElement.remove();
                
                //  user need to be removed from the participants list
                var docRef = db.collection("rooms").doc(ROOM_ID);
                docRef.update({
                    participants: firebase.firestore.FieldValue.arrayRemove(userId)
                });
            })
        }, (error) => {
            //  alert message if permissions not given
            alert("Camera and Microphone Permission are Required for a Video Conversation.")
        });
        
        //peer listens to an event 'open' which is made when a new connection is established to the peer server
        peer.on('open', id => {
            socket.emit('join-room', ROOM_ID, id);

            //  user need to be added to the participants list
            var docRef = db.collection("rooms").doc(ROOM_ID);
            docRef.update({
                participants: firebase.firestore.FieldValue.arrayUnion(currentUserName)
            });
        })

    } else { 
        // if user is not logged in then ask them to login
         alert("Please Login First!");  
        location.href = '/';
    }
});

//  function to connect to new users
const connectToNewUser = (userId, stream) => {
    // mic value(on/off) and hand raise value is send to others as metadata
    option = {metadata: {"mvalue": stream.getAudioTracks()[0].enabled, "hvalue": handValue}};

    //  creat a call to send to new user with our own stream and metadata
    const call = peer.call(userId, stream, option);
    var video = document.createElement('video');
    createVideoDiv(userId);
    
    //  display received stream from the called user on our screen 
    call.on('stream', userVideoStream => {
        video.setAttribute('id', `${call.peer}`);
        video.setAttribute('class', 'border-blue');
        addVideoStream(video, userVideoStream,call.peer)
    })
}

//  function to dislpay stream on the screen
const addVideoStream = (video, stream, userName) => {
    var divId = userName + "-div"    
    video.srcObject = stream;

    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    document.getElementById(`${divId}`).append(video);
}

//  function to create div element with specific ID for the video element
const createVideoDiv = (userName) => {
    var divId = userName + "-div"

    var html = `
    <div class="video-class" id=${divId}>
        <div class="video-name" >${userName}</div>
    </div>`
    videoGrid.insertAdjacentHTML('beforeend', html);
}


// function to mute/unmute audio
const muteUnmute = () => {
    let track  = myVideoStream.getAudioTracks()[0].enabled;
    if (track) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        mikeValue = false;
        socket.emit('videoBorder', handValue, mikeValue, currentUserName);
        const html = ` <i class="unmute fas fa-microphone-slash"></i> `
        document.querySelector('.mute-button').innerHTML = html;
    } else {
        const html = ` <i class="fas fa-microphone"></i> `
        document.querySelector('.mute-button').innerHTML = html;
        myVideoStream.getAudioTracks()[0].enabled = true;
        mikeValue = true;
        socket.emit('videoBorder', handValue, mikeValue, currentUserName);
    }
}

// function to play/stop video
const playStop = () => {
    let track  = myVideoStream.getVideoTracks()[0].enabled;
    if (track ) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        const html = ` <i class="stop fas fa-video-slash"></i> `
        document.querySelector('.video-button').innerHTML = html;
    } else {
        const html = ` <i class="fas fa-video"></i> `
        document.querySelector('.video-button').innerHTML = html;
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

// function to change video border of any user depending on their mic or hand raise value 
socket.on('setVideoBorder', (hvalue, mvalue, UId) => {
    let uidElement = document.getElementById(`${UId}`);
    if(uidElement) {
        if(hvalue)
            uidElement.setAttribute('class', 'border-gold');
        else if(mvalue)
            uidElement.setAttribute('class', 'border-blue');
        else
            uidElement.setAttribute('class', 'border-grey');
    }
})

//  function to emit hand raised or not by the user
const hand = () => {
    if (handValue) {
        handValue = false;
        document.getElementById('hand-up').setAttribute('id', 'hand-down');
        socket.emit('videoBorder', handValue, mikeValue, currentUserName);
    } else {
        handValue = true;
        document.getElementById('hand-down').setAttribute('id', 'hand-up');
        socket.emit('videoBorder', handValue, mikeValue, currentUserName);
    }
}

//  function to invite others by providing and asking them to join the group/team
function inviteOhters() {
    prompt( "Ask Your Friend To Join The Group First", ROOM_ID );
};


//  Scroll to bottom of the message list, whenever user sends a message 
function scrollToBottom() {
    var totalHeight = document.querySelector('#list-top .simplebar-content-wrapper').scrollHeight;
    document.querySelector('#list-top .simplebar-content-wrapper').scrollTo({ top: totalHeight, behavior: "smooth" }); 
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
        db.collection('rooms').doc(ROOM_ID).collection('messages')
        .add({
            sender: currentUserName,
            time: dateTime,
            message: textMessage.val(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        //  Add message to our chat
        $('.messages').append(`<li class="me-message">
                                    <div class="sender-details">
                                        <span>Me  </span><span>${dateTime}</span>
                                    </div>${textMessage.val()}</li>`);
        scrollToBottom();
        textMessage.val('');
    }
}

//  Check for realtime messages
function realTimeMessage() {
    var firstTime = true;
    //   listen for changes in document or collection
    db.collection("rooms").doc(ROOM_ID).collection("messages").orderBy('createdAt','desc').limit(1)
    .onSnapshot((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            // Add message of other user to our chat
            if(doc.data().sender != currentUserName && !firstTime)
            {
                if(doc.data().sender == "admin")    
                    $('.messages').append(`<li class="admin-message"><span>${doc.data().message}</span></li>`);
                else
                    $('.messages').append(`<li class="other-message"><div class="sender-details"><span>${doc.data().sender} </span>
                                            <span> ${doc.data().time}</span></div>${doc.data().message}</li>`);
            }   
            firstTime = false;
        });
    });
    document.querySelector('#chat-heading').innerHTML = `${ROOM_ID}`;
}
realTimeMessage();

//  Load recent messages(maximum 20) of the room/team, whenever user opens the chat window of the room/team 
async function recentMessages(){
    //  Retrieve messages in descending order of created timestamp, that means recent messages will  be retrieved first
    const ref = await db.collection("rooms").doc(ROOM_ID).collection("messages").orderBy("createdAt", "desc").limit(20);
    docData = await ref.get();

    //  Store the snapshot of the last available message document
    lastDocument = docData.docs[docData.docs.length-1];

    //  Display message according to the sender's detail
    for(var i = 0; i < docData.docs.length; i++){
        
        if(currentUserName == docData.docs[i].data().sender)
            $('.messages').prepend(`<li class="me-message"><div class="sender-details"><span>Me  </span>
                    <span>${docData.docs[i].data().time}</span></div>${docData.docs[i].data().message}</li>`);

        else if(docData.docs[i].data().sender == "admin")    
            $('.messages').prepend(`<li class="admin-message"><span>${docData.docs[i].data().message}</span></li>`);

        else
        $('.messages').prepend(`<li class="other-message"><div class="sender-details"><span>${docData.docs[i].data().sender} </span>
                                <span> ${docData.docs[i].data().time}</span></div>${docData.docs[i].data().message}</li>`);

    }
    //  Scroll to bottom, to view the recent message
    scrollToBottom();
}

recentMessages();

//  Load previous messages in set of 20 messages, whenever user scrollup and reach's at the top of the message list
async function previousMessages(){
    const ref = await db.collection("rooms").doc(ROOM_ID).collection("messages")
                        .orderBy("createdAt", "desc").startAfter(lastDocument).limit(20);
    docData = await ref.get();

    // Check if message documents are available or not
    if(!docData.docs.length) {
        return ;
    }
    lastDocument = docData.docs[docData.docs.length-1];
    
    //  Display message according to the sender's detail
    for(var i=0; i<docData.docs.length; i++){

        if(currentUserName == docData.docs[i].data().sender)
            $('.messages').prepend(`<li class="me-message"><div class="sender-details"><span>Me  </span>
                        <span>${docData.docs[i].data().time}</span></div>${docData.docs[i].data().message}</li>`);

        else if(docData.docs[i].data().sender == "admin")    
            $('.messages').prepend(`<li class="admin-message"><span>${docData.docs[i].data().message}</span></li>`);

        else
        $('.messages').prepend(`<li class="other-message"><div class="sender-details"><span>${docData.docs[i].data().sender} </span>
                        <span> ${docData.docs[i].data().time}</span></div>${docData.docs[i].data().message}</li>`);
    }
}

//  Check if user has reached the top of the message list
$('#list-top .simplebar-content-wrapper').scroll(function() {
    var container = document.querySelector('#list-top .simplebar-content-wrapper'); 
    if(container.scrollTop == 0) {
        previousMessages();  
        container.scrollTo({ top: 10, behavior: "smooth" });
    }
 });

 //  To leave the meeting
async function leaveMeeting() {
    //  Geet confirmation from the user
    if (confirm('Are You Sure You Want To Leave This Meeting?')) {
        var dateTime = getDateTime();

        //   add notification in chat
        var adminMessage = currentUserName + " left the meeting @" + dateTime; 
        await db.collection('rooms').doc(ROOM_ID).collection('messages')
        .add({
            sender: "admin",
            time: dateTime,
            message: adminMessage,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })

        //  Update participants list
        var userDocRef = await db.collection('rooms').doc(ROOM_ID).get();
        var participantList = userDocRef.data().participants;
        
        if(participantList.length == 1) {
            await db.collection("rooms").doc(ROOM_ID).update({
                    participants: firebase.firestore.FieldValue.arrayRemove(currentUserName)
            });
        }
        //  Move to home
        window.location.href = '/home';
      } 
}

//  get current date and time
function getDateTime(){
    var today = new Date();
    var date = today.getDate()+'/' + months[today.getMonth()]+'/'+today.getFullYear();
    var hour = today.getHours();
    var minutes =  today.getMinutes();
    if(hour < 9)
        hour = '0' + hour;
    if(minutes < 9)
        minutes = '0' + minutes;
    var DateTime = hour + ':' + minutes + '  ' + date;
    return DateTime;
}

//  To display all the participants in the meeting
function readParticipantsList() {
    db.collection("rooms").doc(ROOM_ID).onSnapshot((doc) => {
        if (doc.exists) {
            var participantList = doc.data().participants;
            document.querySelector('.participants-list').innerHTML = "";
            document.querySelector('#participants-count').innerHTML = `# ${participantList.length}`;

            for(var i=0; i<participantList.length; i++) {
                const html =`<li class="participant"><span>${participantList[i]}</span></li>`
                document.querySelector('.participants-list').insertAdjacentHTML('beforeend', html);
            }
        }
    });
}

readParticipantsList();