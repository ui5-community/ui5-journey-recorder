export interface RecorderInject {
    setupHoverSelectEffect(): void;
    setupClickListener(): void;
}

export interface API {
    webSocket: { send_record_step: (step: never) => void; send_instant_message: (sMsg: never) => void; };
}

export interface UI5TestRecorderInjects {
    communication: API;

}