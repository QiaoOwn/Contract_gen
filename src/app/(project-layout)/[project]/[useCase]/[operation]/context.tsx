import {createContext, useContext} from 'react';

type OperationContextProps = {commonLibs: {content: string; filePath: string}[]};
const OperationContext = createContext<OperationContextProps>({} as OperationContextProps);

const Provider = OperationContext.Provider;

export const useOperationContext = () => {
  return useContext(OperationContext);
};

export {Provider};
