function callThePeer(): void {
    console.log('Starting call.');

    socket.emit(SocketMessages.startCall, room);   // Send a message to host for initializing call

    // Allows for RTC server configuration.
    const servers: RTCConfiguration = {
        iceServers: [{
            urls: ['turn:bmrturn.idrivelite.com:3478'],
            username: 'bmr-turn-user',
            credential: 'insecure-key'
        }]
    };

    // Create peer connections and add behavior.

    remotePeerConnection = new RTCPeerConnection(servers);
    console.log('Created remote peer connection object remotePeerConnection.');

    remotePeerConnection.ondatachannel = receiveChannelCallback;

    remotePeerConnection.addEventListener('icecandidate', handleConnection);
    remotePeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange);
    remotePeerConnection.addEventListener('track', gotRemoteMediaStream);
}

// Handles remote MediaStream success by adding it as the remoteVideo src.
function gotRemoteMediaStream(event: RTCTrackEvent): void {
    const mediaStream: MediaStream = event.streams[0];
    if (remoteVideo.srcObject === null) {
        remoteVideo.srcObject = mediaStream;
        remoteStream = mediaStream;
        console.log('viewer Remote peer connection received remote stream.');
    }
}

function receiveChannelCallback(event: RTCDataChannelEvent): void {
    console.log('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.onmessage = onReceiveMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
    enableRemoteMouseAndKeyBoard();
}

function onReceiveMessageCallback(event: MessageEvent): void {
    console.log('Received Message from channel', event.data);
}

function onReceiveChannelStateChange(): void {
    const readyState: RTCDataChannelState = receiveChannel.readyState;
    console.log(`Receive channel state is: ${readyState}`);
}

// Define RTC peer connection behavior.

// Connects with new peer candidate.
function handleConnection(event: RTCPeerConnectionIceEvent): void {
    const iceCandidate: RTCIceCandidate | null = <RTCIceCandidate>event.candidate;

    if (iceCandidate !== null && iceCandidate.sdpMid !== null && iceCandidate.sdpMLineIndex !== null) {
        const candidateMsg: IIceCandidateMsg = {
            candidate: iceCandidate.candidate,
            id: iceCandidate.sdpMid,
            label: iceCandidate.sdpMLineIndex
        };

        socket.emit(SocketMessages.iceCandidate, candidateMsg, room);

        console.log(`viewer ICE candidate:\n${iceCandidate.candidate}.`);
    }
}

function receivedRemoteIceCandidate(rTCIceCandidateInit: IIceCandidateMsg): void {
    // if (pc2.remoteDescription !== null && evt.candidate !== null)
    //want to make sure remote description is set and that the candidate is not null
    //(the last one will be null to indicate it being the last candidate for that signalling period)
    if (rTCIceCandidateInit.candidate.trim().length !== 0) {

        const newIceCandidate: RTCIceCandidate = new RTCIceCandidate({
            candidate: rTCIceCandidateInit.candidate,
            sdpMLineIndex: rTCIceCandidateInit.label,
            sdpMid: rTCIceCandidateInit.id
        });

        if (remotePeerConnection !== undefined) {
            remotePeerConnection.addIceCandidate(newIceCandidate)
                .then(() => {
                    handleConnectionSuccess();
                })
                .catch((error: Error) => {
                    handleConnectionFailure(error);
                });
        }
        console.log(`recieved ICE candidate:\n ${rTCIceCandidateInit.candidate}.`);
    }
}

// Logs that the connection succeeded.
function handleConnectionSuccess(): void {
    console.log(`viewer addIceCandidate success.`);
}

// Logs that the connection failed.
function handleConnectionFailure(error: Error): void {
    console.log(`viewer failed to add ICE Candidate:\n ${error.toString()}.`);
}

// Logs changes to the connection state.
function handleConnectionChange(event: Event): void {
    const peerConnection: RTCPeerConnection | null = <RTCPeerConnection>event.target;
    console.log('viewer ICE state change event: ', event);
    console.log(`viewer ICE state: ` +
        `${peerConnection.iceConnectionState}.`);
}

// Define helper functions.console.log("received ice-candidate as : ", iceCandidate);

// Logs a message with the id and size of a video element.
function logVideoLoaded(event: Event): void {
    const video: HTMLVideoElement | null = <HTMLVideoElement>event.target;
    console.log(`videoWidth: ${video.videoWidth}px, videoHeight: ${video.videoHeight}px.`);
}

function logResizedVideo(event: Event): void {
    logVideoLoaded(event);
}

remoteVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('onresize', logResizedVideo);

// Logs offer creation and sets peer connection session descriptions.
function receivedRemoteOffer(description: RTCSessionDescriptionInit): void {
    console.log('remotePeerConnection setRemoteDescription start.');
    if (remotePeerConnection !== undefined) {
        remotePeerConnection.setRemoteDescription(new RTCSessionDescription(description))
            .then(() => {
                if (remotePeerConnection !== undefined) { setRemoteDescriptionSuccess(); }
            })
            .catch(setSessionDescriptionError);
    }
    console.log('remotePeerConnection createAnswer start.');
    if (remotePeerConnection !== undefined) {
        remotePeerConnection.createAnswer()
            .then(createdAnswer)
            .catch(setSessionDescriptionError);
    }
}

// Logs answer to offer creation and sets peer connection session descriptions.
function createdAnswer(description: RTCSessionDescriptionInit): void {
    console.log(`Answer from remotePeerConnection:\n${description.sdp}.`);

    console.log('remotePeerConnection setLocalDescription start.');
    if (remotePeerConnection !== undefined) {
        remotePeerConnection.setLocalDescription(description)
            .then(() => {
                if (remotePeerConnection !== undefined) { setLocalDescriptionSuccess(); }
            })
            .catch(setSessionDescriptionError);
    }

    socket.emit(SocketMessages.answer, description, room);
}

// Logs success when setting session description.
function setDescriptionSuccess(functionName: string): void {
    console.log(` ${functionName} complete.`);
}

// Logs success when localDescription is set.
function setLocalDescriptionSuccess(): void {
    setDescriptionSuccess('setLocalDescription');
}

// Logs error when setting session description fails.
function setSessionDescriptionError(error: Error): void {
    console.log(`Failed to create session description: ${error.toString()}.`);
}
// Logs success when remoteDescription is set.
function setRemoteDescriptionSuccess(): void {
    setDescriptionSuccess('setRemoteDescription');
}

function enableRemoteMouseAndKeyBoard(): void {
    remoteVideo.addEventListener('mousemove', (ev: MouseEvent) => {
        sendMouseMove(ev);
    });
    remoteVideo.addEventListener('mousedown', (ev: MouseEvent) => {
        sendMouseDown(ev);
    });
    remoteVideo.addEventListener('mouseup', (ev: MouseEvent) => {
        sendMouseUp(ev);
    });
    // document.addEventListener("keyup", (ev) => {
    //     ev.preventDefault();
    //     mProxy.sendKeyCode(ev.code, KeyAction.UP);
    // }, true);
    document.addEventListener('keydown', (ev: KeyboardEvent) => {
        ev.preventDefault();
        console.log('keydown ', ev.key);
        sendKeyDown(ev);
    },                        true);
    document.addEventListener('keyup', (ev: KeyboardEvent) => {
        ev.preventDefault();
        sendKeyUp(ev);
    },                        true);
    remoteVideo.addEventListener('wheel', (ev: WheelEvent) => {
        ev.preventDefault();
        sendWheelMovement(ev);
    });
}
