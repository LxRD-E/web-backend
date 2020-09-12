import * as promClient from 'prom-client';
promClient.collectDefaultMetrics();

const existingMaps: any = {};
export const get = (name: string, help: string): { counter: promClient.Counter<string>; historGram: promClient.Histogram<string> } => {
    if (existingMaps[name]) {
        return existingMaps[name];
    }
    let obj = {
        counter: new promClient.Counter({ name: name + '_counter', help: help }),
        historGram: new promClient.Histogram({ name: name + '_historgram', help: help }),
    }
    existingMaps[name] = obj;
    return obj;
}

export const prom = promClient;