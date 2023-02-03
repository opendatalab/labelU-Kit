import { Subject } from 'rxjs';
const Ob = {
  skippedS: new Subject<any>(),
  nextPageS: new Subject<any>(),
};
export default Ob;
