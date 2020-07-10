type eventType = 'register'|'login'
import base, {mainFunction} from '../listener-base';
const mod = base();
export default mod as mainFunction<eventType, any>;