import manageDevice from './manageDevice';
import manageUser from './manageUser';
import raiseRepair from './raiseRepair';
export * as actor from './actor';
export {default as entity} from './entity';
export const useCase = {
  manageDevice,
  manageUser,
  raiseRepair,
};
