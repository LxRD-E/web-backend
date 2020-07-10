type eventType = 'createThread'|'createPost'
import base, {mainFunction} from '../listener-base';
const mod = base();
export default mod as mainFunction<eventType, any>;