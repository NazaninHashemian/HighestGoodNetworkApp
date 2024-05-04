import { createContext, useState, useMemo } from 'react';

export const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalStatus, setModalStatus] = useState(false);

  const updateModalStatus = () => {
    setModalStatus(true);
  };

  const contextValue = useMemo(() => {
    return { modalStatus, updateModalStatus };
  }, [modalStatus]);

  return <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>;
}
