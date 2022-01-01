const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server)

const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use('/peerjs', peerServer);

// if the user sends a req for the root url, render the login view
app.get('/', (req, res) => {
    res.render('login'); 
})

// if the user sends a req for the home, render the chat view
app.get('/home', (req, res) => {
    res.render('chat'); 
})

// if the user sends a req for the signup, render the signup view
app.get('/signup', (req, res) => {
    res.render('signup'); 
})

// if the user sends a req for the meet/room, render the particular room view
app.get('/meet/:room', (req, res) => {
    res.render('room', {roomId: req.params.room })
})

// handling the connection event for socket object
io.on('connection', socket => {
    /*  function initiated if socket reads join-room event called by peer when a new peer connection is made with peer server,
        so to join the user to that room using socket  */
    socket.on('join-room', (roomId, userId) => {
        
        socket.join(roomId);
        //  logs for server to check if new user connected or not
        console.log("User:" + userId + "  Joined Room:" + roomId);

        /*  broadcast event user-connected to all other users for every new user joining the room.
            So that other users connected to that room can append the new user stream to their room view     */
        socket.to(roomId).emit('user-connected', userId);
        

        /*  disconnect event is initiated when a user leaves the room,
            user-disconnected event is broadcasted to other users of the room, 
            so that they can remove his stream from their room view  */
        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
        })
        
        /*  videoBorder event is initiated when a user turns on/off his mic or raise/lower his hand,
            setVideoBorder event is broadcasted to all users of the room, 
            so that they can change the border color of that users video element in their room view  */
        socket.on('videoBorder', (hvalue, mvalue, id) => {
            io.to(roomId).emit('setVideoBorder', hvalue, mvalue, id);
        })
    })
})

server.listen(process.env.PORT || 3030);
