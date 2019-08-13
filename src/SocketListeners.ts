/**
 * Listeners for socket messages
 */
class SocketListeners {
    private static socketListenersInstance: SocketListeners;
    // private readonly webrtc: WebRTC;

    private constructor() {
        // this.webrtc = WebRTC.GET_INSTANCE();
    }

    public static GET_INSTANCE(): SocketListeners {
        if (this.socketListenersInstance === undefined) {
            this.socketListenersInstance = new SocketListeners();
        }

        return this.socketListenersInstance;
    }

    /**
     * Add all listeners
     */
    public addAll(socket: SocketIOClient.Socket, room: string): void {
        console.log('adding all socket listeners');

        socket.on('connect', this.connectListener);
        socket.on('disconnect', this.disConnectListener);
        socket.on(SocketMessages.message, this.messageListener);
        socket.on(SocketMessages.serverList, this.serverListListener);
        socket.on(SocketMessages.created, this.roomCreatedListener);
        socket.on(SocketMessages.full, this.fullListListener);
        socket.on(SocketMessages.joined, this.joinedListListener);
        socket.on(SocketMessages.iceCandidate, this.iceCandidateListListener);
        socket.on(SocketMessages.offer, this.offerListListener);
    }

    public removeAll(socket: SocketIOClient.Socket): void {
        socket.off('connect', this.connectListener);
        socket.off('disconnect', this.disConnectListener);
        socket.off(SocketMessages.message, this.messageListener);
        socket.off(SocketMessages.serverList, this.serverListListener);
        socket.off(SocketMessages.created, this.roomCreatedListener);
        socket.off(SocketMessages.full, this.fullListListener);
        socket.off(SocketMessages.joined, this.joinedListListener);
        socket.off(SocketMessages.iceCandidate, this.iceCandidateListListener);
        socket.off(SocketMessages.offer, this.offerListListener);

        console.log('removed listeners');
    }

    private readonly roomCreatedListener = (roomName: string): void => {
        console.log(`Created a room as ${roomName} and joined`);
        callButton.disabled = false;  // Enable call button.
        callThePeer();
    }

    private readonly connectListener = (): void => { console.log('socket connected'); };
    private readonly disConnectListener = (): void => { console.log('socket disconnected.'); };
    private readonly messageListener = (statement: string): void => { console.log(statement); };
    private readonly serverListListener = (servers: IBmrServer[]): void => {
        console.log('on serverlist');
        console.log(JSON.stringify(servers));
    }
    private readonly fullListListener = (roomName: string): void => {
        console.log(`Message from client: Room ${roomName} is full :^(`);
    }
    private readonly joinedListListener = (roomName: string): void => {
        console.log(`viewer Joined room ${roomName}`);
        callButton.disabled = false;  // Enable call button.
        callThePeer();
    }
    private readonly iceCandidateListListener = (iceCandidate: IIceCandidateMsg): void => {
        console.log(`viewer received ${SocketMessages.iceCandidate} as : `, iceCandidate);
        receivedRemoteIceCandidate(iceCandidate);
    }
    private readonly offerListListener = (description: RTCSessionDescriptionInit): void => {
        console.log(`viewer received ${SocketMessages.offer} as : `, description);
        receivedRemoteOffer(description);
    }
}
