import { createContext, type ReactNode, useContext } from "react";
import type { createDataModule } from "./data-module";

type DataModule = ReturnType<typeof createDataModule>;

const DataModuleContext = createContext<DataModule | null>(null);

export function DataModuleProvider({
  dataModule,
  children,
}: {
  dataModule: DataModule;
  children: ReactNode;
}) {
  return (
    <DataModuleContext.Provider value={dataModule}>
      {children}
    </DataModuleContext.Provider>
  );
}

export function useDataModule() {
  const dataModule = useContext(DataModuleContext);
  if (!dataModule) {
    throw new Error("useDataModule must be used within a DataModuleProvider.");
  }
  return dataModule;
}
