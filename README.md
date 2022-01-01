# Connecting Peers
By using this application more than two people can connect in real-time.

# Live Demo
#### - `Wait for the Server's reply during Signing Up` 
#### - `Don't use Special Characters in User Name and Room Name`
#### `App Link:` https://connecting-peers.herokuapp.com/   


### `You can also try these Demo Accounts:`
**Email:** `irshad@gmail.com` ,  **Password:** `$irshad` <br>
**Email:** `hussain@gmail.com` ,  **Password:** `$hussain`


## Development
### Configuration
1. Clone this repository.
2. Setup a firebase project and then add your `firebase Config` object to `public\javascripts\firebase.js`

### Running on localhost
1. In `public\javascripts\script.js` , **line no: 40** <br>
change `port: '443'`   **->**    `port: '3030'`

2. In the root directory <br>
  **Run** 
    ```
    npm install
    node server.js
    ```
    The app will run on `localhost:3030`


## TechStack
1. **FrontEnd:** `EJS, CSS and JavaScript` 
  
2. **BackEnd Server:** `NodeJS & Express.js`

3. **Video calling:** `PeerJs and Socket.IO` 
    - PeerJS wraps the browser's WebRTC implementation to provide a complete, configurable, and easy-to-use peer-to-peer connection API.

4. **Database:** `Firebase Firestore (For Data management and messaging)`


# Features
- **Responsive UI**
- **Authentication**
  - Create an account and then login
  - Auth check to prevent unauthorized users from entering
  - Users that have not joined the room/team, cannot join the team meeting using the link
  - Auto logout when tab or window gets closed
- **Create/Join Room(team)**
  - Create your own room/team
  - Join your friend's or colleague's room/team
  - Exit room/team
- **Chat feature**
  - Instant text messaging
  - Group Messaging
  - Notifications
- **Video conferencing**
  - One to one and group video calls
  - In Meet messaging
  - Mute/Unmute the Audio
  - Start/Stop the Video
  - Hand raise
  - `Informative video border` (Blue if the mic is on, Grey if the mic is off, and Golden if a user has raised his hand)
  - Participants list


# Preview
### `Sign Up`
![Signup](https://user-images.githubusercontent.com/54791162/147857170-55dbf18c-5a74-498a-9d0d-4cc245180d24.png)

### `Login`
![Login](https://user-images.githubusercontent.com/54791162/147857172-6a11f67c-31a4-4e29-9de3-1ce740e89a3f.png)

### `Chat`
![Chat](https://user-images.githubusercontent.com/54791162/147857177-58e4288a-045f-4464-b9d7-d1a50006a4bc.png)
