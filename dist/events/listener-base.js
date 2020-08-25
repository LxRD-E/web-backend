"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main = () => {
    let listeners = [];
    const registerListener = (listener) => {
        let index = listeners.push(listener);
        return {
            disconnect: () => {
                listeners[index] = undefined;
                listeners = listeners.filter(val => {
                    return !!val;
                });
            },
        };
    };
    const submitEvent = (type, data) => {
        for (const listener of listeners) {
            listener(type, data);
        }
    };
    return {
        submitEvent,
        registerListener,
    };
};
exports.default = main;

