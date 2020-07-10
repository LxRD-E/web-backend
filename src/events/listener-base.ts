type listener<eventType, dataArg = any> = (eventType: eventType, data: dataArg) => any;

type disconnectFunction = {
    disconnect: () => void;
}

export type mainFunction<eventType, dataArg> = {
    submitEvent: (type: eventType, data: dataArg) => void;
    registerListener: (listener: listener<eventType, dataArg>) => disconnectFunction;
}

export interface IForumPost {
    userId: number;
}

const main = <eventType, dataArg> () => {
    let listeners: listener<any, any>[] = [];
    const registerListener = (listener: listener<eventType, dataArg>) => {
        let index = listeners.push(listener);
        return {
            disconnect: () => {
                // @ts-ignore
                listeners[index] = undefined;
                listeners = listeners.filter(val => {
                    return !!val;
                });
            },
        }
    }
    const submitEvent = (type: eventType, data: any) => {
        for (const listener of listeners) {
            listener(type, data);
        }
    }
    return {
        submitEvent,
        registerListener,
    }
}
export default main;